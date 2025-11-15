import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimitMiddleware, RateLimits } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Registration endpoint - Validates user data and triggers OTP flow
 * NOTE: This endpoint does NOT create the user. Users are only created after OTP verification.
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimitMiddleware(request, RateLimits.auth);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { firstName, lastName, email, phone } = body;

    console.log('📝 Registration validation:', { firstName, lastName, email, phone });

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already exists with this email
    const { data: existingEmailUser } = await supabase
      .from('users')
      .select('id, status')
      .eq('email', normalizedEmail)
      .single();

    if (existingEmailUser) {
      // If user exists and is active, tell them to sign in
      if (existingEmailUser.status === 'active') {
        return NextResponse.json(
          { success: false, error: 'This email is already registered. Please sign in instead.' },
          { status: 409 }
        );
      }
      // If user exists but is pending, they need to complete OTP verification
      if (existingEmailUser.status === 'pending') {
        return NextResponse.json(
          { success: false, error: 'Registration pending. Please complete OTP verification.' },
          { status: 409 }
        );
      }
      // If suspended
      if (existingEmailUser.status === 'suspended') {
        return NextResponse.json(
          { success: false, error: 'This account has been suspended. Please contact support.' },
          { status: 403 }
        );
      }
    }

    // Check if user already exists with this phone number (if provided)
    if (phone && phone.trim() !== '') {
      const { data: existingPhoneUser } = await supabase
        .from('users')
        .select('id, status')
        .eq('phone_number', phone)
        .single();

      if (existingPhoneUser && existingPhoneUser.status === 'active') {
        return NextResponse.json(
          { success: false, error: 'This mobile number is already registered. Please use a different number or sign in.' },
          { status: 409 }
        );
      }
    }

    // Check if user is eligible for founding member status
    const now = new Date();
    const { data: launchDateSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'founding_member_launch_date')
      .single();

    const { data: endDateSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'founding_member_end_date')
      .single();

    let isFoundingMember = false;
    if (launchDateSetting && endDateSetting) {
      const launchDate = new Date(launchDateSetting.value as string);
      const endDate = new Date(endDateSetting.value as string);
      isFoundingMember = now >= launchDate && now <= endDate;
    }

    // Get founding member plan from request body
    const foundingMemberPlan = body.foundingMemberPlan || null;

    console.log('✅ Registration validation passed:', normalizedEmail);

    // Return success - user data will be stored in OTP table temp_user_data
    // Actual user creation happens in verify-otp endpoint after OTP verification
    const response = NextResponse.json({
      success: true,
      message: 'Validation successful. Please verify your email with OTP.',
      validatedData: {
        email: normalizedEmail,
        firstName,
        lastName,
        phone: phone || null,
        isFoundingMember,
        foundingMemberPlan,
        foundingMemberSince: isFoundingMember ? now.toISOString() : null,
      },
      nextStep: 'send-otp'
    });

    return response;

  } catch (error) {
    console.error('❌ Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
