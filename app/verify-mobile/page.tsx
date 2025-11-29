'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/Logo';
import Toast from '@/components/Toast';
import Footer from '@/components/Footer';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';

// Icon aliases
const Check = CheckIcon;
const X = CloseIcon;
const RefreshCw = RefreshIcon;

function VerifyMobileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null); // Store dev OTP for display
  const [emailVerifyLoading, setEmailVerifyLoading] = useState(false); // Loading state for email verification
  const otpRequestInProgress = useRef(false);

  useEffect(() => {
    const phoneParam = searchParams.get('phone');
    if (phoneParam && !otpRequestInProgress.current) {
      setPhone(phoneParam);

      // Check if OTP was already sent for this phone number (prevent resend on refresh)
      const otpSentKey = `otp_sent_${phoneParam}`;
      const alreadySent = sessionStorage.getItem(otpSentKey);
      const lastSentTime = alreadySent ? parseInt(alreadySent) : 0;
      const timeSinceLastSent = Date.now() - lastSentTime;

      // Only send if OTP hasn't been sent in the last 60 seconds
      if (!alreadySent || timeSinceLastSent > 60000) {
        // Mark as in progress to prevent duplicate calls
        otpRequestInProgress.current = true;

        // Mark as sent in sessionStorage BEFORE sending to prevent duplicate triggers
        sessionStorage.setItem(otpSentKey, Date.now().toString());
        setOtpSent(true);

        // Automatically trigger OTP sending when phone is provided
        setTimeout(() => {
          handleSendOtpWithPhone(phoneParam);
        }, 500);
      } else {
        // OTP already sent recently, just show verify step
        setStep('verify');
        setOtpSent(true);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/;
    return phoneRegex.test(phone);
  };

  const handleSendOtpWithPhone = async (phoneNumber: string) => {
    if (!validatePhone(phoneNumber)) {
      setError('Please enter a valid phone number');
      otpRequestInProgress.current = false;
      return;
    }

    setSendingOtp(true);
    setError('');

    try {
      // Get user profile data from localStorage to send registration data
      const userProfileStr = localStorage.getItem('userProfile');
      let firstName = '';
      let lastName = '';
      let email = '';

      if (userProfileStr) {
        try {
          const userProfile = JSON.parse(userProfileStr);
          firstName = userProfile.firstName || '';
          lastName = userProfile.lastName || '';
          email = userProfile.email || '';
          console.log('📋 [verify-mobile] Sending registration data:', { firstName, lastName, email, mobile: phoneNumber });
        } catch (parseError) {
          console.error('Failed to parse userProfile from localStorage:', parseError);
        }
      } else {
        console.warn('⚠️ [verify-mobile] No userProfile found in localStorage - this may be a login attempt');
      }

      const response = await fetch('/api/send-mobile-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: phoneNumber,
          firstName,
          lastName,
          email
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setStep('verify');
      setResendTimer(60);

      // Show success toast
      setToast({ message: 'Verification code sent successfully!', type: 'success' });

      if (data.devOtp) {
        console.log('🔑 Development OTP:', data.devOtp);
        setDevOtp(data.devOtp); // Store OTP for display
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send verification code';
      setError(errorMessage);
      setToast({ message: errorMessage, type: 'error' });
      // Reset progress flag on error to allow retry
      otpRequestInProgress.current = false;
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSendOtp = async () => {
    // Clear sessionStorage for this phone number to allow resend
    const otpSentKey = `otp_sent_${phone}`;
    sessionStorage.removeItem(otpSentKey);

    // Reset the progress flag to allow resend
    otpRequestInProgress.current = false;

    await handleSendOtpWithPhone(phone);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    if (index === 5 && value && newOtp.every(digit => digit !== '')) {
      setTimeout(() => handleVerifyOtp(newOtp.join('')), 100);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && index > 0 && !otp[index]) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const handleVerifyOtp = async (otpValue?: string) => {
    const otpToVerify = otpValue || otp.join('');

    if (otpToVerify.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verify-mobile-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile: phone, otp: otpToVerify }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid verification code');
      }

      setSuccess(true);
      localStorage.setItem('verifiedPhone', phone);
      localStorage.setItem('mobileVerified', 'true');

      // Clear sessionStorage after successful verification
      const otpSentKey = `otp_sent_${phone}`;
      sessionStorage.removeItem(otpSentKey);

      setTimeout(() => {
        router.push('/product-selection');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setLoading(false);
      setOtp(['', '', '', '', '', '']);
      const firstInput = document.getElementById('otp-0');
      firstInput?.focus();
    }
  };

  const handleResendOtp = () => {
    setOtp(['', '', '', '', '', '']);
    setError('');
    handleSendOtp();
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Number Verified!</h2>
          <p className="text-gray-600 text-lg">
            Your mobile number has been successfully verified.
          </p>
          <div className="mt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-20 pb-0 px-4">
        <div className="bg-white rounded-none sm:rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {step === 'phone' ? 'Verify Your Number' : 'Enter Verification Code'}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {step === 'phone'
                ? 'Enter your mobile number to receive a verification code'
                : `We sent a 6-digit code to ${phone}`}
            </p>
          </div>

          {/* Phone Input Step */}
          {step === 'phone' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-red-600 focus:ring-4 focus:ring-red-100 outline-none transition-all bg-gray-50"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendOtp()}
                />
                <p className="text-sm text-gray-500 mt-3">
                  Include country code (e.g., +1 for US, +91 for India)
                </p>
              </div>

              {error && (
                <div className="flex items-center text-red-600 text-sm bg-red-50 py-3 px-4 rounded-lg">
                  <X className="w-4 h-4 mr-2" />
                  {error}
                </div>
              )}

              <button
                onClick={handleSendOtp}
                disabled={sendingOtp || !phone}
                className="w-full text-lg font-semibold px-6 py-4 rounded-xl transition-colors disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                style={{
                  backgroundColor: sendingOtp || !phone ? '#D1D5DB' : '#DC2626',
                  color: '#FFFFFF'
                }}
              >
                {sendingOtp ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Sending Code...
                  </div>
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </div>
          )}

          {/* OTP Verification Step */}
          {step === 'verify' && (
            <div className="space-y-6">
              <div>
                <div className="flex justify-center gap-2 mb-6">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-none transition-all bg-gray-50"
                      autoFocus={index === 0}
                      disabled={loading}
                      autoComplete="off"
                    />
                  ))}
                </div>

                {/* Display Hardcoded OTP for Testing */}
                {devOtp && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <div className="bg-yellow-400 text-yellow-900 rounded-full p-1 mr-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm font-bold text-yellow-900 uppercase tracking-wide">Testing Mode</span>
                    </div>
                    <p className="text-sm text-gray-700 text-center mb-2">Your verification code (not sent via SMS):</p>
                    <div className="flex justify-center">
                      <div className="text-3xl font-mono font-bold text-gray-900 tracking-widest bg-white px-6 py-3 rounded-lg border-2 border-yellow-300">
                        {devOtp}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 text-center mt-2">Enter this code above to verify</p>
                  </div>
                )}

                {error && (
                  <div className="flex items-center justify-center text-red-600 text-sm bg-red-50 py-3 px-4 rounded-lg">
                    <X className="w-4 h-4 mr-2" />
                    {error}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleVerifyOtp()}
                disabled={loading || otp.join('').length !== 6}
                className="w-full text-sm sm:text-base font-semibold px-6 py-3 rounded-xl transition-colors disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                style={{
                  backgroundColor: loading || otp.join('').length !== 6 ? '#D1D5DB' : '#DC2626',
                  color: '#FFFFFF'
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify Number'
                )}
              </button>

              {/* Resend Code */}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Didn't receive the code?
                    </p>
                    <p className="text-sm text-gray-500 font-medium">
                      Resend code in {resendTimer}s
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-3">
                      Didn't receive the code?
                    </p>
                    <button
                      onClick={handleResendOtp}
                      disabled={sendingOtp}
                      className="inline-flex items-center space-x-2 text-red-600 hover:text-red-700 font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Resend Code</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Change Number */}
              <button
                onClick={() => {
                  setStep('phone');
                  setOtp(['', '', '', '', '', '']);
                  setError('');
                }}
                className="w-full text-sm sm:text-base font-semibold px-6 py-3 rounded-xl transition-colors border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Change Phone Number
              </button>
            </div>
          )}

          {/* Verify Email Instead */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={async () => {
                // Get user email from profile
                const userProfileStr = localStorage.getItem('userProfile');
                if (userProfileStr) {
                  try {
                    const profile = JSON.parse(userProfileStr);

                    // Check if this is a registration flow (has firstName/lastName)
                    if (profile.firstName && profile.lastName && profile.email) {
                      // Registration flow - send OTP with registration data
                      setEmailVerifyLoading(true);
                      try {
                        const response = await fetch('/api/send-otp', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            email: profile.email,
                            firstName: profile.firstName,
                            lastName: profile.lastName
                          }),
                        });

                        const data = await response.json();

                        if (response.ok) {
                          // Store registration data for verify-register page
                          localStorage.setItem('registrationData', JSON.stringify({
                            firstName: profile.firstName,
                            lastName: profile.lastName,
                            email: profile.email,
                            mobile: phone || '',
                            password: profile.password || '',
                            registrationType: 'email'
                          }));

                          // Show dev OTP if available
                          if (data.devOtp) {
                            alert(`Your verification code is: ${data.devOtp}`);
                          }

                          setToast({ message: 'Verification code sent to your email!', type: 'success' });

                          // Navigate to registration verification page
                          router.push('/verify-register');
                        } else {
                          // Show error toast
                          setToast({ message: data.error || 'Failed to send verification code', type: 'error' });
                        }
                      } catch (error) {
                        console.error('Error sending email OTP:', error);
                        setToast({ message: 'Failed to send verification code', type: 'error' });
                      } finally {
                        setEmailVerifyLoading(false);
                      }
                    } else if (profile.email) {
                      // Login flow - no firstName/lastName, just email
                      router.push(`/verify-login?email=${encodeURIComponent(profile.email)}`);
                    } else {
                      router.push('/verify-login');
                    }
                  } catch (error) {
                    router.push('/verify-login');
                  }
                } else {
                  router.push('/verify-login');
                }
              }}
              disabled={emailVerifyLoading}
              className="w-full text-sm sm:text-base font-semibold px-6 py-3 rounded-xl transition-colors shadow-md hover:shadow-lg cursor-pointer disabled:cursor-not-allowed"
              style={{ backgroundColor: emailVerifyLoading ? '#9CA3AF' : '#DC2626', color: '#FFFFFF' }}
            >
              {emailVerifyLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Sending Code...
                </div>
              ) : (
                'Verify Email Instead'
              )}
            </button>
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-center text-xs text-gray-500">
              Standard SMS rates may apply
            </p>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Footer />
    </>
  );
}

export default function VerifyMobilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyMobileContent />
    </Suspense>
  );
}
