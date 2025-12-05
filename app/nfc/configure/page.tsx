'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PersonIcon from '@mui/icons-material/Person';
import PaletteIcon from '@mui/icons-material/Palette';
import BrushIcon from '@mui/icons-material/Brush';
import GridOnIcon from '@mui/icons-material/GridOn';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

// Icon aliases
const Person = PersonIcon;
const Palette = PaletteIcon;
const Brush = BrushIcon;
const GridPattern = GridOnIcon;
const Warning = WarningIcon;
const Info = InfoIcon;

// Define types for our configuration
type BaseMaterial = 'pvc' | 'wood' | 'metal';
type TextureOption = 'matte' | 'glossy' | 'brushed' | 'none';
type ColourOption = 'white' | 'black-pvc' | 'black-metal' | 'cherry' | 'birch' | 'silver' | 'rose-gold';

interface StepData {
  cardFirstName: string;
  cardLastName: string;
  baseMaterial: BaseMaterial | null;
  texture: TextureOption | null;
  colour: ColourOption | null;
  pattern: number | null;
}

interface PriceSummary {
  currency: string;
  productPlanPrice: number;
  materialPrice: number;
  appSubscriptionPrice?: number;
  basePrice: number;
  customization: number;
  taxLabel: string;
  taxRate: number;
  taxAmount: number;
  shipping: number;
  total: number;
}

