'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import Logo from '@/components/Logo';
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
  Twitter,
  GitHub,
  YouTube,
  Language,
  LocationOn,
  Star,
  Link as LinkIcon,
  ContentCopy,
  QrCode2,
  CloudDownload,
  Share
} from '@mui/icons-material';

interface ProfileData {
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
    category: string;
    showPublicly?: boolean;
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
          // Not authenticated or no profile, try localStorage as fallback
          const profilesStr = localStorage.getItem('userProfiles');
          if (profilesStr) {
            const profiles = JSON.parse(profilesStr);
            if (profiles && profiles.length > 0) {
              console.log('✅ Found profile in localStorage');
              setProfileData(profiles[profiles.length - 1]);
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

          // Map database profile to preview format
          const mappedProfile: ProfileData = {
            firstName: dbProfile.first_name || '',
            lastName: dbProfile.last_name || '',
            primaryEmail: dbProfile.email || '',
            secondaryEmail: dbProfile.alternate_email || '',
            mobileNumber: dbProfile.phone_number || '',
            whatsappNumber: dbProfile.whatsapp || '',
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
          };

          console.log('✅ Mapped profile data for preview');
          console.log('📋 Services loaded:', dbProfile.services?.length || 0);
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
          console.log('⚠️ No profiles found in database, trying localStorage...');
          // No profiles in database, try localStorage
          const profilesStr = localStorage.getItem('userProfiles');
          if (profilesStr) {
            const profiles = JSON.parse(profilesStr);
            if (profiles && profiles.length > 0) {
              console.log('✅ Found profile in localStorage');
              setProfileData(profiles[profiles.length - 1]);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error fetching profile:', error);
        // Fallback to localStorage
        try {
          const profilesStr = localStorage.getItem('userProfiles');
          if (profilesStr) {
            const profiles = JSON.parse(profilesStr);
            if (profiles && profiles.length > 0) {
              console.log('✅ Found profile in localStorage (fallback)');
              setProfileData(profiles[profiles.length - 1]);
            }
          }
        } catch (storageError) {
          console.warn('Could not read localStorage:', storageError);
        }
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
    if (!qrCodeUrl) return;

    try {
      // Convert data URL to blob
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const file = new File([blob], 'qr-code.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Profile QR Code',
          text: `Scan this QR code to view my profile: ${customUrl}`
        });
      } else {
        // Fallback: copy URL to clipboard
        await navigator.clipboard.writeText(customUrl);
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
                  {profileData.firstName} {profileData.lastName}
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
                  <img src={profileData.companyLogo} alt="Company Logo" className="w-full h-full object-contain" />
                </div>
              )}
            </div>

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
                        <a href={`tel:${profileData.mobileNumber}`} className="text-sm text-gray-700 hover:text-blue-600">
                          {profileData.mobileNumber}
                        </a>
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
                      <Twitter className="w-5 h-5" />
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
                      <LinkIcon className="w-5 h-5" />
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
                      <LinkIcon className="w-5 h-5" />
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
                        <p className="text-sm sm:text-base text-gray-600">{service.pricing}</p>
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
            onClick={() => router.push('/profiles/dashboard')}
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
                  <Star className="w-5 h-5" />
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
