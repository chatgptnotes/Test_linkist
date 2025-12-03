'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { getBaseDomain } from '@/lib/get-base-url';
import { searchSkills } from '@/lib/skills-data';

const GoogleMapPicker = dynamic(() => import('@/components/GoogleMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading Google Maps...</p>
      </div>
    </div>
  )
});
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import ShareIcon from '@mui/icons-material/Share';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CollectionsIcon from '@mui/icons-material/Collections';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InfoIcon from '@mui/icons-material/Info';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import XIcon from '@mui/icons-material/X';
import GitHubIcon from '@mui/icons-material/GitHub';
import YouTubeIcon from '@mui/icons-material/YouTube';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Leaderboard, RoomService, BuildCircle } from '@mui/icons-material';
import Skeleton from '@mui/material/Skeleton';

// Icon aliases
const Person = PersonIcon;
const Briefcase = WorkIcon;
const Share = ShareIcon;
const Camera = PhotoCameraIcon;
const Collections = CollectionsIcon;
const CheckCircle = CheckCircleIcon;
const Plus = AddIcon;
const X2 = CloseIcon;
const Upload = CloudUploadIcon;
const Info = InfoIcon;
const LinkedIn = LinkedInIcon;
const Instagram = InstagramIcon;
const Facebook = FacebookIcon;
const Twitter = XIcon;
const GitHub = GitHubIcon;
const YouTube = YouTubeIcon;
const Search = SearchIcon;
const Edit = EditIcon;
const Trash = DeleteIcon;
const Service = BuildCircle;

interface ProfileData {
  // Basic Information
  salutation: string;
  firstName: string;
  lastName: string;
  primaryEmail: string;
  secondaryEmail: string;
  mobileNumber: string;
  whatsappNumber: string;
  showEmailPublicly: boolean;
  showSecondaryEmailPublicly: boolean;
  showMobilePublicly: boolean;
  showWhatsappPublicly: boolean;

  // Professional Information
  jobTitle: string;
  companyName: string;
  companyWebsite: string;
  companyAddress: string;
  companyLogo: string | null;
  industry: string;
  subDomain: string;
  skills: string[];
  professionalSummary: string;
  showJobTitle: boolean;
  showCompanyName: boolean;
  showCompanyWebsite: boolean;
  showCompanyAddress: boolean;
  showIndustry: boolean;
  showSkills: boolean;

  // Social & Digital Presence
  linkedinUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  behanceUrl: string;
  dribbbleUrl: string;
  githubUrl: string;
  youtubeUrl: string;
  showLinkedin: boolean;
  showInstagram: boolean;
  showFacebook: boolean;
  showTwitter: boolean;
  showBehance: boolean;
  showDribbble: boolean;
  showGithub: boolean;
  showYoutube: boolean;

  // Profile Photo & Background
  profilePhoto: string | null;
  backgroundImage: string | null;
  showProfilePhoto: boolean;
  showBackgroundImage: boolean;

  // Media Gallery
  photos: Array<{ id: string; url: string; title: string; showPublicly: boolean }>;
  videos: Array<{ id: string; url: string; title: string; showPublicly: boolean }>;

  // Certifications & Documents
  certifications: Array<{ id: string; name: string; title: string; url: string; size: number; type: string; showPublicly: boolean }>;

  // Services
  services: Array<{ id: string; title: string; description: string; pricing: string; pricingUnit: string; currency: string; category: string; showPublicly: boolean }>;
}

// Salutation options
const SALUTATIONS = [
  { value: '', label: 'Select' },
  { value: 'Dr.', label: 'Dr.' },
  { value: 'Mr.', label: 'Mr.' },
  { value: 'Mrs.', label: 'Mrs.' },
  { value: 'Miss', label: 'Miss' },
  { value: 'Master', label: 'Master' },
  { value: 'Ms.', label: 'Ms.' },
  { value: 'Prof.', label: 'Prof.' },
];

// Job title options with categories
const JOB_TITLES = [
  { category: 'General / Corporate', titles: [
    'Chief Executive Officer (CEO)', 'Chief Operating Officer (COO)', 'Chief Financial Officer (CFO)',
    'Chief Technology Officer (CTO)', 'Chief Marketing Officer (CMO)', 'Chief Product Officer (CPO)',
    'Vice President', 'Director', 'Manager', 'Team Lead', 'Coordinator', 'Analyst', 'Associate', 'Intern'
  ]},
  { category: 'Technical / IT', titles: [
    'Software Engineer', 'Data Scientist', 'Data Engineer', 'Cloud Architect', 'DevOps Engineer',
    'Cybersecurity Analyst', 'Machine Learning Engineer', 'Full Stack Developer', 'QA Engineer',
    'Systems Administrator', 'Product Manager (Tech)', 'Technical Program Manager'
  ]},
  { category: 'Creative / Marketing', titles: [
    'Marketing Manager', 'Content Strategist', 'SEO Specialist', 'Social Media Manager',
    'Graphic Designer', 'UI/UX Designer', 'Brand Manager', 'Copywriter', 'Art Director'
  ]},
  { category: 'Sales / Customer', titles: [
    'Sales Executive', 'Account Manager', 'Business Development Manager', 'Customer Success Manager',
    'Inside Sales Representative', 'Territory Sales Manager'
  ]},
  { category: 'Finance / Legal / HR', titles: [
    'Financial Analyst', 'Accountant', 'Investment Analyst', 'HR Manager',
    'Talent Acquisition Specialist', 'Legal Counsel', 'Compliance Officer', 'Payroll Specialist'
  ]},
  { category: 'Operations / Logistics', titles: [
    'Operations Manager', 'Supply Chain Analyst', 'Procurement Specialist',
    'Logistics Coordinator', 'Quality Assurance Manager'
  ]},
  { category: 'Healthcare / Science', titles: [
    'Physician', 'Nurse', 'Pharmacist', 'Medical Researcher',
    'Laboratory Technician', 'Clinical Data Manager'
  ]},
  { category: 'Education / Nonprofit', titles: [
    'Teacher', 'Professor', 'Instructional Designer', 'Research Associate',
    'Program Coordinator', 'Fundraising Manager'
  ]}
];

// Industry options
const INDUSTRIES = [
  'Information Technology',
  'Finance & Banking',
  'Healthcare & Life Sciences',
  'Education',
  'Manufacturing',
  'Retail & E-commerce',
  'Transportation & Logistics',
  'Energy & Utilities',
  'Real Estate & Construction',
  'Telecommunications',
  'Media & Entertainment',
  'Agriculture',
  'Government & Public Sector',
  'Nonprofit & NGOs',
  'Hospitality & Travel'
];

// Currency options
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

// Sub-domain options with industry mapping
const SUB_DOMAINS = [
  { industry: 'Information Technology', subDomains: [
    'Software Development', 'Artificial Intelligence / Machine Learning', 'Cloud Computing',
    'Cybersecurity', 'IT Services', 'Data Analytics', 'SaaS / Product Development'
  ]},
  { industry: 'Finance & Banking', subDomains: [
    'Investment Banking', 'Retail Banking', 'FinTech', 'Insurance',
    'Accounting & Audit', 'Asset Management'
  ]},
  { industry: 'Healthcare & Life Sciences', subDomains: [
    'Hospitals & Clinics', 'Pharmaceuticals', 'Biotechnology', 'Medical Devices',
    'HealthTech', 'Clinical Research'
  ]},
  { industry: 'Education', subDomains: [
    'K-12', 'Higher Education', 'EdTech', 'Vocational Training', 'Corporate Learning'
  ]},
  { industry: 'Manufacturing', subDomains: [
    'Automotive', 'Electronics', 'Consumer Goods', 'Industrial Equipment', 'Aerospace'
  ]},
  { industry: 'Retail & E-commerce', subDomains: [
    'Online Marketplaces', 'Fashion & Apparel', 'Food & Beverage',
    'Consumer Electronics', 'Supply Chain'
  ]},
  { industry: 'Transportation & Logistics', subDomains: [
    'Shipping & Freight', 'Warehousing', 'Supply Chain Management', 'Mobility / Ride Sharing'
  ]},
  { industry: 'Energy & Utilities', subDomains: [
    'Oil & Gas', 'Renewable Energy', 'Power Generation', 'Waste Management', 'Water Utilities'
  ]},
  { industry: 'Real Estate & Construction', subDomains: [
    'Residential', 'Commercial', 'Architecture & Design', 'Property Management'
  ]},
  { industry: 'Telecommunications', subDomains: [
    'Mobile Networks', 'Internet Service Providers', 'Cloud Communication', '5G / Fiber Infrastructure'
  ]},
  { industry: 'Media & Entertainment', subDomains: [
    'Film & Television', 'Gaming', 'Publishing', 'Advertising', 'Music Industry'
  ]},
  { industry: 'Agriculture', subDomains: [
    'Agritech', 'Food Processing', 'Livestock Management', 'Organic Farming'
  ]},
  { industry: 'Government & Public Sector', subDomains: [
    'Defense', 'Infrastructure', 'Public Policy', 'Civil Services'
  ]},
  { industry: 'Nonprofit & NGOs', subDomains: [
    'Social Services', 'Environmental', 'Education & Literacy', 'Healthcare', 'Advocacy & Human Rights'
  ]},
  { industry: 'Hospitality & Travel', subDomains: [
    'Hotels & Resorts', 'Tourism', 'Airlines', 'Food Services'
  ]}
];

// Flatten all sub-domains for searching
const ALL_SUB_DOMAINS = SUB_DOMAINS.flatMap(group => group.subDomains);

// Helper function to detect country code from phone number
function detectCountryCodeFromNumber(phoneNumber: string): { countryCode: string; number: string } {
  if (!phoneNumber) {
    return { countryCode: '+971', number: '' };
  }

  // Remove spaces and special characters except +
  const cleaned = phoneNumber.trim().replace(/[\s-()]/g, '');

  // Common country codes (ordered by length - longest first for proper matching)
  const countryCodes = [
    '+880', // Bangladesh (3 digits)
    '+971', // UAE (3 digits)
    '+966', // Saudi Arabia (3 digits)
    '+974', // Qatar (3 digits)
    '+965', // Kuwait (3 digits)
    '+968', // Oman (3 digits)
    '+973', // Bahrain (3 digits)
    '+91',  // India (2 digits)
    '+92',  // Pakistan (2 digits)
    '+94',  // Sri Lanka (2 digits)
    '+86',  // China (2 digits)
    '+81',  // Japan (2 digits)
    '+82',  // South Korea (2 digits)
    '+44',  // UK (2 digits)
    '+20',  // Egypt (2 digits)
    '+1',   // USA/Canada (1 digit)
  ];

  // First check if number starts with + and a country code
  for (const code of countryCodes) {
    if (cleaned.startsWith(code)) {
      const numberWithoutCode = cleaned.substring(code.length);
      console.log(`🔍 Country code detected: ${code} from "${phoneNumber}" -> Number: ${numberWithoutCode}`);
      return { countryCode: code, number: numberWithoutCode };
    }
  }

  // If no + prefix, check if number starts with country code digits (without +)
  // This handles cases like "918999355932" -> should detect "91" as India
  for (const code of countryCodes) {
    const codeDigits = code.substring(1); // Remove the + to get just digits
    if (cleaned.startsWith(codeDigits)) {
      const numberWithoutCode = cleaned.substring(codeDigits.length);
      console.log(`🔍 Country code detected: ${code} from "${phoneNumber}" -> Number: ${numberWithoutCode}`);
      return { countryCode: code, number: numberWithoutCode };
    }
  }

  // Special handling for Indian mobile numbers (they start with 6-9 and are 10 digits)
  // If number starts with 6, 7, 8, or 9 and is 10 digits, it's likely an Indian number
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    console.log(`🇮🇳 Detected Indian mobile number pattern in "${phoneNumber}"`);
    return { countryCode: '+91', number: cleaned };
  }

  // If no country code detected, assume +971 and return full number
  console.log(`⚠️ No country code detected in "${phoneNumber}", defaulting to +971`);
  return { countryCode: '+971', number: cleaned.startsWith('+') ? cleaned.substring(1) : cleaned };
}

function ProfileBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileId = searchParams.get('id');

  const [activeSection, setActiveSection] = useState<'basic' | 'professional' | 'service' | 'social' | 'media-photo' | 'media-gallery'>('basic');
  const [skillInput, setSkillInput] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState<Array<{ skill: string; category: string }>>([]);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const skillDropdownRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastState, setToastState] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [mobileCountryCode, setMobileCountryCode] = useState('+91'); // FIXED: Default to India
  const [whatsappCountryCode, setWhatsappCountryCode] = useState('+91'); // FIXED: Default to India
  const [useSameNumberForWhatsapp, setUseSameNumberForWhatsapp] = useState(false);
  const [showJobTitleDropdown, setShowJobTitleDropdown] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showSubDomainDropdown, setShowSubDomainDropdown] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState('USD');

  // Upload progress states
  const [profilePhotoUploadProgress, setProfilePhotoUploadProgress] = useState(0);
  const [bannerImageUploadProgress, setBannerImageUploadProgress] = useState(0);
  const [companyLogoUploadProgress, setCompanyLogoUploadProgress] = useState(0);
  const [isUploadingProfilePhoto, setIsUploadingProfilePhoto] = useState(false);
  const [isUploadingBannerImage, setIsUploadingBannerImage] = useState(false);
  const [isUploadingCompanyLogo, setIsUploadingCompanyLogo] = useState(false);

  // Loading state for profile data fetch
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const [profileData, setProfileData] = useState<ProfileData>({
    salutation: '',
    firstName: '',
    lastName: '',
    primaryEmail: '',
    secondaryEmail: '',
    mobileNumber: '',
    whatsappNumber: '',
    showEmailPublicly: true,
    showSecondaryEmailPublicly: true,
    showMobilePublicly: true,
    showWhatsappPublicly: false,

    jobTitle: '',
    companyName: '',
    companyWebsite: '',
    companyAddress: '',
    companyLogo: null,
    industry: '',
    subDomain: '',
    skills: [],
    professionalSummary: '',
    showJobTitle: true,
    showCompanyName: true,
    showCompanyWebsite: true,
    showCompanyAddress: true,
    showIndustry: true,
    showSkills: true,

    linkedinUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    twitterUrl: '',
    behanceUrl: '',
    dribbbleUrl: '',
    githubUrl: '',
    youtubeUrl: '',
    showLinkedin: false,
    showInstagram: false,
    showFacebook: false,
    showTwitter: false,
    showBehance: false,
    showDribbble: false,
    showGithub: false,
    showYoutube: false,

    profilePhoto: null,
    backgroundImage: null,
    showProfilePhoto: true,
    showBackgroundImage: true,

    photos: [],
    videos: [],
    certifications: [],
    services: [{
      id: Date.now().toString(),
      title: '',
      description: '',
      pricing: '',
      pricingUnit: '',
      currency: 'USD',
      category: '',
      showPublicly: true
    }]
  });

  // File input ref for photo uploads
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Helper function to resize image if it exceeds 5MB
  const resizeImage = async (file: File): Promise<File> => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes

    // If file is already under 5MB, return it as-is
    if (file.size <= MAX_SIZE) {
      return file;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Calculate new dimensions to reduce file size
          let width = img.width;
          let height = img.height;
          const ratio = file.size / MAX_SIZE;
          const scale = Math.sqrt(1 / ratio) * 0.9; // 0.9 to ensure we're under the limit

          width = Math.floor(width * scale);
          height = Math.floor(height * scale);

          canvas.width = width;
          canvas.height = height;

          // Draw resized image
          ctx.drawImage(img, 0, 0, width, height);

          // Convert canvas to blob with reduced quality
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }

              // Create new file from blob
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });

              console.log(`Image resized from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(resizedFile.size / 1024 / 1024).toFixed(2)}MB`);
              resolve(resizedFile);
            },
            file.type,
            0.8 // Quality (0.8 = 80%)
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  // Compress image with UPSCALING for small images (Profile & Banner only)
  // Never throws errors - returns original or fallback on failure
  const compressImageToBase64WithUpscale = async (
    file: File,
    progressCallback: (progress: number) => void
  ): Promise<string> => {
    const TARGET_DIMENSION = 800; // Target dimension for upscaling/downscaling
    const MIN_DIMENSION = 400; // Upscale if smaller than this
    const QUALITY = 0.7; // 70% quality (aggressive compression)

    try {
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 50);
            progressCallback(progress);
          }
        };

        reader.onload = (event) => {
          try {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
              try {
                progressCallback(60); // Image loaded, starting processing

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                  console.warn('Failed to get canvas context, using original');
                  resolve(event.target?.result as string);
                  return;
                }

                let width = img.width;
                let height = img.height;
                const aspectRatio = width / height;

                // Determine if we need to upscale or downscale
                const maxCurrentDimension = Math.max(width, height);
                const minCurrentDimension = Math.min(width, height);

                if (maxCurrentDimension < MIN_DIMENSION) {
                  // UPSCALE: Image is too small, upscale to TARGET_DIMENSION
                  if (width > height) {
                    width = TARGET_DIMENSION;
                    height = Math.floor(TARGET_DIMENSION / aspectRatio);
                  } else {
                    height = TARGET_DIMENSION;
                    width = Math.floor(TARGET_DIMENSION * aspectRatio);
                  }
                  console.log(`📈 Upscaling small image: ${img.width}x${img.height} → ${width}x${height}`);
                } else if (maxCurrentDimension > TARGET_DIMENSION) {
                  // DOWNSCALE: Image is too large, downscale to TARGET_DIMENSION
                  if (width > height) {
                    width = TARGET_DIMENSION;
                    height = Math.floor(TARGET_DIMENSION / aspectRatio);
                  } else {
                    height = TARGET_DIMENSION;
                    width = Math.floor(TARGET_DIMENSION * aspectRatio);
                  }
                  console.log(`📉 Downscaling large image: ${img.width}x${img.height} → ${width}x${height}`);
                } else {
                  // Image is in acceptable range, keep original dimensions
                  console.log(`✓ Image size acceptable: ${width}x${height}`);
                }

                canvas.width = width;
                canvas.height = height;

                progressCallback(75); // Resizing...

                // Draw resized/upscaled image with high quality interpolation
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                progressCallback(90); // Converting to Base64...

                // Convert canvas to Base64
                const base64String = canvas.toDataURL('image/jpeg', QUALITY);

                const originalSizeKB = file.size / 1024;
                const processedSizeKB = (base64String.length * 0.75) / 1024;

                console.log(`Image processed: ${originalSizeKB.toFixed(0)}KB → ${processedSizeKB.toFixed(0)}KB`);

                progressCallback(100);
                resolve(base64String);
              } catch (error) {
                console.error('Error during image processing:', error);
                // Fallback to original image as Base64
                resolve(event.target?.result as string);
              }
            };

            img.onerror = () => {
              console.error('Failed to load image, using original');
              resolve(event.target?.result as string);
            };
          } catch (error) {
            console.error('Error in image load handler:', error);
            resolve(event.target?.result as string);
          }
        };

        reader.onerror = () => {
          console.error('Failed to read file');
          reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Unexpected error in compressImageToBase64WithUpscale:', error);
      // Last resort fallback: try to read file directly
      try {
        const reader = new FileReader();
        return await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => resolve(''); // Return empty string if all fails
          reader.readAsDataURL(file);
        });
      } catch {
        return ''; // Never throw
      }
    }
  };

  // Regular compression for company logo (no upscaling, but never throws errors)
  const compressImageToBase64 = async (
    file: File,
    progressCallback: (progress: number) => void
  ): Promise<string> => {
    const MAX_DIMENSION = 800; // Max width or height (aggressive compression)
    const QUALITY = 0.7; // 70% quality (aggressive compression)

    try {
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 50);
            progressCallback(progress);
          }
        };

        reader.onload = (event) => {
          try {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
              try {
                progressCallback(60); // Image loaded, starting compression

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                  console.warn('Failed to get canvas context, using original');
                  resolve(event.target?.result as string);
                  return;
                }

                // Calculate new dimensions maintaining aspect ratio
                let width = img.width;
                let height = img.height;

                if (width > height) {
                  if (width > MAX_DIMENSION) {
                    height = Math.floor(height * (MAX_DIMENSION / width));
                    width = MAX_DIMENSION;
                  }
                } else {
                  if (height > MAX_DIMENSION) {
                    width = Math.floor(width * (MAX_DIMENSION / height));
                    height = MAX_DIMENSION;
                  }
                }

                canvas.width = width;
                canvas.height = height;

                progressCallback(75); // Resizing...

                // Draw resized image
                ctx.drawImage(img, 0, 0, width, height);

                progressCallback(90); // Converting to Base64...

                // Convert canvas to Base64 with aggressive compression
                const base64String = canvas.toDataURL('image/jpeg', QUALITY);

                const originalSizeKB = file.size / 1024;
                const compressedSizeKB = (base64String.length * 0.75) / 1024;

                console.log(`Image compressed: ${originalSizeKB.toFixed(0)}KB → ${compressedSizeKB.toFixed(0)}KB`);

                progressCallback(100);
                resolve(base64String);
              } catch (error) {
                console.error('Error during compression:', error);
                resolve(event.target?.result as string);
              }
            };

            img.onerror = () => {
              console.error('Failed to load image, using original');
              resolve(event.target?.result as string);
            };
          } catch (error) {
            console.error('Error in image load handler:', error);
            resolve(event.target?.result as string);
          }
        };

        reader.onerror = () => {
          console.error('Failed to read file');
          reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Unexpected error in compressImageToBase64:', error);
      try {
        const reader = new FileReader();
        return await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
      } catch {
        return '';
      }
    }
  };


  // Handle photo file upload
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, etc.)');
      return;
    }

    try {
      // Resize image if needed
      let processedFile = file;
      if (file.size > MAX_SIZE) {
        console.log(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 5MB. Resizing...`);
        processedFile = await resizeImage(file);
      }

      // Create a temporary URL for preview
      const imageUrl = URL.createObjectURL(processedFile);

      // Add photo to profile data
      const newPhoto = {
        id: Date.now().toString(),
        url: imageUrl,
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        showPublicly: true
      };

      setProfileData({
        ...profileData,
        photos: [...profileData.photos, newPhoto]
      });

      // TODO: Upload to storage server (Supabase, S3, etc.)
      // This is where you would upload processedFile to your storage

    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    }

    // Reset input
    event.target.value = '';
  };

  // Handle certification file upload
  const handleCertificationUpload = async (file: File) => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

    // Validate file type
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid file (PDF, PNG, JPG)');
      return;
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      toast.error('File size must be under 5MB');
      return;
    }

    try {
      toast.loading('Uploading certification...', { id: 'cert-upload' });

      // Upload to Supabase Storage
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'certifications');
      formData.append('isPublic', 'true'); // Enable public access for third-party viewing

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Create certification object with real Supabase URL
      const newCertification = {
        id: result.data.id,
        name: file.name,
        title: '', // User must enter title
        url: result.data.publicUrl, // Real Supabase public URL (not blob URL)
        size: file.size,
        type: file.type,
        showPublicly: true // Default to visible
      };

      // Add to certifications array
      setProfileData({
        ...profileData,
        certifications: [...profileData.certifications, newCertification]
      });

      toast.success('Certification uploaded successfully', { id: 'cert-upload' });

    } catch (error) {
      console.error('Error uploading certification:', error);
      toast.error('Failed to upload certification', { id: 'cert-upload' });
    }
  };

  // Update certification title
  const handleCertificationTitleChange = (certId: string, title: string) => {
    setProfileData({
      ...profileData,
      certifications: profileData.certifications.map(cert =>
        cert.id === certId ? { ...cert, title } : cert
      )
    });
  };

  // Toggle certification visibility
  const handleCertificationVisibilityToggle = (certId: string) => {
    setProfileData({
      ...profileData,
      certifications: profileData.certifications.map(cert =>
        cert.id === certId ? { ...cert, showPublicly: !cert.showPublicly } : cert
      )
    });
  };

  // Fetch existing profile data on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoadingProfile(true);
      try {
        console.log('🔄 Starting profile data fetch from DATABASE...');
        console.log('📋 Profile ID from URL:', profileId);

        // Fetch profiles from database
        const profileResponse = await fetch('/api/profiles');

        if (profileResponse.ok) {
          const result = await profileResponse.json();
          console.log('📦 Database response:', result);

          if (result.success && result.profiles && result.profiles.length > 0) {
            let profileToEdit = null;

            // If profileId is provided in URL, find that specific profile
            if (profileId) {
              profileToEdit = result.profiles.find((p: any) => p.id === profileId);
              console.log('🔍 Looking for profile with ID:', profileId);
            } else {
              // Otherwise, get the first (most recent) profile
              profileToEdit = result.profiles[0];
              console.log('🔍 Using most recent profile');
            }

            if (profileToEdit) {
              console.log('✅ Found profile from database:', profileToEdit);
              console.log('🏢 Company Logo URL from DB:', profileToEdit.company_logo_url);

              // Parse social_links if it's a JSON string
              let socialLinks = {};
              if (typeof profileToEdit.social_links === 'string') {
                try {
                  socialLinks = JSON.parse(profileToEdit.social_links);
                } catch (e) {
                  console.error('Failed to parse social_links:', e);
                }
              } else if (profileToEdit.social_links) {
                socialLinks = profileToEdit.social_links;
              }

              // Auto-detect country codes from phone numbers and split them
              console.log('📱 Raw phone_number from database:', profileToEdit.phone_number);
              console.log('📱 Raw whatsapp from database:', profileToEdit.whatsapp);

              const mobileDetected = detectCountryCodeFromNumber(profileToEdit.phone_number || '');
              const whatsappDetected = detectCountryCodeFromNumber(profileToEdit.whatsapp || '');

              console.log('📞 Mobile detected - Code:', mobileDetected.countryCode, 'Number:', mobileDetected.number);
              console.log('📞 WhatsApp detected - Code:', whatsappDetected.countryCode, 'Number:', whatsappDetected.number);

              // Set country code dropdowns
              setMobileCountryCode(mobileDetected.countryCode);
              setWhatsappCountryCode(whatsappDetected.countryCode);

              // Map database profile structure to builder structure
              const mappedProfile = {
                salutation: profileToEdit.preferences?.salutation || '',
                firstName: profileToEdit.first_name || '',
                lastName: profileToEdit.last_name || '',
                primaryEmail: profileToEdit.email || '',
                secondaryEmail: profileToEdit.alternate_email || '',
                mobileNumber: mobileDetected.number,
                whatsappNumber: whatsappDetected.number,
                showEmailPublicly: profileToEdit.show_email_publicly ?? true,
                showSecondaryEmailPublicly: profileToEdit.show_secondary_email_publicly ?? true,
                showMobilePublicly: profileToEdit.show_mobile_publicly ?? true,
                showWhatsappPublicly: profileToEdit.show_whatsapp_publicly ?? false,

                jobTitle: profileToEdit.job_title || profileToEdit.title || '',
                companyName: profileToEdit.company || profileToEdit.company_name || '',
                companyWebsite: profileToEdit.company_website || '',
                companyAddress: profileToEdit.company_address || profileToEdit.location || '',
                companyLogo: profileToEdit.company_logo_url || null,
                industry: profileToEdit.industry || '',
                subDomain: profileToEdit.sub_domain || '',
                skills: Array.isArray(profileToEdit.skills) ? profileToEdit.skills : [],
                professionalSummary: profileToEdit.professional_summary || profileToEdit.bio || '',
                showJobTitle: profileToEdit.show_job_title ?? true,
                showCompanyName: profileToEdit.show_company_name ?? true,
                showCompanyWebsite: profileToEdit.show_company_website ?? true,
                showCompanyAddress: profileToEdit.show_company_address ?? true,
                showIndustry: profileToEdit.show_industry ?? true,
                showSkills: profileToEdit.show_skills ?? true,

                linkedinUrl: (socialLinks as any)?.linkedin || '',
                instagramUrl: (socialLinks as any)?.instagram || '',
                facebookUrl: (socialLinks as any)?.facebook || '',
                twitterUrl: (socialLinks as any)?.twitter || '',
                behanceUrl: (socialLinks as any)?.behance || '',
                dribbbleUrl: (socialLinks as any)?.dribbble || '',
                githubUrl: (socialLinks as any)?.github || '',
                youtubeUrl: (socialLinks as any)?.youtube || '',
                showLinkedin: profileToEdit.show_linkedin ?? Boolean((socialLinks as any)?.linkedin),
                showInstagram: profileToEdit.show_instagram ?? Boolean((socialLinks as any)?.instagram),
                showFacebook: profileToEdit.show_facebook ?? Boolean((socialLinks as any)?.facebook),
                showTwitter: profileToEdit.show_twitter ?? Boolean((socialLinks as any)?.twitter),
                showBehance: profileToEdit.show_behance ?? false,
                showDribbble: profileToEdit.show_dribbble ?? false,
                showGithub: profileToEdit.show_github ?? false,
                showYoutube: profileToEdit.show_youtube ?? Boolean((socialLinks as any)?.youtube),

                profilePhoto: profileToEdit.profile_photo_url || profileToEdit.avatar_url || null,
                backgroundImage: profileToEdit.background_image_url || null,
                showProfilePhoto: profileToEdit.show_profile_photo ?? true,
                showBackgroundImage: profileToEdit.show_background_image ?? true,

                photos: Array.isArray(profileToEdit.gallery_urls) ? profileToEdit.gallery_urls.map((url: string, index: number) => ({
                  id: `photo-${index}`,
                  url,
                  title: '',
                  showPublicly: true
                })) : [],
                videos: Array.isArray(profileToEdit.video_urls) ? profileToEdit.video_urls.map((url: string, index: number) => ({
                  id: `video-${index}`,
                  url,
                  title: '',
                  showPublicly: true
                })) : [],
                certifications: Array.isArray(profileToEdit.preferences?.certifications)
                  ? profileToEdit.preferences.certifications
                  : [],
                services: Array.isArray(profileToEdit.services) && profileToEdit.services.length > 0
                  ? profileToEdit.services
                  : [{
                      id: Date.now().toString(),
                      title: '',
                      description: '',
                      pricing: '',
                      pricingUnit: '',
                      currency: 'USD',
                      category: '',
                      showPublicly: true
                    }]
              };

              setProfileData(mappedProfile);

              console.log('✅ Profile data loaded from database with auto-detection');
              console.log('📱 Mobile Number (split):', mappedProfile.mobileNumber);
              console.log('📱 WhatsApp Number (split):', mappedProfile.whatsappNumber);
              console.log('🏢 Mapped Company Logo:', mappedProfile.companyLogo);
              return; // Exit early, we have the data
            }
          } else {
            console.log('ℹ️ No profiles found in database, checking localStorage...');
          }
        }

        // First check localStorage for various data sources
        const nfcConfigStr = localStorage.getItem('nfcConfig');
        const userProfileStr = localStorage.getItem('userProfile');
        const userContactDataStr = localStorage.getItem('userContactData');

        console.log('💾 LocalStorage nfcConfig:', nfcConfigStr);
        console.log('💾 LocalStorage userProfile:', userProfileStr);
        console.log('💾 LocalStorage userContactData:', userContactDataStr);

        // Priority order: userContactData (most recent from checkout) > nfcConfig > userProfile
        let mergedData: any = {};

        // Start with nfcConfig
        if (nfcConfigStr) {
          try {
            const config = JSON.parse(nfcConfigStr);
            console.log('✅ Found nfcConfig data:', config);
            mergedData = {
              firstName: config.firstName,
              lastName: config.lastName,
              primaryEmail: config.email,
            };
          } catch (e) {
            console.error('❌ Error parsing nfcConfig:', e);
          }
        }

        // Override with userProfile if available
        if (userProfileStr) {
          try {
            const userProfile = JSON.parse(userProfileStr);
            console.log('✅ Found userProfile data:', userProfile);
            mergedData = {
              ...mergedData,
              firstName: userProfile.firstName || mergedData.firstName,
              lastName: userProfile.lastName || mergedData.lastName,
              primaryEmail: userProfile.email || mergedData.primaryEmail,
              mobileNumber: userProfile.phone || userProfile.mobile || mergedData.mobileNumber,
            };
          } catch (e) {
            console.error('❌ Error parsing userProfile:', e);
          }
        }

        // Override with userContactData (highest priority - most recent)
        if (userContactDataStr) {
          try {
            const userContactData = JSON.parse(userContactDataStr);
            console.log('✅ Found userContactData (from checkout):', userContactData);
            mergedData = {
              ...mergedData,
              firstName: userContactData.firstName || mergedData.firstName,
              lastName: userContactData.lastName || mergedData.lastName,
              primaryEmail: userContactData.email || mergedData.primaryEmail,
              mobileNumber: userContactData.phone || mergedData.mobileNumber,
            };
          } catch (e) {
            console.error('❌ Error parsing userContactData:', e);
          }
        }

        // Apply merged data to profile
        if (Object.keys(mergedData).length > 0) {
          // Auto-detect country code from phone number and split it
          const mobileDetected = detectCountryCodeFromNumber(mergedData.mobileNumber || '');

          console.log('📞 Original phone from localStorage:', mergedData.mobileNumber);
          console.log('📞 Detected country code:', mobileDetected.countryCode);
          console.log('📞 Number without code:', mobileDetected.number);

          // Set the detected country code in dropdown
          setMobileCountryCode(mobileDetected.countryCode);
          setWhatsappCountryCode(mobileDetected.countryCode);

          setProfileData(prev => ({
            ...prev,
            firstName: mergedData.firstName || prev.firstName,
            lastName: mergedData.lastName || prev.lastName,
            primaryEmail: mergedData.primaryEmail || prev.primaryEmail,
            mobileNumber: mobileDetected.number || prev.mobileNumber,
          }));

          console.log('✅ Profile data populated from localStorage with auto-detection');
        }

        // Try to get user email from multiple sources
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };

        // Try multiple sources for user email
        let userEmail = getCookie('userEmail');

        // Fallback to localStorage
        if (!userEmail) {
          const storedEmail = localStorage.getItem('userEmail');
          if (storedEmail) {
            userEmail = storedEmail;
            console.log('📧 Email found in localStorage:', userEmail);
          }
        }

        // Fallback to nfcConfig
        if (!userEmail && nfcConfigStr) {
          try {
            const nfcConfig = JSON.parse(nfcConfigStr);
            userEmail = nfcConfig.email;
            console.log('📧 Email found in nfcConfig:', userEmail);
          } catch (e) {
            console.error('Error parsing nfcConfig for email:', e);
          }
        }

        // Fallback to userProfile
        if (!userEmail && userProfileStr) {
          try {
            const userProfile = JSON.parse(userProfileStr);
            userEmail = userProfile.email;
            console.log('📧 Email found in userProfile:', userEmail);
          } catch (e) {
            console.error('Error parsing userProfile for email:', e);
          }
        }

        // Fallback to userContactData
        if (!userEmail && userContactDataStr) {
          try {
            const userContactData = JSON.parse(userContactDataStr);
            userEmail = userContactData.email;
            console.log('📧 Email found in userContactData:', userEmail);
          } catch (e) {
            console.error('Error parsing userContactData for email:', e);
          }
        }

        console.log('👤 Final user email:', userEmail);

        if (!userEmail) {
          console.log('⚠️ No user email found in any source');
          return;
        }

        console.log('🔍 Fetching profile data for:', userEmail);

        const apiUrl = `/api/profiles/save?email=${encodeURIComponent(userEmail)}`;
        console.log('📡 API URL:', apiUrl);

        const response = await fetch(apiUrl);

        console.log('📨 Response status:', response.status);
        console.log('📨 Response ok:', response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.log('⚠️ No existing profile found or error:', errorText);
          return;
        }

        const result = await response.json();
        console.log('📦 API result:', result);

        if (result.success && result.profile) {
          const profile = result.profile;
          const prefs = profile.preferences || {};

          console.log('✅ Profile found:', profile);
          console.log('⚙️ Preferences:', prefs);

          // Auto-detect country codes from full phone numbers and split them
          console.log('📱 Full mobile number from DB:', profile.phone_number);
          console.log('📱 Full WhatsApp number from DB:', prefs.whatsappNumber);

          const mobileDetected = detectCountryCodeFromNumber(profile.phone_number || '');
          const whatsappDetected = detectCountryCodeFromNumber(prefs.whatsappNumber || '');

          console.log('📞 Mobile detected - Code:', mobileDetected.countryCode, 'Number:', mobileDetected.number);
          console.log('📞 WhatsApp detected - Code:', whatsappDetected.countryCode, 'Number:', whatsappDetected.number);

          // Map database fields to form state
          const displaySettings = profile.display_settings || {};
          const mappedData = {
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            primaryEmail: profile.email || '',
            secondaryEmail: profile.alternate_email || '',
            mobileNumber: mobileDetected.number,
            whatsappNumber: whatsappDetected.number,
            showEmailPublicly: displaySettings.showEmailPublicly ?? prefs.showEmailPublicly ?? true,
            showSecondaryEmailPublicly: displaySettings.showSecondaryEmailPublicly ?? prefs.showSecondaryEmailPublicly ?? true,
            showMobilePublicly: displaySettings.showMobilePublicly ?? prefs.showMobilePublicly ?? true,
            showWhatsappPublicly: displaySettings.showWhatsappPublicly ?? prefs.showWhatsappPublicly ?? false,

            jobTitle: prefs.jobTitle || '',
            companyName: profile.company || '',
            companyWebsite: prefs.companyWebsite || '',
            companyAddress: prefs.companyAddress || '',
            companyLogo: prefs.companyLogo || null,
            industry: prefs.industry || '',
            subDomain: prefs.subDomain || '',
            skills: prefs.skills || [],
            professionalSummary: prefs.professionalSummary || '',
            showJobTitle: prefs.showJobTitle ?? true,
            showCompanyName: prefs.showCompanyName ?? true,
            showCompanyWebsite: prefs.showCompanyWebsite ?? true,
            showCompanyAddress: prefs.showCompanyAddress ?? true,
            showIndustry: prefs.showIndustry ?? true,
            showSkills: prefs.showSkills ?? true,

            linkedinUrl: prefs.linkedinUrl || '',
            instagramUrl: prefs.instagramUrl || '',
            facebookUrl: prefs.facebookUrl || '',
            twitterUrl: prefs.twitterUrl || '',
            behanceUrl: prefs.behanceUrl || '',
            dribbbleUrl: prefs.dribbbleUrl || '',
            githubUrl: prefs.githubUrl || '',
            youtubeUrl: prefs.youtubeUrl || '',
            showLinkedin: prefs.showLinkedin ?? false,
            showInstagram: prefs.showInstagram ?? false,
            showFacebook: prefs.showFacebook ?? false,
            showTwitter: prefs.showTwitter ?? false,
            showBehance: prefs.showBehance ?? false,
            showDribbble: prefs.showDribbble ?? false,
            showGithub: prefs.showGithub ?? false,
            showYoutube: prefs.showYoutube ?? false,

            profilePhoto: profile.avatar_url || null,
            backgroundImage: prefs.backgroundImage || null,
            showProfilePhoto: prefs.showProfilePhoto ?? true,
            showBackgroundImage: prefs.showBackgroundImage ?? true,

            photos: prefs.photos || [],
            videos: prefs.videos || [],
            certifications: prefs.certifications || [],
            services: (prefs.services && prefs.services.length > 0)
              ? prefs.services
              : [{
                  id: Date.now().toString(),
                  title: '',
                  description: '',
                  pricing: '',
                  pricingUnit: '',
                  currency: 'USD',
                  category: '',
                  showPublicly: true
                }]
          };

          console.log('🗺️ Mapped data:', mappedData);
          setProfileData(mappedData);

          // Set detected country codes to dropdowns
          setMobileCountryCode(mobileDetected.countryCode);
          setWhatsappCountryCode(whatsappDetected.countryCode);

          console.log('📱 Detected Mobile Country Code:', mobileDetected.countryCode);
          console.log('📱 Detected WhatsApp Country Code:', whatsappDetected.countryCode);
          console.log('✅ Profile data loaded successfully');
        } else {
          console.log('⚠️ No profile data in response');
        }
      } catch (error) {
        console.error('❌ Error fetching profile data:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfileData();
  }, [profileId]);

  // Auto-update WhatsApp number when mobile number changes (if checkbox is checked)
  useEffect(() => {
    if (useSameNumberForWhatsapp && profileData.mobileNumber) {
      setProfileData(prev => ({ ...prev, whatsappNumber: prev.mobileNumber }));
    }
  }, [profileData.mobileNumber, useSameNumberForWhatsapp]);

  // Handle click outside for skills dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (skillDropdownRef.current && !skillDropdownRef.current.contains(event.target as Node)) {
        setShowSkillDropdown(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    if (showSkillDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSkillDropdown]);

  // Detect user's location and set default currency
  useEffect(() => {
    const detectCurrency = async () => {
      try {
        // Try to detect timezone and map to currency
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let currency = 'USD'; // Default fallback

        // Map common timezones to currencies
        const timezoneToCurrency: { [key: string]: string } = {
          // Europe
          'Europe/London': 'GBP',
          'Europe/Paris': 'EUR',
          'Europe/Berlin': 'EUR',
          'Europe/Rome': 'EUR',
          'Europe/Madrid': 'EUR',
          'Europe/Amsterdam': 'EUR',
          'Europe/Brussels': 'EUR',
          'Europe/Vienna': 'EUR',
          'Europe/Stockholm': 'SEK',
          'Europe/Oslo': 'NOK',
          'Europe/Zurich': 'CHF',
          // Asia
          'Asia/Dubai': 'AED',
          'Asia/Kolkata': 'INR',
          'Asia/Mumbai': 'INR',
          'Asia/Delhi': 'INR',
          'Asia/Tokyo': 'JPY',
          'Asia/Shanghai': 'CNY',
          'Asia/Hong_Kong': 'HKD',
          'Asia/Singapore': 'SGD',
          'Asia/Seoul': 'KRW',
          'Asia/Riyadh': 'SAR',
          // Americas
          'America/New_York': 'USD',
          'America/Los_Angeles': 'USD',
          'America/Chicago': 'USD',
          'America/Toronto': 'CAD',
          'America/Vancouver': 'CAD',
          'America/Mexico_City': 'MXN',
          'America/Sao_Paulo': 'BRL',
          // Oceania
          'Australia/Sydney': 'AUD',
          'Australia/Melbourne': 'AUD',
          'Pacific/Auckland': 'NZD',
          // Africa
          'Africa/Johannesburg': 'ZAR',
        };

        // Check if we have a mapping for the user's timezone
        for (const [tz, curr] of Object.entries(timezoneToCurrency)) {
          if (timezone.includes(tz.split('/')[1])) {
            currency = curr;
            break;
          }
        }

        setDefaultCurrency(currency);
        console.log(`🌍 Detected timezone: ${timezone}, setting currency to: ${currency}`);
      } catch (error) {
        console.error('Failed to detect currency:', error);
        setDefaultCurrency('USD'); // Fallback to USD
      }
    };

    detectCurrency();
  }, []);

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToastState({ message, type });
    setTimeout(() => setToastState(null), 5000);
  };

  // Auto-save toggle changes immediately
  const handleToggleAutoSave = async (toggleName: string, value: boolean) => {
    // Update state first for immediate UI feedback
    setProfileData(prev => ({ ...prev, [toggleName]: value }));

    try {
      // Show saving indicator
      toast.loading('Saving...', { id: 'toggle-save' });

      // Prepare phone numbers with country codes
      const fullMobileNumber = profileData.mobileNumber
        ? `${mobileCountryCode}${profileData.mobileNumber.replace(/^[\s+]*/, '')}`
        : '';
      const fullWhatsappNumber = profileData.whatsappNumber
        ? `${whatsappCountryCode}${profileData.whatsappNumber.replace(/^[\s+]*/, '')}`
        : '';

      // Save to database with updated toggle value - properly map all fields
      const response = await fetch('/api/profiles/save', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: profileData.primaryEmail,
          salutation: profileData.salutation,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          mobileNumber: fullMobileNumber,
          companyName: profileData.companyName,
          profilePhoto: profileData.profilePhoto,
          secondaryEmail: profileData.secondaryEmail,
          whatsappNumber: fullWhatsappNumber,
          showEmailPublicly: toggleName === 'showEmailPublicly' ? value : profileData.showEmailPublicly,
          showSecondaryEmailPublicly: toggleName === 'showSecondaryEmailPublicly' ? value : profileData.showSecondaryEmailPublicly,
          showMobilePublicly: toggleName === 'showMobilePublicly' ? value : profileData.showMobilePublicly,
          showWhatsappPublicly: toggleName === 'showWhatsappPublicly' ? value : profileData.showWhatsappPublicly,
          jobTitle: profileData.jobTitle,
          companyWebsite: profileData.companyWebsite,
          companyAddress: profileData.companyAddress,
          companyLogo: profileData.companyLogo,
          industry: profileData.industry,
          subDomain: profileData.subDomain,
          skills: profileData.skills,
          professionalSummary: profileData.professionalSummary,
          showJobTitle: toggleName === 'showJobTitle' ? value : profileData.showJobTitle,
          showCompanyName: toggleName === 'showCompanyName' ? value : profileData.showCompanyName,
          showCompanyWebsite: toggleName === 'showCompanyWebsite' ? value : profileData.showCompanyWebsite,
          showCompanyAddress: toggleName === 'showCompanyAddress' ? value : profileData.showCompanyAddress,
          showIndustry: toggleName === 'showIndustry' ? value : profileData.showIndustry,
          showSkills: toggleName === 'showSkills' ? value : profileData.showSkills,
          linkedinUrl: profileData.linkedinUrl,
          instagramUrl: profileData.instagramUrl,
          facebookUrl: profileData.facebookUrl,
          twitterUrl: profileData.twitterUrl,
          behanceUrl: profileData.behanceUrl,
          dribbbleUrl: profileData.dribbbleUrl,
          githubUrl: profileData.githubUrl,
          youtubeUrl: profileData.youtubeUrl,
          showLinkedin: toggleName === 'showLinkedin' ? value : profileData.showLinkedin,
          showInstagram: toggleName === 'showInstagram' ? value : profileData.showInstagram,
          showFacebook: toggleName === 'showFacebook' ? value : profileData.showFacebook,
          showTwitter: toggleName === 'showTwitter' ? value : profileData.showTwitter,
          showBehance: toggleName === 'showBehance' ? value : profileData.showBehance,
          showDribbble: toggleName === 'showDribbble' ? value : profileData.showDribbble,
          showGithub: toggleName === 'showGithub' ? value : profileData.showGithub,
          showYoutube: toggleName === 'showYoutube' ? value : profileData.showYoutube,
          backgroundImage: profileData.backgroundImage,
          showProfilePhoto: toggleName === 'showProfilePhoto' ? value : profileData.showProfilePhoto,
          showBackgroundImage: toggleName === 'showBackgroundImage' ? value : profileData.showBackgroundImage,
          photos: profileData.photos,
          videos: profileData.videos,
          certifications: profileData.certifications,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Saved!', { id: 'toggle-save', duration: 2000 });
      } else {
        throw new Error(result.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving toggle:', error);
      toast.error('Failed to save', { id: 'toggle-save', duration: 3000 });
      // Revert state on error
      setProfileData(prev => ({ ...prev, [toggleName]: !value }));
    }
  };

  // Validate required fields for each section
  const validateBasicInfo = () => {
    if (!profileData.firstName.trim()) {
      showToast('First name is required', 'error');
      return false;
    }
    if (!profileData.lastName.trim()) {
      showToast('Last name is required', 'error');
      return false;
    }
    if (!profileData.primaryEmail.trim()) {
      showToast('Primary email is required', 'error');
      return false;
    }
    return true;
  };

  // Handle Continue button click for navigation
  // Validate certifications have titles
  const validateCertifications = () => {
    if (profileData.certifications && profileData.certifications.length > 0) {
      const missingTitles = profileData.certifications.filter(cert => !cert.title || cert.title.trim() === '');
      if (missingTitles.length > 0) {
        toast.error('Please add titles to all certifications before continuing');
        return false;
      }
    }
    return true;
  };

  const handleContinue = (nextSection: 'professional' | 'service' | 'social' | 'media-photo') => {
    if (activeSection === 'basic' && !validateBasicInfo()) {
      return;
    }
    // Validate certifications when leaving the social section
    if (activeSection === 'social' && !validateCertifications()) {
      return;
    }
    setActiveSection(nextSection);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Submit button - save to database
  const handleSubmit = async () => {
    if (!validateBasicInfo()) {
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📤 Submitting profile data...');

      // Combine country code with phone numbers
      const fullMobileNumber = profileData.mobileNumber
        ? `${mobileCountryCode}${profileData.mobileNumber.replace(/^[\s+]*/, '')}`
        : '';
      const fullWhatsappNumber = profileData.whatsappNumber
        ? `${whatsappCountryCode}${profileData.whatsappNumber.replace(/^[\s+]*/, '')}`
        : '';

      const response = await fetch('/api/profiles/save', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: profileData.primaryEmail,
          salutation: profileData.salutation,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          mobileNumber: fullMobileNumber,
          companyName: profileData.companyName,
          profilePhoto: profileData.profilePhoto,
          secondaryEmail: profileData.secondaryEmail,
          whatsappNumber: fullWhatsappNumber,
          showEmailPublicly: profileData.showEmailPublicly,
          showSecondaryEmailPublicly: profileData.showSecondaryEmailPublicly,
          showMobilePublicly: profileData.showMobilePublicly,
          showWhatsappPublicly: profileData.showWhatsappPublicly,
          jobTitle: profileData.jobTitle,
          companyWebsite: profileData.companyWebsite,
          companyAddress: profileData.companyAddress,
          companyLogo: profileData.companyLogo,
          industry: profileData.industry,
          subDomain: profileData.subDomain,
          skills: profileData.skills,
          professionalSummary: profileData.professionalSummary,
          showJobTitle: profileData.showJobTitle,
          showCompanyName: profileData.showCompanyName,
          showCompanyWebsite: profileData.showCompanyWebsite,
          showCompanyAddress: profileData.showCompanyAddress,
          showIndustry: profileData.showIndustry,
          showSkills: profileData.showSkills,
          linkedinUrl: profileData.linkedinUrl,
          instagramUrl: profileData.instagramUrl,
          facebookUrl: profileData.facebookUrl,
          twitterUrl: profileData.twitterUrl,
          behanceUrl: profileData.behanceUrl,
          dribbbleUrl: profileData.dribbbleUrl,
          githubUrl: profileData.githubUrl,
          youtubeUrl: profileData.youtubeUrl,
          showLinkedin: profileData.showLinkedin,
          showInstagram: profileData.showInstagram,
          showFacebook: profileData.showFacebook,
          showTwitter: profileData.showTwitter,
          showBehance: profileData.showBehance,
          showDribbble: profileData.showDribbble,
          showGithub: profileData.showGithub,
          showYoutube: profileData.showYoutube,
          backgroundImage: profileData.backgroundImage,
          showProfilePhoto: profileData.showProfilePhoto,
          showBackgroundImage: profileData.showBackgroundImage,
          photos: profileData.photos,
          videos: profileData.videos,
          certifications: profileData.certifications,
          services: profileData.services,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Profile saved successfully:', result);

        // Store email in localStorage for future edits
        localStorage.setItem('userEmail', profileData.primaryEmail);
        console.log('📧 Email saved to localStorage:', profileData.primaryEmail);

        showToast('Profile saved successfully!', 'success');

        // Save to localStorage for dashboard display (with user isolation)
        const savedProfiles = localStorage.getItem('userProfiles');
        const profiles = savedProfiles ? JSON.parse(savedProfiles) : [];

        // Use the database-generated profile ID (from API response)
        const profileIdToUse = result.profile?.id || result.profileId || profileId || Date.now().toString();

        // Get current user email for user isolation
        const currentUserEmail = profileData.primaryEmail;

        // IMPORTANT: Filter out profiles from other users first
        const currentUserProfiles = profiles.filter((p: any) =>
          p.email === currentUserEmail || p.userEmail === currentUserEmail
        );

        const newProfile = {
          id: profileIdToUse,
          name: `${profileData.firstName} ${profileData.lastName}`.trim(),
          title: profileData.jobTitle,
          company: profileData.companyName,
          email: profileData.primaryEmail,
          userEmail: profileData.primaryEmail, // For user isolation
          phone: fullMobileNumber,
          website: profileData.companyWebsite,
          location: profileData.companyAddress,
          bio: profileData.professionalSummary,
          linkedin: profileData.linkedinUrl,
          twitter: profileData.twitterUrl,
          instagram: profileData.instagramUrl,
          facebook: profileData.facebookUrl,
          youtube: profileData.youtubeUrl,
          image: profileData.profilePhoto,
          ...profileData,
          status: 'active' as const,
          views: 0,
          clicks: 0,
          shares: 0,
          lastUpdated: 'Just now',
          publicUrl: `${getBaseDomain()}/${profileData.firstName.toLowerCase()}${profileData.lastName.toLowerCase()}`
        };

        // Check if profile already exists for THIS USER (prevent duplicates)
        const existingIndex = currentUserProfiles.findIndex((p: any) => p.id === profileIdToUse);

        if (existingIndex >= 0) {
          // Update existing profile
          newProfile.views = currentUserProfiles[existingIndex].views || 0;
          newProfile.clicks = currentUserProfiles[existingIndex].clicks || 0;
          newProfile.shares = currentUserProfiles[existingIndex].shares || 0;
          currentUserProfiles[existingIndex] = newProfile;
          console.log('📝 Updated existing profile in localStorage');
        } else {
          // Add new profile
          currentUserProfiles.push(newProfile);
          console.log('✨ Added new profile to localStorage');
        }

        // Save ONLY current user's profiles back to localStorage
        try {
          localStorage.setItem('userProfiles', JSON.stringify(currentUserProfiles));
          console.log(`💾 Saved ${currentUserProfiles.length} profile(s) for user ${currentUserEmail}`);
        } catch (storageError) {
          // Silently handle localStorage quota errors
          // Profile is already saved to database, so this is not critical
          console.warn('Could not save to localStorage (quota exceeded):', storageError);
        }

        // Redirect to profile preview page
        setTimeout(() => {
          router.push('/profiles/preview');
        }, 1500);
      } else {
        console.error('❌ Failed to save profile:', result.error);
        showToast(result.error || 'Failed to save profile', 'error');
      }
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      showToast('An error occurred while saving your profile', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveChanges = handleSubmit;

  // Handle skill input change with autocomplete
  const handleSkillInputChange = (value: string) => {
    setSkillInput(value);

    if (value.trim().length > 0) {
      const suggestions = searchSkills(value);
      setSkillSuggestions(suggestions.slice(0, 10)); // Show max 10 suggestions
      setShowSkillDropdown(suggestions.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setShowSkillDropdown(false);
      setSkillSuggestions([]);
    }
  };

  // Add skill from input or suggestion
  const addSkill = (skillToAdd?: string) => {
    const skillName = skillToAdd || skillInput.trim();

    if (skillName && !profileData.skills.includes(skillName)) {
      // Check if maximum 5 skills reached
      if (profileData.skills.length >= 5) {
        showToast('Maximum 5 skills allowed', 'error');
        return;
      }
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, skillName]
      });
      setSkillInput('');
      setShowSkillDropdown(false);
      setSkillSuggestions([]);
      setSelectedSuggestionIndex(-1);
    }
  };

  // Handle keyboard navigation in suggestions
  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSkillDropdown || skillSuggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addSkill();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev < skillSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          addSkill(skillSuggestions[selectedSuggestionIndex].skill);
        } else {
          addSkill();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSkillDropdown(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const removeSkill = (skill: string) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills.filter(s => s !== skill)
    });
  };

  const addPhoto = () => {
    // Trigger the file input click
    photoInputRef.current?.click();
  };

  const removePhoto = (id: string) => {
    setProfileData({
      ...profileData,
      photos: profileData.photos.filter(p => p.id !== id)
    });
  };

  const addVideo = () => {
    const newVideo = {
      id: Date.now().toString(),
      url: '',
      title: `Video ${profileData.videos.length + 1}`,
      showPublicly: true
    };
    setProfileData({
      ...profileData,
      videos: [...profileData.videos, newVideo]
    });
  };

  const sections = [
    { id: 'basic' as const, icon: Person, label: 'Basic Information', description: 'Update your personal details and contact preferences' },
    { id: 'professional' as const, icon: Briefcase, label: 'Professional Information', description: 'Build your professional presence and showcase your expertise' },
    { id: 'service' as const, icon: Service, label: 'Service', description: 'Showcase your services, products, and pricing information' },
    { id: 'social' as const, icon: Share, label: 'Social & Digital Presence', description: 'Connect your social media accounts and showcase your digital footprint' },
    { id: 'media-photo' as const, icon: Camera, label: 'Profile Photo & Banner', description: 'Upload and customize your profile visuals for a professional appearance' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-center sm:justify-between gap-3">
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Profile Builder</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 hidden sm:block">Create and manage your professional profile</p>
            </div>
            <div className="flex items-center gap-3 absolute right-4 sm:relative sm:right-0">
              <button
                onClick={handleSaveChanges}
                className="px-4 sm:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center gap-2 text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Save Changes</span>
                <span className="sm:hidden">Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
          {/* Sidebar Navigation - Desktop */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-24">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Sections</h3>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <section.icon className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" />
                    <span className="text-sm font-medium">{section.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Sidebar Navigation - Mobile (Horizontal Scroll) */}
          <div className="lg:hidden mb-4">
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">SECTIONS</h3>
              <nav className="flex overflow-x-auto gap-2 pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'thin' }}>
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors whitespace-nowrap ${
                      activeSection === section.id
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'text-gray-700 bg-gray-50'
                    }`}
                  >
                    <section.icon className="w-4 h-4 flex-shrink-0 text-red-600" />
                    <span className="text-xs font-medium">{section.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {/* Basic Information Section */}
            {activeSection === 'basic' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 sm:p-6 rounded-t-lg">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-white/10 p-2 sm:p-3 rounded-lg">
                      <Person className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white">Basic Information</h2>
                      <p className="text-white/90 text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">{sections.find(s => s.id === 'basic')?.description}</p>
                    </div>
                  </div>
                </div>

                {isLoadingProfile ? (
                  // Skeleton Loader
                  <div className="p-4 sm:p-6 space-y-6">
                    {/* Full Name Skeleton */}
                    <div>
                      <Skeleton variant="text" width={120} height={28} className="mb-3 sm:mb-4" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Skeleton variant="text" width={80} height={20} className="mb-2" />
                          <Skeleton variant="rectangular" height={42} className="rounded-lg" />
                        </div>
                        <div>
                          <Skeleton variant="text" width={80} height={20} className="mb-2" />
                          <Skeleton variant="rectangular" height={42} className="rounded-lg" />
                        </div>
                      </div>
                    </div>

                    {/* Email Addresses Skeleton */}
                    <div>
                      <Skeleton variant="text" width={150} height={28} className="mb-3 sm:mb-4" />
                      <div className="space-y-4">
                        <div>
                          <Skeleton variant="text" width={100} height={20} className="mb-2" />
                          <Skeleton variant="rectangular" height={42} className="rounded-lg" />
                          <div className="flex justify-end mt-2">
                            <Skeleton variant="text" width={120} height={20} />
                          </div>
                        </div>
                        <div>
                          <Skeleton variant="text" width={120} height={20} className="mb-2" />
                          <Skeleton variant="rectangular" height={42} className="rounded-lg" />
                          <div className="flex justify-end mt-2">
                            <Skeleton variant="text" width={120} height={20} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Phone Numbers Skeleton */}
                    <div>
                      <Skeleton variant="text" width={140} height={28} className="mb-3 sm:mb-4" />
                      <div className="space-y-4">
                        <div>
                          <Skeleton variant="text" width={100} height={20} className="mb-2" />
                          <div className="flex gap-2">
                            <Skeleton variant="rectangular" width={120} height={42} className="rounded-lg" />
                            <Skeleton variant="rectangular" height={42} className="rounded-lg flex-1" />
                          </div>
                          <div className="flex justify-between mt-2">
                            <Skeleton variant="text" width={180} height={20} />
                            <Skeleton variant="text" width={120} height={20} />
                          </div>
                        </div>
                        <div>
                          <Skeleton variant="text" width={130} height={20} className="mb-2" />
                          <div className="flex gap-2">
                            <Skeleton variant="rectangular" width={120} height={42} className="rounded-lg" />
                            <Skeleton variant="rectangular" height={42} className="rounded-lg flex-1" />
                          </div>
                          <div className="flex justify-end mt-2">
                            <Skeleton variant="text" width={120} height={20} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 sm:p-6 space-y-6">
                    {/* Full Name */}
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Full Name</h3>

                      {/* Salutation Dropdown */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Salutation</label>
                        <select
                          value={profileData.salutation}
                          onChange={(e) => setProfileData({ ...profileData, salutation: e.target.value })}
                          className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
                        >
                          {SALUTATIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                        <input
                          type="text"
                          value={profileData.firstName}
                          onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                        <input
                          type="text"
                          value={profileData.lastName}
                          onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email Addresses */}
                  <div suppressHydrationWarning>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Email Addresses</h3>
                    <div className="space-y-4" suppressHydrationWarning>
                      <div suppressHydrationWarning>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Primary Email *</label>
                        <div className="relative" suppressHydrationWarning>
                          <input
                            type="email"
                            value={profileData.primaryEmail}
                            onChange={(e) => setProfileData({ ...profileData, primaryEmail: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                            placeholder="Enter your email address"
                            suppressHydrationWarning
                            autoComplete="email"
                          />
                        </div>
                        <div className="flex items-center justify-end mt-2">
                          <div className="flex items-center gap-2">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={profileData.showEmailPublicly}
                                onChange={(e) => handleToggleAutoSave('showEmailPublicly', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                            <span className="text-sm text-gray-700">Show publicly</span>
                          </div>
                        </div>
                      </div>

                      <div suppressHydrationWarning>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Email</label>
                        <div className="relative" suppressHydrationWarning>
                          <input
                            type="email"
                            value={profileData.secondaryEmail}
                            onChange={(e) => setProfileData({ ...profileData, secondaryEmail: e.target.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                            placeholder="Add secondary email"
                            suppressHydrationWarning
                            autoComplete="email"
                          />
                          <Plus className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex items-center justify-end mt-2">
                          <div className="flex items-center gap-2">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={profileData.showSecondaryEmailPublicly}
                                onChange={(e) => handleToggleAutoSave('showSecondaryEmailPublicly', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                            <span className="text-sm text-gray-700">Show publicly</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phone Numbers */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Phone Numbers</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
                        <div className="flex gap-2">
                          <select
                            value={mobileCountryCode}
                            onChange={(e) => setMobileCountryCode(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
                          >
                            <option value="+971">🇦🇪 +971</option>
                            <option value="+1">🇺🇸 +1</option>
                            <option value="+91">🇮🇳 +91</option>
                          </select>
                          <div className="relative flex-1">
                            <input
                              type="tel"
                              value={profileData.mobileNumber}
                              onChange={(e) => {
                                // FIXED: Just store the number, respect dropdown selection
                                setProfileData({ ...profileData, mobileNumber: e.target.value });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                              placeholder="8999355932"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={useSameNumberForWhatsapp}
                              onChange={(e) => {
                                setUseSameNumberForWhatsapp(e.target.checked);
                                if (e.target.checked) {
                                  setProfileData({ ...profileData, whatsappNumber: profileData.mobileNumber });
                                  setWhatsappCountryCode(mobileCountryCode);
                                } else {
                                  setProfileData({ ...profileData, whatsappNumber: '' });
                                }
                              }}
                              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                            />
                            <span className="text-xs text-gray-600">Use same as WhatsApp number</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={profileData.showMobilePublicly}
                                onChange={(e) => handleToggleAutoSave('showMobilePublicly', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                            <span className="text-sm text-gray-700">Show publicly</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number</label>
                        <div className="flex gap-2">
                          <select
                            value={whatsappCountryCode}
                            onChange={(e) => setWhatsappCountryCode(e.target.value)}
                            disabled={useSameNumberForWhatsapp}
                            className={`px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none ${useSameNumberForWhatsapp ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                          >
                            <option value="+971">🇦🇪 +971</option>
                            <option value="+1">🇺🇸 +1</option>
                            <option value="+91">🇮🇳 +91</option>
                          </select>
                          <div className="relative flex-1">
                            <input
                              type="tel"
                              value={profileData.whatsappNumber}
                              onChange={(e) => {
                                // FIXED: Just store the number, respect dropdown selection
                                setProfileData({ ...profileData, whatsappNumber: e.target.value });
                              }}
                              disabled={useSameNumberForWhatsapp}
                              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none ${useSameNumberForWhatsapp ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                              placeholder="8999355932"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-end mt-2">
                          <div className="flex items-center gap-2">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={profileData.showWhatsappPublicly}
                                onChange={(e) => handleToggleAutoSave('showWhatsappPublicly', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                            <span className="text-sm text-gray-700">Show publicly</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
                )}

                {/* Continue Button - Fixed Bottom */}
                <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 rounded-b-lg">
                  <div className="flex justify-center sm:justify-end">
                    <button
                      onClick={() => handleContinue('professional')}
                      className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center justify-center gap-2 shadow-lg"
                      style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                    >
                      Continue
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Professional Information Section */}
            {activeSection === 'professional' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 sm:p-6 rounded-t-lg">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-white/10 p-2 sm:p-3 rounded-lg">
                      <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white">Professional Information</h2>
                      <p className="text-white/90 text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">{sections.find(s => s.id === 'professional')?.description}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-6">
                  {/* Job Title & Role */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Job Title & Role</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Job Title *</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={profileData.jobTitle}
                          onChange={(e) => {
                            setProfileData({ ...profileData, jobTitle: e.target.value });
                            setShowJobTitleDropdown(true);
                          }}
                          onFocus={() => setShowJobTitleDropdown(true)}
                          onBlur={() => {
                            // Delay hiding to allow click on dropdown items
                            setTimeout(() => setShowJobTitleDropdown(false), 200);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                          placeholder="Type to search or enter custom job title..."
                        />

                        {/* Live Search Dropdown - only show if there are matches */}
                        {(() => {
                          // Check if there are any matching job titles
                          const hasMatches = JOB_TITLES.some(group =>
                            group.titles.some(title =>
                              title.toLowerCase().includes(profileData.jobTitle.toLowerCase())
                            )
                          );

                          // Only show dropdown if there are matches
                          if (!showJobTitleDropdown || profileData.jobTitle.length === 0 || !hasMatches) {
                            return null;
                          }

                          return (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {JOB_TITLES.map((group) => {
                                const filteredTitles = group.titles.filter(title =>
                                  title.toLowerCase().includes(profileData.jobTitle.toLowerCase())
                                );

                                if (filteredTitles.length === 0) return null;

                                return (
                                  <div key={group.category}>
                                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0">
                                      {group.category}
                                    </div>
                                    {filteredTitles.map((title) => (
                                      <button
                                        key={title}
                                        type="button"
                                        onClick={() => {
                                          setProfileData({ ...profileData, jobTitle: title });
                                          setShowJobTitleDropdown(false);
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-red-50 hover:text-red-700 transition-colors text-sm"
                                      >
                                        {title}
                                      </button>
                                    ))}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={profileData.showJobTitle}
                            onChange={(e) => handleToggleAutoSave('showJobTitle', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                        <span className="text-sm text-gray-700">Show job title on profile</span>
                      </div>
                    </div>
                  </div>

                  {/* Company Information */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Company Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                        <input
                          type="text"
                          value={profileData.companyName}
                          onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                          placeholder="TechCorp Solutions"
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <label className="flex items-center cursor-pointer">
                            <input
                            type="checkbox"
                            checked={profileData.showCompanyName}
                            onChange={(e) => handleToggleAutoSave('showCompanyName', e.target.checked)}
                            className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                          <span className="text-sm text-gray-700">Show company name</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Company Website</label>
                        <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500">
                          <span className="pl-3 pr-1 py-2 text-gray-500 select-none whitespace-nowrap">https://</span>
                          <input
                            type="text"
                            value={profileData.companyWebsite.replace('https://', '')}
                            onChange={(e) => {
                              const domain = e.target.value;
                              const fullUrl = domain ? `https://${domain}` : '';
                              setProfileData({ ...profileData, companyWebsite: fullUrl });
                            }}
                            className="flex-1 px-2 py-2 border-0 outline-none rounded-r-lg"
                            placeholder="yourwebsite.com"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <label className="flex items-center cursor-pointer">
                            <input
                            type="checkbox"
                            checked={profileData.showCompanyWebsite}
                            onChange={(e) => handleToggleAutoSave('showCompanyWebsite', e.target.checked)}
                            className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                          <span className="text-sm text-gray-700">Show website</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
                      <input
                        type="text"
                        value={profileData.companyAddress}
                        onChange={(e) => setProfileData({ ...profileData, companyAddress: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                        placeholder="Business Bay, Dubai, UAE"
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <label className="flex items-center cursor-pointer">
                          <input
                          type="checkbox"
                          checked={profileData.showCompanyAddress}
                          onChange={(e) => handleToggleAutoSave('showCompanyAddress', e.target.checked)}
                          className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                        <span className="text-sm text-gray-700">Show address & map</span>
                      </div>

                      {/* Google Map Picker - shown when "Show address & map" is enabled */}
                      {profileData.showCompanyAddress && (
                        <div className="mt-4">
                          <GoogleMapPicker
                            initialAddress={{
                              addressLine1: profileData.companyAddress,
                            }}
                            onAddressChange={(address) => {
                              setProfileData(prev => ({
                                ...prev,
                                companyAddress: address.displayName || `${address.addressLine1}, ${address.city}, ${address.country}`
                              }));
                              showToast('Location updated successfully', 'success');
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                        <div className="w-20 h-20 sm:w-16 sm:h-16 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                          {profileData.companyLogo ? (
                            <img src={profileData.companyLogo} alt="Company Logo" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <svg className="w-10 h-10 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
                          <input
                            type="file"
                            id="company-logo-upload"
                            accept="image/png,image/jpeg,image/jpg"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  setIsUploadingCompanyLogo(true);
                                  setCompanyLogoUploadProgress(0);

                                  // Compress and convert to Base64 (no upscaling for logos)
                                  const base64String = await compressImageToBase64(file, (progress) => {
                                    setCompanyLogoUploadProgress(progress);
                                  });

                                  if (base64String) {
                                    setProfileData(prev => ({
                                      ...prev,
                                      companyLogo: base64String
                                    }));
                                    toast.success('Company logo uploaded successfully!');
                                  } else {
                                    console.warn('Company logo processing returned empty, but continuing');
                                  }
                                } catch (error) {
                                  // Graceful error handling - never show error to user
                                  console.error('Company logo upload error:', error);
                                  // Silently continue - the function should have handled this
                                } finally {
                                  setIsUploadingCompanyLogo(false);
                                  setCompanyLogoUploadProgress(0);
                                }
                              }
                            }}
                          />
                          <div className="w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById('company-logo-upload') as HTMLInputElement;
                                if (input) {
                                  input.click();
                                }
                              }}
                              disabled={isUploadingCompanyLogo}
                              className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                            >
                              <Upload className="w-4 h-4" />
                              {isUploadingCompanyLogo ? `Uploading... ${companyLogoUploadProgress}%` : 'Upload Logo'}
                            </button>
                            {isUploadingCompanyLogo && (
                              <div className="mt-2 w-full">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${companyLogoUploadProgress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            <span className="text-xs text-gray-500 text-center sm:text-left block mt-2">PNG, JPG up to 2MB</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Industry & Domain */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Industry & Domain</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Industry *</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={profileData.industry}
                            onChange={(e) => {
                              setProfileData({ ...profileData, industry: e.target.value, subDomain: '' });
                              setShowIndustryDropdown(true);
                            }}
                            onFocus={() => setShowIndustryDropdown(true)}
                            onBlur={() => {
                              // Delay hiding to allow click on dropdown items
                              setTimeout(() => setShowIndustryDropdown(false), 200);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                            placeholder="Type to search or enter custom industry..."
                          />

                          {/* Live Search Dropdown - only show if there are matches */}
                          {(() => {
                            // Check if there are any matching industries
                            const hasMatches = INDUSTRIES.some(industry =>
                              industry.toLowerCase().includes(profileData.industry.toLowerCase())
                            );

                            // Only show dropdown if there are matches
                            if (!showIndustryDropdown || profileData.industry.length === 0 || !hasMatches) {
                              return null;
                            }

                            return (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {INDUSTRIES.filter(industry =>
                                  industry.toLowerCase().includes(profileData.industry.toLowerCase())
                                ).map((industry) => (
                                  <button
                                    key={industry}
                                    type="button"
                                    onClick={() => {
                                      setProfileData({ ...profileData, industry, subDomain: '' });
                                      setShowIndustryDropdown(false);
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-red-50 hover:text-red-700 transition-colors text-sm"
                                  >
                                    {industry}
                                  </button>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sub Domain</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={profileData.subDomain}
                            onChange={(e) => {
                              setProfileData({ ...profileData, subDomain: e.target.value });
                              setShowSubDomainDropdown(true);
                            }}
                            onFocus={() => setShowSubDomainDropdown(true)}
                            onBlur={() => {
                              // Delay hiding to allow click on dropdown items
                              setTimeout(() => setShowSubDomainDropdown(false), 200);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
                            placeholder={profileData.industry ? "Type to search or enter custom sub-domain..." : "Select industry first..."}
                            disabled={!profileData.industry}
                          />

                          {/* Live Search Dropdown - only show if there are matches */}
                          {(() => {
                            // If no industry selected, don't show dropdown
                            if (!profileData.industry || !showSubDomainDropdown) {
                              return null;
                            }

                            // Find the selected industry's sub-domains
                            const selectedIndustryData = SUB_DOMAINS.find(
                              group => group.industry.toLowerCase() === profileData.industry.toLowerCase()
                            );

                            if (!selectedIndustryData) {
                              return null;
                            }

                            // Filter sub-domains based on search text
                            const filteredSubDomains = selectedIndustryData.subDomains.filter(subDomain =>
                              profileData.subDomain.length === 0 ||
                              subDomain.toLowerCase().includes(profileData.subDomain.toLowerCase())
                            );

                            if (filteredSubDomains.length === 0) {
                              return null;
                            }

                            return (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0">
                                  {selectedIndustryData.industry}
                                </div>
                                {filteredSubDomains.map((subDomain) => (
                                  <button
                                    key={subDomain}
                                    type="button"
                                    onClick={() => {
                                      setProfileData({ ...profileData, subDomain });
                                      setShowSubDomainDropdown(false);
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-red-50 hover:text-red-700 transition-colors text-sm"
                                  >
                                    {subDomain}
                                  </button>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                        type="checkbox"
                        checked={profileData.showIndustry}
                        onChange={(e) => handleToggleAutoSave('showIndustry', e.target.checked)}
                        className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                      <span className="text-sm text-gray-700">Show industry information</span>
                    </div>
                  </div>

                  {/* Skills & Expertise */}
                  <div>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Skills & Expertise</h3>
                      <span className="text-sm text-gray-600">{profileData.skills.length} of 5 skills added</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Search & Add Skills</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1" ref={skillDropdownRef}>
                          <input
                            type="text"
                            value={skillInput}
                            onChange={(e) => handleSkillInputChange(e.target.value)}
                            onKeyDown={handleSkillKeyDown}
                            disabled={profileData.skills.length >= 5}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
                            placeholder={profileData.skills.length >= 5 ? "Maximum 5 skills reached" : "Type skill name..."}
                          />

                          {/* Autocomplete Dropdown */}
                          {showSkillDropdown && skillSuggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {skillSuggestions.map((suggestion, index) => {
                                const isAlreadyAdded = profileData.skills.includes(suggestion.skill);
                                const isSelected = index === selectedSuggestionIndex;

                                return (
                                  <button
                                    key={`${suggestion.skill}-${index}`}
                                    type="button"
                                    onClick={() => !isAlreadyAdded && addSkill(suggestion.skill)}
                                    disabled={isAlreadyAdded}
                                    className={`w-full text-left px-3 py-2 transition-colors ${
                                      isAlreadyAdded
                                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                        : isSelected
                                        ? 'bg-red-50 text-red-700'
                                        : 'hover:bg-red-50 hover:text-red-700'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="font-medium text-sm">
                                          {suggestion.skill}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                          {suggestion.category}
                                        </div>
                                      </div>
                                      {isAlreadyAdded && (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={addSkill}
                          disabled={profileData.skills.length >= 5}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                            profileData.skills.length >= 5
                              ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {profileData.skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded-full"
                          >
                            {skill}
                            <button
                              onClick={() => removeSkill(skill)}
                              className="hover:bg-red-700 rounded-full p-0.5"
                            >
                              <X2 className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        {profileData.skills.includes('Product Strategy') && (
                          <>
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                              Agile Management
                              <button className="hover:bg-blue-700 rounded-full p-0.5">
                                <X2 className="w-3 h-3" />
                              </button>
                            </span>
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white text-sm rounded-full">
                              Data Analysis
                              <button className="hover:bg-yellow-600 rounded-full p-0.5">
                                <X2 className="w-3 h-3" />
                              </button>
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <label className="flex items-center cursor-pointer">
                          <input
                          type="checkbox"
                          checked={profileData.showSkills}
                          onChange={(e) => handleToggleAutoSave('showSkills', e.target.checked)}
                          className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                        <span className="text-sm text-gray-700">Show skills on profile</span>
                      </div>
                    </div>
                  </div>

                  {/* Professional Summary */}
                  <div>
                    <div className="mb-3 sm:mb-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Professional Summary</h3>
                    </div>
                    <div className="relative">
                      <textarea
                        value={profileData.professionalSummary}
                        onChange={(e) => {
                          if (e.target.value.length <= 500) {
                            setProfileData({ ...profileData, professionalSummary: e.target.value });
                          }
                        }}
                        rows={6}
                        maxLength={500}
                        className="w-full px-3 py-2 pb-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                        placeholder="Experienced Product Manager with 8+ years in tech industry. Specialized in building scalable products and leading cross-functional teams. Passionate about user experience an"
                      />
                      <span className={`absolute bottom-2 right-3 text-sm ${profileData.professionalSummary.length > 500 ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                        {profileData.professionalSummary.length}/500
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Write a brief summary of your professional background and expertise (maximum 500 characters)</p>
                  </div>
                </div>

                {/* Continue Button - Fixed Bottom */}
                <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 rounded-b-lg">
                  <div className="flex justify-center sm:justify-end">
                    <button
                      onClick={() => handleContinue('service')}
                      className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center justify-center gap-2 shadow-lg"
                      style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                    >
                      Continue
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Service Section */}
            {activeSection === 'service' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 sm:p-6 rounded-t-lg">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-white/10 p-2 sm:p-3 rounded-lg">
                      <Service className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white">Service</h2>
                      <p className="text-white/90 text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">{sections.find(s => s.id === 'service')?.description}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-6">
                  {/* Services List */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Your Services</h3>
                      <button
                        onClick={() => {
                          const newService = {
                            id: Date.now().toString(),
                            title: '',
                            description: '',
                            pricing: '',
                            pricingUnit: '',
                            currency: defaultCurrency,
                            category: '',
                            showPublicly: true
                          };
                          setProfileData({
                            ...profileData,
                            services: [...profileData.services, newService]
                          });
                        }}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" />
                        Add that
                      </button>
                    </div>

                    <div className="space-y-4">
                        {profileData.services.map((service, index) => (
                          <div key={service.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">Service {index + 1}</h4>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const newService = {
                                      id: Date.now().toString(),
                                      title: '',
                                      description: '',
                                      pricing: '',
                                      pricingUnit: '',
                                      currency: defaultCurrency,
                                      category: '',
                                      showPublicly: true
                                    };
                                    setProfileData({
                                      ...profileData,
                                      services: [...profileData.services, newService]
                                    });
                                  }}
                                  className="text-green-600 hover:text-green-700 p-1"
                                  title="Add another service"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setProfileData({
                                      ...profileData,
                                      services: profileData.services.filter(s => s.id !== service.id)
                                    });
                                  }}
                                  className="text-red-600 hover:text-red-700 p-1"
                                  title="Delete service"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Service Title */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Service Title *
                                </label>
                                <input
                                  type="text"
                                  value={service.title}
                                  onChange={(e) => {
                                    const updatedServices = profileData.services.map(s =>
                                      s.id === service.id ? { ...s, title: e.target.value } : s
                                    );
                                    setProfileData({ ...profileData, services: updatedServices });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                                  placeholder="e.g., Web Development"
                                />
                              </div>

                              {/* Service Category */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Category / Type *
                                </label>
                                <input
                                  type="text"
                                  value={service.category}
                                  onChange={(e) => {
                                    const updatedServices = profileData.services.map(s =>
                                      s.id === service.id ? { ...s, category: e.target.value } : s
                                    );
                                    setProfileData({ ...profileData, services: updatedServices });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                                  placeholder="e.g., Consulting, Development, Design"
                                />
                              </div>

                              {/* Service Pricing & Currency */}
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                {/* Currency Dropdown */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Currency *
                                  </label>
                                  <select
                                    value={service.currency || defaultCurrency}
                                    onChange={(e) => {
                                      const updatedServices = profileData.services.map(s =>
                                        s.id === service.id ? { ...s, currency: e.target.value } : s
                                      );
                                      setProfileData({ ...profileData, services: updatedServices });
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
                                  >
                                    {CURRENCIES.map(curr => (
                                      <option key={curr.code} value={curr.code}>
                                        {curr.symbol} {curr.code} - {curr.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Pricing Input */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pricing *
                                  </label>
                                  <input
                                    type="text"
                                    value={service.pricing}
                                    onChange={(e) => {
                                      // Only allow numbers, decimals, dashes for ranges
                                      const value = e.target.value;
                                      const allowedPattern = /^[0-9.\-\s]*$/;
                                      if (allowedPattern.test(value) || value === '') {
                                        const updatedServices = profileData.services.map(s =>
                                          s.id === service.id ? { ...s, pricing: value } : s
                                        );
                                        setProfileData({ ...profileData, services: updatedServices });
                                      }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                                    placeholder="e.g., 100, 50-100"
                                  />
                                </div>

                                {/* Pricing Unit Dropdown */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Per
                                  </label>
                                  <select
                                    value={service.pricingUnit || ''}
                                    onChange={(e) => {
                                      const updatedServices = profileData.services.map(s =>
                                        s.id === service.id ? { ...s, pricingUnit: e.target.value } : s
                                      );
                                      setProfileData({ ...profileData, services: updatedServices });
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
                                  >
                                    <option value="">Fixed Price</option>
                                    <option value="/hour">Per Hour</option>
                                    <option value="/day">Per Day</option>
                                    <option value="/week">Per Week</option>
                                    <option value="/month">Per Month</option>
                                    <option value="/project">Per Project</option>
                                    <option value="/session">Per Session</option>
                                  </select>
                                </div>
                              </div>

                              {/* Show Publicly Toggle */}
                              <div className="flex items-end">
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={service.showPublicly}
                                      onChange={(e) => {
                                        const updatedServices = profileData.services.map(s =>
                                          s.id === service.id ? { ...s, showPublicly: e.target.checked } : s
                                        );
                                        setProfileData({ ...profileData, services: updatedServices });
                                      }}
                                      className="sr-only peer"
                                    />
                                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                  </label>
                                  <span className="text-sm text-gray-700">Show on profile</span>
                                </div>
                              </div>
                            </div>

                            {/* Service Description */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                                <span className="text-xs text-gray-500 ml-2">
                                  ({service.description.length}/250 characters)
                                </span>
                              </label>
                              <textarea
                                value={service.description}
                                onChange={(e) => {
                                  if (e.target.value.length <= 250) {
                                    const updatedServices = profileData.services.map(s =>
                                      s.id === service.id ? { ...s, description: e.target.value } : s
                                    );
                                    setProfileData({ ...profileData, services: updatedServices });
                                  }
                                }}
                                maxLength={250}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                                placeholder="Describe your service..."
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                  </div>
                </div>

                {/* Continue Button - Fixed Bottom */}
                <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 rounded-b-lg">
                  <div className="flex justify-center sm:justify-end">
                    <button
                      onClick={() => handleContinue('social')}
                      className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center justify-center gap-2 shadow-lg"
                      style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                    >
                      Continue
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Social & Digital Presence Section */}
            {activeSection === 'social' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 sm:p-6 rounded-t-lg">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-white/10 p-2 sm:p-3 rounded-lg">
                      <Share className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white">Social & Digital Presence</h2>
                      <p className="text-white/90 text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">{sections.find(s => s.id === 'social')?.description}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-6">
                  {/* Social Media Accounts */}
                  <div>
                    <div className="mb-3 sm:mb-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Social Media Accounts</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* LinkedIn */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
                        <div className="relative flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500 overflow-hidden">
                          <LinkedIn className="absolute left-3 top-2.5 w-5 h-5 text-blue-700 pointer-events-none flex-shrink-0" />
                          <span className="pl-10 pr-1 py-2 text-gray-500 select-none whitespace-nowrap text-xs sm:text-sm flex-shrink-0">
                            <span className="hidden sm:inline">https://linkedin.com/in/</span>
                            <span className="inline sm:hidden">linkedin.com/in/</span>
                          </span>
                          <input
                            type="text"
                            value={profileData.linkedinUrl.replace('https://linkedin.com/in/', '')}
                            onChange={(e) => {
                              const handle = e.target.value;
                              const fullUrl = handle ? `https://linkedin.com/in/${handle}` : '';
                              setProfileData({
                                ...profileData,
                                linkedinUrl: fullUrl,
                                showLinkedin: handle.trim().length > 0
                              });
                            }}
                            className="flex-1 min-w-0 px-2 py-2 border-0 outline-none rounded-r-lg text-sm"
                            placeholder="yourhandle"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <label className="flex items-center cursor-pointer">
                            <input
                            type="checkbox"
                            checked={profileData.showLinkedin}
                            onChange={(e) => handleToggleAutoSave('showLinkedin', e.target.checked)}
                            className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                          <span className="text-sm text-gray-700">Show LinkedIn profile</span>
                        </div>
                      </div>

                      {/* Instagram */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                        <div className="relative flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500 overflow-hidden">
                          <Instagram className="absolute left-3 top-2.5 w-5 h-5 text-pink-600 pointer-events-none flex-shrink-0" />
                          <span className="pl-10 pr-1 py-2 text-gray-500 select-none whitespace-nowrap text-xs sm:text-sm flex-shrink-0">
                            <span className="hidden sm:inline">https://instagram.com/</span>
                            <span className="inline sm:hidden">instagram.com/</span>
                          </span>
                          <input
                            type="text"
                            value={profileData.instagramUrl.replace('https://instagram.com/', '')}
                            onChange={(e) => {
                              const handle = e.target.value;
                              const fullUrl = handle ? `https://instagram.com/${handle}` : '';
                              setProfileData({
                                ...profileData,
                                instagramUrl: fullUrl,
                                showInstagram: handle.trim().length > 0
                              });
                            }}
                            className="flex-1 min-w-0 px-2 py-2 border-0 outline-none rounded-r-lg text-sm"
                            placeholder="yourhandle"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <label className="flex items-center cursor-pointer">
                            <input
                            type="checkbox"
                            checked={profileData.showInstagram}
                            onChange={(e) => handleToggleAutoSave('showInstagram', e.target.checked)}
                            className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                          <span className="text-sm text-gray-700">Show Instagram profile</span>
                        </div>
                      </div>

                      {/* Facebook */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                        <div className="relative flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500 overflow-hidden">
                          <Facebook className="absolute left-3 top-2.5 w-5 h-5 text-blue-600 pointer-events-none flex-shrink-0" />
                          <span className="pl-10 pr-1 py-2 text-gray-500 select-none whitespace-nowrap text-xs sm:text-sm flex-shrink-0">
                            <span className="hidden sm:inline">https://facebook.com/</span>
                            <span className="inline sm:hidden">facebook.com/</span>
                          </span>
                          <input
                            type="text"
                            value={profileData.facebookUrl.replace('https://facebook.com/', '')}
                            onChange={(e) => {
                              const handle = e.target.value;
                              const fullUrl = handle ? `https://facebook.com/${handle}` : '';
                              setProfileData({
                                ...profileData,
                                facebookUrl: fullUrl,
                                showFacebook: handle.trim().length > 0
                              });
                            }}
                            className="flex-1 min-w-0 px-2 py-2 border-0 outline-none rounded-r-lg text-sm"
                            placeholder="yourprofile"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <label className="flex items-center cursor-pointer">
                            <input
                            type="checkbox"
                            checked={profileData.showFacebook}
                            onChange={(e) => handleToggleAutoSave('showFacebook', e.target.checked)}
                            className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                          <span className="text-sm text-gray-700">Show Facebook profile</span>
                        </div>
                      </div>

                      {/* Twitter/X */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">X (Twitter)</label>
                        <div className="relative flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500 overflow-hidden">
                          <Twitter className="absolute left-3 top-2.5 w-5 h-5 text-gray-900 pointer-events-none flex-shrink-0" />
                          <span className="pl-10 pr-1 py-2 text-gray-500 select-none whitespace-nowrap text-xs sm:text-sm flex-shrink-0">
                            <span className="hidden sm:inline">https://x.com/</span>
                            <span className="inline sm:hidden">x.com/</span>
                          </span>
                          <input
                            type="text"
                            value={profileData.twitterUrl.replace('https://x.com/', '')}
                            onChange={(e) => {
                              const handle = e.target.value;
                              const fullUrl = handle ? `https://x.com/${handle}` : '';
                              setProfileData({
                                ...profileData,
                                twitterUrl: fullUrl,
                                showTwitter: handle.trim().length > 0
                              });
                            }}
                            className="flex-1 min-w-0 px-2 py-2 border-0 outline-none rounded-r-lg text-sm"
                            placeholder="yourhandle"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <label className="flex items-center cursor-pointer">
                            <input
                            type="checkbox"
                            checked={profileData.showTwitter}
                            onChange={(e) => handleToggleAutoSave('showTwitter', e.target.checked)}
                            className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                          <span className="text-sm text-gray-700">Show X profile</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Custom Links & Portfolios */}
                  <div>
                    <div className="mb-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Custom Links & Portfolios</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Behance */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Behance Portfolio</label>
                        <div className="relative flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500 overflow-hidden">
                          <div className="absolute left-3 top-2.5 text-blue-500 font-bold text-sm pointer-events-none flex-shrink-0">Bē</div>
                          <span className="pl-10 pr-1 py-2 text-gray-500 select-none whitespace-nowrap text-xs sm:text-sm flex-shrink-0">
                            <span className="hidden sm:inline">https://behance.net/</span>
                            <span className="inline sm:hidden">behance.net/</span>
                          </span>
                          <input
                            type="text"
                            value={profileData.behanceUrl.replace('https://behance.net/', '')}
                            onChange={(e) => {
                              const handle = e.target.value;
                              const fullUrl = handle ? `https://behance.net/${handle}` : '';
                              setProfileData({
                                ...profileData,
                                behanceUrl: fullUrl,
                                showBehance: handle.trim().length > 0
                              });
                            }}
                            className="flex-1 min-w-0 px-2 py-2 border-0 outline-none rounded-r-lg text-sm"
                            placeholder="yourportfolio"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <label className="flex items-center cursor-pointer">
                            <input
                            type="checkbox"
                            checked={profileData.showBehance}
                            onChange={(e) => handleToggleAutoSave('showBehance', e.target.checked)}
                            className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                          <span className="text-sm text-gray-700">Show Behance portfolio</span>
                        </div>
                      </div>

                      {/* Dribbble */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dribbble</label>
                        <div className="relative flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500 overflow-hidden">
                          <svg className="absolute left-3 top-2.5 w-5 h-5 text-pink-500 pointer-events-none flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.816zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.935 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z"/>
                          </svg>
                          <span className="pl-10 pr-1 py-2 text-gray-500 select-none whitespace-nowrap text-xs sm:text-sm flex-shrink-0">
                            <span className="hidden sm:inline">https://dribbble.com/</span>
                            <span className="inline sm:hidden">dribbble.com/</span>
                          </span>
                          <input
                            type="text"
                            value={profileData.dribbbleUrl.replace('https://dribbble.com/', '')}
                            onChange={(e) => {
                              const handle = e.target.value;
                              const fullUrl = handle ? `https://dribbble.com/${handle}` : '';
                              setProfileData({
                                ...profileData,
                                dribbbleUrl: fullUrl,
                                showDribbble: handle.trim().length > 0
                              });
                            }}
                            className="flex-1 min-w-0 px-2 py-2 border-0 outline-none rounded-r-lg text-sm"
                            placeholder="yourprofile"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <label className="flex items-center cursor-pointer">
                            <input
                            type="checkbox"
                            checked={profileData.showDribbble}
                            onChange={(e) => handleToggleAutoSave('showDribbble', e.target.checked)}
                            className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                          <span className="text-sm text-gray-700">Show Dribbble profile</span>
                        </div>
                      </div>

                      {/* GitHub */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
                        <div className="relative flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500 overflow-hidden">
                          <GitHub className="absolute left-3 top-2.5 w-5 h-5 text-gray-900 pointer-events-none flex-shrink-0" />
                          <span className="pl-10 pr-1 py-2 text-gray-500 select-none whitespace-nowrap text-xs sm:text-sm flex-shrink-0">
                            <span className="hidden sm:inline">https://github.com/</span>
                            <span className="inline sm:hidden">github.com/</span>
                          </span>
                          <input
                            type="text"
                            value={profileData.githubUrl.replace('https://github.com/', '')}
                            onChange={(e) => {
                              const handle = e.target.value;
                              const fullUrl = handle ? `https://github.com/${handle}` : '';
                              setProfileData({
                                ...profileData,
                                githubUrl: fullUrl,
                                showGithub: handle.trim().length > 0
                              });
                            }}
                            className="flex-1 min-w-0 px-2 py-2 border-0 outline-none rounded-r-lg text-sm"
                            placeholder="yourhandle"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <label className="flex items-center cursor-pointer">
                            <input
                            type="checkbox"
                            checked={profileData.showGithub}
                            onChange={(e) => handleToggleAutoSave('showGithub', e.target.checked)}
                            className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                          <span className="text-sm text-gray-700">Show GitHub profile</span>
                        </div>
                      </div>

                      {/* YouTube */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">YouTube Channel</label>
                        <div className="relative flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500 overflow-hidden">
                          <YouTube className="absolute left-3 top-2.5 w-5 h-5 text-red-600 pointer-events-none flex-shrink-0" />
                          <span className="pl-10 pr-1 py-2 text-gray-500 select-none whitespace-nowrap text-xs sm:text-sm flex-shrink-0">
                            <span className="hidden sm:inline">https://youtube.com/@</span>
                            <span className="inline sm:hidden">youtube.com/@</span>
                          </span>
                          <input
                            type="text"
                            value={profileData.youtubeUrl.replace('https://youtube.com/@', '')}
                            onChange={(e) => {
                              const handle = e.target.value;
                              const fullUrl = handle ? `https://youtube.com/@${handle}` : '';
                              setProfileData({
                                ...profileData,
                                youtubeUrl: fullUrl,
                                showYoutube: handle.trim().length > 0
                              });
                            }}
                            className="flex-1 min-w-0 px-2 py-2 border-0 outline-none rounded-r-lg text-sm"
                            placeholder="yourchannel"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <label className="flex items-center cursor-pointer">
                            <input
                            type="checkbox"
                            checked={profileData.showYoutube}
                            onChange={(e) => handleToggleAutoSave('showYoutube', e.target.checked)}
                            className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                          <span className="text-sm text-gray-700">Show YouTube channel</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Certifications & Attachments */}
                  <div className="mt-8">
                    <div className="mb-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Certifications & Attachments</h3>
                      <p className="text-sm text-gray-600 mt-1">Upload certificates, awards, or other documents to validate your skills.</p>
                    </div>

                    {/* File Upload Area */}
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-red-400 transition-colors cursor-pointer"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-red-500', 'bg-red-50');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-red-500', 'bg-red-50');
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-red-500', 'bg-red-50');
                        const files = Array.from(e.dataTransfer.files);
                        const validFiles = files.filter(file => {
                          const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
                          const maxSize = 5 * 1024 * 1024; // 5MB
                          return validTypes.includes(file.type) && file.size <= maxSize;
                        });

                        if (validFiles.length > 0) {
                          for (const file of validFiles) {
                            await handleCertificationUpload(file);
                          }
                        } else {
                          toast.error('Please upload valid files (PDF, PNG, JPG) under 5MB');
                        }
                      }}
                      onClick={() => document.getElementById('certification-upload')?.click()}
                    >
                      <input
                        id="certification-upload"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          for (const file of files) {
                            await handleCertificationUpload(file);
                          }
                          e.target.value = ''; // Reset input
                        }}
                      />
                      <div className="flex flex-col items-center">
                        <Upload className="h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Drag & drop files here or click to browse
                        </p>
                        <p className="text-xs text-gray-500">
                          Supports: PDF, PNG, JPG (Max 5MB)
                        </p>
                      </div>
                    </div>

                    {/* Uploaded Certifications List */}
                    {profileData.certifications && profileData.certifications.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {profileData.certifications.map((cert) => (
                          <div
                            key={cert.id}
                            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-start gap-3 mb-3">
                              {/* File Icon */}
                              <div className="flex-shrink-0 mt-1">
                                {cert.type === 'application/pdf' ? (
                                  <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                                    <path d="M14 2v6h6"/>
                                    <path d="M12 18v-6"/>
                                    <path d="M9 15h6"/>
                                  </svg>
                                ) : (
                                  <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                                    <path d="M14 2v6h6"/>
                                    <path d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                                    <path d="M21 15l-5-5-6 6-3-3-3 3"/>
                                  </svg>
                                )}
                              </div>

                              {/* File Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate mb-1">
                                  {cert.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(cert.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>

                              {/* Delete Button */}
                              <button
                                onClick={() => {
                                  setProfileData({
                                    ...profileData,
                                    certifications: profileData.certifications.filter(c => c.id !== cert.id)
                                  });
                                  toast.success('Certification removed');
                                }}
                                className="flex-shrink-0 text-red-600 hover:text-red-800 transition-colors"
                              >
                                <Trash className="h-5 w-5" />
                              </button>
                            </div>

                            {/* Title Input - REQUIRED */}
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={cert.title}
                                onChange={(e) => handleCertificationTitleChange(cert.id, e.target.value)}
                                placeholder="e.g., AWS Certified Solutions Architect"
                                className={`w-full px-3 py-2 border ${
                                  !cert.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                } rounded-md focus:outline-none focus:ring-2 text-sm`}
                              />
                              {!cert.title && (
                                <p className="text-xs text-red-600 mt-1">Title is required</p>
                              )}
                            </div>

                            {/* Show Publicly Toggle */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">Show publicly</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={cert.showPublicly}
                                  onChange={() => handleCertificationVisibilityToggle(cert.id)}
                                  className="sr-only peer"
                                />
                                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Continue Button - Fixed Bottom */}
                <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 rounded-b-lg">
                  <div className="flex justify-center sm:justify-end">
                    <button
                      onClick={() => handleContinue('media-photo')}
                      className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center justify-center gap-2 shadow-lg"
                      style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                    >
                      Continue
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Photo & Banner Section */}
            {activeSection === 'media-photo' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-6 space-y-8">
                  {/* Profile Photo */}
                  <div>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Profile Photo</h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8">
                          <div className="text-center">
                            <div className="relative inline-block">
                              <div className="w-32 h-32 bg-gray-200 rounded-full overflow-hidden">
                                {profileData.profilePhoto ? (
                                  <img
                                    src={profileData.profilePhoto}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <img
                                    src={`https://ui-avatars.com/api/?name=${profileData.firstName || 'J'}+${profileData.lastName || 'D'}&size=128&background=667eea&color=fff`}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                            </div>
                            <input
                              type="file"
                              id="profile-photo-upload"
                              accept="image/png,image/jpeg,image/jpg,image/gif"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    setIsUploadingProfilePhoto(true);
                                    setProfilePhotoUploadProgress(0);

                                    // Compress with upscaling for small images (never throws errors)
                                    const base64String = await compressImageToBase64WithUpscale(file, (progress) => {
                                      setProfilePhotoUploadProgress(progress);
                                    });

                                    if (base64String) {
                                      setProfileData(prev => ({
                                        ...prev,
                                        profilePhoto: base64String
                                      }));
                                      toast.success('Profile photo uploaded successfully!');
                                    } else {
                                      console.warn('Profile photo processing returned empty, but continuing');
                                    }
                                  } catch (error) {
                                    // Graceful error handling - never show error to user
                                    console.error('Profile photo upload error:', error);
                                    // Silently continue - the function should have handled this
                                  } finally {
                                    setIsUploadingProfilePhoto(false);
                                    setProfilePhotoUploadProgress(0);
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById('profile-photo-upload') as HTMLInputElement;
                                if (input) {
                                  input.click();
                                }
                              }}
                              disabled={isUploadingProfilePhoto}
                              className="mt-4 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                            >
                              <Upload className="w-4 h-4" />
                              {isUploadingProfilePhoto ? `Uploading... ${profilePhotoUploadProgress}%` : 'Upload New Photo'}
                            </button>
                            {isUploadingProfilePhoto && (
                              <div className="mt-2 w-full">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${profilePhotoUploadProgress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF up to 10MB</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 text-sm mb-3">Photo Guidelines</h4>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>Use a high-quality, professional headshot</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>Face should be clearly visible and well-lit</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>Square aspect ratio works best</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>Minimum resolution: 400x400 pixels</span>
                            </li>
                          </ul>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <label className="flex items-center cursor-pointer">
                            <input
                            type="checkbox"
                            checked={profileData.showProfilePhoto}
                            onChange={(e) => handleToggleAutoSave('showProfilePhoto', e.target.checked)}
                            className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                          <span className="text-sm text-gray-700">Show profile photo publicly</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Banner Image */}
                  <div>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Banner Image</h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        {/* Banner Preview */}
                        <div className="bg-gray-200 rounded-lg overflow-hidden border border-gray-200" style={{ aspectRatio: '16/9' }}>
                          {profileData.backgroundImage ? (
                            <img src={profileData.backgroundImage} alt="Banner" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              <span className="text-sm">No banner image</span>
                            </div>
                          )}
                        </div>

                        {/* Always-visible Upload Button */}
                        <input
                          type="file"
                          id="background-image-upload"
                          accept="image/png,image/jpeg,image/jpg"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                setIsUploadingBannerImage(true);
                                setBannerImageUploadProgress(0);

                                // Compress with upscaling for small images (never throws errors)
                                const base64String = await compressImageToBase64WithUpscale(file, (progress) => {
                                  setBannerImageUploadProgress(progress);
                                });

                                if (base64String) {
                                  setProfileData(prev => ({
                                    ...prev,
                                    backgroundImage: base64String
                                  }));
                                  toast.success('Banner image uploaded successfully!');
                                } else {
                                  console.warn('Banner image processing returned empty, but continuing');
                                }
                              } catch (error) {
                                // Graceful error handling - never show error to user
                                console.error('Banner image upload error:', error);
                                // Silently continue - the function should have handled this
                              } finally {
                                setIsUploadingBannerImage(false);
                                setBannerImageUploadProgress(0);
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('background-image-upload') as HTMLInputElement;
                            if (input) {
                              input.click();
                            }
                          }}
                          disabled={isUploadingBannerImage}
                          className="mt-4 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                        >
                          <Upload className="w-4 h-4" />
                          {isUploadingBannerImage ? `Uploading... ${bannerImageUploadProgress}%` : (profileData.backgroundImage ? 'Change Banner' : 'Upload Banner')}
                        </button>
                        {isUploadingBannerImage && (
                          <div className="mt-2 w-full">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${bannerImageUploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2 text-center">JPG or PNG up to 15MB</p>
                      </div>

                      <div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 text-sm mb-3">Banner Guidelines</h4>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>Use professional relevant imagery</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>Avoid busy patterns that distract from text</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>Recommended size: 1920x1080 pixels</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>Ensure good contrast with text overlay</span>
                            </li>
                          </ul>
                        </div>

                        {/* Banner Visibility Toggle */}
                        <div className="flex items-center gap-2 mt-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={profileData.showBackgroundImage}
                              onChange={(e) => handleToggleAutoSave('showBackgroundImage', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                          <span className="text-sm text-gray-700">Show banner publicly</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button - Fixed Bottom */}
                <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 rounded-b-lg">
                  <div className="flex items-center justify-center sm:justify-end">
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Submit Profile
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input for photo uploads */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* Toast Notification */}
      {toastState && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50 ${
          toastState.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toastState.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <X2 className="w-5 h-5" />
          )}
          <span className="font-medium">{toastState.message}</span>
          <button
            onClick={() => setToastState(null)}
            className="ml-2 hover:opacity-80"
          >
            <X2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProfileBuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p>Loading profile builder...</p>
        </div>
      </div>
    }>
      <ProfileBuilderContent />
    </Suspense>
  );
}
