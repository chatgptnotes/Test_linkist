'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LanguageIcon from '@mui/icons-material/Language';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import XIcon from '@mui/icons-material/X';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import YouTubeIcon from '@mui/icons-material/YouTube';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';

// Icon aliases
const User = PersonIcon;
const Mail = EmailIcon;
const Phone = PhoneIcon;
const Briefcase = WorkIcon;
const MapPin = LocationOnIcon;
const Globe = LanguageIcon;
const Linkedin = LinkedInIcon;
const Twitter = XIcon;
const Instagram = InstagramIcon;
const Facebook = FacebookIcon;
const Youtube = YouTubeIcon;
const Camera = CameraAltIcon;
const Plus = AddIcon;
const ArrowRight = ArrowForwardIcon;
const Save = SaveIcon;
const Eye = VisibilityIcon;

interface ProfileData {
  // Personal Info
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  bio: string;

  // Social Links
  linkedin: string;
  twitter: string;
  instagram: string;
  facebook: string;
  youtube: string;

  // Profile Image
  profileImage: string;
}

function ProfileBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState<'personal' | 'social' | 'preview'>('personal');
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    email: '',
    phone: '',
    website: '',
    location: '',
    bio: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    facebook: '',
    youtube: '',
    profileImage: ''
  });

  useEffect(() => {
    // If editing an existing profile (profileId exists)
    if (profileId) {
      const savedProfiles = localStorage.getItem('userProfiles');
      if (savedProfiles) {
        const profiles = JSON.parse(savedProfiles);
        const profileToEdit = profiles.find((p: any) => p.id === profileId);

        if (profileToEdit) {
          // Map dashboard profile structure to builder structure
          setProfileData({
            firstName: profileToEdit.name.split(' ')[0] || '',
            lastName: profileToEdit.name.split(' ').slice(1).join(' ') || '',
            title: profileToEdit.title || '',
            company: profileToEdit.company || '',
            email: profileToEdit.email || '',
            phone: profileToEdit.phone || '',
            website: profileToEdit.website || '',
            location: profileToEdit.location || '',
            bio: profileToEdit.bio || '',
            linkedin: profileToEdit.linkedin || '',
            twitter: profileToEdit.twitter || '',
            instagram: profileToEdit.instagram || '',
            facebook: profileToEdit.facebook || '',
            youtube: profileToEdit.youtube || '',
            profileImage: profileToEdit.image || ''
          });
        }
      }
    } else {
      // Load from single userProfile for new profiles
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        setProfileData(JSON.parse(savedProfile));
      }
    }
  }, [profileId]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    if (profileId) {
      // Update existing profile in userProfiles array
      const savedProfiles = localStorage.getItem('userProfiles');
      if (savedProfiles) {
        const profiles = JSON.parse(savedProfiles);
        const profileIndex = profiles.findIndex((p: any) => p.id === profileId);

        if (profileIndex !== -1) {
          // Update the profile while keeping dashboard-specific fields
          profiles[profileIndex] = {
            ...profiles[profileIndex],
            name: `${profileData.firstName} ${profileData.lastName}`.trim(),
            title: profileData.title,
            company: profileData.company,
            email: profileData.email,
            phone: profileData.phone,
            website: profileData.website,
            location: profileData.location,
            bio: profileData.bio,
            linkedin: profileData.linkedin,
            twitter: profileData.twitter,
            instagram: profileData.instagram,
            facebook: profileData.facebook,
            youtube: profileData.youtube,
            image: profileData.profileImage,
            lastUpdated: 'Just now'
          };

          localStorage.setItem('userProfiles', JSON.stringify(profiles));
          alert('Profile updated successfully!');
          router.push('/profile-dashboard');
        }
      }
    } else {
      // Save new profile to userProfile (original behavior)
      localStorage.setItem('userProfile', JSON.stringify(profileData));
      alert('Profile saved successfully! Your NFC card will display this information when tapped.');
    }

    // TODO: Save to backend/database
    console.log('Profile saved:', profileData);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange('profileImage', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo width={140} height={45} variant="light" />
            <Link
              href="/account"
              className="text-gray-700 hover:text-gray-900"
            >
              My Account
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Build Your Digital Profile
          </h1>
          <p className="text-lg text-gray-600">
            Create your digital business card that will be displayed when someone taps your NFC card
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('personal')}
                className={`flex-1 py-4 px-6 text-center font-medium transition ${
                  activeTab === 'personal'
                    ? 'border-b-2 border-black text-black'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <User className="h-5 w-5 inline-block mr-2" />
                Personal Info
              </button>
              <button
                onClick={() => setActiveTab('social')}
                className={`flex-1 py-4 px-6 text-center font-medium transition ${
                  activeTab === 'social'
                    ? 'border-b-2 border-black text-black'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Globe className="h-5 w-5 inline-block mr-2" />
                Social Links
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex-1 py-4 px-6 text-center font-medium transition ${
                  activeTab === 'preview'
                    ? 'border-b-2 border-black text-black'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Eye className="h-5 w-5 inline-block mr-2" />
                Preview
              </button>
            </nav>
          </div>

          <div className="p-8">
            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                {/* Profile Image */}
                <div className="flex flex-col items-center mb-8">
                  <div className="relative">
                    {profileData.profileImage ? (
                      <img
                        src={profileData.profileImage}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                        <User className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-black text-white p-2 rounded-full cursor-pointer hover:bg-gray-800 transition">
                      <Camera className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Upload your profile photo</p>
                </div>

                {/* Name Fields */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {/* Title & Company */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={profileData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={profileData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Acme Inc."
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                {/* Website & Location */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={profileData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="San Francisco, CA"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Tell people about yourself..."
                  />
                </div>
              </div>
            )}

            {/* Social Links Tab */}
            {activeTab === 'social' && (
              <div className="space-y-6">
                <p className="text-gray-600 mb-6">
                  Add your social media profiles to make it easy for people to connect with you
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Linkedin className="h-4 w-4 inline-block mr-2" />
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={profileData.linkedin}
                    onChange={(e) => handleInputChange('linkedin', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Twitter className="h-4 w-4 inline-block mr-2" />
                    Twitter / X
                  </label>
                  <input
                    type="url"
                    value={profileData.twitter}
                    onChange={(e) => handleInputChange('twitter', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Instagram className="h-4 w-4 inline-block mr-2" />
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={profileData.instagram}
                    onChange={(e) => handleInputChange('instagram', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Facebook className="h-4 w-4 inline-block mr-2" />
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={profileData.facebook}
                    onChange={(e) => handleInputChange('facebook', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="https://facebook.com/yourprofile"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Youtube className="h-4 w-4 inline-block mr-2" />
                    YouTube
                  </label>
                  <input
                    type="url"
                    value={profileData.youtube}
                    onChange={(e) => handleInputChange('youtube', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="https://youtube.com/@yourchannel"
                  />
                </div>
              </div>
            )}

            {/* Preview Tab */}
            {activeTab === 'preview' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8">
                  <h3 className="text-xl font-semibold mb-6 text-center">
                    This is how your profile will look when someone taps your card
                  </h3>

                  {/* Preview Card */}
                  <div className="max-w-sm mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32"></div>

                    <div className="relative px-6 pb-6">
                      {/* Profile Image */}
                      <div className="flex justify-center -mt-16 mb-4">
                        {profileData.profileImage ? (
                          <img
                            src={profileData.profileImage}
                            alt="Profile"
                            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                          />
                        ) : (
                          <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                            <User className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Profile Info */}
                      <div className="text-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">
                          {profileData.firstName || profileData.lastName
                            ? `${profileData.firstName} ${profileData.lastName}`.trim()
                            : 'Your Name'}
                        </h2>
                        {profileData.title && (
                          <p className="text-gray-600 mt-1">{profileData.title}</p>
                        )}
                        {profileData.company && (
                          <p className="text-gray-500 text-sm">{profileData.company}</p>
                        )}
                      </div>

                      {/* Bio */}
                      {profileData.bio && (
                        <p className="text-gray-700 text-sm text-center mb-4 px-4">
                          {profileData.bio}
                        </p>
                      )}

                      {/* Contact Buttons */}
                      <div className="space-y-2 mt-6">
                        {profileData.email && (
                          <a
                            href={`mailto:${profileData.email}`}
                            className="flex items-center justify-center w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </a>
                        )}
                        {profileData.phone && (
                          <button
                            type="button"
                            onClick={() => { window.location.href = `tel:${profileData.phone}`; }}
                            className="flex items-center justify-center w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition"
                            aria-label={`Call ${((profileData.firstName || profileData.lastName) ? `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() : 'contact')}`}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </button>
                        )}
                        {profileData.website && (
                          <a
                            href={profileData.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-full bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition"
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            Website
                          </a>
                        )}
                      </div>

                      {/* Social Links */}
                      {(profileData.linkedin || profileData.twitter || profileData.instagram || profileData.facebook || profileData.youtube) && (
                        <div className="flex justify-center gap-3 mt-6 pt-6 border-t border-gray-200">
                          {profileData.linkedin && (
                            <a
                              href={profileData.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Linkedin className="h-6 w-6" />
                            </a>
                          )}
                          {profileData.twitter && (
                            <a
                              href={profileData.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-500"
                            >
                              <Twitter className="h-6 w-6" />
                            </a>
                          )}
                          {profileData.instagram && (
                            <a
                              href={profileData.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-pink-600 hover:text-pink-700"
                            >
                              <Instagram className="h-6 w-6" />
                            </a>
                          )}
                          {profileData.facebook && (
                            <a
                              href={profileData.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Facebook className="h-6 w-6" />
                            </a>
                          )}
                          {profileData.youtube && (
                            <a
                              href={profileData.youtube}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Youtube className="h-6 w-6" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Location */}
                      {profileData.location && (
                        <div className="flex items-center justify-center text-gray-500 text-sm mt-4">
                          <MapPin className="h-4 w-4 mr-1" />
                          {profileData.location}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Tip:</strong> Make sure all your information is correct before saving.
                    This profile will be displayed when someone taps your NFC card.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
            <div className="flex gap-4">
              <button
                onClick={handleSaveProfile}
                className="flex-1 bg-black text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition flex items-center justify-center"
              >
                <Save className="h-5 w-5 mr-2" />
                Save Profile
              </button>
              <Link
                href="/account"
                className="flex-1 border border-gray-300 py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 transition text-center flex items-center justify-center"
              >
                Go to Dashboard
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-3">Need Help?</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Your profile will be live immediately after saving</li>
            <li>• You can update your profile anytime from your account dashboard</li>
            <li>• All fields except First Name, Last Name, and Email are optional</li>
            <li>• Social links should be full URLs (including https://)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ProfileBuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p>Loading profile builder...</p>
        </div>
      </div>
    }>
      <ProfileBuilderContent />
    </Suspense>
  );
}