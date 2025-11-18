'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LanguageIcon from '@mui/icons-material/Language';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import XIcon from '@mui/icons-material/X';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import YouTubeIcon from '@mui/icons-material/YouTube';
import GitHubIcon from '@mui/icons-material/GitHub';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ShareIcon from '@mui/icons-material/Share';
import QrCodeIcon from '@mui/icons-material/QrCode';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WorkIcon from '@mui/icons-material/Work';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import GroupsIcon from '@mui/icons-material/Groups';
import StarIcon from '@mui/icons-material/Star';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MessageIcon from '@mui/icons-material/Message';
import SendIcon from '@mui/icons-material/Send';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Icon aliases
const Mail = EmailIcon;
const Phone = PhoneIcon;
const MapPin = LocationOnIcon;
const Globe = LanguageIcon;
const Linkedin = LinkedInIcon;
const Twitter = XIcon;
const Instagram = InstagramIcon;
const Facebook = FacebookIcon;
const Youtube = YouTubeIcon;
const Github = GitHubIcon;
const Download = CloudDownloadIcon;
const Share2 = ShareIcon;
const QrCode = QrCodeIcon;
const Calendar = CalendarTodayIcon;
const Briefcase = WorkIcon;
const Award = EmojiEventsIcon;
const BookOpen = MenuBookIcon;
const Users = GroupsIcon;
const Star = StarIcon;
const ExternalLink = OpenInNewIcon;
const MessageSquare = MessageIcon;
const Send = SendIcon;
const ChevronDown = ExpandMoreIcon;

interface ProfileData {
  // Personal Info
  fullName: string;
  title: string;
  company: string;
  bio: string;
  profileImage: string;
  coverImage?: string;

  // Contact Info
  email: string;
  phone: string;
  website?: string;
  location?: string;

  // Social Links
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  github?: string;

  // Professional Info
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    description?: string;
  }>;

  education?: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;

  skills?: string[];
  achievements?: string[];

  // Portfolio/Gallery
  portfolio?: Array<{
    id: string;
    title: string;
    image: string;
    description?: string;
    link?: string;
  }>;

  // Additional
  testimonials?: Array<{
    name: string;
    role: string;
    content: string;
    image?: string;
  }>;

  // Services
  services?: Array<{
    id: string;
    title: string;
    description?: string;
    pricing: string;
    category: string;
    showPublicly?: boolean;
  }>;

  // Settings
  theme?: 'default' | 'dark' | 'minimal' | 'creative';
  accentColor?: string;
}

