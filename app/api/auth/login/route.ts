import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { rateLimitMiddleware, RateLimits } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimitMiddleware(request, RateLimits.auth);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('🔐 Login attempt:', email);

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user by email
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (fetchError || !user) {
      console.log('❌ User not found:', normalizedEmail);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password using bcrypt
    console.log('🔍 DEBUG - User found:', {
      email: user.email,
      hasPasswordHash: !!user.password_hash,
      hashLength: user.password_hash?.length,
      hashPrefix: user.password_hash?.substring(0, 7),
      inputPasswordLength: password.length,
      inputPassword: password
    });

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    console.log('🔍 DEBUG - Password comparison result:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Invalid password for:', normalizedEmail);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('✅ User logged in successfully:', normalizedEmail);

    // Create session (in production, use JWT or session tokens)
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone_number,
        role: user.role,
        emailVerified: user.email_verified,
        mobileVerified: user.mobile_verified,
      }
    });

    // Set session cookie with proper cross-origin support for desktop browsers
    response.cookies.set('session', user.id, {
      httpOnly: true,
      secure: true, // Always secure for production (required for sameSite: 'none')
      sameSite: 'none' as const, // Changed from 'lax' to 'none' for desktop browser compatibility
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined // Support cross-subdomain cookies
    });

    return response;

  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
