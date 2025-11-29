'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import EmailIcon from '@mui/icons-material/Email';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Icon aliases
const Mail = EmailIcon;
const ArrowLeft = ArrowBackIcon;
const CheckCircle = CheckCircleIcon;

export default function VerifyRegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState(''); // Email or mobile
  const [registrationType, setRegistrationType] = useState<'email' | 'mobile'>('email');
  const [devOtp, setDevOtp] = useState('');
  const [registrationData, setRegistrationData] = useState<any>(null);

  useEffect(() => {
    // Get registration data from localStorage
    const data = localStorage.getItem('registrationData');
    if (!data) {
      router.push('/register');
      return;
    }

    const parsedData = JSON.parse(data);
    setRegistrationData(parsedData);
    setRegistrationType(parsedData.registrationType || 'email');
    setIdentifier(parsedData.email || parsedData.mobile);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const requestBody = registrationType === 'email'
        ? { email: identifier, otp }
        : { mobile: identifier, otp };

      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Account created successfully!', 'success');
        // Clear registration data from localStorage
        localStorage.removeItem('registrationData');
        // Mark email as verified
        localStorage.setItem('emailVerified', 'true');
        // Redirect to product selection for new users (same as mobile verification)
        router.push('/product-selection');
      } else {
        showToast(data.error || 'Invalid verification code', 'error');
      }
    } catch (error) {
      console.error('Verification error:', error);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const requestBody = registrationType === 'email'
        ? {
            email: identifier,
            firstName: registrationData?.firstName,
            lastName: registrationData?.lastName
          }
        : {
            mobile: identifier,
            firstName: registrationData?.firstName,
            lastName: registrationData?.lastName
          };

      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        const medium = registrationType === 'email' ? 'email' : 'mobile number';
        showToast(`Verification code resent to your ${medium}!`, 'success');
        if (data.devOtp) {
          setDevOtp(data.devOtp);
        }
      } else {
        showToast(data.error || 'Failed to resend code', 'error');
      }
    } catch (error) {
      console.error('Resend error:', error);
      showToast('Failed to resend code', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center space-x-3">
            <img src="/logo.svg" alt="Linkist" className="h-10" />
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Verify your {registrationType === 'email' ? 'email' : 'mobile number'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We sent a verification code to{' '}
          <span className="font-medium text-gray-900">{identifier}</span>
        </p>
        <p className="mt-1 text-center text-xs text-gray-500">
          Complete your account registration
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Verification code
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
              </div>
            </div>

            {/* Development OTP Display */}
            {devOtp && process.env.NODE_ENV === 'development' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-sm text-yellow-800">
                  <strong>Development Mode:</strong> Your verification code is{' '}
                  <span className="font-mono text-lg font-bold">{devOtp}</span>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: loading || otp.length !== 6 ? '#9CA3AF' : '#DC2626',
                  color: '#FFFFFF'
                }}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify & Create Account
                  </div>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the code?{' '}
                <button
                  onClick={handleResendCode}
                  className="font-medium text-red-600 hover:text-red-500"
                >
                  Resend code
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link href="/register" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to registration
        </Link>
      </div>
    </div>
  );
}
