'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { getBaseUrl } from '@/lib/get-base-url';
import QRCode from 'qrcode';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import EmailIcon from '@mui/icons-material/Email';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

// Icon aliases
const CheckCircle = CheckCircleIcon;
const Package = Inventory2Icon;
const Truck = LocalShippingIcon;
const Mail = EmailIcon;
const ArrowRight = ArrowForwardIcon;
const Copy = ContentCopyIcon;
const QrCode2 = QrCode2Icon;
const ExternalLink = OpenInNewIcon;
const Close = CloseIcon;
const CloudDownload = CloudDownloadIcon;

export default function SuccessPage() {
  const router = useRouter();
  const [orderData, setOrderData] = useState<{ orderNumber: string; cardConfig: { fullName: string }; shipping: { fullName: string; email: string; phone: string; addressLine1: string; addressLine2?: string; city: string; stateProvince?: string; postalCode: string; country: string; isFounderMember: boolean; quantity: number }; pricing: { total: number } } | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [profileUrl, setProfileUrl] = useState<string>('');

  useEffect(() => {
    // First check for orderConfirmation from payment page
    const orderConfirmation = localStorage.getItem('orderConfirmation');
    if (orderConfirmation) {
      const confirmation = JSON.parse(orderConfirmation);
      // Convert to order format
      const orderData = {
        orderNumber: 'LFND' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        ...confirmation,
        cardConfig: confirmation.cardConfig || { fullName: confirmation.customerName },
        shipping: confirmation.shipping || {},
        pricing: confirmation.pricing || { total: confirmation.amount }
      };
      setOrderData(orderData);
      // Store the order data for page refreshes
      localStorage.setItem('lastCompletedOrder', JSON.stringify(orderData));
      // Clear the confirmation data
      localStorage.removeItem('orderConfirmation');
      localStorage.removeItem('pendingOrder');
    } else {
      // Check for last completed order (in case of page refresh)
      const lastOrder = localStorage.getItem('lastCompletedOrder');
      if (lastOrder) {
        setOrderData(JSON.parse(lastOrder));
      } else {
        // Fallback to currentOrder if coming from old flow
        const order = localStorage.getItem('currentOrder');
        if (order) {
          setOrderData(JSON.parse(order));
        } else {
          // No order found - redirect to home
          console.warn('No order data found - redirecting to home page');
          router.push('/');
        }
      }
    }
  }, []);

  // Generate QR Code and profile URL
  useEffect(() => {
    const generateQrCodeAndUrl = async () => {
      const baseUrl = getBaseUrl();
      let username = 'your-profile';

      // Try to get username from various sources
      if (orderData?.cardConfig?.fullName) {
        username = orderData.cardConfig.fullName.toLowerCase().replace(/\s+/g, '-');
      } else if (orderData?.shipping?.fullName) {
        username = orderData.shipping.fullName.toLowerCase().replace(/\s+/g, '-');
      } else if (orderData?.shipping?.email) {
        username = orderData.shipping.email.split('@')[0];
      }

      const url = `${baseUrl}/${username}`;
      setProfileUrl(url);

      try {
        const qrDataUrl = await QRCode.toDataURL(url, {
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

    if (orderData) {
      generateQrCodeAndUrl();
    }
  }, [orderData]);

  const handleCopyUrl = () => {
    const copyToClipboard = (text: string) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
          fallbackCopy(text);
        });
      } else {
        fallbackCopy(text);
      }
    };

    const fallbackCopy = (text: string) => {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          alert('Copy failed. Please copy manually: ' + text);
        }
      } catch (err) {
        console.error('Fallback copy failed:', err);
        alert('Copy failed. Please copy manually: ' + text);
      }
    };

    copyToClipboard(profileUrl);
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
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const file = new File([blob], 'qr-code.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Profile QR Code',
          text: `Scan this QR code to view my profile: ${profileUrl}`
        });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        alert('QR code sharing not supported. URL copied to clipboard!');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing QR code:', error);
        alert('Failed to share QR code');
      }
    }
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p>Loading your order...</p>
        </div>
      </div>
    );
  }

  // Check if this is a digital-only product (no physical card)
  const isDigitalOnly = orderData.isDigitalOnly || orderData.isDigitalProduct || orderData.cardConfig?.baseMaterial === 'digital';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-6">
        {/* Success Message */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center mb-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Congratulations!
          </h1>
          <p className="text-xl text-gray-700 mb-4">
            {isDigitalOnly ? 'Your digital profile is ready!' : 'Your card is on the way'}
          </p>
          <p className="text-lg text-gray-600 mb-2">
            {isDigitalOnly
              ? 'Thank you for your order. Your digital profile has been activated.'
              : 'Thank you for your order. Your NFC card is being prepared.'}
          </p>
          <p className="text-lg font-medium text-gray-700">
            Order #{orderData.orderNumber}
          </p>
        </div>

        {/* Only show Order Details and Shipping for physical products */}
        {!isDigitalOnly && (
          <div className="grid md:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-6">Order Details</h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Card Name</span>
                <span className="font-medium text-gray-900">
                  {orderData.cardConfig?.fullName || orderData.customerName || 'John Doe'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Quantity</span>
                <span className="font-medium text-gray-900">1</span>
              </div>

              <div className="pt-3 space-y-2">
                {(() => {
                  const finalTotal = orderData.pricing?.total || 103.95;
                  const voucherPercent = orderData.voucherDiscount || 0;

                  // Calculate backwards from final total
                  // finalTotal = (subtotal + tax) after discount
                  // If 20% discount: finalTotal = originalAmount * 0.8
                  // So: originalAmount = finalTotal / (1 - discount/100)
                  const totalBeforeDiscount = voucherPercent > 0
                    ? finalTotal / (1 - voucherPercent / 100)
                    : finalTotal;

                  const subtotalBeforeDiscount = totalBeforeDiscount / 1.05;
                  const taxAmount = subtotalBeforeDiscount * 0.05;
                  const voucherDiscountAmount = totalBeforeDiscount - finalTotal;

                  return (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>${subtotalBeforeDiscount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Customization</span>
                        <span className="text-green-600">Included</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Shipping ({orderData.shipping?.country === 'United Arab Emirates' ? 'UAE' : orderData.shipping?.country || 'AE'})</span>
                        <span className="text-green-600">Free</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>VAT (5%)</span>
                        <span>${taxAmount.toFixed(2)}</span>
                      </div>
                      {orderData.shipping?.isFounderMember && (
                        <div className="flex justify-between text-green-600">
                          <span>Founder Member Benefits (10% off)</span>
                          <span>Included</span>
                        </div>
                      )}
                      {orderData.voucherCode && orderData.voucherDiscount && (
                        <div className="flex justify-between text-green-600 font-medium">
                          <span>Voucher Discount ({orderData.voucherCode} - {orderData.voucherDiscount}%)</span>
                          <span>-${voucherDiscountAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="text-gray-700 font-bold">Total Amount</span>
                <span className="font-bold text-xl text-gray-900">
                  ${orderData.pricing?.total.toFixed(2) || '103.95'}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-6">Shipping Information</h3>

            <div className="space-y-4">
              <div className="pb-3 border-b border-gray-100">
                <p className="text-sm text-gray-600 mb-1">Name:</p>
                <p className="font-medium text-gray-900">{orderData.shipping?.fullName || orderData.customerName || 'Customer'}</p>
              </div>

              <div className="pb-3 border-b border-gray-100">
                <p className="text-sm text-gray-600 mb-1">Email:</p>
                <p className="text-gray-900">{orderData.shipping?.email || orderData.email || 'customer@example.com'}</p>
              </div>

              <div className="pb-3 border-b border-gray-100">
                <p className="text-sm text-gray-600 mb-1">Phone:</p>
                <p className="text-gray-900">{orderData.shipping?.phone || orderData.shipping?.phoneNumber || orderData.phoneNumber || '+1 (555) 123-4567'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Shipping Address:</p>
                <div className="text-gray-900 leading-relaxed">
                  <p className="font-medium">{orderData.shipping?.addressLine1 || 'Address'}</p>
                  {orderData.shipping?.addressLine2 && <p>{orderData.shipping.addressLine2}</p>}
                  <p>{orderData.shipping?.city || 'City'}{orderData.shipping?.stateProvince ? `, ${orderData.shipping.stateProvince}` : ''} {orderData.shipping?.postalCode || ''}</p>
                  <p>{orderData.shipping?.country || 'Country'}</p>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* What Happens Next */}
        <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-bold mb-8">What Happens Next</h2>

          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-1">
                  {isDigitalOnly ? 'Profile Activated' : 'Order Confirmed'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {isDigitalOnly
                    ? 'Your digital profile has been activated and is ready to use'
                    : 'Your order has been received and confirmed'}
                </p>
                <p className="text-xs text-gray-500 mt-2">Just now</p>
              </div>
            </div>

            {!isDigitalOnly && (
              <>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">Design Processing</h3>
                    <p className="text-gray-600 text-sm">Your card design is being prepared for production</p>
                    <p className="text-xs text-gray-500 mt-2">Within 1-2 business days</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <Truck className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-500 mb-1">Shipping</h3>
                    <p className="text-gray-500 text-sm">Your card will be shipped to your address</p>
                    <p className="text-xs text-gray-400 mt-2">3-5 business days after production</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-500 mb-1">Delivery</h3>
                    <p className="text-gray-500 text-sm">Your NFC card arrives at your doorstep</p>
                    <p className="text-xs text-gray-400 mt-2">We'll send tracking information</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Email Updates */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <div className="flex items-start space-x-3">
            <Mail className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Stay Updated
              </h3>
              <p className="text-blue-700 mb-4">
                We&apos;ll send you email updates at each step of the process:
              </p>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Order confirmation (sent now)</li>
                {!isDigitalOnly && (
                  <>
                    <li>• Design approval and production start</li>
                    <li>• Shipping notification with tracking</li>
                    <li>• Delivery confirmation</li>
                  </>
                )}
                {isDigitalOnly && (
                  <li>• Profile setup instructions</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Profile URL Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Profile URL</h3>
          <div className="flex flex-col gap-4">
            <div className="w-full">
              <div className="flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-red-500 rounded-lg px-4 py-3 overflow-hidden">
                <code className="text-sm font-mono text-gray-900 font-semibold truncate w-full">
                  {profileUrl || 'Generating...'}
                </code>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 w-full">
              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopyUrl}
                className="flex flex-col items-center justify-center px-2 sm:px-4 py-3 rounded-lg font-semibold transition-all min-h-[80px] w-full"
                style={{
                  backgroundColor: copied ? '#16a34a' : '#dc2626',
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = copied ? '#15803d' : '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = copied ? '#16a34a' : '#dc2626';
                }}
              >
                <Copy className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
                <span className="text-xs sm:text-sm">{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              {/* View Profile Button */}
              <button
                type="button"
                onClick={() => window.open(profileUrl, '_blank')}
                className="flex flex-col items-center justify-center px-2 sm:px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all min-h-[80px] w-full"
              >
                <ExternalLink className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
                <span className="text-xs sm:text-sm">View</span>
              </button>

              {/* QR Code Button */}
              <button
                type="button"
                onClick={() => setShowQrCode(true)}
                className="flex flex-col items-center justify-center px-2 sm:px-4 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-semibold transition-all min-h-[80px] w-full"
              >
                <QrCode2 className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
                <span className="text-xs sm:text-sm">QR Code</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link
            href="/claim-url"
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-semibold transition text-center flex items-center justify-center"
          >
            Start building Profile
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </div>

        {/* Support Information */}
        <div className="text-center mt-12 p-6 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            Questions about your order? We&apos;re here to help.
          </p>
          <div className="flex justify-center space-x-6 text-sm">
            <Link href="/help" className="text-blue-600 hover:underline">
              Help Center
            </Link>
            <Link href="/contact" className="text-blue-600 hover:underline">
              Contact Support
            </Link>
            <Link href="mailto:support@linkist.ai" className="text-blue-600 hover:underline">
              support@linkist.ai
            </Link>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrCode && qrCodeUrl && (
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
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <Close className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <img
                src={qrCodeUrl}
                alt="Profile QR Code"
                className="w-64 h-64 border-2 border-red-500 rounded-lg bg-white p-4"
              />
              <p className="text-sm text-gray-600 mt-4 text-center">
                Scan this QR code to visit your profile
              </p>

              <div className="flex gap-3 mt-6 w-full">
                <button
                  onClick={handleDownloadQrCode}
                  className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition flex items-center justify-center gap-2 font-medium"
                >
                  <CloudDownload className="w-5 h-5" />
                  Download
                </button>
                <button
                  onClick={handleShareQrCode}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 font-medium"
                >
                  <Mail className="w-5 h-5" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}