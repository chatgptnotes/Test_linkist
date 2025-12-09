'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBaseUrl } from '@/lib/get-base-url';
import QRCode from 'qrcode';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import EmailIcon from '@mui/icons-material/Email';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ShareIcon from '@mui/icons-material/Share';
import WorkIcon from '@mui/icons-material/Work';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CollectionsIcon from '@mui/icons-material/Collections';
import PeopleIcon from '@mui/icons-material/People';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

// Icon aliases
const Package = Inventory2Icon;
const Truck = LocalShippingIcon;
const CheckCircle = CheckCircleIcon;
const Clock = AccessTimeIcon;
const User = PersonIcon;
const Settings = SettingsIcon;
const Mail = EmailIcon;
const AlertCircle = ErrorOutlineIcon;
const Eye = VisibilityIcon;
const Share = ShareIcon;
const Briefcase = WorkIcon;
const ShareNetwork = ShareRoundedIcon;
const Camera = PhotoCameraIcon;
const Gallery = CollectionsIcon;
const Users = PeopleIcon;
const EyeIcon = RemoveRedEyeIcon;
const WhatsApp = WhatsAppIcon;
const MailIcon = MailOutlineIcon;
const QrCode2 = QrCode2Icon;
const CloudDownload = CloudDownloadIcon;
const Close = CloseIcon;
const ExternalLink = OpenInNewIcon;

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  email_verified: boolean;
  mobile_verified: boolean;
  role: 'user' | 'admin';
  created_at: string;
  is_founding_member?: boolean;
  founding_member_since?: string;
  founding_member_plan?: 'lifetime' | 'annual' | 'monthly' | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  email: string;
  cardConfig: any;
  shipping: any;
  pricing: {
    total: number;
    subtotal: number;
    shipping: number;
    tax: number;
  };
  estimatedDelivery?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  createdAt: number;
  updatedAt: number;
}

interface AccountStats {
  totalOrders: number;
  totalSpent: number;
  recentOrders: Order[];
  founderMember: boolean;
  joinDate: string;
}

interface AnalyticsData {
  totalViews: number;
  uniqueViews: number;
  whatsappEngagement: number;
  emailEngagement: number;
  socialMediaEngagement: number;
  recentViews: any[];
  recentEngagements: any[];
}

