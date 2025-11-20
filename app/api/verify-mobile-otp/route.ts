import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { SupabaseMobileOTPStore } from '@/lib/supabase-otp-store';
import { createClient } from '@supabase/supabase-js';
import { rateLimitMiddleware, RateLimits } from '@/lib/rate-limit';
import { SessionStore } from '@/lib/session-store';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  // Apply strict rate limiting for OTP verification
  const rateLimitResponse = rateLimitMiddleware(request, RateLimits.strict);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { mobile, otp } = await request.json();

    if (!mobile || !otp) {
      return NextResponse.json(
        { success: false, error: 'Mobile number and OTP are required' },
        { status: 400 }
      );
    }

  // Use database OTP if hardcoded testing OTP is enabled or Twilio not configured
  const useDatabaseOTP = (process.env.USE_HARDCODED_OTP === 'true') || !accountSid || !authToken || !verifyServiceSid;

    if (!useDatabaseOTP) {
      try {
        // Verify using Twilio Verify API in production
        const client = twilio(accountSid, authToken);

        const verificationCheck = await client.verify.v2
          .services(verifyServiceSid)
          .verificationChecks.create({
            to: mobile,
            code: otp
          });

        if (verificationCheck.status === 'approved') {
          console.log('✅ [verify-mobile-otp] Twilio verification approved');

          // Update user's mobile_verified status in database
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          let userEmail = request.cookies.get('userEmail')?.value;
          let user = null;

          // Try to find user by email from cookie first
          if (userEmail) {
            const { data: userData, error: emailError } = await supabase
              .from('users')
              .select('id, email, role')
              .eq('email', userEmail)
              .single();

            if (userData && !emailError) {
              user = userData;
            }
          }

          // Fallback: Look up user by phone number if cookie method failed
          if (!user) {
            const { data: userData, error: phoneError } = await supabase
              .from('users')
              .select('id, email, role')
              .eq('phone_number', mobile)
              .single();

            if (userData && !phoneError) {
              user = userData;
              userEmail = userData.email;
            }
          }

          if (user) {
            // Existing user - Update mobile_verified status
            console.log('✅ [verify-mobile-otp] Twilio: Existing user found, updating mobile_verified status');

            await supabase
              .from('users')
              .update({ mobile_verified: true, phone_number: mobile })
              .eq('id', user.id);

            // Create session
            const sessionId = await SessionStore.create(user.id, user.email, user.role || 'user');
            console.log('✅ Session created after mobile verification (Twilio):', sessionId);

            // Set session cookie
            const response = NextResponse.json({
              success: true,
              message: 'Mobile number verified successfully',
              verified: true
            });

            response.cookies.set('session', sessionId, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax' as const, // 'lax' works on both mobile and desktop
              maxAge: 60 * 60 * 24 * 7, // 7 days
              path: '/',
              domain: process.env.COOKIE_DOMAIN || undefined // Support cross-subdomain cookies
            });

            return response;
          }

          // New user - Check for registration data in temp_user_data
          console.log('👤 [verify-mobile-otp] Twilio: User not found, checking for registration data');

          const mobileOTPRecord = await SupabaseMobileOTPStore.get(mobile);

          console.log('📋 [verify-mobile-otp] Twilio OTP record:', {
            exists: !!mobileOTPRecord,
            has_temp_user_data: !!mobileOTPRecord?.temp_user_data,
            temp_user_data: mobileOTPRecord?.temp_user_data
          });

          if (mobileOTPRecord && mobileOTPRecord.temp_user_data) {
            console.log('🆕 [verify-mobile-otp] Twilio: Creating new user account for mobile:', mobile);

            try {
              const { SupabaseUserStore } = await import('@/lib/supabase-user-store');

              // Create the user account with pending status
              const newUser = await SupabaseUserStore.upsertByEmail({
                email: mobileOTPRecord.temp_user_data.email || `${Date.now()}@temp-mobile-user.com`,
                first_name: mobileOTPRecord.temp_user_data.firstName,
                last_name: mobileOTPRecord.temp_user_data.lastName,
                phone_number: mobile,
                role: 'user',
                status: 'pending',
                email_verified: false,
                mobile_verified: false,
              });

              console.log('✅ [verify-mobile-otp] Twilio: New user created with pending status:', newUser.id);

              // Activate user now that OTP is verified
              const activatedUser = await SupabaseUserStore.activateUser(newUser.id, 'mobile');
              console.log('✅ [verify-mobile-otp] Twilio: User activated successfully with mobile verification');

              // Create session
              const sessionId = await SessionStore.create(activatedUser.id, activatedUser.email, activatedUser.role);
              console.log('✅ [verify-mobile-otp] Twilio: Session created for new user:', sessionId);

              // Clean up OTP record
              await SupabaseMobileOTPStore.delete(mobile);

              // Set session cookie
              const response = NextResponse.json({
                success: true,
                message: 'Mobile number verified successfully',
                verified: true,
                newUser: true
              });

              response.cookies.set('session', sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const, // 'lax' works on both mobile and desktop
                maxAge: 60 * 60 * 24 * 7, // 7 days
                path: '/',
                domain: process.env.COOKIE_DOMAIN || undefined // Support cross-subdomain cookies
              });

              return response;
            } catch (createError) {
              console.error('❌ [verify-mobile-otp] Twilio: Failed to create user for mobile:', createError);
              // Return more helpful debug info in development to assist troubleshooting
              const payload: any = { success: false, error: 'Failed to create user account. Please try again.' };
              if (process.env.NODE_ENV !== 'production' && createError instanceof Error) {
                payload.debug = { message: createError.message };
              }
              return NextResponse.json(payload, { status: 500 });
            }
          }

          return NextResponse.json({
            success: true,
            message: 'Mobile number verified successfully',
            verified: true
          });
        } else {
          return NextResponse.json(
            { success: false, error: 'Invalid verification code. Please try again.' },
            { status: 400 }
          );
        }

      } catch (error: any) {
        console.error('❌ Twilio verification error:', error);

        // Handle specific Twilio errors
        if (error.code === 60202) {
          return NextResponse.json(
            { success: false, error: 'Max verification attempts reached. Please request a new code.' },
            { status: 429 }
          );
        }

        if (error.code === 60200) {
          return NextResponse.json(
            { success: false, error: 'Invalid phone number format.' },
            { status: 400 }
          );
        }

        // Fallback to database verification on error
      }
    }

    // Check for hardcoded test OTP first (bypass database check for testing)
    const useHardcodedOTP = process.env.USE_HARDCODED_OTP === 'true';
    const hardcodedOTP = process.env.HARDCODED_OTP;

    if (useHardcodedOTP && hardcodedOTP && otp === hardcodedOTP) {
      console.log('✅ Hardcoded test OTP accepted for:', mobile);
      // Skip database check, proceed directly to user verification
    } else {
      // Database verification (development mode or Twilio fallback)
      const storedData = await SupabaseMobileOTPStore.get(mobile);

      if (!storedData) {
        return NextResponse.json(
          { success: false, error: 'No verification code found for this mobile number. Please request a new code.' },
          { status: 400 }
        );
      }

      // Check if OTP has expired
      if (new Date() > new Date(storedData.expires_at)) {
        await SupabaseMobileOTPStore.delete(mobile);
        return NextResponse.json(
          { success: false, error: 'Verification code has expired. Please request a new code.' },
          { status: 400 }
        );
      }

      // Check if OTP matches
      if (storedData.otp !== otp) {
        return NextResponse.json(
          { success: false, error: 'Invalid verification code. Please check and try again.' },
          { status: 400 }
        );
      }

      // Mark as verified in database
      const updated = await SupabaseMobileOTPStore.set(mobile, {
        ...storedData,
        verified: true
      });

      if (!updated) {
        console.error('Failed to mark mobile OTP as verified');
        return NextResponse.json(
          { success: false, error: 'Failed to verify code' },
          { status: 500 }
        );
      }
    }

    // Update user's mobile_verified status in database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let userEmail = request.cookies.get('userEmail')?.value;
    let user = null;

    // Try to find user by email from cookie first
    if (userEmail) {
      const { data: userData, error: emailError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', userEmail)
        .single();

      if (userData && !emailError) {
        user = userData;
      }
    }

    // Fallback: Look up user by phone number if cookie method failed
    if (!user) {
      const { data: userData, error: phoneError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('phone_number', mobile)
        .single();

      if (userData && !phoneError) {
        user = userData;
        userEmail = userData.email;
      }
    }

    if (user) {
      // Existing user - Update mobile_verified status
      console.log('✅ [verify-mobile-otp] Existing user found, updating mobile_verified status');

      await supabase
        .from('users')
        .update({ mobile_verified: true, phone_number: mobile })
        .eq('id', user.id);

      // Create session
      const sessionId = await SessionStore.create(user.id, user.email, user.role || 'user');
      console.log('✅ Session created after mobile verification:', sessionId);

      // Set session cookie
      const response = NextResponse.json({
        success: true,
        message: 'Mobile number verified successfully',
        verified: true
      });

      response.cookies.set('session', sessionId, {
        httpOnly: true,
        secure: true, // Always secure for production (required for sameSite: 'none')
        sameSite: 'none' as const, // Changed from 'lax' to 'none' for desktop browser compatibility
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        domain: process.env.COOKIE_DOMAIN || undefined // Support cross-subdomain cookies
      });

      return response;
    }

    // New user - Check for registration data in temp_user_data
    console.log('👤 [verify-mobile-otp] User not found, checking for registration data');

    const mobileOTPRecord = await SupabaseMobileOTPStore.get(mobile);

    console.log('📋 [verify-mobile-otp] OTP record:', {
      exists: !!mobileOTPRecord,
      has_temp_user_data: !!mobileOTPRecord?.temp_user_data,
      temp_user_data: mobileOTPRecord?.temp_user_data
    });

    if (mobileOTPRecord && mobileOTPRecord.temp_user_data) {
      console.log('🆕 [verify-mobile-otp] Creating new user account for mobile:', mobile);

      try {
        const { SupabaseUserStore } = await import('@/lib/supabase-user-store');

        // Create the user account with pending status
        const newUser = await SupabaseUserStore.upsertByEmail({
          email: mobileOTPRecord.temp_user_data.email || `${Date.now()}@temp-mobile-user.com`,
          first_name: mobileOTPRecord.temp_user_data.firstName,
          last_name: mobileOTPRecord.temp_user_data.lastName,
          phone_number: mobile,
          role: 'user',
          status: 'pending',
          email_verified: false,
          mobile_verified: false,
        });

        console.log('✅ [verify-mobile-otp] New user created with pending status:', newUser.id);

        // Activate user now that OTP is verified
        const activatedUser = await SupabaseUserStore.activateUser(newUser.id, 'mobile');
        console.log('✅ [verify-mobile-otp] User activated successfully with mobile verification');

        // Create session
        const sessionId = await SessionStore.create(activatedUser.id, activatedUser.email, activatedUser.role);
        console.log('✅ [verify-mobile-otp] Session created for new user:', sessionId);

        // Clean up OTP record
        await SupabaseMobileOTPStore.delete(mobile);

        // Set session cookie
        const response = NextResponse.json({
          success: true,
          message: 'Mobile number verified successfully',
          verified: true,
          newUser: true
        });

        response.cookies.set('session', sessionId, {
          httpOnly: true,
          secure: true, // Always secure for production (required for sameSite: 'none')
          sameSite: 'none' as const, // Changed from 'lax' to 'none' for desktop browser compatibility
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
          domain: process.env.COOKIE_DOMAIN || undefined // Support cross-subdomain cookies
        });

        return response;
      } catch (createError) {
        console.error('❌ [verify-mobile-otp] Failed to create user for mobile:', createError);
        const payload: any = { success: false, error: 'Failed to create user account. Please try again.' };
        if (process.env.NODE_ENV !== 'production' && createError instanceof Error) {
          payload.debug = { message: createError.message };
        }
        return NextResponse.json(payload, { status: 500 });
      }
    } else {
      console.error('❌ [verify-mobile-otp] User not found and no registration data available');
      console.error('❌ [verify-mobile-otp] OTP record exists:', !!mobileOTPRecord);
      console.error('❌ [verify-mobile-otp] temp_user_data is null:', mobileOTPRecord && !mobileOTPRecord.temp_user_data);

      if (mobileOTPRecord && !mobileOTPRecord.temp_user_data) {
        return NextResponse.json(
          {
            success: false,
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
        { success: false, error: 'User account not found. Please register first.' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error verifying mobile OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify code. Please try again.' },
      { status: 500 }
    );
  }
}
