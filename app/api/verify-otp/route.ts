import { NextRequest, NextResponse } from 'next/server';
import { SupabaseEmailOTPStore, SupabaseMobileOTPStore, type EmailOTPRecord } from '@/lib/supabase-otp-store';
import { SupabaseUserStore } from '@/lib/supabase-user-store';
import { SessionStore } from '@/lib/session-store';
import { memoryOTPStore } from '@/lib/memory-otp-store';
import twilio from 'twilio';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, mobile, otp } = body;

    // Accept either email or mobile
    const identifier = mobile || email;

    if (!identifier || !otp) {
      return NextResponse.json(
        { error: 'Email/Phone and OTP are required' },
        { status: 400 }
      );
    }

    // Determine if identifier is email or phone
    const isEmail = identifier.includes('@');
    const isPhone = !isEmail;

    console.log('🔐 [verify-otp] Starting OTP verification for:', identifier, 'Type:', isEmail ? 'email' : 'phone');

    let user = null;

    // ==================== PHONE OTP VERIFICATION ====================
    if (isPhone) {
      console.log('📱 [verify-otp] Verifying phone OTP for:', identifier);

      // Clean and format phone number to match what was used in send-otp
      let phoneToVerify = identifier.replace(/[\s-()]/g, '');

      // Try multiple phone formats
      const phoneFormats = [
        phoneToVerify,                    // As entered
        `+${phoneToVerify}`,              // With + prefix
        `+91${phoneToVerify}`,            // With India country code
        phoneToVerify.replace(/^\\+/, '') // Without + if present
      ];

      console.log('📱 [verify-otp] Will try phone formats:', phoneFormats);

      // Check if Twilio is configured
      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioVerifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
      const useTwilio = twilioAccountSid && twilioAuthToken && twilioVerifyServiceSid;

      if (useTwilio) {
        let twilioSuccess = false;
        let lastTwilioError = null;

        // Try each phone format with Twilio
        for (const phoneFormat of phoneFormats) {
          try {
            console.log('📞 [verify-otp] Trying Twilio verification with:', phoneFormat);
            const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

            const verificationCheck = await twilioClient.verify.v2
              .services(twilioVerifyServiceSid)
              .verificationChecks.create({
                to: phoneFormat,
                code: otp
              });

            console.log('✅ [verify-otp] Twilio verification result:', verificationCheck.status, 'for format:', phoneFormat);

            if (verificationCheck.status === 'approved') {
              twilioSuccess = true;
              phoneToVerify = phoneFormat; // Use the format that worked
              break;
            }
          } catch (twilioError: any) {
            console.error('❌ [verify-otp] Twilio verification failed for format:', phoneFormat, 'Error:', twilioError.message);
            lastTwilioError = twilioError;
            // Continue trying other formats
          }
        }

        // If all Twilio attempts failed, try database fallback with all phone formats
        if (!twilioSuccess) {
          console.log('⚠️ [verify-otp] All Twilio formats failed, falling back to database verification');
          console.log('⚠️ [verify-otp] Last Twilio error:', lastTwilioError?.message);

          let storedRecord = null;
          let matchedFormat = null;

          // Try all phone formats to find the OTP
          for (const phoneFormat of phoneFormats) {
            storedRecord = await SupabaseMobileOTPStore.get(phoneFormat);
            if (storedRecord) {
              matchedFormat = phoneFormat;
              console.log('✅ [verify-otp] Found OTP in database with phone format:', phoneFormat);
              break;
            }
          }

          if (!storedRecord) {
            console.error('❌ [verify-otp] No OTP found for any phone format. Tried:', phoneFormats);
            return NextResponse.json(
              { error: 'No verification code found. Please request a new code.' },
              { status: 400 }
            );
          }

          if (new Date() > new Date(storedRecord.expires_at)) {
            await SupabaseMobileOTPStore.delete(matchedFormat!);
            return NextResponse.json(
              { error: 'Verification code has expired. Please request a new code.' },
              { status: 400 }
            );
          }

          if (storedRecord.otp !== otp) {
            return NextResponse.json(
              { error: 'Invalid verification code. Please check and try again.' },
              { status: 400 }
            );
          }

          // Mark as verified
          await SupabaseMobileOTPStore.set(matchedFormat!, {
            ...storedRecord,
            verified: true
          });

          // Clean up
          await SupabaseMobileOTPStore.delete(matchedFormat!);
          phoneToVerify = matchedFormat!; // Use the format that matched
        }
      } else {
        // No Twilio, use database verification - try all phone formats
        console.log('📱 [verify-otp] Verifying from database, trying all phone formats');

        let storedRecord = null;
        let matchedFormat = null;

        // Try all phone formats to find the OTP
        for (const phoneFormat of phoneFormats) {
          storedRecord = await SupabaseMobileOTPStore.get(phoneFormat);
          if (storedRecord) {
            matchedFormat = phoneFormat;
            console.log('✅ [verify-otp] Found OTP in database with phone format:', phoneFormat);
            break;
          }
        }

        if (!storedRecord) {
          console.error('❌ [verify-otp] No OTP found for any phone format. Tried:', phoneFormats);
          return NextResponse.json(
            { error: 'No verification code found. Please request a new code.' },
            { status: 400 }
          );
        }

        if (new Date() > new Date(storedRecord.expires_at)) {
          await SupabaseMobileOTPStore.delete(matchedFormat!);
          return NextResponse.json(
            { error: 'Verification code has expired. Please request a new code.' },
            { status: 400 }
          );
        }

        if (storedRecord.otp !== otp) {
          return NextResponse.json(
            { error: 'Invalid verification code. Please check and try again.' },
            { status: 400 }
          );
        }

        // Mark as verified
        await SupabaseMobileOTPStore.set(matchedFormat!, {
          ...storedRecord,
          verified: true
        });

        // Clean up
        await SupabaseMobileOTPStore.delete(matchedFormat!);
        phoneToVerify = matchedFormat!; // Use the format that matched
      }

      console.log('✅ [verify-otp] Phone OTP verified successfully');

      // Try to get user from database with multiple phone formats
      for (const phoneFormat of phoneFormats) {
        user = await SupabaseUserStore.getByPhone(phoneFormat);
        if (user) {
          console.log('✅ [verify-otp] Found user with phone format:', phoneFormat);
          break;
        }
      }

      if (!user) {
        console.log('👤 [verify-otp] User not found, checking if this is new registration for mobile:', identifier);

        // Get the stored OTP record to check for user registration data
        const mobileRecord = await SupabaseMobileOTPStore.get(identifier);

        console.log('📋 [DEBUG] Mobile OTP record:', {
          exists: !!mobileRecord,
          has_temp_user_data: !!mobileRecord?.temp_user_data,
          temp_user_data: mobileRecord?.temp_user_data
        });

        if (mobileRecord && mobileRecord.temp_user_data) {
          console.log('🆕 [verify-otp] Creating new user account for mobile:', identifier);

          try {
            // Create the user account with pending status
            user = await SupabaseUserStore.upsertByEmail({
              email: mobileRecord.temp_user_data.email || `${Date.now()}@temp-mobile-user.com`, // Temporary email if not provided
              first_name: mobileRecord.temp_user_data.firstName,
              last_name: mobileRecord.temp_user_data.lastName,
              phone_number: identifier,
              role: 'user',
              status: 'pending',
              email_verified: false,
              mobile_verified: false,
              is_founding_member: mobileRecord.temp_user_data.isFoundingMember || false,
              founding_member_plan: mobileRecord.temp_user_data.foundingMemberPlan || null,
              founding_member_since: mobileRecord.temp_user_data.foundingMemberSince || null,
            });

            console.log('✅ [verify-otp] New user created with pending status:', user.id);

            // Activate user now that OTP is verified
            user = await SupabaseUserStore.activateUser(user.id, 'mobile');
            console.log('✅ [verify-otp] User activated successfully with mobile verification');
          } catch (createError) {
            console.error('❌ [verify-otp] Failed to create user for mobile:', createError);
            return NextResponse.json(
              { error: 'Failed to create user account. Please try again.' },
              { status: 500 }
            );
          }
        } else {
          console.error('❌ [verify-otp] User not found for any phone format and no registration data.');
          console.error('❌ [verify-otp] Tried phone formats:', phoneFormats);
          console.error('❌ [verify-otp] OTP record exists:', !!mobileRecord);
          console.error('❌ [verify-otp] temp_user_data is null:', mobileRecord && !mobileRecord.temp_user_data);

          if (mobileRecord && !mobileRecord.temp_user_data) {
            return NextResponse.json(
              {
                error: 'Registration data not found. This may be because:\n1. The registration data was not saved during signup\n2. You are trying to login instead of register\n\nPlease try registering again.',
                debug: {
                  otp_record_exists: true,
                  temp_user_data_missing: true,
                  solution: 'Please start registration process again'
                }
              },
              { status: 400 }
            );
          }

          return NextResponse.json(
            { error: 'User account not found. Please register first.' },
            { status: 404 }
          );
        }
      } else {
        // Existing user - just update verification status and activate if needed
        if (user.status === 'pending') {
          user = await SupabaseUserStore.activateUser(user.id, 'mobile');
        } else {
          await SupabaseUserStore.updateVerificationStatus(user.email, 'mobile', true);
        }
      }
    }

    // ==================== EMAIL OTP VERIFICATION ====================
    if (isEmail) {
      console.log('📧 [verify-otp] Verifying email OTP');
      const normalizedIdentifier = identifier.toLowerCase();
      const storedRecord = await SupabaseEmailOTPStore.get(normalizedIdentifier);

      if (!storedRecord) {
        return NextResponse.json(
          { error: 'No verification code found for this email. Please request a new code.' },
          { status: 400 }
        );
      }

      if (new Date() > new Date(storedRecord.expires_at)) {
        await SupabaseEmailOTPStore.delete(normalizedIdentifier);
        return NextResponse.json(
          { error: 'Verification code has expired. Please request a new code.' },
          { status: 400 }
        );
      }

      if (storedRecord.otp !== otp) {
        return NextResponse.json(
          { error: 'Invalid verification code. Please check and try again.' },
          { status: 400 }
        );
      }

      console.log('✅ [verify-otp] Email OTP verified successfully');

      // Mark as verified
      await SupabaseEmailOTPStore.set(normalizedIdentifier, {
        ...storedRecord,
        verified: true
      });

      // Get user from database or create if this is a new registration
      user = await SupabaseUserStore.getByEmail(normalizedIdentifier);

      if (!user) {
        console.log('👤 [verify-otp] User not found, checking if this is new registration for:', normalizedIdentifier);

        console.log('📋 [DEBUG] Email OTP record:', {
          exists: !!storedRecord,
          has_temp_user_data: !!storedRecord?.temp_user_data,
          temp_user_data: storedRecord?.temp_user_data
        });

        // Check if this OTP record has user registration data
        if (storedRecord.temp_user_data) {
          console.log('🆕 [verify-otp] Creating new user account for:', normalizedIdentifier);

          try {
            // Create the user account with pending status
            user = await SupabaseUserStore.upsertByEmail({
              email: normalizedIdentifier,
              first_name: storedRecord.temp_user_data.firstName,
              last_name: storedRecord.temp_user_data.lastName,
              phone_number: storedRecord.temp_user_data.phone || null,
              role: 'user',
              status: 'pending',
              email_verified: false,
              mobile_verified: false,
              is_founding_member: storedRecord.temp_user_data.isFoundingMember || false,
              founding_member_plan: storedRecord.temp_user_data.foundingMemberPlan || null,
              founding_member_since: storedRecord.temp_user_data.foundingMemberSince || null,
            });

            console.log('✅ [verify-otp] New user created with pending status:', user.id);

            // Activate user now that OTP is verified
            user = await SupabaseUserStore.activateUser(user.id, 'email');
            console.log('✅ [verify-otp] User activated successfully with email verification');
          } catch (createError) {
            console.error('❌ [verify-otp] Failed to create user:', createError);
            return NextResponse.json(
              { error: 'Failed to create user account. Please try again.' },
              { status: 500 }
            );
          }
        } else {
          console.error('❌ [verify-otp] User not found and no registration data available for:', normalizedIdentifier);
          console.error('❌ [verify-otp] OTP record exists:', !!storedRecord);
          console.error('❌ [verify-otp] temp_user_data is null:', storedRecord && !storedRecord.temp_user_data);

          if (storedRecord && !storedRecord.temp_user_data) {
            return NextResponse.json(
              {
                error: 'Registration data not found. This may be because:\n1. The registration data was not saved during signup\n2. You are trying to login instead of register\n\nPlease try registering again.',
                debug: {
                  otp_record_exists: true,
                  temp_user_data_missing: true,
                  solution: 'Please start registration process again'
                }
              },
              { status: 400 }
            );
          }

          return NextResponse.json(
            { error: 'User account not found. Please register first.' },
            { status: 404 }
          );
        }
      } else {
        // Existing user - activate if pending, otherwise just update verification status
        if (user.status === 'pending') {
          user = await SupabaseUserStore.activateUser(user.id, 'email');
        } else {
          await SupabaseUserStore.updateVerificationStatus(normalizedIdentifier, 'email', true);
        }
      }

      // Clean up
      await SupabaseEmailOTPStore.delete(normalizedIdentifier);
    }

    // ==================== CREATE SESSION ====================
    if (!user) {
      return NextResponse.json(
        { error: 'User account not found.' },
        { status: 404 }
      );
    }

    console.log('✅ [verify-otp] User found:', user.id);

    // Check user status before creating session
    if (user.status === 'suspended') {
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact support.' },
        { status: 403 }
      );
    }

    if (user.status === 'pending') {
      return NextResponse.json(
        { error: 'Your account is pending verification. Please complete the verification process.' },
        { status: 403 }
      );
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Your account is not active. Please contact support.' },
        { status: 403 }
      );
    }

    // Create user session (only for active users)
    const sessionId = await SessionStore.create(user.id, user.email, user.role);
    console.log('🔑 [verify-otp] Session created:', sessionId);

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      verified: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        email_verified: user.email_verified,
        role: user.role
      }
    });

    // Detect if request is from mobile browser
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    console.log('🔐 [verify-otp] Setting session cookie. Mobile:', isMobile, 'User-Agent:', userAgent.substring(0, 50));

    // Set HTTP-only session cookie that works on BOTH desktop and mobile browsers
    // Key insight: Use 'lax' which works well on mobile, and ensure proper secure/domain settings for desktop
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Secure in production, allow HTTP in development
      sameSite: 'lax' as const, // 'lax' works on both mobile and desktop when configured correctly
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined // Support cross-subdomain cookies
    };

    response.cookies.set('session', sessionId, cookieOptions);

    // Also send session token in response body as fallback for mobile apps
    console.log('✅ [verify-otp] Session cookie set with options:', {
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      domain: cookieOptions.domain,
      path: cookieOptions.path,
      sessionId: sessionId.substring(0, 20) + '...'
    });

    return response;

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}