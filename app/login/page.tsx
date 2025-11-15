'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import Logo from '@/components/Logo';
import Footer from '@/components/Footer';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CircularProgress from '@mui/material/CircularProgress';

// Icon aliases
const ArrowLeft = ArrowBackIcon;

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    emailOrPhone: ''
  });
  const [loading, setLoading] = useState(false);
  const [returnUrl, setReturnUrl] = useState('/account');
  const [inputType, setInputType] = useState<'email' | 'phone'>('email');
  const [countryCode, setCountryCode] = useState('+971'); // Default to UAE
  const [phoneNumber, setPhoneNumber] = useState('');

  // Debounce timer for input type detection
  let detectionTimerRef: NodeJS.Timeout | null = null;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrlParam = urlParams.get('returnUrl');
    if (returnUrlParam) {
      setReturnUrl(returnUrlParam);
    }

    // Detect user's country and set appropriate country code
    detectUserCountry();
  }, []);

  const detectUserCountry = async () => {
    try {
      // Try to get user's location from IP
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();

      const countryCodeMap: { [key: string]: string } = {
        'AE': '+971', // UAE
        'IN': '+91',  // India
        'US': '+1',   // USA
        'GB': '+44',  // UK
        'SA': '+966', // Saudi Arabia
        'QA': '+974', // Qatar
        'OM': '+968', // Oman
        'KW': '+965', // Kuwait
        'BH': '+973', // Bahrain
      };

      if (data.country_code && countryCodeMap[data.country_code]) {
        setCountryCode(countryCodeMap[data.country_code]);
      }
    } catch (error) {
      console.log('Could not detect country, using default UAE (+971)');
    }
  };

  const detectInputType = (value: string) => {
    // Check if input contains @ symbol (email) or is numeric (phone)
    if (value.includes('@')) {
      setInputType('email');
    } else if (/^\d/.test(value)) {
      setInputType('phone');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For phone input, concatenate country code with phone number
      const identifier = inputType === 'phone'
        ? `${countryCode}${formData.emailOrPhone}`
        : formData.emailOrPhone;

      console.log('🔐 Login attempt with:', identifier);

      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrPhone: identifier }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Verification code sent!', 'success');
        // Clear old userProfile to prevent confusion with current login
        localStorage.removeItem('userProfile');
        // Store email/phone and return URL for verification
        localStorage.setItem('loginIdentifier', identifier);
        localStorage.setItem('returnUrl', returnUrl);
        router.push('/verify-login');
      } else {
        showToast(data.error || 'Failed to send verification code', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-grow flex flex-col pt-20 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/register" className="font-medium text-red-600 hover:text-red-500">
              create a new account
            </Link>
          </p>
        </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-700">
                Email or Phone Number
              </label>
              <div className="mt-1">
                <div className="flex">
                  {inputType === 'phone' && (
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="appearance-none px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm bg-gray-50"
                      style={{ width: '100px' }}
                    >
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+966">🇸🇦 +966</option>
                      <option value="+974">🇶🇦 +974</option>
                      <option value="+968">🇴🇲 +968</option>
                      <option value="+965">🇰🇼 +965</option>
                      <option value="+973">🇧🇭 +973</option>
                    </select>
                  )}
                  <input
                    key="emailOrPhone-stable"
                    id="emailOrPhone"
                    name="emailOrPhone"
                    type={inputType === 'phone' ? 'tel' : 'text'}
                    autoComplete={inputType === 'phone' ? 'tel' : 'email tel'}
                    required
                    value={formData.emailOrPhone}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, emailOrPhone: value });

                      // Debounced input type detection
                      if (detectionTimerRef) {
                        clearTimeout(detectionTimerRef);
                      }
                      detectionTimerRef = setTimeout(() => {
                        detectInputType(value);
                      }, 300);
                    }}
                    className={`appearance-none block w-full px-3 py-2 border border-gray-300 ${
                      inputType === 'phone' ? 'border-l-0 rounded-r-md' : 'rounded-md'
                    } placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm`}
                    placeholder={inputType === 'phone' ? 'Enter phone number' : 'Enter your email or phone number'}
                  />
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                We'll send a verification code to your registered {inputType === 'email' ? 'email' : 'phone'}
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                }`}
                style={{
                  backgroundColor: loading ? '#9CA3AF' : '#DC2626',
                  color: '#FFFFFF'
                }}
              >
                {loading ? (
                  <CircularProgress size={20} style={{ color: 'white' }} />
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-6 text-center mb-8">
        <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to home
        </Link>
      </div>
      </div>
      <Footer />
    </div>
  );
}
