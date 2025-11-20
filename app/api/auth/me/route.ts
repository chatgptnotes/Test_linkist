import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-middleware';
import { RBAC } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const authSession = await getCurrentUser(request);

    if (!authSession.isAuthenticated || !authSession.user) {
      return NextResponse.json(
        { error: 'Not authenticated', isAuthenticated: false },
        { status: 401 }
      );
    }

    const user = authSession.user;

    // Get user permissions for frontend use
    const permissions = RBAC.getUserPermissions(user);
    const canAccessAdmin = RBAC.canAccessAdmin(user);

    return NextResponse.json({
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        email_verified: user.email_verified,
        mobile_verified: user.mobile_verified,
        role: user.role,
        created_at: user.created_at,
        is_founding_member: user.is_founding_member || false,
        founding_member_since: user.founding_member_since || null,
        founding_member_plan: user.founding_member_plan || null
      },
      permissions,
      canAccessAdmin,
      isAdmin: RBAC.isAdmin(user),
      isModerator: RBAC.isModerator(user)
    });

  } catch (error) {
    console.error('❌ /api/auth/me error:', error);
    return NextResponse.json(
      { error: 'Internal server error', isAuthenticated: false },
      { status: 500 }
    );
  }
}