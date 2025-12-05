'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import Logo from '@/components/Logo';
import { usePWA } from '@/contexts/PWAContext';
import {
  CheckCircle,
  Email,
  Phone,
  WhatsApp,
  Work,
  Business,
  LinkedIn,
  Instagram,
  Facebook,
  X as XIcon,
  GitHub,
  YouTube,
  Language,
  LocationOn,
  Star,
  Link as LinkIcon,
  ContentCopy,
  QrCode2,
  CloudDownload,
  Share as ShareIcon,
  BookmarkAdd,
  PersonAdd
} from '@mui/icons-material';

// Currency symbols mapping
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' }
];

interface ProfileData {
  salutation: string;
  firstName: string;
  lastName: string;
  primaryEmail: string;
  secondaryEmail: string;
  mobileNumber: string;
  whatsappNumber: string;
  jobTitle: string;
  companyName: string;
  companyWebsite: string;
  companyAddress: string;
  companyLogo: string | null;
  industry: string;
  subDomain: string;
  skills: string[];
  professionalSummary: string;
  linkedinUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  behanceUrl: string;
  dribbbleUrl: string;
  githubUrl: string;
  youtubeUrl: string;
  // Basic Information toggles
  showEmailPublicly: boolean;
  showSecondaryEmailPublicly: boolean;
  showMobilePublicly: boolean;
  showWhatsappPublicly: boolean;
  // Professional Information toggles
  showJobTitle: boolean;
  showCompanyName: boolean;
  showCompanyWebsite: boolean;
  showCompanyAddress: boolean;
  showIndustry: boolean;
  showSkills: boolean;
  // Social Media toggles
  showLinkedin: boolean;
  showInstagram: boolean;
  showFacebook: boolean;
  showTwitter: boolean;
  showBehance: boolean;
  showDribbble: boolean;
  showGithub: boolean;
  showYoutube: boolean;
  // Media toggles
  profilePhoto: string | null;
  backgroundImage: string | null;
  showProfilePhoto: boolean;
  showBackgroundImage: boolean;
  // Services
  services?: Array<{
    id: string;
    title: string;
    description?: string;
    pricing: string;
    pricingUnit?: string;
    currency?: string;
    category: string;
    showPublicly?: boolean;
  }>;
  // Certifications
  certifications?: Array<{
    id: string;
    name: string;
    title: string;
    url: string;
    size: number;
    type: string;
    showPublicly: boolean;
  }>;
}

