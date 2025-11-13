'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'qrcode';
import { getBaseDomain } from '@/lib/get-base-url';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import QrCodeIcon from '@mui/icons-material/QrCode';
import ShareIcon from '@mui/icons-material/Share';
import BarChartIcon from '@mui/icons-material/BarChart';
import GroupsIcon from '@mui/icons-material/Groups';
import MouseIcon from '@mui/icons-material/Mouse';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

// Icon aliases
const Plus = AddIcon;
const Eye = VisibilityIcon;
const Edit = EditIcon;
const Trash2 = DeleteIcon;
const MoreVertical = MoreVertIcon;
const QrCode = QrCodeIcon;
const Share2 = ShareIcon;
const BarChart = BarChartIcon;
const Users = GroupsIcon;
const MousePointer = MouseIcon;
const TrendingUp = TrendingUpIcon;
const Copy = ContentCopyIcon;
const ExternalLink = OpenInNewIcon;
const CloudDownload = CloudDownloadIcon;

interface Profile {
  id: string;
  name: string;
  title: string;
  company: string;
  image?: string;
  status: 'active' | 'draft' | 'inactive';
  views: number;
  clicks: number;
  shares: number;
  lastUpdated: string;
  qrCode?: string;
  publicUrl: string;
}

export default function ProfileDashboard() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Check founding member status
  const [isFoundingMember, setIsFoundingMember] = useState(false);
  const [foundingMemberPlan, setFoundingMemberPlan] = useState<string | null>(null);
  // QR Code modal state
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [selectedProfileForQr, setSelectedProfileForQr] = useState<Profile | null>(null);

  useEffect(() => {
    // Load profiles from authenticated API
    const loadProfiles = async () => {
      try {
        // Check authentication first
        const authResponse = await fetch('/api/auth/me');

        if (!authResponse.ok) {
          console.log('⚠️ Not authenticated, redirecting to login...');
          router.push('/login?returnUrl=/profiles/dashboard');
          return;
        }

        const authData = await authResponse.json();

        if (!authData.isAuthenticated || !authData.user?.email) {
          console.log('⚠️ Not authenticated, redirecting to login...');
          router.push('/login?returnUrl=/profiles/dashboard');
          return;
        }

        const userEmail = authData.user.email;
        console.log('🔍 Loading profiles for user:', userEmail);

        // Fetch profiles from API (filtered by current user)
        const profilesResponse = await fetch('/api/profiles');

        if (profilesResponse.ok) {
          const result = await profilesResponse.json();

          if (result.success && result.profiles) {
            console.log('✅ Profiles loaded from database:', result.profiles.length);

            // Transform API profiles to match component interface
            const transformedProfiles = result.profiles.map((p: any) => ({
              id: p.id,
              name: p.name || 'Unnamed Profile',
              title: p.title || p.designation || '',
              company: p.company || '',
              image: p.image || p.profile_image,
              status: 'active' as const,
              views: 0,
              clicks: 0,
              shares: 0,
              lastUpdated: new Date(p.updated_at || p.created_at).toLocaleDateString(),
              publicUrl: `${getBaseDomain()}/${p.username || p.id}`
            }));

            setProfiles(transformedProfiles);
          } else {
            console.log('⚠️ No profiles found, trying localStorage...');
            loadProfilesFromLocalStorage(userEmail);
          }
        } else {
          console.log('⚠️ Profile API failed, trying localStorage...');
          loadProfilesFromLocalStorage(userEmail);
        }

      } catch (error) {
        console.error('❌ Error loading profiles:', error);
        // Fallback to localStorage
        const savedProfiles = localStorage.getItem('userProfiles');
        if (savedProfiles) {
          setProfiles(JSON.parse(savedProfiles));
        }
      } finally {
        setLoading(false);
      }
    };

    const loadProfilesFromLocalStorage = (userEmail: string) => {
      const savedProfiles = localStorage.getItem('userProfiles');
      if (savedProfiles) {
        try {
          const allProfiles = JSON.parse(savedProfiles);
          // Filter profiles by current user if email is stored
          const userProfiles = allProfiles.filter((p: any) =>
            !p.userEmail || p.userEmail === userEmail
          );
          console.log('✅ Loaded profiles from localStorage:', userProfiles.length);
          setProfiles(userProfiles);
        } catch (error) {
          console.error('Error parsing localStorage profiles:', error);
          setProfiles([]);
        }
      } else {
        setProfiles([]);
      }
    };

    loadProfiles();
  }, [router]);

  const handleDeleteProfile = (id: string) => {
    if (confirm('Are you sure you want to delete this profile?')) {
      setProfiles(profiles.filter(p => p.id !== id));
      localStorage.setItem('userProfiles', JSON.stringify(profiles.filter(p => p.id !== id)));
    }
  };

  const handleDuplicateProfile = (profile: Profile) => {
    const newProfile = {
      ...profile,
      id: Date.now().toString(),
      name: `${profile.name} (Copy)`,
      status: 'draft' as const,
      views: 0,
      clicks: 0,
      shares: 0,
      lastUpdated: 'Just now'
    };
    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    localStorage.setItem('userProfiles', JSON.stringify(updatedProfiles));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    // Check founding member status from user data
    const checkFoundingMember = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setIsFoundingMember(data.user?.is_founding_member || false);
          setFoundingMemberPlan(data.user?.founding_member_plan || null);
        }
      } catch (error) {
        console.error('Error checking founding member status:', error);
      }
    };
    checkFoundingMember();
  }, []);

  // Generate QR Code when a profile is selected
  useEffect(() => {
    const generateQrCode = async () => {
      if (!selectedProfileForQr) return;

      try {
        const qrDataUrl = await QRCode.toDataURL(selectedProfileForQr.publicUrl, {
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

    if (selectedProfileForQr) {
      generateQrCode();
    }
  }, [selectedProfileForQr]);

  const handleDownloadQrCode = () => {
    if (!qrCodeUrl) return;

    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `${selectedProfileForQr?.name || 'profile'}-qr-code.png`;
    a.click();
  };

  const handleShareQrCode = async () => {
    if (!qrCodeUrl || !selectedProfileForQr) return;

    try {
      // Convert data URL to blob
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const file = new File([blob], 'qr-code.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Profile QR Code',
          text: `Scan this QR code to view my profile: ${selectedProfileForQr.publicUrl}`
        });
      } else {
        // Fallback: just download
        handleDownloadQrCode();
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
      // Fallback: download
      handleDownloadQrCode();
    }
  };

  const handleOpenQrCode = (profile: Profile) => {
    setSelectedProfileForQr(profile);
    setShowQrCode(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">Profile Dashboard</h1>
                {isFoundingMember && (
                  <div className="flex items-center bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Founding Member
                    {foundingMemberPlan && (
                      <span className="ml-2 text-xs opacity-80">({foundingMemberPlan})</span>
                    )}
                  </div>
                )}
              </div>
              <p className="text-gray-600 mt-2">Manage and track your digital profiles</p>
            </div>
            <Link
              href="/profiles/templates"
              className="bg-[#263252] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1a2339] transition flex items-center"
            >
              <Plus className="h-5 w-5 md:mr-2" />
              <span className="hidden md:inline">Create New Profile</span>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {profiles.reduce((sum, p) => sum + p.views, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-3 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+12%</span>
              <span className="text-gray-500 ml-1">from last week</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {profiles.reduce((sum, p) => sum + p.clicks, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <MousePointer className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-3 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+8%</span>
              <span className="text-gray-500 ml-1">from last week</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Shares</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {profiles.reduce((sum, p) => sum + p.shares, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Share2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-3 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+15%</span>
              <span className="text-gray-500 ml-1">from last week</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Profiles</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {profiles.filter(p => p.status === 'active').length}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="flex items-center mt-3 text-sm">
              <span className="text-gray-500">of {profiles.length} total profiles</span>
            </div>
          </div>
        </div>

        {/* Profiles Grid */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Profiles</h2>
          </div>

          {profiles.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No profiles yet</h3>
              <p className="text-gray-500 mb-6">Create your first digital profile to get started</p>
              <Link
                href="/profiles/create"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Profile
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow relative"
                >
                  {/* Dropdown Menu */}
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => setShowDropdown(showDropdown === profile.id ? null : profile.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <MoreVertical className="h-5 w-5 text-gray-500" />
                    </button>
                    {showDropdown === profile.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <Link
                          href={`/profiles/builder?id=${profile.id}`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Link>
                        <Link
                          href={`/profiles/${profile.id}/analytics`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <BarChart className="h-4 w-4 mr-2" />
                          View Analytics
                        </Link>
                        <button
                          onClick={() => handleDuplicateProfile(profile)}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </button>
                        <Link
                          href={`/p/${profile.id}`}
                          target="_blank"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Public Profile
                        </Link>
                        <button
                          onClick={() => handleDeleteProfile(profile.id)}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left border-t"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="flex items-start space-x-4 mb-4">
                    {profile.image ? (
                      <img
                        src={profile.image}
                        alt={profile.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xl">
                        {profile.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{profile.name}</h3>
                      <p className="text-sm text-gray-600">{profile.title}</p>
                      <p className="text-sm text-gray-500">{profile.company}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(profile.status)}`}>
                      {profile.status}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">Updated {profile.lastUpdated}</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-gray-100">
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-gray-900">{profile.views}</p>
                      <p className="text-xs text-gray-500">Views</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-gray-900">{profile.clicks}</p>
                      <p className="text-xs text-gray-500">Clicks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-gray-900">{profile.shares}</p>
                      <p className="text-xs text-gray-500">Shares</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Link
                      href={`/profiles/builder?id=${profile.id}`}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition text-center"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/p/${profile.id}`}
                      target="_blank"
                      className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-700 transition text-center"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleOpenQrCode(profile)}
                      className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition"
                      title="Show QR Code"
                    >
                      <QrCode className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Public URL */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Public URL</p>
                    <p className="text-sm text-gray-700 font-mono truncate">{profile.publicUrl}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QR Code Modal */}
        {showQrCode && qrCodeUrl && selectedProfileForQr && (
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
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
                >
                  ×
                </button>
              </div>

              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <img
                    src={qrCodeUrl}
                    alt="Profile QR Code"
                    className="w-64 h-64"
                  />
                </div>

                <div className="text-center mt-4">
                  <p className="text-lg font-semibold text-gray-900">{selectedProfileForQr.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Scan this QR code to visit the profile
                  </p>
                  <p className="text-xs text-gray-500 mt-2 font-mono break-all">
                    {selectedProfileForQr.publicUrl}
                  </p>
                </div>

                <div className="flex gap-3 mt-6 w-full">
                  <button
                    onClick={handleDownloadQrCode}
                    className="flex-1 px-4 py-3 bg-[#263252] text-white rounded-lg hover:bg-[#1a2339] transition flex items-center justify-center gap-2 font-medium"
                  >
                    <CloudDownload className="w-5 h-5" />
                    Download
                  </button>
                  <button
                    onClick={handleShareQrCode}
                    className="flex-1 px-4 py-3 bg-[#263252] text-white rounded-lg hover:bg-[#1a2339] transition flex items-center justify-center gap-2 font-medium"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}