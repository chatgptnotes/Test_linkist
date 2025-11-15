import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { SupabaseMobileOTPStore, generateMobileOTP, cleanExpiredOTPs } from '@/lib/supabase-otp-store';
import { SupabaseUserStore } from '@/lib/supabase-user-store';
import { rateLimitMiddleware, RateLimits, getClientIdentifier } from '@/lib/rate-limit';
import { checkSpamAndBots } from '@/lib/spam-detection';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

export async function POST(request: NextRequest) {
  // Apply rate limiting for OTP requests
  const rateLimitResponse = rateLimitMiddleware(request, RateLimits.otp);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { mobile, firstName, lastName, email } = await request.json();

    console.log('📱 [send-mobile-otp] Received request:', { mobile, firstName, lastName, email });

    // Validate mobile number
    if (!mobile || typeof mobile !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid mobile number is required' },
        { status: 400 }
      );
    }

    // Validate mobile number format
    const digitsOnly = mobile.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid mobile number (10-15 digits)' },
        { status: 400 }
      );
    }

    // Check for spam and bot activity
    const ipAddress = getClientIdentifier(request);
    const userAgent = request.headers.get('user-agent');

    const spamCheck = await checkSpamAndBots(mobile, ipAddress, userAgent);

    if (!spamCheck.allowed) {
      console.warn(`🚫 Blocked OTP request - Phone: ${mobile}, IP: ${ipAddress}, Reason: ${spamCheck.reason}, Risk Score: ${spamCheck.riskScore}`);

      return NextResponse.json(
        {
          success: false,
          error: spamCheck.reason || 'Request blocked',
          retryAfter: spamCheck.retryAfter,
          riskScore: spamCheck.riskScore,
        },
        {
          status: 429,
          headers: spamCheck.retryAfter
            ? { 'Retry-After': spamCheck.retryAfter.toString() }
            : {},
        }
      );
    }

    // Log elevated risk but allow
    if (spamCheck.riskScore > 30) {
      console.warn(`⚠️ Elevated risk score: ${spamCheck.riskScore} for phone ${mobile} from IP ${ipAddress}`);
    }

    // Use hardcoded OTP if environment variable is set, or if Twilio not configured
    const useHardcodedOTP = process.env.USE_HARDCODED_OTP === 'true';
    const useDatabaseOTP = useHardcodedOTP || !accountSid || !authToken || !verifyServiceSid;

    console.log('🔍 SMS OTP Debug:', {
      accountSid: accountSid ? 'Set' : 'Missing',
      authToken: authToken ? 'Set' : 'Missing',
      verifyServiceSid: verifyServiceSid ? 'Set' : 'Missing',
      useHardcodedOTP,
      useDatabaseOTP,
      mobile
    });

    if (useDatabaseOTP) {
      // Use hardcoded OTP for testing if enabled, otherwise generate random OTP
      const otp = useHardcodedOTP && process.env.HARDCODED_OTP
        ? process.env.HARDCODED_OTP
        : generateMobileOTP();
      const expiresAt = new Date(Date.now() + (10 * 60 * 1000)).toISOString();

      // Try to find user by phone number to link OTP
      let userId: string | null = null;
      try {
        const user = await SupabaseUserStore.getByPhone(mobile);
        if (user) {
          userId = user.id;
          console.log('📱 Found user for mobile OTP:', userId);
        }
      } catch (error) {
        console.log('📱 No existing user found for mobile, will create guest OTP');
      }

      await cleanExpiredOTPs();

      // Store OTP with temp_user_data for new registrations
      const tempUserData = (firstName && lastName) ? {
        firstName,
        lastName,
        email: email || null,
        phone: mobile
      } : null;

      console.log('💾 [send-mobile-otp] Storing OTP with temp_user_data:', tempUserData);

      const stored = await SupabaseMobileOTPStore.set(mobile, {
        user_id: userId,
        mobile,
        otp,
        expires_at: expiresAt,
        verified: false,
        temp_user_data: tempUserData
      });

      if (!stored) {
        console.error('Failed to store OTP in database');
        return NextResponse.json(
          { success: false, error: 'Failed to generate verification code' },
          { status: 500 }
        );
      }

      console.log(`✅ [send-mobile-otp] Mobile OTP stored: ${mobile}, user_id: ${userId || 'guest'}, has_temp_user_data: ${!!tempUserData}`);

      return NextResponse.json({
        success: true,
        message: useHardcodedOTP
          ? 'Verification code displayed on screen (testing mode)'
          : 'Verification code generated',
        devOtp: otp, // Show OTP for testing
        smsStatus: useHardcodedOTP ? 'hardcoded' : 'database'
      });
    }

    try {
      // Initialize Twilio client
      console.log('📞 Initializing Twilio client...');
      const client = twilio(accountSid, authToken);

      // Send verification code using Twilio Verify API
      // Note: Twilio generates and manages the OTP, we don't need to store it
      console.log('📤 Sending SMS to:', mobile);
      const verification = await client.verify.v2
        .services(verifyServiceSid)
        .verifications.create({
          to: mobile,
          channel: 'sms'
        });

      console.log('✅ Twilio verification sent:', verification.status);

      return NextResponse.json({
        success: true,
        message: 'Verification code sent to your mobile number',
        status: verification.status,
        smsStatus: 'sent'
      });

    } catch (error: any) {
      console.error('❌ Twilio error:', {
        message: error.message,
        code: error.code,
        status: error.status,
        moreInfo: error.moreInfo
      });

      // Handle specific Twilio errors
      if (error.code === 60200) {
        return NextResponse.json(
          { success: false, error: 'Invalid phone number format. Please include country code (e.g., +1234567890)' },
          { status: 400 }
        );
      }

      if (error.code === 60203) {
        return NextResponse.json(
          { success: false, error: 'Max send attempts reached. Please try again later.' },
          { status: 429 }
        );
      }

      if (error.code === 60212) {
        return NextResponse.json(
          { success: false, error: 'Too many requests. Please wait before requesting another code.' },
          { status: 429 }
        );
      }

      // Fallback: Generate OTP and store in database
      console.log('⚠️ SMS failed, using database OTP as fallback');
      const otp = process.env.USE_HARDCODED_OTP === 'true' && process.env.HARDCODED_OTP
        ? process.env.HARDCODED_OTP
        : generateMobileOTP();
      const expiresAt = new Date(Date.now() + (10 * 60 * 1000)).toISOString();

      // Try to find user by phone number to link OTP
      let userId: string | null = null;
      try {
        const user = await SupabaseUserStore.getByPhone(mobile);
        if (user) {
          userId = user.id;
        }
      } catch (error) {
        // Guest OTP
      }

      // Store OTP with temp_user_data for new registrations
      const tempUserData = (firstName && lastName) ? {
        firstName,
        lastName,
        email: email || null,
        phone: mobile
      } : null;

      console.log('💾 [send-mobile-otp] Fallback storing OTP with temp_user_data:', tempUserData);

      await cleanExpiredOTPs();
      await SupabaseMobileOTPStore.set(mobile, {
        user_id: userId,
        mobile,
        otp,
        expires_at: expiresAt,
        verified: false,
        temp_user_data: tempUserData
      });

      console.log(`✅ [send-mobile-otp] Fallback OTP stored: ${mobile}, user_id: ${userId || 'guest'}, has_temp_user_data: ${!!tempUserData}`);

      return NextResponse.json({
        success: true,
        message: 'Verification code generated (SMS delivery failed)',
        devOtp: otp, // Always show in fallback mode
        smsStatus: 'fallback',
        twilioError: error.message
      });
    }

  } catch (error) {
    console.error('❌ Error in send-mobile-otp:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send verification code. Please try again.' },
      { status: 500 }
    );
  }
}

// GET endpoint for development - show current OTPs
export async function GET() {
  if (process.env.NODE_ENV === 'development') {
    await cleanExpiredOTPs();
    const records = await SupabaseMobileOTPStore.getAllForDev();
    const currentOTPs = records.map((record) => ({
      mobile: record.mobile,
      otp: record.otp,
      expiresAt: record.expires_at,
      expired: new Date() > new Date(record.expires_at),
      verified: record.verified
    }));

    return NextResponse.json({ otps: currentOTPs });
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
