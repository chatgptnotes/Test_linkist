'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from './StripePaymentForm';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientSecret: string;
  amount: number;
  orderDetails: {
    customerName: string;
    email: string;
    orderNumber?: string;
    voucherCode?: string;
    discount?: number;
  };
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
}

export default function StripePaymentModal({
  isOpen,
  onClose,
  clientSecret,
  amount,
  orderDetails,
  onPaymentSuccess,
  onPaymentError,
}: StripePaymentModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Prevent body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#000000',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
            <p className="text-sm text-gray-500 mt-1">
              Secure payment powered by Stripe
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Order Summary */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-medium text-gray-900">{orderDetails.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-900">{orderDetails.email}</span>
            </div>
            {orderDetails.orderNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">Order:</span>
                <span className="font-medium text-gray-900 font-mono text-xs">
                  {orderDetails.orderNumber}
                </span>
              </div>
            )}
            {orderDetails.voucherCode && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Voucher Applied:</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded font-mono text-xs font-semibold">
                    {orderDetails.voucherCode}
                  </span>
                  {orderDetails.discount && orderDetails.discount > 0 && (
                    <span className="text-green-600 font-semibold">
                      -${(orderDetails.discount / 100).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-gray-900">
                ${(amount / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="px-6 py-6">
          <Elements stripe={stripePromise} options={options}>
            <StripePaymentForm
              amount={amount}
              onSuccess={onPaymentSuccess}
              onError={onPaymentError}
              returnUrl={`${window.location.origin}/nfc/success`}
            />
          </Elements>
        </div>

        {/* Security Notice */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
          <div className="flex items-start gap-3 text-xs text-gray-600">
            <svg
              className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <div>
              <p className="font-semibold text-gray-900 mb-1">
                Your payment is secure
              </p>
              <p className="leading-relaxed">
                Your card information is encrypted and securely processed by Stripe.
                We never store your card details on our servers. This payment is
                PCI DSS Level 1 compliant - the highest level of payment security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
