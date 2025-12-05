'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Icon aliases
const CheckCircle = CheckCircleIcon;

interface StepData {
  cardFirstName: string;
  cardLastName: string;
  baseMaterial: 'pvc' | 'wood' | 'stainless_steel';
  texture: 'matte' | 'metal_brushed';
  pattern: number;
  color: 'black' | 'silver' | 'gold';
}

export default function ConfigureNewPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<StepData>({
    cardFirstName: '',
    cardLastName: '',
    baseMaterial: 'stainless_steel',
    texture: 'metal_brushed',
    pattern: 0,
    color: 'black'
  });

  const steps = [
    { number: 1, title: 'Personalize Your Name', completed: false },
    { number: 2, title: 'Select Base Material', completed: false },
    { number: 3, title: 'Choose Design', completed: false }
  ];

  const materials = [
    { id: 'pvc', name: 'PVC', price: 69, description: 'Lightweight, durable and cost-effective' },
    { id: 'wood', name: 'Wood', price: 79, description: 'Natural texture with sustainable appeal' },
    { id: 'stainless_steel', name: 'Stainless Steel', price: 99, description: 'Premium metal finish with ultimate durability', selected: true }
  ];

  const textures = [
    { id: 'matte', name: 'Matte', description: 'Soft anti-reflective finish with elegant sophistication' },
    { id: 'metal_brushed', name: 'Metal Brushed Steel', description: 'Directional brushed pattern with metallic appeal', selected: true }
  ];

  const colors = [
    { id: 'black', name: 'Black', color: '#000000' },
    { id: 'silver', name: 'Silver', color: '#C0C0C0' },
    { id: 'gold', name: 'Gold', color: '#FFD700' }
  ];

  const patterns = [
    { id: 0, name: 'Pattern 1' },
    { id: 1, name: 'Pattern 2' },
    { id: 2, name: 'Pattern 3' },
    { id: 3, name: 'Pattern 4' }
  ];

  const getPrice = () => {
    const basePrices = { pvc: 69, wood: 79, stainless_steel: 99 };
    return basePrices[formData.baseMaterial];
  };

  const handleContinue = () => {
    if (currentStep === 1) {
      if (!formData.cardFirstName.trim() || !formData.cardLastName.trim()) {
        alert('Please enter both first and last name for the card');
        return;
      }
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - redirect to checkout
      // Get pattern name from the patterns array
      const selectedPattern = patterns.find(p => p.id === formData.pattern);
      const configData = {
        ...formData,
        pattern: selectedPattern?.name || `Pattern ${formData.pattern}`
      };
      localStorage.setItem('nfcConfig', JSON.stringify(configData));
      router.push('/nfc/checkout');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                <span className="text-white font-bold">L</span>
              </div>
              <span className="text-xl font-semibold">Linkist</span>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center space-x-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= step.number 
                    ? 'bg-red-500 text-white' 
                    : currentStep > step.number
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.number ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-1 mx-4 ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Side - Form */}
          <div className="space-y-8">
            {/* Step 1: Personalize Name */}
            {currentStep === 1 && (
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Personalize Your Name</h1>
                <p className="text-gray-600 mb-8">
                  Enter the name as you'd like it to appear on your card (independent from your profile name).
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card First Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Jane"
                      value={formData.cardFirstName}
                      onChange={(e) => setFormData({...formData, cardFirstName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    />
                    <div className="text-right text-sm text-gray-500 mt-1">
                      {formData.cardFirstName.length} / 15
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Last Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Doe"
                      value={formData.cardLastName}
                      onChange={(e) => setFormData({...formData, cardLastName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                    />
                    <div className="text-right text-sm text-gray-500 mt-1">
                      {formData.cardLastName.length} / 15
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Select Base Material */}
            {currentStep === 2 && (
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Select Base Material</h1>
                <p className="text-gray-600 mb-8">Each material offers a unique feel and finish.</p>

                <div className="space-y-4">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      onClick={() => setFormData({...formData, baseMaterial: material.id as any})}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.baseMaterial === material.id
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{material.name}</h3>
                          <p className="text-sm text-gray-600">{material.description}</p>
                        </div>
                        <div className="text-xl font-bold text-gray-900">${material.price}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Texture</h3>
                  <div className="space-y-4">
                    {textures.map((texture) => (
                      <div
                        key={texture.id}
                        onClick={() => setFormData({...formData, texture: texture.id as any})}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.texture === texture.id
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <h4 className="font-semibold text-gray-900">{texture.name}</h4>
                        <p className="text-sm text-gray-600">{texture.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Choose Design */}
            {currentStep === 3 && (
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Choose Design</h1>
                <p className="text-gray-600 mb-8">Select pattern and color for your card's background.</p>

                <div className="space-y-8">
                  {/* Pattern Selection */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Pattern</h3>
                    <div className="grid grid-cols-4 gap-3">
                      {patterns.map((pattern) => (
                        <div
                          key={pattern.id}
                          onClick={() => setFormData({...formData, pattern: pattern.id})}
                          className={`aspect-square border-2 rounded-lg cursor-pointer flex items-center justify-center ${
                            formData.pattern === pattern.id
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="w-8 h-8 bg-gray-300 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Color</h3>
                    <div className="flex space-x-4">
                      {colors.map((color) => (
                        <div
                          key={color.id}
                          onClick={() => setFormData({...formData, color: color.id as any})}
                          className={`flex flex-col items-center cursor-pointer ${
                            formData.color === color.id ? 'opacity-100' : 'opacity-60 hover:opacity-80'
                          }`}
                        >
                          <div
                            className={`w-12 h-12 rounded-full border-4 ${
                              formData.color === color.id ? 'border-red-500' : 'border-gray-200'
                            }`}
                            style={{ backgroundColor: color.color }}
                          ></div>
                          <span className="text-sm text-gray-600 mt-2">{color.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-8">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`px-6 py-3 border border-gray-300 rounded-lg font-medium ${
                  currentStep === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                ← Back to {currentStep === 2 ? 'Design' : currentStep === 3 ? 'Material' : 'Start'}
              </button>

              <button
                onClick={handleContinue}
                className="px-8 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                {currentStep === 3 ? 'Continue' : 'Continue'}
              </button>
            </div>
          </div>

          {/* Right Side - Preview & Pricing */}
          <div className="space-y-8">
            {/* Card Preview */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
              
              {/* Front Card */}
              <div className="space-y-4">
                <div className="w-full aspect-[1.6/1] bg-gray-800 rounded-lg relative overflow-hidden">
                  <div className="absolute top-4 left-4 text-white text-xs">
                    {formData.cardFirstName.substring(0, 2).toUpperCase() || 'BT'}
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <div className="w-8 h-1 bg-red-500 mb-1"></div>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-600">Front</div>
              </div>

              {/* Back Card */}
              <div className="space-y-4 mt-6">
                <div className="w-full aspect-[1.6/1] bg-gray-800 rounded-lg relative overflow-hidden">
                  <div className="absolute bottom-4 left-4">
                    <div className="text-red-500 text-xs font-bold">Linkist</div>
                    <div className="text-white text-xs">For Modern Professionals</div>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <div className="w-6 h-6 border-2 border-white rounded"></div>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-600">Back</div>
              </div>
            </div>

            {/* Pricing Summary */}
            {currentStep >= 2 && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Price (Premium Card)</span>
                    <span className="font-medium">${getPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">VAT (@5%)</span>
                    <span className="font-medium">included</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping (Within UAE)</span>
                    <span className="font-medium">included</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Total Price</span>
                      <span className="text-lg font-bold text-red-500">${getPrice().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {currentStep === 3 && (
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                      onClick={handleBack}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleContinue}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Continue
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}