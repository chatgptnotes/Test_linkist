import { NextRequest, NextResponse } from 'next/server'
import { createAdminSession } from '@/lib/auth-middleware'

// Force mock credentials regardless of environment variables
const ADMIN_EMAIL = 'admin@gmail.com'
const ADMIN_PASSWORD = '12345678'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log('🔐 Admin login attempt:', {
      receivedEmail: email,
      receivedPasswordLength: password?.length,
      expectedEmail: ADMIN_EMAIL,
      expectedPasswordLength: ADMIN_PASSWORD.length
    })

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Verify admin credentials with detailed logging
    const emailMatch = email === ADMIN_EMAIL
    const passwordMatch = password === ADMIN_PASSWORD

    console.log('🔍 Credential check:', { emailMatch, passwordMatch })

    if (!emailMatch || !passwordMatch) {
      console.log(`❌ Invalid admin credentials attempt: ${email}`)
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create admin session token
    const sessionToken = await createAdminSession()
    
    console.log('✅ Admin login successful')

    // Set secure cookie with the session token
    const response = NextResponse.json({
      success: true,
      message: 'Admin login successful'
    })

    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: true, // Always secure for production (required for sameSite: 'none')
      sameSite: 'none' as const, // Changed from 'strict' to 'none' for desktop browser compatibility
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined // Support cross-subdomain cookies
    })

    return response

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    console.log('🚪 Admin logout requested')
    
    // Clear admin session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    response.cookies.set('admin_session', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
      maxAge: 0,
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined
    })

    return response

  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}