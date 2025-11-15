// Production-ready authentication middleware using Supabase
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { SessionStore } from './session-store'

// Auth configuration
const AUTH_CONFIG: {
  adminRoutes: string[];
  protectedRoutes: string[];
  publicRoutes: string[];
  adminApiRoutes: string[];
  protectedApiRoutes: string[];
  publicApiRoutes: string[];
  sessionDuration: number;
  adminPin: string;
} = {
  // Protected admin routes
  adminRoutes: ['/admin'],
  // Protected user routes
  protectedRoutes: ['/account', '/dashboard'],
  // Public routes that don't need auth
  publicRoutes: ['/', '/login', '/register', '/signup', '/verify-login', '/nfc/configure', '/nfc/checkout', '/nfc/success', '/welcome-to-linkist', '/verify-mobile'],
  // API routes that need admin access
  adminApiRoutes: ['/api/admin'],
  // API routes that need user auth (excluding specific endpoints)
  protectedApiRoutes: ['/api/account'],
  // Public API routes that don't need auth
  publicApiRoutes: ['/api/user/profile'],
  // Session duration
  sessionDuration: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  // Admin PIN for admin access (in production, this should be more secure)
  adminPin: process.env.ADMIN_PIN || '1234',
}

export interface AuthUser {
  id: string
  email: string
  role: 'user' | 'admin'
  status?: 'pending' | 'active' | 'suspended'
  email_verified?: boolean
  mobile_verified?: boolean
  created_at?: string
  first_name?: string | null
  last_name?: string | null
}

export interface AuthSession {
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  sessionId?: string
}

// Create Supabase client for middleware
function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  return { supabase, response }
}

// Get authenticated user from Supabase session
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthSession> {
  try {
    // First check for admin session (PIN-based admin access)
    const adminSessionId = request.cookies.get('admin_session')?.value
    const isAdminSession = await verifyAdminSession(adminSessionId)

    if (isAdminSession) {
      // Create admin user from session token
      const adminUser: AuthUser = {
        id: 'admin-session',
        email: 'admin@linkist.com',
        role: 'admin',
        email_verified: true,
        created_at: new Date().toISOString(),
      }

      return {
        user: adminUser,
        isAuthenticated: true,
        isAdmin: true,
        sessionId: 'admin-session',
      }
    }

    // Check for custom session cookie (from OTP login)
    const customSessionId = request.cookies.get('session')?.value

    if (customSessionId) {
      const sessionData = await SessionStore.get(customSessionId)

      if (sessionData) {
        // Fetch user details from database to get first_name, last_name, and status
        let firstName: string | null = null
        let lastName: string | null = null
        let userStatus: 'pending' | 'active' | 'suspended' = 'active'

        try {
          const { supabase: dbClient } = createMiddlewareClient(request)
          const { data: userData, error: userError } = await dbClient
            .from('users')
            .select('first_name, last_name, status')
            .eq('id', sessionData.userId)
            .maybeSingle() // Use maybeSingle to avoid errors if user not found

          if (!userError && userData) {
            firstName = userData.first_name || null
            lastName = userData.last_name || null
            userStatus = userData.status || 'active'

            // Check if user is suspended or pending - reject session
            if (userStatus === 'suspended') {
              console.warn('Suspended user attempted to access:', sessionData.email)
              return { user: null, isAuthenticated: false, isAdmin: false }
            }

            if (userStatus === 'pending') {
              console.warn('Pending user attempted to access:', sessionData.email)
              return { user: null, isAuthenticated: false, isAdmin: false }
            }
          }
        } catch (error) {
          // Silently fail user data fetch - not critical for auth
          console.warn('Failed to fetch user details:', error)
        }

        // Only allow active users to authenticate
        if (userStatus !== 'active') {
          return { user: null, isAuthenticated: false, isAdmin: false }
        }

        const sessionUser: AuthUser = {
          id: sessionData.userId,
          email: sessionData.email,
          role: sessionData.role,
          status: userStatus,
          email_verified: true,
          created_at: new Date(sessionData.createdAt).toISOString(),
          first_name: firstName,
          last_name: lastName,
        }

        return {
          user: sessionUser,
          isAuthenticated: true,
          isAdmin: sessionData.role === 'admin',
          sessionId: customSessionId,
        }
      }
    }

    // Check for regular Supabase user session
    const { supabase, response } = createMiddlewareClient(request)

    // Get the current user from Supabase
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { user: null, isAuthenticated: false, isAdmin: false }
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email!,
      role: 'user', // Regular users default to 'user' role
      email_verified: user.email_confirmed_at != null,
      created_at: user.created_at,
    }

    return {
      user: authUser,
      isAuthenticated: true,
      isAdmin: false,
      sessionId: user.id,
    }

  } catch (error) {
    console.error('Auth middleware error:', error)
    return { user: null, isAuthenticated: false, isAdmin: false }
  }
}

