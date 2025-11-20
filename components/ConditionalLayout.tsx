'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from './Navbar';
import Footer from './Footer';
import Logo from './Logo';
import UserProfileDropdown from './UserProfileDropdown';
import LogoutIcon from '@mui/icons-material/Logout';
import { toast } from 'sonner';

// Icon aliases
const LogOut = LogoutIcon;

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if current route is admin-related
  const isAdminRoute = pathname.startsWith('/admin') ||
                       pathname.startsWith('/admin-login') ||
                       pathname.startsWith('/admin-access');

  // Check if current route is an authentication page (login, register, verify)
  const isAuthPage = pathname.startsWith('/login') ||
                     pathname.startsWith('/register') ||
                     pathname.startsWith('/verify-login') ||
                     pathname.startsWith('/verify-mobile') ||
                     pathname.startsWith('/verify-email');

  // Check if current route is an inner page (checkout flow, account, etc.)
  const isInnerPage = pathname.startsWith('/checkout') ||
                      pathname.startsWith('/confirm-payment') ||
                      pathname.startsWith('/thank-you') ||
                      pathname.startsWith('/account') ||
                      pathname.startsWith('/profile-dashboard') ||
                      pathname.startsWith('/verify-email') ||
                      pathname.startsWith('/nfc/') ||
                      pathname.startsWith('/product-selection') ||
                      pathname.startsWith('/choose-plan') ||
                      pathname.startsWith('/welcome-to-linkist') ||
                      pathname.startsWith('/verify-mobile') ||
                      pathname.startsWith('/verify-login') ||
                      pathname.startsWith('/login') ||
                      pathname.startsWith('/profiles/preview') ||
                      pathname.startsWith('/profiles/builder') ||
                      pathname.startsWith('/claim-url');

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store'
        }).catch(() => null); // Suppress fetch errors in console

        if (!response) {
          setUserData(null);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
        } else {
          // 401 is expected when not logged in - silently handle
          setUserData(null);
        }
      } catch (error) {
        // Network or other errors - silently handle
        setUserData(null);
      }
    };

    // Check onboarding status from localStorage
    const userOnboarded = localStorage.getItem('userOnboarded') === 'true';
    setIsOnboarded(userOnboarded);

    checkAuth();
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('userOnboarded');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('session');
      localStorage.removeItem('claimedUsername');
      localStorage.removeItem('profileUrl');
      localStorage.removeItem('productSelection');
      localStorage.removeItem('pendingOrder');
      localStorage.removeItem('orderConfirmation');
      localStorage.removeItem('checkoutVoucherState');
      localStorage.removeItem('nfcConfig');
      localStorage.removeItem('cardConfig');
      localStorage.removeItem('orderData');

      // Call logout API
      await fetch('/api/auth/logout', { method: 'POST' });

      // Clear cookies
      document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'userEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      // Show success message
      toast.success('Logged out successfully!');

      // Redirect to home
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed. Please try again.');
    }
  };

  // For admin routes, render children without navbar/footer
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // For inner pages, render with simple header (only logo + logout after onboarding)
  if (isInnerPage) {
    // Special case: claim-url page has its own logo header, don't add header from layout
    if (pathname.startsWith('/claim-url')) {
      return <>{children}</>;
    }

    // Only show logout on these pages (after user has completed onboarding)
    const showLogout = pathname.startsWith('/product-selection') ||
                       pathname.startsWith('/nfc/') ||
                       pathname.startsWith('/account') ||
                       pathname.startsWith('/profile-dashboard') ||
                       pathname.startsWith('/checkout') ||
                       pathname.startsWith('/confirm-payment') ||
                       pathname.startsWith('/profiles/preview') ||
                       pathname.startsWith('/profiles/builder');

    // Show footer on profile pages
    const showFooter = pathname.startsWith('/profiles/preview') ||
                       pathname.startsWith('/profiles/builder');

    return (
      <>
        <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 h-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
            <Link href="/">
              <Logo width={100} height={32} noLink={true} variant="light" />
            </Link>
            {userData && !isAuthPage && showLogout && (
              <div className="relative" ref={dropdownRef}>
                {/* User Avatar Button with Dropdown */}
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-semibold">
                    {userData.first_name
                      ? `${userData.first_name[0]}`.toUpperCase()
                      : userData.email?.[0].toUpperCase() || 'U'}
                  </div>
                  <span className="hidden md:block text-sm text-gray-700 font-medium">
                    {userData.first_name && userData.last_name
                      ? `${userData.first_name.toLowerCase()}${userData.last_name.toLowerCase()}`
                      : userData.first_name
                      ? userData.first_name.toLowerCase()
                      : userData.email?.split('@')[0] || 'user'}
                  </span>
                  {/* Dropdown Arrow */}
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white text-sm font-semibold">
                          {userData.first_name && userData.last_name
                            ? `${userData.first_name[0]}`.toUpperCase()
                            : userData.email?.[0].toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {userData.first_name && userData.last_name
                              ? `${userData.first_name} ${userData.last_name}`
                              : 'User'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {userData.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dropdown Items */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          router.push('/profiles/builder');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile Builder
                      </button>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          router.push('/profile-dashboard');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        Dashboard
                      </button>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          router.push('/orders');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        My Orders
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>
        <main className="pt-16 flex-grow min-h-0">
          {children}
        </main>
        {showFooter && <Footer />}
      </>
    );
  }

  // Check if it's the landing or home page (which has its own footer and navbar)
  const isLandingPage = pathname === '/';

  // Check if it's a dynamic username route (e.g., /bhu-bala)
  // Username routes are single-level paths that don't match any known routes
  const knownRoutes = ['/admin', '/api', '/checkout', '/confirm-payment', '/thank-you', '/account',
                       '/profile-dashboard', '/verify-email', '/nfc', '/product-selection', '/choose-plan',
                       '/welcome-to-linkist', '/verify-mobile', '/verify-login', '/login', '/register',
                       '/profiles', '/claim-url', '/help', '/contact', '/about', '/pricing', '/features',
                       '/founding-member', '/templates', '/new-card', '/_next', '/favicon'];

  const isUsernameRoute = pathname !== '/' &&
                          !pathname.includes('/', 1) && // Single level route (no additional slashes)
                          !knownRoutes.some(route => pathname.startsWith(route));

  // For username routes, render children only (page has its own header)
  if (isUsernameRoute) {
    return <>{children}</>;
  }

  // For normal routes, render with navbar and footer (except landing/home page)
  return (
    <>
      {!isLandingPage && <Navbar />}
      <main className={`${!isLandingPage ? 'pt-16' : ''} flex-grow min-h-0`}>
        {children}
      </main>
      {!isLandingPage && <Footer />}
    </>
  );
}