'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import QRCode from 'qrcode';
import Logo from '@/components/Logo';
import {
  CheckCircle,
  Email,
  Phone,
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
  PersonAdd,
  WhatsApp,
  Share as ShareIcon
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
  services?: Array<{ id: string; title: string; description: string; pricing: string; pricingUnit?: string; currency?: string; category: string; showPublicly?: boolean }>;
  // Certifications
  certifications?: Array<{ id: string; name: string; title: string; url: string; size: number; type: string; showPublicly: boolean }>;
}

export default function ProfilePreviewPage() {
  const router = useRouter();
  const params = useParams();
  const username = params?.username as string;

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [showShareSection, setShowShareSection] = useState(false);

  useEffect(() => {
    // Set custom URL based on username from URL params
    if (username) {
      const baseUrl = window.location.origin;
      setCustomUrl(`${baseUrl}/${username}`);
    }

    const fetchProfileData = async () => {
      try {
        console.log('🔍 Fetching profile data for username:', username);

        // Fetch profile from database using username from URL
        const profileResponse = await fetch(`/api/profile/${username}`);

        if (!profileResponse.ok) {
          console.log('⚠️ Profile not found for username:', username);
          setLoading(false);
          return;
        }

        const data = await profileResponse.json();
        console.log('📦 Profile API response:', data);

        if (data.success && data.profile) {
          const dbProfile = data.profile;
          console.log('✅ Found profile in database for username:', username);

          // Map API response to ProfileData format
          const prefs = dbProfile.preferences || {};

          const mappedProfile: ProfileData = {
            salutation: prefs.salutation || '',
            firstName: dbProfile.firstName || '',
            lastName: dbProfile.lastName || '',
            primaryEmail: dbProfile.email || '',
            secondaryEmail: dbProfile.alternate_email || '',
            mobileNumber: dbProfile.phone || '',
            whatsappNumber: dbProfile.whatsapp || '',
            jobTitle: dbProfile.title || '',
            companyName: dbProfile.company || '',
            companyWebsite: dbProfile.website || '',
            companyAddress: dbProfile.location || '',
            companyLogo: dbProfile.companyLogo || null,
            industry: dbProfile.industry || '',
            subDomain: '',
            skills: dbProfile.skills || [],
            professionalSummary: dbProfile.bio || '',
            linkedinUrl: dbProfile.linkedin || '',
            instagramUrl: dbProfile.instagram || '',
            facebookUrl: dbProfile.facebook || '',
            twitterUrl: dbProfile.twitter || '',
            behanceUrl: dbProfile.social_links?.behance || prefs.behanceUrl || '',
            dribbbleUrl: dbProfile.social_links?.dribbble || prefs.dribbbleUrl || '',
            githubUrl: dbProfile.github || '',
            youtubeUrl: dbProfile.youtube || '',
            // Read toggle values from display_settings (preferred) or preferences (fallback)
            showEmailPublicly: dbProfile.display_settings?.showEmailPublicly ?? prefs.showEmailPublicly ?? true,
            showSecondaryEmailPublicly: dbProfile.display_settings?.showSecondaryEmailPublicly ?? prefs.showSecondaryEmailPublicly ?? true,
            showMobilePublicly: dbProfile.display_settings?.showMobilePublicly ?? prefs.showMobilePublicly ?? true,
            showWhatsappPublicly: dbProfile.display_settings?.showWhatsappPublicly ?? prefs.showWhatsappPublicly ?? false,
            showJobTitle: dbProfile.display_settings?.showJobTitle ?? prefs.showJobTitle ?? true,
            showCompanyName: dbProfile.display_settings?.showCompanyName ?? prefs.showCompanyName ?? true,
            showCompanyWebsite: dbProfile.display_settings?.showCompanyWebsite ?? prefs.showCompanyWebsite ?? true,
            showCompanyAddress: dbProfile.display_settings?.showCompanyAddress ?? prefs.showCompanyAddress ?? true,
            showIndustry: dbProfile.display_settings?.showIndustry ?? prefs.showIndustry ?? true,
            showSkills: dbProfile.display_settings?.showSkills ?? prefs.showSkills ?? true,
            showLinkedin: dbProfile.display_settings?.showLinkedin ?? prefs.showLinkedin ?? false,
            showInstagram: dbProfile.display_settings?.showInstagram ?? prefs.showInstagram ?? false,
            showFacebook: dbProfile.display_settings?.showFacebook ?? prefs.showFacebook ?? false,
            showTwitter: dbProfile.display_settings?.showTwitter ?? prefs.showTwitter ?? false,
            showBehance: dbProfile.display_settings?.showBehance ?? prefs.showBehance ?? false,
            showDribbble: dbProfile.display_settings?.showDribbble ?? prefs.showDribbble ?? false,
            showGithub: dbProfile.display_settings?.showGithub ?? prefs.showGithub ?? false,
            showYoutube: dbProfile.display_settings?.showYoutube ?? prefs.showYoutube ?? false,
            profilePhoto: dbProfile.profileImage || null,
            backgroundImage: dbProfile.coverImage || null,
            showProfilePhoto: prefs.showProfilePhoto ?? true,
            showBackgroundImage: prefs.showBackgroundImage ?? true,
            // Services
            services: dbProfile.services || [],
            // Certifications
            certifications: prefs.certifications || [],
          };

          console.log('✅ Mapped profile data for preview');
          setProfileData(mappedProfile);
        }
      } catch (error) {
        console.error('❌ Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfileData();
    }
  }, [username]);

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
      <div className="min-h-screen bg-gray-50">
        {/* Simple Logo-only Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
            <Logo width={140} height={45} variant="light" />
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
            <p className="text-gray-600 mb-6">
              The profile <span className="font-semibold">/{username}</span> doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Logo-only Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <Logo width={140} height={45} variant="light" />
        </div>
      </div>

      {/* Profile Card */}
      <div className="max-w-3xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Background Image */}
          {profileData.showBackgroundImage && profileData.backgroundImage ? (
            <div className="h-24 sm:h-32 relative">
              <img src={profileData.backgroundImage} alt="Background" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="h-24 sm:h-32 bg-gradient-to-r from-purple-600 via-blue-500 to-teal-400"></div>
          )}

          <div className="px-4 sm:px-6 pb-8">
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

            {/* Divider */}
            <div className="border-t border-gray-200 my-6 sm:my-8"></div>

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
              profileData.showTwitter || profileData.showBehance || profileData.showDribbble ||
              profileData.showGithub || profileData.showYoutube) && (
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
                </div>
              </div>
            )}

            {/* Services Section */}
            {profileData.services && profileData.services.filter(s => s.showPublicly !== false).length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Services</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profileData.services
                    .filter(service => service.showPublicly !== false)
                    .map((service) => (
                      <div
                        key={service.id}
                        className="rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-base font-semibold text-gray-900">{service.title}</h4>
                          {service.category && (
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                              {service.category}
                            </span>
                          )}
                        </div>
                        {service.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-3">{service.description}</p>
                        )}
                        {service.pricing && (
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-500">Pricing</span>
                            <span className="text-sm font-semibold text-red-600">
                              {CURRENCIES.find(c => c.code === (service.currency || 'USD'))?.symbol || '$'}
                              {service.pricing}{service.pricingUnit || ''}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
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
    </div>
  );
}
