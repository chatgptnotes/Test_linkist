/**
 * Shared Pricing Utilities
 * Single source of truth for order amount calculations
 * Used by checkout and payment pages to ensure consistency
 */

export interface CardConfig {
  baseMaterial?: 'pvc' | 'metal' | 'wood' | 'digital';
  quantity?: number;
}

export interface PricingBreakdown {
  materialPrice: number;
  quantity: number;
  subtotal: number;
  appSubscriptionPrice: number;
  taxRate: number;
  taxAmount: number;
  shippingCost: number;
  totalBeforeDiscount: number;
  totalWithoutAppSubscription: number; // For voucher validation
}

export interface CalculatePricingOptions {
  cardConfig: CardConfig;
  country: string;
  isFoundingMember: boolean;
  includeAppSubscription?: boolean; // Default: true
}

// Material base prices (USD)
export const materialPrices: Record<string, number> = {
  pvc: 69,
  metal: 99,
  wood: 79,
  digital: 59,
};

// App subscription price (USD)
export const APP_SUBSCRIPTION_PRICE = 120;

// Tax rates by country
export const TAX_RATES: Record<string, number> = {
  IN: 0.18, // India - 18% GST
  US: 0.08, // USA - varies by state, using average
  CA: 0.13, // Canada - varies by province
  GB: 0.20, // UK - 20% VAT
  AU: 0.10, // Australia - 10% GST
  // Add more countries as needed
};

// Default tax rate for unlisted countries
export const DEFAULT_TAX_RATE = 0.05;

// Shipping cost (flat rate for now)
export const SHIPPING_COST = 0; // Free shipping

/**
 * Calculate comprehensive pricing breakdown
 * This is the SINGLE SOURCE OF TRUTH for all pricing calculations
 */
export function calculatePricing(options: CalculatePricingOptions): PricingBreakdown {
  const {
    cardConfig,
    country,
    isFoundingMember,
    includeAppSubscription = true,
  } = options;

  // Get base material price
  const materialPrice = cardConfig?.baseMaterial
    ? materialPrices[cardConfig.baseMaterial] || 69
    : 69;

  // Get quantity
  const quantity = cardConfig?.quantity || 1;

  // Calculate subtotal (material cost only)
  const subtotal = materialPrice * quantity;

  // App subscription price (founding members get it free)
  let appSubscriptionPrice = 0;
  if (includeAppSubscription && !isFoundingMember && cardConfig?.baseMaterial !== 'digital') {
    appSubscriptionPrice = APP_SUBSCRIPTION_PRICE * quantity;
  } else if (includeAppSubscription && !isFoundingMember && cardConfig?.baseMaterial === 'digital') {
    // Digital cards get single subscription, not per quantity
    appSubscriptionPrice = APP_SUBSCRIPTION_PRICE;
  }

  // Get tax rate for country
  const taxRate = TAX_RATES[country] || DEFAULT_TAX_RATE;

  // FIXED: Calculate tax ONLY on material price (base price), NOT on subscription
  // Tax should only apply to the physical product, not the digital subscription
  const taxAmount = subtotal * taxRate;

  // Shipping cost
  const shippingCost = SHIPPING_COST;

  // Total before discount
  const totalBeforeDiscount = subtotal + appSubscriptionPrice + taxAmount + shippingCost;

  // Total without app subscription (for voucher validation consistency)
  const totalWithoutAppSubscription = subtotal + taxAmount + shippingCost;

  return {
    materialPrice,
    quantity,
    subtotal,
    appSubscriptionPrice,
    taxRate,
    taxAmount,
    shippingCost,
    totalBeforeDiscount,
    totalWithoutAppSubscription,
  };
}

/**
 * Get order amount for voucher validation
 * This ensures consistent validation across checkout and payment pages
 *
 * IMPORTANT: Always use this for voucher validation API calls
 */
export function getOrderAmountForVoucher(options: CalculatePricingOptions): number {
  const pricing = calculatePricing({
    ...options,
    includeAppSubscription: true, // Always include for consistent validation
  });

  // Return total before discount (includes app subscription, tax, shipping)
  return pricing.totalBeforeDiscount;
}

/**
 * Validate pricing data from localStorage or API
 * Returns true if all required fields exist
 */
export function validatePricingData(pricing: any): boolean {
  if (!pricing) return false;

  const requiredFields = [
    'materialPrice',
    'quantity',
    'subtotal',
    'taxAmount',
    'totalBeforeDiscount',
  ];

  return requiredFields.every(field => {
    const value = pricing[field];
    return value !== undefined && value !== null && !isNaN(value);
  });
}

/**
 * Format price for display
 */
export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Calculate discount amount based on voucher type
 */
export function calculateDiscountAmount(
  orderAmount: number,
  discountType: 'percentage' | 'fixed',
  discountValue: number,
  maxDiscountAmount?: number
): number {
  let discount = 0;

  if (discountType === 'percentage') {
    discount = (orderAmount * discountValue) / 100;
  } else {
    discount = discountValue;
  }

  // Apply max discount cap if specified
  if (maxDiscountAmount && discount > maxDiscountAmount) {
    discount = maxDiscountAmount;
  }

  // Discount cannot exceed order amount
  if (discount > orderAmount) {
    discount = orderAmount;
  }

  return Math.round(discount * 100) / 100; // Round to 2 decimals
}
