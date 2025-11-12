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

    // Use database OTP only if Twilio not configured (not based on NODE_ENV)
    const useDatabaseOTP = !accountSid || !authToken || !verifyServiceSid;

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
            // Update mobile_verified status
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
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 7, // 7 days
              path: '/'
            });

            return response;
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
      // Update mobile_verified status
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
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      });

      return response;
    }

    return NextResponse.json({
      success: true,
      message: 'Mobile number verified successfully',
      verified: true
    });

  } catch (error) {
    console.error('Error verifying mobile OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify code. Please try again.' },
      { status: 500 }
    );
  }
}