export default function PublicProfilePage() {
  const params = useParams();
  const profileId = params.id as string;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('about');
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    // Load profile data
    const loadProfile = async () => {
      // In production, this would fetch from API
      // For now, using mock data
      setProfile({
        fullName: 'John Doe',
        title: 'CEO & Founder',
        company: 'Tech Innovations Inc.',
        bio: 'Passionate entrepreneur and technology enthusiast with over 10 years of experience in building innovative solutions. Specializing in AI, blockchain, and sustainable technology.',
        profileImage: '/api/placeholder/400/400',
        coverImage: '/api/placeholder/1200/300',
        email: 'john.doe@techinnovations.com',
        phone: '+1 (555) 123-4567',
        website: 'www.techinnovations.com',
        location: 'San Francisco, CA',
        linkedin: 'linkedin.com/in/johndoe',
        twitter: 'twitter.com/johndoe',
        instagram: 'instagram.com/johndoe',
        experience: [
          {
            title: 'CEO & Founder',
            company: 'Tech Innovations Inc.',
            duration: '2020 - Present',
            description: 'Leading the company vision and strategy for next-generation technology solutions.'
          },
          {
            title: 'Senior Product Manager',
            company: 'Global Tech Corp',
            duration: '2018 - 2020',
            description: 'Managed product lifecycle for enterprise AI solutions.'
          }
        ],
        education: [
          {
            degree: 'MBA in Technology Management',
            institution: 'Stanford University',
            year: '2018'
          },
          {
            degree: 'BS in Computer Science',
            institution: 'MIT',
            year: '2014'
          }
        ],
        skills: ['Leadership', 'Strategy', 'AI/ML', 'Blockchain', 'Product Management', 'Public Speaking'],
        portfolio: [
          {
            id: '1',
            title: 'AI Assistant Platform',
            image: '/api/placeholder/400/300',
            description: 'Revolutionary AI platform for business automation',
            link: '#'
          },
          {
            id: '2',
            title: 'Blockchain Supply Chain',
            image: '/api/placeholder/400/300',
            description: 'Transparent supply chain management system',
            link: '#'
          }
        ],
        testimonials: [
          {
            name: 'Sarah Johnson',
            role: 'CTO at TechCorp',
            content: 'John is an exceptional leader with a unique vision for technology innovation.',
            image: '/api/placeholder/60/60'
          }
        ],
        services: [
          {
            id: '1',
            title: 'UX/UI Design Consultation',
            description: 'Expert consultation on user experience and interface design for your digital products.',
            pricing: 'AED 850/hr',
            category: 'Design',
            showPublicly: true
          },
          {
            id: '2',
            title: 'Mobile App Design',
            description: 'Complete mobile application design from wireframes to final UI.',
            pricing: 'Starting at AED 5,000',
            category: 'Design',
            showPublicly: true
          },
          {
            id: '3',
            title: 'Design System Creation',
            description: 'Build comprehensive design systems for scalable product development.',
            pricing: 'Contact for pricing',
            category: 'Design',
            showPublicly: true
          }
        ],
        theme: 'default',
        accentColor: '#EF4444'
      });
      setLoading(false);

      // Track profile view
      trackProfileView(profileId);
    };

    loadProfile();
  }, [profileId]);

  const trackProfileView = async (id: string) => {
    // Track view in analytics
    console.log('Tracking view for profile:', id);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: profile?.fullName,
        text: `Check out ${profile?.fullName}'s profile`,
        url: window.location.href
      });
    } else {
      // Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    }
  };

  const handleDownloadVCard = async () => {
    if (!profile) return;

    // Generate vCard with more complete information
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${profile.fullName}
ORG:${profile.company}
TITLE:${profile.title}
TEL:${profile.phone}
EMAIL:${profile.email}
URL:${profile.website}
ADR;TYPE=WORK:;;${profile.location};;;;
NOTE:${profile.bio?.replace(/\n/g, '\\n') || ''}
END:VCARD`;

    // Create blob
    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const fileName = `${profile.fullName.replace(' ', '_')}.vcf`;

    // Try Web Share API first (works on mobile browsers including Chrome iOS)
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], fileName, { type: 'text/vcard;charset=utf-8' });

        // Check if files can be shared
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${profile.fullName} Contact`,
            text: `Save ${profile.fullName} to your contacts`
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;

      // For iOS devices, open in new tab as additional fallback
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        a.target = '_blank';
      }

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download contact:', error);
      alert('Unable to save contact. Please try again or use a different browser.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600">This profile does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Cover Image */}
      {profile.coverImage && (
        <div className="h-48 md:h-64 relative">
          <img
            src={profile.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>
      )}

      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`${profile.coverImage ? '-mt-20' : 'pt-8'} relative z-10`}>
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            {/* Profile Image and Basic Info */}
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <div className="flex-shrink-0">
                <img
                  src={profile.profileImage}
                  alt={profile.fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900">{profile.fullName}</h1>
                <p className="text-xl text-gray-600 mt-1">{profile.title}</p>
                <p className="text-lg text-gray-500">{profile.company}</p>

                {/* Contact Buttons */}
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
                  <a
                    href={`mailto:${profile.email}`}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </a>
                  <button
                    type="button"
                    onClick={() => { window.location.href = `tel:${profile.phone}`; }}
                    className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition"
                    aria-label={`Call ${profile.fullName || 'contact'}`}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </button>
                  <button
                    onClick={handleDownloadVCard}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Save Contact
                  </button>
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </button>
                </div>

                {/* Social Links */}
                <div className="flex justify-center md:justify-start space-x-3 mt-4">
                  {profile.linkedin && (
                    <a href={`https://${profile.linkedin}`} target="_blank" rel="noopener noreferrer"
                       className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition">
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {profile.twitter && (
                    <a href={`https://${profile.twitter}`} target="_blank" rel="noopener noreferrer"
                       className="p-2 bg-sky-100 text-sky-600 rounded-lg hover:bg-sky-200 transition">
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {profile.instagram && (
                    <a href={`https://${profile.instagram}`} target="_blank" rel="noopener noreferrer"
                       className="p-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200 transition">
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {profile.website && (
                    <a href={`https://${profile.website}`} target="_blank" rel="noopener noreferrer"
                       className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition">
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-3">About</h2>
                <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Quick Info */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {profile.location && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.email && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="truncate">{profile.email}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span>{profile.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Experience Section */}
          {profile.experience && profile.experience.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Briefcase className="h-6 w-6 mr-2 text-red-600" />
                Experience
              </h2>
              <div className="space-y-6">
                {profile.experience.map((exp, index) => (
                  <div key={index} className="relative pl-8 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-red-600 before:rounded-full">
                    <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                    <p className="text-gray-600">{exp.company}</p>
                    <p className="text-sm text-gray-500 mt-1">{exp.duration}</p>
                    {exp.description && (
                      <p className="text-gray-600 mt-2">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education Section */}
          {profile.education && profile.education.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <BookOpen className="h-6 w-6 mr-2 text-red-600" />
                Education
              </h2>
              <div className="space-y-4">
                {profile.education.map((edu, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <Award className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                      <p className="text-gray-600">{edu.institution}</p>
                      <p className="text-sm text-gray-500">{edu.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills Section */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Section */}
          {profile.portfolio && profile.portfolio.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Portfolio</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.portfolio.map((item) => (
                  <div key={item.id} className="group relative overflow-hidden rounded-xl">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-semibold">{item.title}</h3>
                        {item.description && (
                          <p className="text-sm mt-1 text-gray-200">{item.description}</p>
                        )}
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center mt-2 text-sm hover:underline"
                          >
                            View Project
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Services Section */}
          {profile.services && profile.services.filter(s => s.showPublicly !== false).length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Services</h2>
              <div className="space-y-3">
                {profile.services.filter(s => s.showPublicly !== false).map((service) => (
                  <div
                    key={service.id}
                    className="flex items-start justify-between gap-4 py-2"
                  >
                    <div className="flex-1">
                      <h3 className="text-base font-medium text-gray-900">{service.title}</h3>
                      {service.description && (
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-base text-gray-600">{service.pricing}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Get in Touch</h2>
            <button
              onClick={() => setShowContactForm(!showContactForm)}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition flex items-center justify-center"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Send Message
            </button>

            {showContactForm && (
              <form className="mt-6 space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <textarea
                  rows={4}
                  placeholder="Your Message"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition flex items-center justify-center"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 mt-12">
        <p className="text-gray-500 text-sm">
          Powered by{' '}
          <a href="https://linkist.ai" className="text-red-600 hover:underline">
            Linkist
          </a>
        </p>
      </div>
    </div>
  );
}