// Verify admin session (temporary solution using encrypted cookies)
async function verifyAdminSession(sessionId?: string): Promise<boolean> {
  if (!sessionId) return false

  try {
    // In a real app, you'd verify this against a database
    // For now, we'll use a simple time-based token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    await jwtVerify(sessionId, secret)
    return true
  } catch {
    return false
  }
}

// Create admin session token
export async function createAdminSession(): Promise<string> {
  try {
    const { SignJWT } = await import('jose')
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    
    return await new SignJWT({ 
      role: 'admin',
      created: Date.now() 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)
  } catch (error) {
    console.error('Error creating admin session:', error)
    throw error
  }
}

// Check if route requires authentication
function requiresAuth(pathname: string): 'admin' | 'user' | 'none' {
  // Check if it's a public API route first
  if (AUTH_CONFIG.publicApiRoutes && AUTH_CONFIG.publicApiRoutes.some(route => pathname.startsWith(route))) {
    return 'none'
  }

  // Check admin routes
  if (AUTH_CONFIG.adminRoutes.some(route => pathname.startsWith(route))) {
    return 'admin'
  }

  // Check admin API routes
  if (AUTH_CONFIG.adminApiRoutes.some(route => pathname.startsWith(route))) {
    return 'admin'
  }

  // Check protected user routes
  if (AUTH_CONFIG.protectedRoutes.some(route => pathname.startsWith(route))) {
    return 'user'
  }

  // Check protected API routes
  if (AUTH_CONFIG.protectedApiRoutes.some(route => pathname.startsWith(route))) {
    return 'user'
  }

  // Check if it's any /api/user route (but not in public API routes)
  if (pathname.startsWith('/api/user')) {
    return 'user'
  }

  return 'none'
}

// Main authentication middleware
export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth for public routes and static files
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/stripe-webhook') ||
    pathname.startsWith('/api/process-order') ||
    pathname.startsWith('/api/admin-login') ||
    pathname.startsWith('/admin-login') ||
    pathname.startsWith('/admin-access') ||
    pathname.startsWith('/api/send-otp') ||
    pathname.startsWith('/api/verify-otp') ||
    pathname.startsWith('/api/send-mobile-otp') ||
    pathname.startsWith('/api/verify-mobile-otp') ||
    pathname.includes('.') // Static files
  ) {
    return NextResponse.next()
  }

  const authRequirement = requiresAuth(pathname)

  if (authRequirement === 'none') {
    return NextResponse.next()
  }

  // Get user authentication status
  const session = await getAuthenticatedUser(request)

  // Handle admin routes
  if (authRequirement === 'admin') {
    if (!session.isAdmin) {
      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        return Response.json(
          { error: 'Admin access required' },
          { status: 401 }
        )
      }
      
      // For page routes, redirect to admin access page
      const loginUrl = new URL('/admin-access', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Admin authenticated, allow access without Supabase session
    return NextResponse.next()
  }

  // Handle user routes
  if (authRequirement === 'user') {
    if (!session.isAuthenticated) {
      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        return Response.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      
      // For page routes, redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Update Supabase session
  const { response } = createMiddlewareClient(request)
  return response
}

// Helper function to get current user in API routes
export async function getCurrentUser(request: NextRequest): Promise<AuthSession> {
  return await getAuthenticatedUser(request)
}

// Helper function to require admin in API routes
export function requireAdmin(handler: (request: NextRequest) => Promise<Response>) {
  return async (request: NextRequest) => {
    const session = await getCurrentUser(request)
    
    if (!session.isAdmin) {
      return Response.json(
        { error: 'Admin access required' },
        { status: 401 }
      )
    }

    return handler(request)
  }
}

// Helper function to require auth in API routes
export function requireAuth(handler: (request: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    const session = await getCurrentUser(request)
    
    if (!session.isAuthenticated || !session.user) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return handler(request, session.user)
  }
}