export default function ConfigureNewPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<StepData>({
    cardFirstName: '',
    cardLastName: '',
    baseMaterial: null,
    texture: null,
    colour: null,
    pattern: null
  });
  const [userCountry, setUserCountry] = useState<string>('India');
  const [isLoading, setIsLoading] = useState(false);

  // Product Plan Price (Physical Card + Digital Profile)
  const PRODUCT_PLAN_PRICE = 69;

  // Clear any existing corrupted data on component mount
  useEffect(() => {
    // Clear old config data to prevent corruption
    localStorage.removeItem('nfcConfig');
    localStorage.removeItem('cardConfig');
    console.log('Configure: Cleared old localStorage data');

    // Get user profile data from localStorage (from welcome page)
    const userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      try {
        const profile = JSON.parse(userProfile);
        setUserCountry(profile.country || 'India');

        // Pre-fill card names from userProfile if available (user can customize)
        setFormData(prev => ({
          ...prev,
          cardFirstName: profile.firstName || '',
          cardLastName: profile.lastName || ''
        }));

        console.log('Configure: Pre-filled card name from profile:', {
          cardFirstName: profile.firstName,
          cardLastName: profile.lastName,
          country: profile.country
        });
      } catch (error) {
        console.error('Error parsing user profile:', error);
      }
    }
  }, []);

  // Admin-configured prices (these would come from admin panel)
  const prices: Record<BaseMaterial, number> = {
    pvc: 69,
    wood: 79,
    metal: 99
  };

  // Define dependencies
  const textureOptions: Record<BaseMaterial, TextureOption[]> = {
    pvc: ['matte', 'glossy'],
    wood: ['none'],
    metal: ['matte', 'brushed']
  };

  const colourOptions: Record<BaseMaterial, ColourOption[]> = {
    pvc: ['white', 'black-pvc'],
    wood: ['cherry', 'birch'],
    metal: ['black-metal', 'silver', 'rose-gold']
  };

  // Base materials with descriptions
  const baseMaterials: Array<{ value: BaseMaterial; label: string; description: string }> = [
    { value: 'pvc', label: 'PVC', description: 'Lightweight and affordable' },
    { value: 'wood', label: 'Wood', description: 'Natural and sustainable' },
    { value: 'metal', label: 'Metal', description: 'Premium and durable' }
  ];

  // All texture options for display
  const allTextures: Array<{ value: TextureOption; label: string; description: string }> = [
    { value: 'matte', label: 'Matte', description: 'Soft anti-reflective finish' },
    { value: 'glossy', label: 'Glossy', description: 'High-shine reflective surface' },
    { value: 'brushed', label: 'Brushed', description: 'Directional brushed pattern' },
    { value: 'none', label: 'Natural', description: 'Natural material texture' }
  ];

  // All colour options for display with exact hex codes
  const allColours: Array<{ value: ColourOption; label: string; hex: string; gradient: string }> = [
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

  // Admin-configured patterns
  const patterns = [
    { id: 1, name: 'Geometric' },
    { id: 2, name: 'Minimalist' },
    { id: 3, name: 'Abstract' }
  ];

  // Check if an option is available based on current base selection
  const isTextureAvailable = (texture: TextureOption): boolean => {
    if (!formData.baseMaterial) return false;
    return textureOptions[formData.baseMaterial].includes(texture);
  };

  const isColourAvailable = (colour: ColourOption): boolean => {
    if (!formData.baseMaterial) return false;
    return colourOptions[formData.baseMaterial].includes(colour);
  };

  // Handle base material change
  const handleBaseMaterialChange = (material: BaseMaterial) => {
    const newFormData: StepData = {
      ...formData,
      baseMaterial: material,
      // Clear texture if not valid for new base
      texture: formData.texture && textureOptions[material].includes(formData.texture)
        ? formData.texture
        : null,
      // Clear colour if not valid for new base
      colour: formData.colour && colourOptions[material].includes(formData.colour)
        ? formData.colour
        : null
    };
    setFormData(newFormData);
    console.log('Base material changed:', newFormData);
  };

  // Handle other selections
  const handleTextureChange = (texture: TextureOption) => {
    if (isTextureAvailable(texture)) {
      setFormData({ ...formData, texture });
    }
  };

  const handleColourChange = (colour: ColourOption) => {
    if (isColourAvailable(colour)) {
      setFormData({ ...formData, colour });
    }
  };

  const handlePatternChange = (patternId: number) => {
    setFormData({ ...formData, pattern: patternId });
  };

  const getPrice = () => {
    if (!formData.baseMaterial) return 0;
    return prices[formData.baseMaterial];
  };

  // Calculate price summary with region-based tax logic
  const calculatePriceSummary = (): PriceSummary | null => {
    const materialPrice = getPrice();
    if (!materialPrice) return null;

    // FIXED: Tax should only be calculated on material price, NOT subscription
    const basePrice = materialPrice;

    // Region-based tax rates
    let taxRate = 0.10; // Default 10%
    let taxLabel = 'VAT (10%)';

    if (userCountry === 'India') {
      taxRate = 0.18;
      taxLabel = 'GST (18%)';
    } else if (userCountry === 'UAE') {
      taxRate = 0.05;
      taxLabel = 'VAT (5%)';
    }

    // FIXED: Tax calculated ONLY on material price (base price)
    const taxAmount = basePrice * taxRate;

    // Total for configure page: material + tax only (subscription shown on payment page)
    const total = basePrice + taxAmount;

    return {
      currency: '$',
      productPlanPrice: PRODUCT_PLAN_PRICE,
      materialPrice,
      appSubscriptionPrice: undefined, // Don't show subscription here
      basePrice,
      customization: 0,
      taxLabel,
      taxRate,
      taxAmount,
      shipping: 0, // Included in base price
      total
    };
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getCardGradient = () => {
    const selectedColor = allColours.find(c => c.value === formData.colour);
    return selectedColor?.gradient || 'from-gray-200 to-gray-300';
  };

  const getTextColor = () => {
    // Return white text for dark backgrounds, black for light backgrounds
    const darkBackgrounds = ['black-pvc', 'black-metal', 'cherry', 'rose-gold'];
    if (formData.colour && darkBackgrounds.includes(formData.colour)) {
      return 'text-white';
    }
    return 'text-gray-900';
  };

  const handleContinue = () => {
    if (!formData.cardFirstName.trim() || !formData.cardLastName.trim()) {
      alert('Please enter both first and last name for the card');
      return;
    }

    if (!formData.baseMaterial || !formData.texture || !formData.colour || !formData.pattern) {
      alert('Please complete all configuration options');
      return;
    }

    // Set loading state
    setIsLoading(true);

    // Create clean data object for storage
    // Get pattern name from the patterns array
    const selectedPattern = patterns.find(p => p.id === formData.pattern);
    const configData = {
      cardFirstName: formData.cardFirstName.trim(),
      cardLastName: formData.cardLastName.trim(),
      baseMaterial: formData.baseMaterial,
      texture: formData.texture,
      colour: formData.colour,
      pattern: selectedPattern?.name || `Pattern ${formData.pattern}`
    };

    console.log('Configure: Saving card data to localStorage:', configData);

    // Save to localStorage and redirect to checkout
    localStorage.setItem('nfcConfig', JSON.stringify(configData));

    // Verify the data was saved correctly
    const savedData = localStorage.getItem('nfcConfig');
    console.log('Configure: Verified saved data:', savedData);

    router.push('/nfc/checkout');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:items-start">
          {/* Configuration Section - Left Side */}
          <div className="lg:col-span-7 space-y-4 order-2 lg:order-1">

            {/* Step 1: Personalize Name - Compact Modern Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Person className="mr-2 w-5 h-5 text-gray-600" /> Personalize Your Name
                </h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  This name will appear on the card exactly as entered (independent from your profile name)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Card First Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. John"
                        value={formData.cardFirstName}
                        onChange={(e) => {
                          const newFormData = {...formData, cardFirstName: e.target.value};
                          setFormData(newFormData);
                        }}
                        maxLength={15}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                      />
                      <span className="absolute right-2 top-2 text-xs text-gray-400">
                        {formData.cardFirstName.length}/15
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Card Last Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. Doe"
                        value={formData.cardLastName}
                        onChange={(e) => {
                          const newFormData = {...formData, cardLastName: e.target.value};
                          setFormData(newFormData);
                        }}
                        maxLength={15}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                      />
                      <span className="absolute right-2 top-2 text-xs text-gray-400">
                        {formData.cardLastName.length}/15
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Base Material - Modern Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Palette className="mr-2 w-5 h-5 text-gray-600" /> Base Material
                </h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  {baseMaterials.map((material) => (
                    <button
                      key={material.value}
                      onClick={() => handleBaseMaterialChange(material.value)}
                      className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.baseMaterial === material.value
                          ? 'border-red-500 bg-red-50 shadow-md ring-2 ring-red-200'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="text-center">
                        <h3 className={`font-semibold text-sm ${formData.baseMaterial === material.value ? 'text-red-600' : 'text-gray-900'}`}>{material.label}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{material.description}</p>
                        <div className="mt-3 text-lg font-bold text-gray-900">${prices[material.value]}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Combined Texture & Colour in One Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Brush className="mr-2 w-5 h-5 text-gray-600" /> Texture & Colour
                </h2>
              </div>

              <div className="p-4 space-y-4">
                {/* Texture Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Texture</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {allTextures.map((texture) => {
                      const isAvailable = isTextureAvailable(texture.value);
                      const isSelected = formData.texture === texture.value;

                      return (
                        <button
                          key={texture.value}
                          onClick={() => handleTextureChange(texture.value)}
                          disabled={!isAvailable}
                          className={`relative p-3 border-2 rounded-lg transition-all ${
                            !isAvailable
                              ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-100'
                              : isSelected
                                ? 'border-red-500 bg-red-50 shadow-md ring-2 ring-red-200'
                                : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                          }`}
                        >
                          <div className="text-center">
                            <h4 className={`text-xs font-medium ${!isAvailable ? 'text-gray-500' : isSelected ? 'text-red-600' : 'text-gray-900'}`}>
                              {texture.label}
                            </h4>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Colour Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Colour</h3>
                  <div className="flex flex-wrap gap-3">
                    {allColours.map((colour) => {
                      const isAvailable = isColourAvailable(colour.value);
                      const isSelected = formData.colour === colour.value;

                      return (
                        <button
                          key={colour.value}
                          onClick={() => handleColourChange(colour.value)}
                          disabled={!isAvailable}
                          className={`relative group ${!isAvailable ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div
                            className={`w-14 h-14 rounded-xl border-4 transition-all ${
                              isSelected && isAvailable
                                ? 'border-red-500 scale-110 shadow-lg ring-4 ring-red-200'
                                : !isAvailable
                                  ? 'border-gray-200 opacity-50'
                                  : 'border-gray-300 hover:scale-105'
                            }`}
                            style={{
                              backgroundColor: colour.hex,
                              opacity: !isAvailable ? 0.5 : 1
                            }}
                          />
                          <span className={`text-xs mt-1 block text-center font-medium ${
                            !isAvailable ? 'text-gray-500' : isSelected ? 'text-red-600' : 'text-gray-700'
                          }`}>
                            {colour.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {!formData.baseMaterial && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-700 flex items-center">
                      <Warning className="mr-2 w-4 h-4" /> Select a base material to see available options
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Pattern - Modern Compact */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <GridPattern className="mr-2 w-5 h-5 text-gray-600" /> Pattern
                </h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  {patterns.map((pattern) => {
                    const isSelected = formData.pattern === pattern.id;

                    return (
                      <button
                        key={pattern.id}
                        onClick={() => handlePatternChange(pattern.id)}
                        className={`relative p-3 border-2 rounded-xl transition-all ${
                          isSelected
                            ? 'border-red-500 bg-red-50 shadow-md ring-2 ring-red-200'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-2 flex items-center justify-center">
                          <span className={`text-xs font-medium ${isSelected ? 'text-red-600' : 'text-gray-600'}`}>{pattern.name}</span>
                        </div>
                        <span className={`text-xs font-medium ${isSelected ? 'text-red-600' : 'text-gray-700'}`}>{pattern.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Price Breakdown - After Pattern */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5">
                <h3 className="text-sm font-semibold text-gray-900">Price Breakdown</h3>
              </div>
              <div className="p-3">
                {(() => {
                  const priceSummary = calculatePriceSummary();
                  const hasBase = formData.baseMaterial !== null;

                  return (
                    <div className="space-y-1.5 text-sm">
                      {/* Material Price Only */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">
                          Base Material x 1
                        </span>
                        <span className="font-semibold text-gray-900">
                          {hasBase ? formatCurrency(getPrice()) : '—'}
                        </span>
                      </div>

                      {/* Customization - Show as included */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Customization</span>
                        <span className="text-green-600 font-medium">Included</span>
                      </div>

                      {/* Shipping - Show as included */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Shipping</span>
                        <span className="text-green-600 font-medium">Included</span>
                      </div>

                      {/* Tax */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">
                          {priceSummary ? priceSummary.taxLabel : 'VAT (5%)'}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {priceSummary ? formatCurrency(priceSummary.taxAmount) : '—'}
                        </span>
                      </div>

                      {/* Total */}
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-900">Total</span>
                          <span className={`text-xl font-bold ${priceSummary ? 'text-red-500' : 'text-gray-400'}`}>
                            {priceSummary ? formatCurrency(priceSummary.total) : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Info about Tax based on region */}
                      <div className="mt-2 p-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-700 flex items-center">
                          <Info className="mr-1 w-4 h-4" />
                          {userCountry === 'India'
                            ? 'GST (18%) will apply for deliveries to India'
                            : userCountry === 'UAE'
                            ? 'VAT (5%) will apply for deliveries to UAE'
                            : `VAT (10%) will apply for international deliveries`
                          }
                        </p>
                      </div>

                      {/* Warning about incomplete selections */}
                      {(() => {
                        const missingItems = [];
                        if (!formData.cardFirstName?.trim() || !formData.cardLastName?.trim()) {
                          missingItems.push('Card Name');
                        }
                        if (!formData.baseMaterial) {
                          missingItems.push('Base Material');
                        }
                        if (!formData.texture) {
                          missingItems.push('Texture');
                        }
                        if (!formData.colour) {
                          missingItems.push('Colour');
                        }
                        if (!formData.pattern) {
                          missingItems.push('Pattern');
                        }

                        if (missingItems.length > 0) {
                          return (
                            <div className="mt-2 p-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-xs text-amber-700 flex items-center">
                                <Warning className="mr-1 w-4 h-4" /> Please select: <span className="font-semibold ml-1">{missingItems.join(', ')}</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  );
                })()}

                <button
                  onClick={handleContinue}
                  disabled={!formData.baseMaterial || !formData.texture || !formData.colour || !formData.pattern || !formData.cardFirstName?.trim() || !formData.cardLastName?.trim() || isLoading}
                  className={`w-full mt-4 px-6 py-3 rounded-lg font-semibold transition-all shadow-md ${
                    (formData.baseMaterial && formData.texture && formData.colour && formData.pattern && formData.cardFirstName?.trim() && formData.cardLastName?.trim())
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Continue to Checkout →'
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* Live Preview - Right Side */}
          <div className="lg:col-start-8 lg:col-span-5 order-1 lg:order-2">
            <div className="lg:sticky lg:top-32">
                {/* Card Preview - Compact Modern */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
                      <button
                      type="button"
                      className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                      title="AI Assistant"
                    >
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  {/* Front Card */}
                  <div>
                    <div className={`w-full aspect-[1.6/1] bg-gradient-to-br ${getCardGradient()} rounded-xl relative overflow-hidden shadow-lg`}>
                      {/* AI Icon top right - Plain, no border/shadow */}
                      <div className="absolute top-4 right-4">
                        <img
                          src={formData.colour === 'white' ? '/ai2.png' : '/ai1.png'}
                          alt="AI Assistant"
                          className={`w-6 h-6 ${formData.colour === 'white' ? '' : 'invert'}`}
                        />
                      </div>

                      {/* User Initials or Name */}
                      <div className="absolute bottom-6 left-6">
                        {(() => {
                          const firstName = formData.cardFirstName?.trim() || '';
                          const lastName = formData.cardLastName?.trim() || '';
                          const isSingleCharOnly = firstName.length <= 1 && lastName.length <= 1;

                          if (isSingleCharOnly) {
                            return (
                              <div className={`${getTextColor()} text-2xl font-light`}>
                                {(firstName || 'J').toUpperCase()}{(lastName || 'D').toUpperCase()}
                              </div>
                            );
                          } else {
                            return (
                              <div className={`${getTextColor()} text-base font-medium`}>
                                {firstName} {lastName}
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                    <div className="text-center text-sm text-gray-600">Front</div>
                  </div>

                  {/* Back Card */}
                  <div>
                    <div className={`w-full aspect-[1.6/1] bg-gradient-to-br ${getCardGradient()} rounded-xl relative overflow-hidden shadow-lg`}>
                      {/* Linkist Logo Center */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <img
                          src="/logo_linkist.png"
                          alt="Linkist"
                          className="h-16 w-auto mb-4"
                        />
                        <div className={`${getTextColor()} text-sm font-medium tracking-wider`}>FOUNDING MEMBER</div>
                        <div className="absolute bottom-1 right-4">
                        {/* <img src="/nfc2.png" alt="NFC" className="w-12 h-12" /> */}
                      </div>
                      </div>

                      {/* NFC Symbol - vertically centered on right side */}
                      <div className="absolute top-1/2 -translate-y-1/2 right-4">
                        <img src="/nfc2.png" alt="NFC" className="w-9 h-9" />
                      </div>
                    </div>
                    <div className="text-center text-sm text-gray-600 mt-2">Back</div>
                  </div>
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