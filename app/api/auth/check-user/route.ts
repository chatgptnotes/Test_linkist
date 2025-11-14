import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase credentials:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      });
      return NextResponse.json(
        { success: false, error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, mobile } = body;

    // Must provide either email or mobile
    if (!email && !mobile) {
      return NextResponse.json(
        { success: false, error: 'Email or mobile number is required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    let exists = false;

    // Check if email exists
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const { data: emailUser, error: emailError } = await supabase
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors if not found

      if (emailError) {
        console.error('❌ Email check error:', emailError);
        // Don't fail the request, just log and continue
      }

      if (emailUser) {
        exists = true;
      }
    }

    // Check if mobile exists
    if (mobile && !exists) {
      const normalizedMobile = mobile.replace(/\s/g, ''); // Remove spaces
      const { data: mobileUser, error: mobileError } = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', normalizedMobile)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors if not found

      if (mobileError) {
        console.error('❌ Mobile check error:', mobileError);
        // Don't fail the request, just log and continue
      }

      if (mobileUser) {
        exists = true;
      }
    }

    return NextResponse.json({
      success: true,
      exists,
      message: exists
        ? 'User already exists. Please login.'
        : 'User does not exist. You can proceed with registration.'
    });

  } catch (error) {
    console.error('❌ Check user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check user existence' },
      { status: 500 }
    );
  }
}