export default function ProfilePreviewPage() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [showShareSection, setShowShareSection] = useState(false);
  const [showAddToHomePopup, setShowAddToHomePopup] = useState(false);
  const [shortcutName, setShortcutName] = useState('');
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showAndroidInstructions, setShowAndroidInstructions] = useState(false);

  // Use centralized PWA context
  const { isIOS, isAndroid, isInstallable, triggerInstall } = usePWA();

  useEffect(() => {
    const fetchProfileData = async () => {
      // First, try to get custom URL from localStorage
      const claimedUsername = localStorage.getItem('claimedUsername');
      if (claimedUsername) {
        const baseUrl = window.location.origin;
        setCustomUrl(`${baseUrl}/${claimedUsername}`);
      }
      try {
        console.log('🔍 Fetching profile data for preview...');

        // Fetch profile from database (API uses authenticated user from session)
        const profileResponse = await fetch('/api/profiles');

        if (!profileResponse.ok) {
          console.log('⚠️ Profile fetch failed, trying localStorage fallback...');

          // Try to get current user email for filtering
          let currentUserEmail = null;
          try {
            const authResponse = await fetch('/api/auth/me');
            if (authResponse.ok) {
              const authData = await authResponse.json();
              currentUserEmail = authData.user?.email;
            }
          } catch (e) {
            console.log('Could not fetch user email for filtering');
          }

          // Not authenticated or no profile, try localStorage as fallback
          const profilesStr = localStorage.getItem('userProfiles');
          if (profilesStr) {
            const profiles = JSON.parse(profilesStr);

            // Filter to current user's profiles only
            const userProfiles = currentUserEmail
              ? profiles.filter((p: any) => p.email === currentUserEmail || p.userEmail === currentUserEmail)
              : profiles;

            if (userProfiles && userProfiles.length > 0) {
              console.log(`✅ Found ${userProfiles.length} profile(s) in localStorage`);
              setProfileData(userProfiles[userProfiles.length - 1]);
            }
          }
          setLoading(false);
          return;
        }

        const data = await profileResponse.json();
        console.log('📦 Profile API response:', data);

        if (data.profiles && data.profiles.length > 0) {
          // Get the most recent profile
          const dbProfile = data.profiles[0];
          console.log('✅ Found profile in database:', dbProfile.id);
          console.log('🔍 DEBUG - dbProfile.whatsapp_number:', dbProfile.whatsapp_number);
          console.log('🔍 DEBUG - dbProfile.display_settings:', JSON.stringify(dbProfile.display_settings, null, 2));

          // Map database profile to preview format
          const mappedProfile: ProfileData = {
            salutation: dbProfile.preferences?.salutation || '',
            firstName: dbProfile.first_name || '',
            lastName: dbProfile.last_name || '',
            primaryEmail: dbProfile.email || '',
            secondaryEmail: dbProfile.alternate_email || '',
            mobileNumber: dbProfile.phone_number || '',
            whatsappNumber: dbProfile.whatsapp_number || '',
            jobTitle: dbProfile.job_title || '',
            companyName: dbProfile.company_name || '',
            companyWebsite: dbProfile.company_website || '',
            companyAddress: dbProfile.company_address || '',
            companyLogo: dbProfile.company_logo_url,
            industry: dbProfile.industry || '',
            subDomain: dbProfile.sub_domain || '',
            skills: dbProfile.skills || [],
            professionalSummary: dbProfile.professional_summary || '',
            linkedinUrl: dbProfile.social_links?.linkedin || '',
            instagramUrl: dbProfile.social_links?.instagram || '',
            facebookUrl: dbProfile.social_links?.facebook || '',
            twitterUrl: dbProfile.social_links?.twitter || '',
            behanceUrl: dbProfile.social_links?.behance || '',
            dribbbleUrl: dbProfile.social_links?.dribbble || '',
            githubUrl: dbProfile.social_links?.github || '',
            youtubeUrl: dbProfile.social_links?.youtube || '',
            // Read toggle values from display_settings (preferred) or preferences (fallback)
            showEmailPublicly: dbProfile.display_settings?.showEmailPublicly ?? dbProfile.preferences?.showEmailPublicly ?? true,
            showSecondaryEmailPublicly: dbProfile.display_settings?.showSecondaryEmailPublicly ?? dbProfile.preferences?.showSecondaryEmailPublicly ?? true,
            showMobilePublicly: dbProfile.display_settings?.showMobilePublicly ?? dbProfile.preferences?.showMobilePublicly ?? true,
            showWhatsappPublicly: dbProfile.display_settings?.showWhatsappPublicly ?? dbProfile.preferences?.showWhatsappPublicly ?? false,
            showJobTitle: dbProfile.display_settings?.showJobTitle ?? dbProfile.preferences?.showJobTitle ?? true,
            showCompanyName: dbProfile.display_settings?.showCompanyName ?? dbProfile.preferences?.showCompanyName ?? true,
            showCompanyWebsite: dbProfile.display_settings?.showCompanyWebsite ?? dbProfile.preferences?.showCompanyWebsite ?? true,
            showCompanyAddress: dbProfile.display_settings?.showCompanyAddress ?? dbProfile.preferences?.showCompanyAddress ?? true,
            showIndustry: dbProfile.display_settings?.showIndustry ?? dbProfile.preferences?.showIndustry ?? true,
            showSkills: dbProfile.display_settings?.showSkills ?? dbProfile.preferences?.showSkills ?? true,
            showLinkedin: dbProfile.display_settings?.showLinkedin ?? dbProfile.preferences?.showLinkedin ?? false,
            showInstagram: dbProfile.display_settings?.showInstagram ?? dbProfile.preferences?.showInstagram ?? false,
            showFacebook: dbProfile.display_settings?.showFacebook ?? dbProfile.preferences?.showFacebook ?? false,
            showTwitter: dbProfile.display_settings?.showTwitter ?? dbProfile.preferences?.showTwitter ?? false,
            showBehance: dbProfile.display_settings?.showBehance ?? dbProfile.preferences?.showBehance ?? false,
            showDribbble: dbProfile.display_settings?.showDribbble ?? dbProfile.preferences?.showDribbble ?? false,
            showGithub: dbProfile.display_settings?.showGithub ?? dbProfile.preferences?.showGithub ?? false,
            showYoutube: dbProfile.display_settings?.showYoutube ?? dbProfile.preferences?.showYoutube ?? false,
            profilePhoto: dbProfile.profile_photo_url,
            backgroundImage: dbProfile.background_image_url,
            showProfilePhoto: dbProfile.preferences?.showProfilePhoto ?? true,
            showBackgroundImage: dbProfile.preferences?.showBackgroundImage ?? true,
            // Services
            services: dbProfile.services || [],
            // Certifications
            certifications: dbProfile.preferences?.certifications || [],
          };

          console.log('✅ Mapped profile data for preview');
          console.log('📋 Services loaded:', dbProfile.services?.length || 0);
          console.log('🔍 DEBUG - mappedProfile.whatsappNumber:', mappedProfile.whatsappNumber);
          console.log('🔍 DEBUG - mappedProfile.showWhatsappPublicly:', mappedProfile.showWhatsappPublicly);
          setProfileData(mappedProfile);

          // Set customUrl from database if not already set from localStorage
          if (!customUrl) {
            const baseUrl = window.location.origin;
            let username = 'your-profile';

            if (dbProfile.custom_url) {
              // Use custom_url from database (same as dashboard)
              username = dbProfile.custom_url;
            } else if (dbProfile.first_name) {
              // Use first name as username
              username = dbProfile.first_name.toLowerCase().replace(/\s+/g, '-');
            } else if (dbProfile.email) {
              // Last resort fallback to email username
              username = dbProfile.email.split('@')[0];
            }

            setCustomUrl(`${baseUrl}/${username}`);
            console.log('✅ Set customUrl from database:', username);
          }
        } else {
          console.log('⚠️ No profiles found in database, redirecting to profile builder...');
          // No profiles found - don't use localStorage as it might have stale data
          // Redirect to create a new profile
          setTimeout(() => {
            router.push('/profiles/templates');
          }, 2000);
        }
      } catch (error) {
        console.error('❌ Error fetching profile:', error);
        // On error, don't use localStorage fallback to prevent showing wrong user's data
        // Instead, redirect to login
        setTimeout(() => {
          router.push('/login?redirect=/profiles/preview');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Generate QR Code when custom URL is set
  useEffect(() => {
    const generateQrCode = async () => {
      if (!customUrl) return;

      try {
        const qrDataUrl = await QRCode.toDataURL(customUrl, {
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

    if (customUrl) {
      generateQrCode();
    }
  }, [customUrl]);


  // Set default shortcut name when profile loads
  useEffect(() => {
    if (profileData) {
      const defaultName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'My Profile';
      setShortcutName(defaultName);
    }
  }, [profileData]);

  // Handle Add to Home Screen
  const handleAddToHomeScreen = async () => {
    console.log('🏠 Add to Home Screen clicked');
    console.log('📱 Platform: iOS =', isIOS, ', Android =', isAndroid);
    console.log('📦 PWA Installable:', isInstallable);
    console.log('🔍 Window deferred prompt:', typeof window !== 'undefined' ? !!(window as any).deferredPrompt : 'N/A');

    if (isIOS) {
      // iOS doesn't support programmatic install, show instructions directly
      console.log('📱 iOS detected - showing instructions');
      setShowIOSInstructions(true);
      return;
    }

    // Try native PWA install first
    const result = await triggerInstall();

    if (result === 'accepted') {
      console.log('✅ User accepted the install prompt');
      // Success - native popup handled everything
    } else if (result === 'dismissed') {
      console.log('❌ User dismissed the install prompt');
      // User dismissed - that's fine, no fallback needed
    } else {
      // No deferred prompt available - show instructions modal
      console.log('❌ No deferred prompt available, showing instructions');
      console.log('ℹ️ This usually means: not HTTPS, already installed, or browser doesn\'t support beforeinstallprompt');
      setShowAndroidInstructions(true);
    }
  };

  const handleCopyUrl = async () => {
    if (!customUrl) return;

    try {
      await navigator.clipboard.writeText(customUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleShare = async () => {
    if (!customUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profileData?.firstName} ${profileData?.lastName}'s Profile`,
          text: `Check out my professional profile!`,
          url: customUrl
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(customUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Failed to share:', error);
        // Fallback to copy on error
        try {
          await navigator.clipboard.writeText(customUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (copyError) {
          console.error('Failed to copy URL:', copyError);
        }
      }
    }
  };

  const handleDownloadQrCode = () => {
    if (!qrCodeUrl) return;

    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `profile-qr-code.png`;
    a.click();
  };

  const handleShareQrCode = async () => {
    const profileUrl = typeof window !== 'undefined' ? window.location.href : '';

    try {
      // First try Web Share API with just URL (works on most browsers)
      if (navigator.share) {
        await navigator.share({
          title: `${profileData?.firstName} ${profileData?.lastName}'s Profile`,
          text: 'Check out my digital profile!',
          url: profileUrl
        });
        return;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return; // User cancelled
      // Share failed, fall through to clipboard fallback
    }

    // Fallback: copy URL to clipboard
    try {
      await navigator.clipboard.writeText(profileUrl);
      alert('Profile link copied to clipboard!');
    } catch (err) {
      alert('Failed to copy link');
    }
  };

  // Generate and download vCard for saving to contacts
  const handleSaveToContacts = async () => {
    if (!profileData) return;

    // Create vCard format (v3.0 for maximum compatibility)
    const fullName = profileData.salutation
      ? `${profileData.salutation} ${profileData.firstName} ${profileData.lastName}`
      : `${profileData.firstName} ${profileData.lastName}`;
    const vCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${fullName}`,
      `N:${profileData.lastName};${profileData.firstName};;${profileData.salutation || ''};`,
      profileData.jobTitle && profileData.showJobTitle ? `TITLE:${profileData.jobTitle}` : '',
      profileData.companyName && profileData.showCompanyName ? `ORG:${profileData.companyName}` : '',
      profileData.primaryEmail && profileData.showEmailPublicly ? `EMAIL;TYPE=INTERNET:${profileData.primaryEmail}` : '',
      profileData.secondaryEmail && profileData.showSecondaryEmailPublicly ? `EMAIL;TYPE=INTERNET:${profileData.secondaryEmail}` : '',
      profileData.mobileNumber && profileData.showMobilePublicly ? `TEL;TYPE=CELL:${profileData.mobileNumber}` : '',
      profileData.whatsappNumber && profileData.showWhatsappPublicly ? `TEL;TYPE=WHATSAPP:${profileData.whatsappNumber}` : '',
      profileData.companyWebsite && profileData.showCompanyWebsite ? `URL:${profileData.companyWebsite}` : '',
      profileData.companyAddress && profileData.showCompanyAddress ? `ADR;TYPE=WORK:;;${profileData.companyAddress};;;;` : '',
      customUrl ? `URL:${customUrl}` : '',
      profileData.professionalSummary ? `NOTE:${profileData.professionalSummary.replace(/\n/g, '\\n')}` : '',
      'END:VCARD'
    ].filter(line => line).join('\n');

    // Create blob
    const blob = new Blob([vCard], { type: 'text/vcard;charset=utf-8' });
    const fileName = `${profileData.firstName}-${profileData.lastName}.vcf`;

    // Try Web Share API first (works on mobile browsers including Chrome iOS)
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], fileName, { type: 'text/vcard;charset=utf-8' });

        // Check if files can be shared
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${profileData.firstName} ${profileData.lastName} Contact`,
            text: `Save ${profileData.firstName} ${profileData.lastName} to your contacts`
          });
          return; // Exit if sharing was successful
        }
      } catch (error: any) {
        // If user cancels the share, don't show error
        if (error.name === 'AbortError') {
          return;
        }
        console.log('Web Share API not available or failed, falling back to download');
      }
    }

    // Fallback: Traditional download method (for desktop and browsers that don't support Web Share API)
    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;

      // For iOS devices, open in new tab as additional fallback
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        link.target = '_blank';
      }

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download contact:', error);
      alert('Unable to save contact. Please try again or use a different browser.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No profile data found</p>
          <button
            onClick={() => router.push('/profiles/builder')}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Card */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Profile Preview Header with Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-0">Profile Preview</h1>
          <button
            onClick={() => router.push('/profiles/builder')}
            className="w-full sm:w-auto px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            Edit Profile
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Background Image */}
          {profileData.showBackgroundImage && profileData.backgroundImage ? (
            <div className="h-24 sm:h-32 relative">
              <img src={profileData.backgroundImage} alt="Background" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="h-24 sm:h-32 bg-gradient-to-r from-purple-600 via-blue-500 to-teal-400"></div>
          )}

          <div className="px-6 sm:px-8 pb-8">
            {/* Profile Section */}
            <div className="flex items-start gap-4 sm:gap-6 -mt-12 sm:-mt-16">
              {/* Left Column - Profile Photo & Info */}
              <div className="flex-1">
                {/* Profile Photo */}
                {profileData.showProfilePhoto && (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 sm:border-6 border-blue-500 bg-white overflow-hidden shadow-xl relative z-10 mb-4">
                    {profileData.profilePhoto ? (
                      <img src={profileData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl sm:text-4xl font-bold">
                        {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                      </div>
                    )}
                  </div>
                )}

                {/* Name */}
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 capitalize">
                  {profileData.salutation && `${profileData.salutation} `}{profileData.firstName} {profileData.lastName}
                </h1>
                 {/* Job Title */}
                 {profileData.showJobTitle && profileData.jobTitle && (
                  <p className="text-sm sm:text-base text-gray-700 mb-2">
                    {profileData.jobTitle}
                    {profileData.showCompanyName && profileData.companyName && ` @${profileData.companyName}`}
                  </p>
                )}
                {/* Company & Industry */}
                <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                  {profileData.showCompanyName && profileData.companyName && profileData.showIndustry && profileData.industry && (
                    <p>
                      {profileData.companyName} - {profileData.industry}
                    </p>
                  )}
                  {profileData.subDomain && (
                    <p>{profileData.subDomain}</p>
                  )}
                </div>
              </div>

              {/* Company Logo - Right side */}
              {profileData.companyLogo && (
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-lg p-2 shadow-md flex-shrink-0 relative z-0">
                  <img src={profileData.companyLogo} alt="Company Logo" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-6 sm:my-8"></div>

            {/* Share and Add to Contacts Buttons */}
            <div className="mb-6 flex flex-row gap-3">
              <button
                onClick={() => setShowShareSection(!showShareSection)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-md"
                style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
              >
                <ShareIcon className="w-5 h-5" />
                Share
              </button>
              <button
                onClick={handleSaveToContacts}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-md"
                style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
              >
                <PersonAdd className="w-5 h-5" />
                Add to Contacts
              </button>
            </div>

            {/* Save Shortcut to Homepage Button */}
            <div className="mb-6">
              <button
                onClick={handleAddToHomeScreen}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-red-600 border-2 border-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors shadow-md"
              >
                <BookmarkAdd className="w-5 h-5" />
                Save shortcut to homepage
              </button>
            </div>

            {/* Share Section - Compact Layout */}
            {showShareSection && (
              <div className="mb-6 sm:mb-8">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">Your Profile URL</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowQrCode(true)}
                        className="flex-shrink-0 p-2 bg-white border border-blue-300 text-blue-600 rounded hover:bg-blue-50 transition"
                        title="Show QR Code"
                      >
                        <QrCode2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleCopyUrl}
                        className="flex-shrink-0 p-2 bg-white border border-blue-300 text-blue-600 rounded hover:bg-blue-50 transition"
                        title="Copy URL"
                      >
                        {copied ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <ContentCopy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <a
                    href={customUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium break-all block"
                  >
                    {customUrl}
                  </a>
                </div>
              </div>
            )}

            {/* Professional Summary Section */}
            {profileData.professionalSummary && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Professional Summary</h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed text-justify">{profileData.professionalSummary}</p>
              </div>
            )}

            {/* Contact Information Section */}
            <div id="contact-section" className="mb-8 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Contact Information</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Left Column */}
                <div>
                  <div className="space-y-3">
                    {profileData.showEmailPublicly && profileData.primaryEmail && (
                      <div className="flex items-start gap-3">
                        <Email className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <a href={`mailto:${profileData.primaryEmail}`} className="text-sm text-gray-700 hover:text-blue-600 break-all">
                          {profileData.primaryEmail}
                        </a>
                      </div>
                    )}
                    {profileData.showSecondaryEmailPublicly && profileData.secondaryEmail && (
                      <div className="flex items-start gap-3">
                        <Email className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <a href={`mailto:${profileData.secondaryEmail}`} className="text-sm text-gray-700 hover:text-green-600 break-all">
                          {profileData.secondaryEmail}
                        </a>
                      </div>
                    )}
                    {profileData.showMobilePublicly && profileData.mobileNumber && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <button
                          type="button"
                          onClick={() => { window.location.href = `tel:${profileData.mobileNumber}`; }}
                          className="text-sm text-gray-700 hover:text-blue-600"
                          aria-label={`Call ${profileData.firstName ?? profileData.lastName ?? 'contact'}`}
                        >
                          {profileData.mobileNumber}
                        </button>
                      </div>
                    )}
                    {profileData.showWhatsappPublicly && profileData.whatsappNumber && (
                      <div className="flex items-center gap-3">
                        <WhatsApp className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <a href={`https://wa.me/${profileData.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-700 hover:text-green-600">
                          {profileData.whatsappNumber}
                        </a>
                      </div>
                    )}
                    {profileData.showCompanyWebsite && profileData.companyWebsite && (
                      <div className="flex items-start gap-3">
                        <Language className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <a href={profileData.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                          {profileData.companyWebsite}
                        </a>
                      </div>
                    )}
                    {profileData.showCompanyAddress && profileData.companyAddress && (
                      <div className="flex items-start gap-3">
                        <LocationOn className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{profileData.companyAddress}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Skills */}
                <div>
                  {profileData.showSkills && profileData.skills && profileData.skills.length > 0 && (
                    <>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Skills & Expertise</h4>
                      <div className="flex flex-wrap gap-2">
                        {profileData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Your Profile URL Section */}
            {customUrl && (
              <div className="mb-6 sm:mb-8">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">Your Profile URL</span>
                    </div>
                    <button
                      onClick={() => setShowQrCode(true)}
                      className="flex-shrink-0 p-2 bg-white border border-blue-300 text-blue-600 rounded hover:bg-blue-50 transition"
                      title="Show QR Code"
                    >
                      <QrCode2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={customUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium break-all flex-1"
                    >
                      {customUrl}
                    </a>
                    <button
                      onClick={handleCopyUrl}
                      className="flex-shrink-0 p-2 bg-white border border-blue-300 text-blue-600 rounded hover:bg-blue-50 transition"
                      title="Copy URL"
                    >
                      {copied ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <ContentCopy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Certifications Section */}
            {profileData.certifications && profileData.certifications.filter(cert => cert.showPublicly).length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Certifications</h3>
                <div className="space-y-2">
                  {profileData.certifications
                    .filter(cert => cert.showPublicly)
                    .map((cert) => (
                      <a
                        key={cert.id}
                        href={cert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          {/* File type icon */}
                          <div className="flex-shrink-0">
                            {cert.type === 'application/pdf' ? (
                              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                                <path d="M14 2v6h6"/>
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                                <path d="M14 2v6h6"/>
                              </svg>
                            )}
                          </div>
                          {/* Certification title */}
                          <span className="text-sm sm:text-base text-gray-900 font-medium flex-1">
                            {cert.title}
                          </span>
                          {/* Download/view icon */}
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </div>
                      </a>
                    ))}
                </div>
              </div>
            )}

            {/* Social Media Links */}
            {(profileData.showLinkedin || profileData.showInstagram || profileData.showFacebook ||
              profileData.showTwitter || profileData.showGithub || profileData.showYoutube ||
              profileData.showBehance || profileData.showDribbble) && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Social Profiles</h3>
                <div className="flex flex-wrap gap-3">
                  {profileData.showLinkedin && profileData.linkedinUrl && (
                    <a
                      href={profileData.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm"
                    >
                      <LinkedIn className="w-5 h-5" />
                      LinkedIn
                    </a>
                  )}
                  {profileData.showInstagram && profileData.instagramUrl && (
                    <a
                      href={profileData.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-pink-600 hover:bg-pink-50 hover:text-pink-600 transition-colors text-sm"
                    >
                      <Instagram className="w-5 h-5" />
                      Instagram
                    </a>
                  )}
                  {profileData.showFacebook && profileData.facebookUrl && (
                    <a
                      href={profileData.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm"
                    >
                      <Facebook className="w-5 h-5" />
                      Facebook
                    </a>
                  )}
                  {profileData.showTwitter && profileData.twitterUrl && (
                    <a
                      href={profileData.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-900 hover:bg-gray-50 hover:text-gray-900 transition-colors text-sm"
                    >
                      <XIcon className="w-5 h-5" />
                      X
                    </a>
                  )}
                  {profileData.showGithub && profileData.githubUrl && (
                    <a
                      href={profileData.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-900 hover:bg-gray-50 hover:text-gray-900 transition-colors text-sm"
                    >
                      <GitHub className="w-5 h-5" />
                      GitHub
                    </a>
                  )}
                  {profileData.showYoutube && profileData.youtubeUrl && (
                    <a
                      href={profileData.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-red-600 hover:bg-red-50 hover:text-red-600 transition-colors text-sm"
                    >
                      <YouTube className="w-5 h-5" />
                      YouTube
                    </a>
                  )}
                  {profileData.showBehance && profileData.behanceUrl && (
                    <a
                      href={profileData.behanceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 hover:text-blue-500 transition-colors text-sm"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.938 4.503c.702 0 1.34.06 1.92.188.577.13 1.07.33 1.485.61.41.28.733.65.96 1.12.225.47.34 1.05.34 1.73 0 .74-.17 1.36-.507 1.86-.338.5-.837.9-1.502 1.22.906.26 1.576.72 2.022 1.37.448.66.665 1.45.665 2.36 0 .75-.13 1.39-.41 1.93-.28.55-.67 1-1.16 1.35-.48.348-1.05.6-1.67.767-.61.165-1.252.254-1.91.254H0V4.51h6.938v-.007zM3.495 7.98h2.704c.82 0 1.42-.18 1.802-.53.383-.35.572-.81.572-1.38 0-.31-.06-.58-.18-.798-.12-.22-.29-.4-.51-.56-.22-.158-.48-.278-.78-.355-.3-.077-.63-.115-.99-.115H3.495v3.738zm0 8.027h3.09c.39 0 .73-.04 1.02-.13.29-.09.53-.22.73-.396.19-.177.33-.39.43-.64.09-.25.13-.54.13-.87 0-.68-.17-1.19-.52-1.53-.35-.34-.86-.51-1.54-.51H3.495v4.077zm14.588-8.82h-4.162V5.92h4.162v1.27zm.617 7.66c.36.367.89.55 1.57.55.5 0 .92-.13 1.26-.39.34-.26.57-.54.68-.84h2.29c-.37 1.18-.95 2.02-1.73 2.52-.78.5-1.69.75-2.73.75-.78 0-1.48-.13-2.09-.38-.61-.25-1.13-.6-1.56-1.05-.42-.45-.74-.98-.95-1.6-.21-.62-.32-1.29-.32-2.01 0-.71.11-1.38.32-1.99.21-.61.52-1.14.94-1.59.42-.45.94-.8 1.55-1.05.61-.25 1.31-.38 2.09-.38.84 0 1.58.16 2.21.48.63.32 1.16.76 1.58 1.32.42.56.73 1.22.93 1.97.2.75.28 1.56.23 2.42h-6.86c.02.78.25 1.42.61 1.78zm-.23-4.54c-.26-.35-.73-.52-1.4-.52-.4 0-.73.08-1 .24-.26.16-.48.36-.64.58-.16.22-.27.45-.33.68-.06.23-.09.43-.09.59h4.16c-.08-.67-.31-1.22-.7-1.57z"/>
                      </svg>
                      Behance
                    </a>
                  )}
                  {profileData.showDribbble && profileData.dribbbleUrl && (
                    <a
                      href={profileData.dribbbleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-pink-500 hover:bg-pink-50 hover:text-pink-500 transition-colors text-sm"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.816zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.935 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z"/>
                      </svg>
                      Dribbble
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Services Section */}
            {profileData.services && profileData.services.filter(s => s.showPublicly !== false).length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Services</h3>
                <div className="space-y-3">
                  {profileData.services.filter(s => s.showPublicly !== false).map((service) => (
                    <div
                      key={service.id}
                      className="flex items-start justify-between gap-4 py-2"
                    >
                      <div className="flex-1">
                        <h4 className="text-sm sm:text-base font-medium text-gray-900">{service.title}</h4>
                        {service.description && (
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">{service.description}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm sm:text-base text-gray-600">
                          {CURRENCIES.find(c => c.code === (service.currency || 'USD'))?.symbol || '$'}
                          {service.pricing}{service.pricingUnit || ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={() => router.push('/profiles/builder')}
            className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm sm:text-base cursor-pointer"
          >
            Edit Profile
          </button>
          <button
            onClick={() => router.push('/profile-dashboard')}
            className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-lg text-sm sm:text-base border-0 cursor-pointer"
            style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrCode && qrCodeUrl && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
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
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col items-center">
              <img
                src={qrCodeUrl}
                alt="Profile QR Code"
                className="w-64 h-64 border-2 border-blue-300 rounded-lg bg-white p-4"
              />
              <p className="text-sm text-gray-600 mt-4 text-center">
                Scan this QR code to visit this profile
              </p>

              <div className="flex gap-3 mt-6 w-full">
                <button
                  onClick={handleDownloadQrCode}
                  className="flex-1 px-4 py-3 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 font-medium border-2 border-red-600"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  <CloudDownload className="w-5 h-5" />
                  Download
                </button>
                <button
                  onClick={handleShareQrCode}
                  className="flex-1 px-4 py-3 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 font-medium border-2 border-red-600"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  <ShareIcon className="w-5 h-5" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add to Home Screen Popup */}
      {showAddToHomePopup && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          onClick={() => setShowAddToHomePopup(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add to Home Screen</h3>
              <button
                onClick={() => setShowAddToHomePopup(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Enter a name for your shortcut. This will appear on your home screen.
            </p>

            <input
              type="text"
              value={shortcutName}
              onChange={(e) => setShortcutName(e.target.value)}
              placeholder="Shortcut name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none mb-4 text-gray-900"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddToHomePopup(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToHomeScreen}
                className="flex-1 px-4 py-3 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                style={{ backgroundColor: '#dc2626' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          onClick={() => setShowIOSInstructions(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add to Home Screen</h3>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                To add <strong>&quot;{shortcutName}&quot;</strong> to your home screen:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <p className="text-sm text-gray-700">
                    Tap the <strong>Share</strong> button{' '}
                    <svg className="inline-block w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>{' '}
                    at the bottom of Safari
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <p className="text-sm text-gray-700">
                    Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <p className="text-sm text-gray-700">
                    Name it <strong>&quot;{shortcutName}&quot;</strong> and tap <strong>Add</strong>
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full mt-6 px-4 py-3 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              style={{ backgroundColor: '#dc2626' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Android/Chrome Instructions Modal */}
      {showAndroidInstructions && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          onClick={() => setShowAndroidInstructions(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add to Home Screen</h3>
              <button
                onClick={() => setShowAndroidInstructions(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                To add <strong>&quot;{shortcutName}&quot;</strong> to your home screen:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <p className="text-sm text-gray-700">
                    Tap the <strong>menu button</strong>{' '}
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-200 rounded text-gray-700 font-bold text-lg">⋮</span>{' '}
                    in Chrome
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <p className="text-sm text-gray-700">
                    Select <strong>&quot;Add to Home screen&quot;</strong> or <strong>&quot;Install app&quot;</strong>
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <p className="text-sm text-gray-700">
                    Name it <strong>&quot;{shortcutName}&quot;</strong> and tap <strong>Add</strong>
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> This works best on the live site with HTTPS. The native install prompt will appear automatically in production.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAndroidInstructions(false)}
              className="w-full mt-6 px-4 py-3 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              style={{ backgroundColor: '#dc2626' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