export default function AccountPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  // Generate QR Code when profile data is available
  useEffect(() => {
    const generateQrCode = async () => {
      const baseUrl = getBaseUrl();
      let username = 'your-profile';

      if (profileData?.customUrl) {
        username = profileData.customUrl;
      } else if (user?.first_name) {
        username = user.first_name.toLowerCase().replace(/\s+/g, '-');
      } else if (profileData?.first_name) {
        username = profileData.first_name.toLowerCase().replace(/\s+/g, '-');
      } else if (profileData?.email) {
        username = profileData.email.split('@')[0];
      }

      const profileUrl = `${baseUrl}/${username}`;

      try {
        const qrDataUrl = await QRCode.toDataURL(profileUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qrDataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    if (profileData || user) {
      generateQrCode();
    }
  }, [profileData, user]);

  const loadAnalyticsData = async (email: string) => {
    try {
      console.log('📊 Fetching analytics data for:', email);
      const analyticsResponse = await fetch(`/api/profile-analytics?email=${encodeURIComponent(email)}`);

      if (analyticsResponse.ok) {
        const analyticsResult = await analyticsResponse.json();
        if (analyticsResult.success && analyticsResult.data) {
          console.log('✅ Analytics data loaded:', analyticsResult.data);
          setAnalytics(analyticsResult.data);
        } else {
          console.log('⚠️ No analytics data available');
          // Set default zero values if no data
          setAnalytics({
            totalViews: 0,
            uniqueViews: 0,
            whatsappEngagement: 0,
            emailEngagement: 0,
            socialMediaEngagement: 0,
            recentViews: [],
            recentEngagements: []
          });
        }
      } else {
        console.error('❌ Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('❌ Error loading analytics:', error);
    }
  };

  const checkAuthAndLoadData = async () => {
    try {
      // Check if user is authenticated via API
      const authResponse = await fetch('/api/auth/me');

      if (!authResponse.ok || authResponse.status === 401) {
        // Not authenticated, redirect to login
        router.push('/login?returnUrl=/profile-dashboard');
        return;
      }

      const authData = await authResponse.json();

      if (!authData.isAuthenticated || !authData.user?.email) {
        // Not authenticated, redirect to login
        router.push('/login?returnUrl=/profile-dashboard');
        return;
      }

      const userEmail = authData.user.email;
      console.log('🔍 Loading account data for:', userEmail);

      // Load account data from API
      const response = await fetch(`/api/account?email=${encodeURIComponent(userEmail)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch account data');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load account data');
      }

      console.log('✅ Account data loaded:', data.data);

      setUser(data.data.user);
      setOrders(data.data.orders);
      setStats(data.data.stats);

      // Load analytics data
      loadAnalyticsData(userEmail);

      // Load profile data from database API (using /api/profiles which works correctly)
      try {
        console.log('🔍 Fetching profile data from database for:', userEmail);
        const profileResponse = await fetch('/api/profiles');

        if (profileResponse.ok) {
          const profileResult = await profileResponse.json();
          if (profileResult.success && profileResult.profiles && profileResult.profiles.length > 0) {
            // Get the first (most recent) profile and map it to dashboard format
            const dbProfile = profileResult.profiles[0];
            console.log('✅ Profile data loaded from database:', dbProfile);

            // Map database profile to dashboard format (matching the structure expected by the component)
            const mappedProfile = {
              id: dbProfile.id,
              firstName: dbProfile.first_name,
              lastName: dbProfile.last_name,
              first_name: dbProfile.first_name,
              last_name: dbProfile.last_name,
              email: dbProfile.email,
              primaryEmail: dbProfile.email,
              mobileNumber: dbProfile.phone_number,
              phone_number: dbProfile.phone_number,
              customUrl: dbProfile.custom_url,
              custom_url: dbProfile.custom_url,
              profileUrl: dbProfile.profile_url,
              profile_url: dbProfile.profile_url,
              jobTitle: dbProfile.job_title,
              job_title: dbProfile.job_title,
              companyName: dbProfile.company_name,
              company_name: dbProfile.company_name,
              industry: dbProfile.industry,
              skills: dbProfile.skills,
              professionalSummary: dbProfile.professional_summary,
              professional_summary: dbProfile.professional_summary,
              profilePhoto: dbProfile.profile_photo_url || dbProfile.avatar_url,
              profile_photo_url: dbProfile.profile_photo_url,
              avatar_url: dbProfile.avatar_url,
              services: dbProfile.services || [],
              preferences: dbProfile.preferences || {},
              displaySettings: dbProfile.display_settings || {},
              display_settings: dbProfile.display_settings || {},
              isFounderMember: dbProfile.is_founder_member,
              is_founder_member: dbProfile.is_founder_member,
              // Social Media URLs (from social_links JSONB)
              linkedinUrl: dbProfile.social_links?.linkedin || '',
              instagramUrl: dbProfile.social_links?.instagram || '',
              facebookUrl: dbProfile.social_links?.facebook || '',
              twitterUrl: dbProfile.social_links?.twitter || '',
              githubUrl: dbProfile.social_links?.github || '',
              youtubeUrl: dbProfile.social_links?.youtube || '',
              behanceUrl: dbProfile.social_links?.behance || '',
              dribbbleUrl: dbProfile.social_links?.dribbble || '',
            };

            setProfileData(mappedProfile);
          } else {
            console.log('⚠️ No profile found in database, trying localStorage');
            loadProfileFromLocalStorage(userEmail);
          }
        } else {
          console.log('⚠️ Profile API failed, trying localStorage');
          loadProfileFromLocalStorage(userEmail);
        }
      } catch (profileError) {
        console.error('❌ Error fetching profile from database:', profileError);
        loadProfileFromLocalStorage(userEmail);
      }

      function loadProfileFromLocalStorage(email: string) {
        let loadedProfile = null;

        // Try userProfiles array first
        const savedProfiles = localStorage.getItem('userProfiles');
        if (savedProfiles) {
          try {
            const profiles = JSON.parse(savedProfiles);
            const userProfile = profiles.find((p: any) => p.email === email);
            if (userProfile) {
              loadedProfile = userProfile;
            }
          } catch (parseError) {
            console.error('Error parsing userProfiles:', parseError);
          }
        }

        // Try profileData key as fallback
        if (!loadedProfile) {
          const singleProfile = localStorage.getItem('profileData');
          if (singleProfile) {
            try {
              loadedProfile = JSON.parse(singleProfile);
            } catch (parseError) {
              console.error('Error parsing profileData:', parseError);
            }
          }
        }

        // Try userProfile key as another fallback
        if (!loadedProfile) {
          const userProfileKey = localStorage.getItem('userProfile');
          if (userProfileKey) {
            try {
              const parsed = JSON.parse(userProfileKey);
              if (parsed.email === email || !loadedProfile) {
                loadedProfile = parsed;
              }
            } catch (parseError) {
              console.error('Error parsing userProfile:', parseError);
            }
          }
        }

        if (loadedProfile) {
          console.log('✅ Profile data loaded from localStorage:', loadedProfile);
          setProfileData(loadedProfile);
        } else {
          console.log('⚠️ No profile data found in localStorage');
        }
      }

    } catch (error) {
      console.error('Error loading account data:', error);
      setError('Failed to load account information');

      // If account data fails, try to show any localStorage order data as fallback
      const currentOrder = localStorage.getItem('currentOrder');
      if (currentOrder) {
        try {
          const order = JSON.parse(currentOrder);
          setOrders([{
            ...order,
            id: 'local-' + Date.now(),
            status: 'confirmed',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }]);
          setUser({
            id: 'local-user',
            email: order.email || 'user@example.com',
            email_verified: false,
            mobile_verified: false,
            role: 'user',
            created_at: new Date().toISOString()
          });
          setError(null); // Clear error if we have fallback data
        } catch (parseError) {
          console.error('Error parsing localStorage order:', parseError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to check section completion based on user data
  const isBasicInfoComplete = () => {
    // Check if user has basic info filled
    if (user && user.first_name && user.last_name && user.email && user.phone_number) {
      return true;
    }
    // Also check profileData as fallback
    if (profileData && profileData.firstName && profileData.lastName &&
        profileData.primaryEmail && profileData.mobileNumber) {
      return true;
    }
    return false;
  };

  const isProfessionalComplete = () => {
    // Check profileData for professional info
    return profileData && (profileData.jobTitle || profileData.companyName ||
           (profileData.skills && profileData.skills.length > 0));
  };

  const isSocialMediaComplete = () => {
    // Check profileData for social media links
    if (!profileData) return false;
    return profileData.linkedinUrl || profileData.instagramUrl ||
           profileData.facebookUrl || profileData.twitterUrl ||
           profileData.githubUrl || profileData.youtubeUrl ||
           profileData.behanceUrl || profileData.dribbbleUrl;
  };

  const isProfilePhotoComplete = () => {
    // Check profileData for profile photo
    return profileData && profileData.profilePhoto;
  };


  // Calculate profile completion percentage based on actual user data
  const calculateProfileCompletion = () => {
    let completed = 0;
    const total = 4; // Total sections (removed Gallery)

    // Basic Info - check user object for actual data
    if (isBasicInfoComplete()) completed++;

    // Professional - check if profileData has professional info
    if (isProfessionalComplete()) completed++;

    // Social Media - check if profileData has social links
    if (isSocialMediaComplete()) completed++;

    // Profile Photo - check if profileData has photo
    if (isProfilePhotoComplete()) completed++;

    return Math.round((completed / total) * 100);
  };

  const profileCompletion = calculateProfileCompletion();

  const handleLogout = () => {
    // Clear any auth tokens
    document.cookie = 'session=; Max-Age=0; path=/;';
    localStorage.removeItem('verifiedEmail');
    localStorage.removeItem('emailVerified');
    router.push('/login');
  };

  const handleDownloadQrCode = () => {
    if (!qrCodeUrl) return;

    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `profile-qr-code.png`;
    a.click();
  };

  const handleShareQrCode = async () => {
    if (!qrCodeUrl) return;

    const baseUrl = getBaseUrl();
    let username = 'your-profile';

    if (profileData?.customUrl) {
      username = profileData.customUrl;
    } else if (user?.first_name) {
      username = user.first_name.toLowerCase().replace(/\s+/g, '-');
    } else if (profileData?.first_name) {
      username = profileData.first_name.toLowerCase().replace(/\s+/g, '-');
    } else if (profileData?.email) {
      username = profileData.email.split('@')[0];
    }

    const profileUrl = `${baseUrl}/${username}`;

    try {
      // Convert data URL to blob
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const file = new File([blob], 'qr-code.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Profile QR Code',
          text: `Scan this QR code to view my profile: ${profileUrl}`
        });
      } else {
        // Fallback: copy URL to clipboard
        await navigator.clipboard.writeText(profileUrl);
        alert('QR code sharing not supported. URL copied to clipboard!');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing QR code:', error);
        alert('Failed to share QR code');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Account Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header - Below Navbar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Profile Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2 sm:line-clamp-1">Manage your digital presence and connect with your network</p>
            </div>

            {/* Right side: Badge + Edit button */}
            <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
              {/* Founding Member Badge */}
              {(user?.is_founding_member || true) && (
                <div className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-md">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <span className="text-xs sm:text-sm font-bold whitespace-nowrap">Founding Member</span>
                </div>
              )}

              <Link
                href="/profiles/builder"
                className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-[#263252] text-white rounded-lg hover:bg-[#1a2339] transition-colors font-medium text-xs sm:text-sm shadow-sm"
              >
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

        {/* Profile Completion */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Profile Completion</h2>
            <span className="text-xl sm:text-2xl font-bold text-[#263252]">{profileCompletion}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-[#263252] h-3 rounded-full transition-all duration-500"
              style={{ width: `${profileCompletion}%` }}
            ></div>
          </div>

          {/* Completion Action Button */}
          {profileCompletion < 100 && (
            <div className="mb-4">
              <Link
                href="/profiles/builder"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#263252] text-white rounded-lg hover:bg-[#1a2339] transition-colors font-medium text-sm"
              >
                <Settings className="w-4 h-4" />
                Complete Your Profile
              </Link>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {isBasicInfoComplete() ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Basic Info ✓
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                Basic Info Missing
              </span>
            )}

            {isProfessionalComplete() ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Professional ✓
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                Professional Missing
              </span>
            )}

            {isSocialMediaComplete() ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Social Media ✓
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <Clock className="w-3 h-3 mr-1" />
                Social Media Pending
              </span>
            )}

          </div>
        </div>

        {/* Profile URL Section */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Profile URL</h3>
          <div className="flex flex-col gap-3">
            <div className="w-full">
              <div className="flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-[#263252] rounded-lg px-3 sm:px-4 py-3 overflow-hidden">
                <code className="text-xs sm:text-sm font-mono text-[#263252] font-semibold break-all w-full">
                  {(() => {
                    const baseUrl = getBaseUrl();

                    // Generate username from custom_url or first name
                    let username = 'your-profile';

                    if (profileData?.customUrl) {
                      // Use custom_url from database
                      username = profileData.customUrl;
                    } else if (user?.first_name) {
                      // Use first name as username
                      username = user.first_name.toLowerCase().replace(/\s+/g, '-');
                    } else if (profileData?.first_name) {
                      // Check profile data for first name
                      username = profileData.first_name.toLowerCase().replace(/\s+/g, '-');
                    } else if (profileData?.email) {
                      // Last resort fallback to email username
                      username = profileData.email.split('@')[0];
                    }

                    return `${baseUrl}/${username}`;
                  })()}
                </code>
              </div>
            </div>
            <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const baseUrl = getBaseUrl();

                // Generate username from custom_url or first name
                let username = 'your-profile';

                if (profileData?.customUrl) {
                  // Use custom_url from database
                  username = profileData.customUrl;
                } else if (user?.first_name) {
                  // Use first name as username
                  username = user.first_name.toLowerCase().replace(/\s+/g, '-');
                } else if (profileData?.first_name) {
                  // Check profile data for first name
                  username = profileData.first_name.toLowerCase().replace(/\s+/g, '-');
                } else if (profileData?.email) {
                  // Last resort fallback to email username
                  username = profileData.email.split('@')[0];
                }

                const urlToCopy = `${baseUrl}/${username}`;

                // Mobile-compatible copy function with fallback
                const copyToClipboard = (text: string) => {
                  // Method 1: Try modern Clipboard API (works on HTTPS/localhost)
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }).catch(() => {
                      // Fallback if clipboard API fails
                      fallbackCopy(text);
                    });
                  } else {
                    // Method 2: Fallback for mobile/non-HTTPS
                    fallbackCopy(text);
                  }
                };

                // Fallback copy method that works on mobile
                const fallbackCopy = (text: string) => {
                  try {
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    textArea.style.position = 'fixed';
                    textArea.style.top = '0';
                    textArea.style.left = '0';
                    textArea.style.width = '2em';
                    textArea.style.height = '2em';
                    textArea.style.padding = '0';
                    textArea.style.border = 'none';
                    textArea.style.outline = 'none';
                    textArea.style.boxShadow = 'none';
                    textArea.style.background = 'transparent';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();

                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);

                    if (successful) {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } else {
                      alert('Copy failed. Please copy manually: ' + text);
                    }
                  } catch (err) {
                    console.error('Fallback copy failed:', err);
                    alert('Copy failed. Please copy manually: ' + text);
                  }
                };

                copyToClipboard(urlToCopy);
              }}
              className="flex-1"
              style={{
                backgroundColor: copied ? '#16a34a' : '#dc2626',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                minHeight: '48px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = copied ? '#15803d' : '#b91c1c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = copied ? '#16a34a' : '#dc2626';
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={() => {
                const baseUrl = getBaseUrl();
                let username = 'your-profile';

                if (profileData?.customUrl) {
                  username = profileData.customUrl;
                } else if (user?.first_name) {
                  username = user.first_name.toLowerCase().replace(/\s+/g, '-');
                } else if (profileData?.first_name) {
                  username = profileData.first_name.toLowerCase().replace(/\s+/g, '-');
                } else if (profileData?.email) {
                  username = profileData.email.split('@')[0];
                }

                const profileUrl = `${baseUrl}/${username}`;
                window.open(profileUrl, '_blank');
              }}
              className="flex-1"
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#b91c1c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626';
              }}
            >
              <ExternalLink style={{ width: '20px', height: '20px' }} />
              View Profile
            </button>
            <button
              type="button"
              onClick={() => setShowQrCode(true)}
              className="flex-1"
              style={{
                backgroundColor: '#263252',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a2339';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#263252';
              }}
            >
              <QrCode2 style={{ width: '20px', height: '20px' }} />
              QR Code
            </button>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <br />
        <br />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Analytics Overview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:p-8">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Analytics Overview</h2>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-200 rounded-lg">
                    <EyeIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="text-sm text-gray-700">Total Profile Views</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{analytics?.totalViews || 0}</span>
              </div>
            </div>
          </div>

          {/* Profile Sections */}
          <div className="lg:col-span-2">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Profile Sections</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Personal Info Card */}
              <Link href="/profiles/builder" className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer block group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Personal Info</h3>
                      <p className="text-sm text-gray-600">Basic details & contact</p>
                    </div>
                  </div>
                  {isBasicInfoComplete() ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">Name, Email, Phone, Location</p>
              </Link>

              {/* Professional Card */}
              <Link href="/profiles/builder" className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer block group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Briefcase className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Professional</h3>
                      <p className="text-sm text-gray-600">Work & expertise</p>
                    </div>
                  </div>
                  {isProfessionalComplete() ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">Job Title, Company, Skills, Bio</p>
              </Link>

              {/* Social & Digital Card */}
              <Link href="/profiles/builder" className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer block group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-pink-100 rounded-lg">
                      <ShareNetwork className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Social & Digital</h3>
                      <p className="text-sm text-gray-600">Online presence</p>
                    </div>
                  </div>
                  {isSocialMediaComplete() ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">LinkedIn, Instagram, Portfolio links</p>
              </Link>

              {/* Profile Photo Card */}
              <Link href="/profiles/builder" className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer block group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Camera className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Profile Photo</h3>
                      <p className="text-sm text-gray-600">Your profile image</p>
                    </div>
                  </div>
                  {isProfilePhotoComplete() ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">Upload & crop your photo</p>
              </Link>

              {/* Media Gallery Card */}
              {/* Settings Card */}
              <Link href="/profile-dashboard/settings" className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer block group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Settings className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Settings</h3>
                      <p className="text-sm text-gray-600">Privacy & preferences</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500">Visibility, notifications, theme</p>
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrCode && qrCodeUrl && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowQrCode(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Profile QR Code</h3>
              <button
                onClick={() => setShowQrCode(false)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <Close className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <img
                src={qrCodeUrl}
                alt="Profile QR Code"
                className="w-64 h-64 border-2 border-[#263252] rounded-lg bg-white p-4"
              />
              <p className="text-sm text-gray-600 mt-4 text-center">
                Scan this QR code to visit this profile
              </p>

              <div className="flex gap-3 mt-6 w-full">
                <button
                  onClick={handleDownloadQrCode}
                  className="flex-1 px-4 py-3 text-white rounded-lg hover:bg-[#1a2339] transition flex items-center justify-center gap-2 font-medium border-2 border-[#263252]"
                  style={{ backgroundColor: '#263252' }}
                >
                  <CloudDownload className="w-5 h-5" />
                  Download
                </button>
                <button
                  onClick={handleShareQrCode}
                  className="flex-1 px-4 py-3 text-white rounded-lg hover:bg-[#b91c1c] transition flex items-center justify-center gap-2 font-medium border-2 border-[#dc2626]"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  <Share className="w-5 h-5" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
