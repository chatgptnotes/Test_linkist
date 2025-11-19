'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Footer from '@/components/Footer';
import { Country, State, City } from 'country-state-city';
import { getOrderAmountForVoucher } from '@/lib/pricing-utils';
// PIN verification removed - no longer needed

// Dynamically import MapPicker to avoid SSR issues
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SecurityIcon from '@mui/icons-material/Security';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// Icon aliases
const Truck = LocalShippingIcon;
const CreditCard = CreditCardIcon;
const Shield = SecurityIcon;
const ArrowLeft = ArrowBackIcon;
const MapPin = LocationOnIcon;
const GoogleMapPicker = dynamic(() => import('@/components/GoogleMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Loading Google Maps...</p>
    </div>
  ),
});

const checkoutSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  stateProvince: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  quantity: z.number().min(1).max(10),
  isFounderMember: z.boolean(),
}).superRefine((data, ctx) => {
  // Make postal code mandatory only for India
  if (data.country === 'IN' && (!data.postalCode || data.postalCode.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Postal code is required for India',
      path: ['postalCode'],
    });
  }
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

// Color mapping for card preview
const allColours: Array<{ value: string; label: string; hex: string; gradient: string }> = [
  // PVC colors
  { value: 'white', label: 'White', hex: '#FFFFFF', gradient: 'from-white to-gray-100' },
  { value: 'black-pvc', label: 'Black', hex: '#000000', gradient: 'from-gray-900 to-black' },
  // Wood colors
  { value: 'cherry', label: 'Cherry', hex: '#8E3A2D', gradient: 'from-red-950 to-red-900' },
  { value: 'birch', label: 'Birch', hex: '#E5C79F', gradient: 'from-amber-100 to-amber-200' },
  // Metal colors
  { value: 'black-metal', label: 'Black', hex: '#1A1A1A', gradient: 'from-gray-800 to-gray-900' },
  { value: 'silver', label: 'Silver', hex: '#C0C0C0', gradient: 'from-gray-300 to-gray-400' },
  { value: 'rose-gold', label: 'Rose Gold', hex: '#B76E79', gradient: 'from-rose-300 to-rose-400' }
];

export default function CheckoutPage() {
  const router = useRouter();

  // Product Plan Price (Physical Card + Digital Profile)
  const PRODUCT_PLAN_PRICE = 69;
  // Linkist App Subscription (1 Year)
  const APP_SUBSCRIPTION_PRICE = 120;

  const [cardConfig, setCardConfig] = useState<{
    fullName?: string;
    cardFirstName?: string;
    cardLastName?: string;
    baseMaterial?: string;
    color?: string;
    [key: string]: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMap, setShowMap] = useState(false); // Map hidden by default
  const [gpsCoordinates, setGpsCoordinates] = useState<{
    latitude?: number;
    longitude?: number;
    area?: string;
  }>({});

  // Location dropdown states
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [availableStates, setAvailableStates] = useState<any[]>([]);
  const [availableCities, setAvailableCities] = useState<any[]>([]);
  const [isUpdatingFromMap, setIsUpdatingFromMap] = useState(false);
  const previousStateRef = useRef<string>('');
  const previousCountryRef = useRef<string>('');

  // PIN modal and related state removed - no longer needed
  // const [step, setStep] = useState<'shipping' | 'payment' | 'review'>('shipping');

  // FIXED: Don't initialize from localStorage - causes stale state issues
  // Let auto-apply run fresh validation on each page load
  // Voucher state - starts fresh, no localStorage initialization
  const [voucherCode, setVoucherCode] = useState('LINKISTFM');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherDiscountAmount, setVoucherDiscountAmount] = useState(0);
  const [voucherType, setVoucherType] = useState<'fixed' | 'percentage'>('fixed');
  const [voucherValid, setVoucherValid] = useState<boolean | null>(null);
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [autoAppliedVoucher, setAutoAppliedVoucher] = useState(false);
  const [userIsFoundingMember, setUserIsFoundingMember] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      quantity: 1,
      isFounderMember: true,
      country: 'US',
    },
  });

  const watchedValues = watch();
  const quantity = watchedValues.quantity || 1;
  const isFounderMember = watchedValues.isFounderMember || false;

  // Initialize country dropdown state to match form default
  useEffect(() => {
    if (!selectedCountry && watchedValues.country) {
      setSelectedCountry(watchedValues.country);
      previousCountryRef.current = watchedValues.country; // Track initial country
      const states = State.getStatesOfCountry(watchedValues.country);
      setAvailableStates(states);
    }
  }, [watchedValues.country, selectedCountry]);

  useEffect(() => {
    console.log('Checkout: Loading configuration data...');

    // Check founding member status immediately on page load
    const checkFoundingMemberEarly = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store'
        });
        if (response.ok) {
          const data = await response.json();
          const isFoundingMember = data.user?.is_founding_member || false;
          setUserIsFoundingMember(isFoundingMember);
          console.log('✅ Checkout: Founding member status loaded early:', isFoundingMember);
        }
      } catch (error) {
        console.log('⚠️ Checkout: Could not check founding member status early');
      }
    };

    checkFoundingMemberEarly();

    // FIXED: Don't restore voucher state from localStorage
    // This causes stale validation to override fresh auto-apply
    // Instead, let auto-apply run fresh validation each time
    // Clear any old saved state
    localStorage.removeItem('checkoutVoucherState');
    console.log('✅ Cleared stale voucher state - will run fresh validation');

    // Check for nfcConfig first (this is what configure page saves)
    const nfcConfigStr = localStorage.getItem('nfcConfig');

    if (nfcConfigStr) {
      try {
        const config = JSON.parse(nfcConfigStr);
        console.log('Checkout: Raw loaded config:', config);

        // Validate that we have required fields (card names)
        if (config.cardFirstName && config.cardLastName) {
          const processedConfig = {
            cardFirstName: config.cardFirstName,
            cardLastName: config.cardLastName,
            baseMaterial: config.baseMaterial,
            texture: config.texture,
            pattern: config.pattern,
            color: config.colour || config.color,  // Handle both colour and color
            fullName: `${config.cardFirstName} ${config.cardLastName}`.trim()
          };

          console.log('Checkout: Processed card config for preview:', processedConfig);
          setCardConfig(processedConfig);

          // Check for saved user profile data to autofill shipping fields with PROFILE name
          const userProfileStr = localStorage.getItem('userProfile');
          if (userProfileStr) {
            try {
              const userProfile = JSON.parse(userProfileStr);
              console.log('Checkout: Found user profile for shipping:', userProfile);

              // Autofill shipping fields from user profile (NOT from card config)
              if (userProfile.email) {
                setValue('email', userProfile.email);
              }
              // Use profile name for shipping, NOT card name
              if (userProfile.firstName) {
                setValue('firstName', userProfile.firstName);
                console.log('Checkout: Using profile firstName for shipping:', userProfile.firstName);
              }
              if (userProfile.lastName) {
                setValue('lastName', userProfile.lastName);
                console.log('Checkout: Using profile lastName for shipping:', userProfile.lastName);
              }
              if (userProfile.mobile) {
                setValue('phone', userProfile.mobile);
              }
              if (userProfile.country) {
                // Map country name to country code if needed
                const countryMap: { [key: string]: string } = {
                  'United States': 'US',
                  'United Arab Emirates': 'AE',
                  'India': 'IN',
                  'Canada': 'CA',
                  'United Kingdom': 'GB',
                  'Australia': 'AU',
                  'Germany': 'DE',
                  'France': 'FR',
                  'Singapore': 'SG'
                };
                const countryCode = countryMap[userProfile.country] || userProfile.country;
                setValue('country', countryCode);
              }

              console.log('Checkout: Autofilled shipping data from user profile');
            } catch (error) {
              console.error('Checkout: Error parsing user profile:', error);
            }
          }
        } else {
          console.error('Checkout: Invalid config data - missing cardFirstName or cardLastName');
          router.push('/nfc/configure');
        }
      } catch (error) {
        console.error('Checkout: Error parsing config:', error);
        router.push('/nfc/configure');
      }
    } else {
      console.log('Checkout: No config found, redirecting to configure');
      router.push('/nfc/configure');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-apply LINKISTFM voucher on page load
  // FIXED: Race condition resolved by running only once on mount
  useEffect(() => {
    let isMounted = true;
    let abortController = new AbortController();

    const autoApplyVoucher = async () => {
      // Only run if not already processed
      if (autoAppliedVoucher) {
        console.log('🔄 Auto-apply skipped - already processed');
        return;
      }

      // Check if user email is available from form data
      const userEmail = watchedValues.email;
      if (!userEmail) {
        console.log('⏳ Auto-apply waiting for email...');
        return;
      }

      // Don't auto-apply if voucher code is empty or already validated
      if (!voucherCode || voucherCode !== 'LINKISTFM') {
        console.log('⏭️ Auto-apply skipped - no LINKISTFM code');
        return;
      }

      try {
        console.log('🚀 Starting LINKISTFM auto-apply...');
        setApplyingVoucher(true);

        // STEP 1: Get founding member status FIRST (before any pricing calculations)
        let isFoundingMember = false;
        try {
          const meResponse = await fetch('/api/auth/me', {
            credentials: 'include',
            cache: 'no-store',
            signal: abortController.signal
          });
          if (meResponse.ok && isMounted) {
            const meData = await meResponse.json();
            isFoundingMember = meData.user?.is_founding_member || false;
            setUserIsFoundingMember(isFoundingMember);
            console.log('👤 Founding member status:', isFoundingMember);
          }
        } catch (error: any) {
          if (error.name === 'AbortError') return;
          console.warn('⚠️ Could not check founding member status:', error);
        }

        // STEP 2: Calculate order amount using unified pricing utility
        // Calculate pricing OUTSIDE the async function to avoid stale closures
        const country = watchedValues.country || 'US';
        const orderAmount = getOrderAmountForVoucher({
          cardConfig: {
            baseMaterial: (cardConfig?.baseMaterial as any) || 'pvc',
            quantity: quantity,
          },
          country: country,
          isFoundingMember: isFoundingMember,
        });

        console.log('💰 Calculated order amount for validation:', {
          orderAmount,
          country,
          baseMaterial: cardConfig?.baseMaterial,
          quantity,
          isFoundingMember
        });

        // STEP 3: Validate voucher with all required parameters
        const voucherResponse = await fetch('/api/vouchers/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: 'LINKISTFM',
            orderAmount: orderAmount,
            userEmail: userEmail,
            isFoundingMember: isFoundingMember, // NEW: Pass founding member status
          }),
          signal: abortController.signal,
        });

        if (!isMounted) return;

        if (voucherResponse.ok) {
          const voucherData = await voucherResponse.json();
          if (voucherData.valid && voucherData.voucher) {
            setVoucherDiscount(voucherData.voucher.discount_value);
            setVoucherDiscountAmount(voucherData.voucher.discount_amount || 0);
            setVoucherType(voucherData.voucher.discount_type || 'fixed');
            setVoucherValid(true);
            setAutoAppliedVoucher(true);
            console.log('✅ LINKISTFM auto-applied successfully:', {
              discount: voucherData.voucher.discount_value,
              type: voucherData.voucher.discount_type,
              amount: voucherData.voucher.discount_amount
            });
          } else {
            // Validation failed
            console.error('❌ LINKISTFM validation failed:', voucherData?.message || 'Unknown error');
            setVoucherValid(false);
            setAutoAppliedVoucher(true); // Mark as attempted to prevent re-runs
          }
        } else {
          const errorData = await voucherResponse.json();
          console.error('❌ LINKISTFM validation error:', {
            status: voucherResponse.status,
            message: errorData?.message || 'No message',
            error: errorData?.error || 'Unknown'
          });
          setVoucherValid(false);
          setAutoAppliedVoucher(true); // Mark as attempted
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('🛑 Auto-apply cancelled');
          return;
        }
        console.error('❌ Error auto-applying voucher:', error);
        setAutoAppliedVoucher(true); // Mark as attempted to prevent infinite retries
      } finally {
        if (isMounted) {
          setApplyingVoucher(false);
        }
      }
    };

    // Only run auto-apply when email becomes available
    if (watchedValues.email && !autoAppliedVoucher) {
      autoApplyVoucher();
    }

    return () => {
      isMounted = false;
      abortController.abort();
    };
    // FIXED: Only depend on email and autoAppliedVoucher flag
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues.email, autoAppliedVoucher]);

  // Save voucher state to localStorage whenever it changes
  useEffect(() => {
    if (voucherValid === true && voucherCode && voucherDiscount > 0) {
      const voucherState = {
        voucherCode,
        voucherDiscount,
        voucherDiscountAmount,
        voucherType,
        voucherValid: true,
      };
      localStorage.setItem('checkoutVoucherState', JSON.stringify(voucherState));
      console.log('Checkout: Saved voucher state to localStorage:', voucherState);
    } else if (voucherValid === false) {
      // Clear saved voucher if validation failed
      localStorage.removeItem('checkoutVoucherState');
    }
  }, [voucherValid, voucherCode, voucherDiscount, voucherDiscountAmount, voucherType]);

  // Handle country change - load states for selected country
  useEffect(() => {
    // Only clear state/city if country VALUE actually changed (not just isUpdatingFromMap flag)
    if (selectedCountry && selectedCountry !== previousCountryRef.current && !isUpdatingFromMap) {
      const states = State.getStatesOfCountry(selectedCountry);
      setAvailableStates(states);
      setSelectedState(''); // Reset state when country changes
      setSelectedCity(''); // Reset city when country changes
      setAvailableCities([]);
      setValue('stateProvince', ''); // Update form value
      setValue('city', ''); // Update form value

      // Update previous country ref
      previousCountryRef.current = selectedCountry;
    }
  }, [selectedCountry, setValue, isUpdatingFromMap]);

  // Handle state change - load cities for selected state
  useEffect(() => {
    if (selectedCountry && selectedState && !isUpdatingFromMap) {
      // Only reset city if the state actually changed (user manually changed it)
      const stateChanged = previousStateRef.current !== '' && previousStateRef.current !== selectedState;

      const cities = City.getCitiesOfState(selectedCountry, selectedState);
      setAvailableCities(cities);

      // Only reset city if user manually changed the state dropdown
      if (stateChanged) {
        setSelectedCity('');
        setValue('city', '');
      }

      // Update the previous state ref
      previousStateRef.current = selectedState;
    }
  }, [selectedState, selectedCountry, setValue, isUpdatingFromMap]);

  const calculatePricing = () => {
    // Get price based on selected material
    const materialPrices: Record<string, number> = {
      pvc: 69,
      wood: 79,
      metal: 99,
      stainless_steel: 99,
      digital: 19 // Digital Profile + Linkist App price
    };
    const materialPrice = cardConfig?.baseMaterial ? materialPrices[cardConfig.baseMaterial] || 69 : 69;

    // Only Material Price (no app subscription shown on checkout page)
    const productPlanPrice = 0; // Removed
    const appSubscriptionPrice = 0; // Not shown on checkout page
    const basePrice = materialPrice; // Only material price
    const subtotal = basePrice * quantity;

    // Tax logic: 18% GST for India, 5% VAT for others (applied only on physical items, not subscription)
    const isIndia = watchedValues.country === 'IN';
    const taxRate = isIndia ? 0.18 : 0.05;
    const taxableAmount = basePrice * quantity; // Tax only on material price
    const taxAmount = taxableAmount * taxRate;

    // Shipping is included in base price (no additional cost)
    const shippingCost = 0;
    const totalBeforeDiscount = subtotal + taxAmount + shippingCost;

    // No voucher discount on checkout page - vouchers only apply on payment page
    const discountAmount = 0;
    const total = totalBeforeDiscount;

    return {
      productPlanPrice,
      materialPrice,
      appSubscriptionPrice,
      basePrice,
      subtotal,
      taxAmount,
      shippingCost,
      totalBeforeDiscount,
      discountAmount,
      total,
      taxRate,
      taxLabel: isIndia ? 'GST (18%)' : 'VAT (5%)'
    };
  };

  const validateVoucher = async () => {
    if (!voucherCode.trim()) {
      alert('Please enter a voucher code');
      return;
    }

    setApplyingVoucher(true);
    try {
      // Calculate order amount using unified pricing utility
      const country = watchedValues.country || 'US';
      const orderAmount = getOrderAmountForVoucher({
        cardConfig: {
          baseMaterial: (cardConfig?.baseMaterial as any) || 'pvc',
          quantity: quantity,
        },
        country: country,
        isFoundingMember: userIsFoundingMember,
      });

      const response = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: voucherCode.toUpperCase(),
          orderAmount: orderAmount,
          userEmail: watchedValues.email,
          isFoundingMember: userIsFoundingMember
        })
      });

      const result = await response.json();

      if (result.valid && result.voucher) {
        // Store voucher details from API
        setVoucherDiscount(result.voucher.discount_value);
        setVoucherDiscountAmount(result.voucher.discount_amount || 0);
        setVoucherType(result.voucher.discount_type || 'fixed');
        setVoucherValid(true);
        console.log('✅ Voucher applied:', result.voucher.discount_type, result.voucher.discount_value, 'Amount:', result.voucher.discount_amount);
      } else {
        setVoucherDiscount(0);
        setVoucherDiscountAmount(0);
        setVoucherType('fixed');
        setVoucherValid(false);
        alert('Invalid voucher code');
      }
    } catch (error) {
      console.error('Error validating voucher:', error);
      setVoucherDiscount(0);
      setVoucherDiscountAmount(0);
      setVoucherValid(false);
      alert('Error validating voucher. Please try again.');
    } finally {
      setApplyingVoucher(false);
    }
  };

  // Helper functions for card preview
  const getCardGradient = () => {
    const selectedColor = allColours.find(c => c.value === cardConfig?.color);
    return selectedColor?.gradient || 'from-gray-800 to-gray-900';
  };

  const getTextColor = () => {
    // Return white text for dark backgrounds, black for light backgrounds
    const darkBackgrounds = ['black-pvc', 'black-metal', 'cherry', 'rose-gold'];
    if (cardConfig?.color && darkBackgrounds.includes(cardConfig.color)) {
      return 'text-white';
    }
    return 'text-gray-900';
  };

  const pricing = calculatePricing();

  // Handle address update from map
  const handleMapAddressChange = (addressData: any) => {
    console.log('📍 Map address changed:', addressData);
    console.log('📍 Full address data:', JSON.stringify(addressData, null, 2));

    // Set flag to prevent useEffect from resetting values
    setIsUpdatingFromMap(true);

    // Update form fields with address from map
    if (addressData.addressLine1) setValue('addressLine1', addressData.addressLine1);
    if (addressData.addressLine2) setValue('addressLine2', addressData.addressLine2);
    if (addressData.postalCode) setValue('postalCode', addressData.postalCode);

    // Update country dropdown
    if (addressData.countryCode) {
      const country = Country.getAllCountries().find(c => c.isoCode === addressData.countryCode);

      if (!country) {
        console.error('❌ Country not found for code:', addressData.countryCode);
        setIsUpdatingFromMap(false);
        return;
      }

      console.log('🌍 Country found:', country.isoCode, country.name);

      // Set country
      setSelectedCountry(country.isoCode);
      previousCountryRef.current = country.isoCode; // Track country change
      setValue('country', country.isoCode);

      // Get available states for the selected country
      const states = State.getStatesOfCountry(country.isoCode);
      console.log(`📍 Found ${states.length} states for ${country.name}`);
      setAvailableStates(states);

      // Update state dropdown if state data is available
      if (addressData.stateProvince) {
        console.log('📍 Looking for state:', addressData.stateProvince);

        if (states.length === 0) {
          console.log('⚠️ No states available in library, setting directly');
          setSelectedState(addressData.stateProvince);
          previousStateRef.current = addressData.stateProvince;
          setValue('stateProvince', addressData.stateProvince);
          // Also try to set city if provided
          if (addressData.city) {
            setValue('city', addressData.city);
            setSelectedCity(addressData.city);
          }
        } else {
          // Try to find state by name or ISO code
          const state = states.find(s =>
            s.name.toLowerCase() === addressData.stateProvince.toLowerCase() ||
            s.isoCode.toLowerCase() === addressData.stateProvince.toLowerCase()
          );

          if (state) {
            console.log('✅ State found:', state.isoCode, state.name);

            // Get available cities for the selected state
            const cities = City.getCitiesOfState(country.isoCode, state.isoCode);
            console.log(`🏙️ Found ${cities.length} cities for ${state.name}`);

            // Set state AFTER getting cities to avoid race condition
            setSelectedState(state.isoCode);
            previousStateRef.current = state.isoCode;
            setValue('stateProvince', state.name);
            setAvailableCities(cities);

            // Update city dropdown if city data is available
            if (addressData.city) {
              console.log('🏙️ Looking for city:', addressData.city);

              if (cities.length === 0) {
                console.log('⚠️ No cities available in library, setting directly');
                setSelectedCity(addressData.city);
                setValue('city', addressData.city);
              } else {
                const city = cities.find(c =>
                  c.name.toLowerCase() === addressData.city.toLowerCase()
                );

                if (city) {
                  console.log('✅ City found:', city.name);
                  setSelectedCity(city.name);
                  setValue('city', city.name);
                } else {
                  console.log('⚠️ City not found in library, setting directly:', addressData.city);
                  setSelectedCity(addressData.city);
                  setValue('city', addressData.city);
                }
              }
            }
          } else {
            console.log('⚠️ State not found in library, setting directly:', addressData.stateProvince);
            setSelectedState(addressData.stateProvince);
            previousStateRef.current = addressData.stateProvince;
            setValue('stateProvince', addressData.stateProvince);

            // Also set city directly if provided
            if (addressData.city) {
              setSelectedCity(addressData.city);
              setValue('city', addressData.city);
            }
          }
        }
      } else if (addressData.city) {
        // No state provided but city is available
        console.log('🏙️ Setting city without state:', addressData.city);
        setSelectedCity(addressData.city);
        setValue('city', addressData.city);
      }
    }

    // Store GPS coordinates and area
    setGpsCoordinates({
      latitude: addressData.latitude,
      longitude: addressData.longitude,
      area: addressData.area,
    });

    // Reset flag after a longer delay to ensure all state updates have completed
    setTimeout(() => {
      setIsUpdatingFromMap(false);
      console.log('✅ Map update complete');
    }, 300);
  };

  // PIN verification function removed - no longer needed

  const createOrder = async (orderPayload: any) => {
    try {
      console.log('📤 Checkout: Creating order in database before payment...');
      console.log('📦 Checkout: Order payload:', orderPayload);

      // Create order in database with status 'pending'
      const response = await fetch('/api/process-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardConfig: orderPayload.cardConfig,
          checkoutData: {
            email: orderPayload.email,
            fullName: orderPayload.customerName,
            phoneNumber: orderPayload.phoneNumber,
            addressLine1: orderPayload.shipping.addressLine1,
            addressLine2: orderPayload.shipping.addressLine2,
            city: orderPayload.shipping.city,
            state: orderPayload.shipping.stateProvince,
            country: orderPayload.shipping.country,
            postalCode: orderPayload.shipping.postalCode,
          },
        }),
      });

      console.log('📡 Checkout: Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Checkout: Response error:', errorText);
        throw new Error(`Failed to create order: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Checkout: Order created successfully:', result);
      console.log('🆔 Checkout: Order ID:', result.order?.id);

      if (!result.order || !result.order.id) {
        throw new Error('Order was created but no ID was returned');
      }

      // Store order data for payment page (including order ID and founding member status)
      const orderWithId = {
        ...orderPayload,
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        isFoundingMember: userIsFoundingMember, // Add founding member flag
      };

      console.log('💾 Checkout: Storing order in localStorage:', orderWithId);
      localStorage.setItem('pendingOrder', JSON.stringify(orderWithId));

      // Verify it was stored correctly
      const storedOrder = localStorage.getItem('pendingOrder');
      console.log('✅ Checkout: Verified stored order:', storedOrder ? 'Success' : 'Failed');

      // Small delay to ensure localStorage is written
      await new Promise(resolve => setTimeout(resolve, 100));

      // Clear the voucher state from localStorage as it's now saved in the order
      localStorage.removeItem('checkoutVoucherState');
      console.log('🧹 Checkout: Cleared voucher state from localStorage');

      console.log('🔀 Checkout: Redirecting to payment page...');

      // Redirect to payment page
      router.push('/nfc/payment');
    } catch (error) {
      console.error('❌ Checkout: Error creating order:', error);
      setIsLoading(false);
      alert(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const processOrder = async (formData: CheckoutForm) => {
    setShowMap(false); // Force hide map immediately on submit
    setIsLoading(true);
    try {
      console.log('💳 Checkout: Processing order with form data:', formData);
      console.log('💳 Checkout: Card config:', cardConfig);
      console.log('💳 Checkout: Pricing:', pricing);

      // Save user contact data to localStorage for profile builder
      const userContactData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      };
      localStorage.setItem('userContactData', JSON.stringify(userContactData));
      console.log('💾 Checkout: Saved user contact data to localStorage:', userContactData);

      // Prepare order data for API
      const orderPayload = {
        customerName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phoneNumber: formData.phone,
        firstName: formData.firstName,
        lastName: formData.lastName,
        quantity: formData.quantity,
        cardConfig: {
          ...cardConfig,
          quantity: formData.quantity
        },
        shipping: {
          fullName: `${formData.firstName} ${formData.lastName}`,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          stateProvince: formData.stateProvince,
          country: formData.country,
          postalCode: formData.postalCode,
          phoneNumber: formData.phone,
          latitude: gpsCoordinates.latitude,
          longitude: gpsCoordinates.longitude,
          area: gpsCoordinates.area
        },
        pricing: {
          productPlanPrice: pricing.productPlanPrice,
          materialPrice: pricing.materialPrice,
          appSubscriptionPrice: APP_SUBSCRIPTION_PRICE, // Send actual subscription price to payment page
          basePrice: pricing.basePrice,
          subtotal: pricing.subtotal,
          shippingCost: pricing.shippingCost,
          taxAmount: pricing.taxAmount,
          totalBeforeDiscount: pricing.totalBeforeDiscount,
          discountAmount: 0, // No discount on checkout
          total: pricing.total,
          taxRate: pricing.taxRate,
          taxLabel: pricing.taxLabel,
          voucherCode: null, // Payment page handles vouchers
          voucherDiscount: 0 // Payment page handles vouchers
        },
        isFounderMember: formData.isFounderMember
      };

      console.log('📤 Checkout: Order prepared, creating order directly');

      // Create order directly without PIN verification
      // Note: createOrder handles setIsLoading(false) on error, and redirects on success
      await createOrder(orderPayload);

    } catch (error) {
      console.error('❌ Checkout: Order processing error:', error);
      alert(`Order preparation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  if (!cardConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p>Loading your card configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">

      {/* Full-page Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-98 z-[9999] flex items-center justify-center backdrop-blur-md">
          <div className="bg-white rounded-xl p-8 shadow-2xl text-center border border-gray-200">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-900">Processing your order...</p>
            <p className="text-sm text-gray-600 mt-2">Please wait, redirecting to payment page</p>
          </div>
        </div>
      )}

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-opacity duration-300 relative z-0 ${isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {/* Checkout Header - Centered above everything */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Complete Your Order</h2>
          <p className="text-gray-600 mt-2">Fill in your details to get your NFC card</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <div className="space-y-6 order-2 lg:order-1">

            <form onSubmit={handleSubmit(processOrder)} className="space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div suppressHydrationWarning>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="john@example.com"
                      suppressHydrationWarning
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        {...register('firstName')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="John"
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        {...register('lastName')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="Doe"
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      {...register('phone')}
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="+1 234 567 8900"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-lg font-semibold flex items-center">
                    <Truck className="h-5 w-5 mr-2" />
                    Shipping Address
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="flex items-center justify-center space-x-2 text-sm px-3 py-2 rounded-lg transition-colors cursor-pointer w-full sm:w-auto"
                    style={{ backgroundColor: '#ff0000', color: '#FFFFFF' }}
                  >
                    <MapPin className="h-4 w-4" />
                    <span>{showMap ? 'Hide Map' : 'Use Map'}</span>
                  </button>
                </div>

                {/* Google Map Picker - Only shows when user clicks "Use Map" button AND not loading */}
                {!isLoading && showMap && (
                  <div className="mb-4">
                    <GoogleMapPicker
                      initialAddress={{
                        addressLine1: watchedValues.addressLine1,
                        addressLine2: watchedValues.addressLine2,
                        city: watchedValues.city,
                        stateProvince: watchedValues.stateProvince,
                        postalCode: watchedValues.postalCode,
                        country: watchedValues.country,
                        latitude: gpsCoordinates.latitude,
                        longitude: gpsCoordinates.longitude,
                      }}
                      onAddressChange={handleMapAddressChange}
                      className="mb-4"
                    />
                  </div>
                )}

                {/* GPS Coordinates Display */}
                {gpsCoordinates.latitude && gpsCoordinates.longitude && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Location Captured
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      GPS: {gpsCoordinates.latitude.toFixed(6)}, {gpsCoordinates.longitude.toFixed(6)}
                      {gpsCoordinates.area && ` • Area: ${gpsCoordinates.area}`}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 1 *
                    </label>
                    <input
                      {...register('addressLine1')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="123 Main St"
                    />
                    {errors.addressLine1 && (
                      <p className="text-red-500 text-sm mt-1">{errors.addressLine1.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 2
                    </label>
                    <input
                      {...register('addressLine2')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="Apt 4B"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <select
                        value={selectedCity}
                        onChange={(e) => {
                          const cityName = e.target.value;
                          setSelectedCity(cityName);
                          setValue('city', cityName);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        <option value="">Select City</option>
                        {/* Show selected city even if not in library */}
                        {selectedCity && !availableCities.find(c => c.name === selectedCity) && (
                          <option value={selectedCity}>{selectedCity}</option>
                        )}
                        {availableCities.map((city) => (
                          <option key={city.name} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                      {errors.city && (
                        <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                      )}
                      {selectedCity && !availableCities.find(c => c.name === selectedCity) && (
                        <p className="text-xs text-gray-500 mt-1">City auto-filled from map (you can change if needed)</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State/Province
                      </label>
                      <select
                        value={selectedState}
                        onChange={(e) => {
                          const stateCode = e.target.value;
                          setSelectedState(stateCode);
                          const stateName = availableStates.find(s => s.isoCode === stateCode)?.name || stateCode;
                          setValue('stateProvince', stateName);

                          // Load cities for the new state (only if user manually changes)
                          if (!isUpdatingFromMap && stateCode && selectedCountry) {
                            const cities = City.getCitiesOfState(selectedCountry, stateCode);
                            setAvailableCities(cities);
                            setSelectedCity('');
                            setValue('city', '');
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        <option value="">Select State/Province</option>
                        {/* Show selected state even if not in library */}
                        {selectedState && !availableStates.find(s => s.isoCode === selectedState) && (
                          <option value={selectedState}>
                            {selectedState}
                          </option>
                        )}
                        {availableStates.map((state) => (
                          <option key={state.isoCode} value={state.isoCode}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                      {selectedState && !availableStates.find(s => s.isoCode === selectedState) && (
                        <p className="text-xs text-gray-500 mt-1">State auto-filled from map (you can change if needed)</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postal Code {watchedValues.country === 'IN' && '*'}
                      </label>
                      <input
                        {...register('postalCode')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="10001"
                      />
                      {errors.postalCode && (
                        <p className="text-red-500 text-sm mt-1">{errors.postalCode.message}</p>
                      )}
                      {watchedValues.country === 'IN' && !errors.postalCode && (
                        <p className="text-xs text-gray-500 mt-1">Mandatory field for users in India</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country *
                      </label>
                      <select
                        value={selectedCountry}
                        onChange={(e) => {
                          const countryCode = e.target.value;
                          setSelectedCountry(countryCode);
                          previousCountryRef.current = countryCode; // Track manual country change
                          setValue('country', countryCode);

                          // Load states for the new country
                          if (countryCode) {
                            const states = State.getStatesOfCountry(countryCode);
                            setAvailableStates(states);
                            setSelectedState('');
                            setSelectedCity('');
                            setAvailableCities([]);
                            setValue('stateProvince', '');
                            setValue('city', '');
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        <option value="">Select Country</option>
                        {Country.getAllCountries().map((country) => (
                          <option key={country.isoCode} value={country.isoCode}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                      {errors.country && (
                        <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
                style={{ backgroundColor: '#ff0000', color: '#FFFFFF' }}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-2"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Continue to Payment
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-8 order-1 lg:order-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              
              {/* Card Preview */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">
                  {cardConfig?.baseMaterial === 'digital' ? 'Digital Profile + Linkist App' : 'Your NFC Card'}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {cardConfig?.fullName || 'Custom NFC Card'}
                </p>
                {cardConfig?.baseMaterial && cardConfig.baseMaterial !== 'digital' && (
                  <p className="text-xs text-gray-500 mb-4">
                    Material: {cardConfig.baseMaterial.charAt(0).toUpperCase() + cardConfig.baseMaterial.slice(1)} •
                    Color: {(() => {
                      const color = cardConfig.color || 'Black';
                      // Remove material suffix (e.g., "black-pvc" -> "black")
                      const colorName = color.split('-')[0];
                      return colorName.charAt(0).toUpperCase() + colorName.slice(1);
                    })()}
                  </p>
                )}
                {cardConfig?.baseMaterial === 'digital' && (
                  <p className="text-xs text-gray-500 mb-4">
                    Includes: Linkist App Access (1 Year) • AI Credits • Analytics Dashboard
                  </p>
                )}

                {/* Front Card */}
                <div className="mb-4">
                  <div className={`w-56 aspect-[1.6/1] bg-gradient-to-br ${getCardGradient()} rounded-xl relative overflow-hidden shadow-lg mr-auto`}>
                    {/* AI Icon top right - No wrapper, no background, no shadow */}
                    <img
                      src={cardConfig?.color === 'white' ? '/ai2.png' : '/ai1.png'}
                      alt="AI"
                      className={`absolute top-3 right-3 w-4 h-4 ${cardConfig?.color === 'white' ? '' : 'invert'}`}
                      style={{ boxShadow: 'none', background: 'transparent' }}
                    />

                    {/* User Name or Initials */}
                    <div className="absolute bottom-4 left-4">
                      {(() => {
                        const firstName = cardConfig?.cardFirstName?.trim() || '';
                        const lastName = cardConfig?.cardLastName?.trim() || '';
                        const isSingleCharOnly = firstName.length <= 1 && lastName.length <= 1;

                        if (isSingleCharOnly) {
                          return (
                            <div className={`${getTextColor()} text-xl font-light`}>
                              {(firstName || 'J').toUpperCase()}{(lastName || 'D').toUpperCase()}
                            </div>
                          );
                        } else {
                          return (
                            <div className={`${getTextColor()} text-sm font-medium`}>
                              {firstName} {lastName}
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-3 text-sm">
                {/* Material Price Only */}
                <div className="flex justify-between">
                  <span>
                    Base Material x {quantity}
                  </span>
                  <span>${(pricing.materialPrice * quantity).toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Customization</span>
                  <span className="text-green-600">Included</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600">Included</span>
                </div>
                <div className="flex justify-between">
                  <span>{pricing.taxLabel || 'VAT (5%)'}</span>
                  <span>${pricing.taxAmount.toFixed(2)}</span>
                </div>

                <div className="border-t pt-3 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${pricing.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-6 flex items-start space-x-3 text-sm text-gray-600">
                <Shield className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-medium">Secure Payment</p>
                  <p>Your payment info is encrypted and secure</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}