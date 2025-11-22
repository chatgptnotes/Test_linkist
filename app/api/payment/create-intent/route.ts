import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Helper function to get Stripe instance
function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Stripe secret key not configured');
  }
  return new Stripe(secretKey, {
    apiVersion: '2024-09-30.acacia',
  });
}

// Helper function to get Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

// Helper function to validate and calculate voucher discount
async function calculateVoucherDiscount(
  voucherCode: string,
  originalAmount: number,
  userEmail?: string
): Promise<{ discountAmount: number; finalAmount: number; voucherId: string } | null> {
  const supabase = getSupabaseClient();

  // Fetch voucher
  const { data: voucher, error } = await supabase
    .from('vouchers')
    .select('*')
    .eq('code', voucherCode)
    .eq('is_active', true)
    .single();

  if (error || !voucher) {
    return null;
  }

  // Check expiry
  const now = new Date();
  const validFrom = new Date(voucher.valid_from);
  const validUntil = voucher.valid_until ? new Date(voucher.valid_until) : null;

  if (now < validFrom || (validUntil && now > validUntil)) {
    return null;
  }

  // Check usage limit
  if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
    return null;
  }

  // Check user limit if email provided
  if (userEmail && voucher.user_limit) {
    const { count } = await supabase
      .from('voucher_usage')
      .select('*', { count: 'exact', head: true })
      .eq('voucher_id', voucher.id)
      .eq('user_email', userEmail);

    if (count && count >= voucher.user_limit) {
      return null;
    }
  }

  // Check minimum order value
  if (originalAmount < voucher.min_order_value) {
    return null;
  }

  // Calculate discount
  let discountAmount = 0;
  if (voucher.discount_type === 'percentage') {
    discountAmount = (originalAmount * voucher.discount_value) / 100;
    // Apply max discount cap if set
    if (voucher.max_discount_amount && discountAmount > voucher.max_discount_amount) {
      discountAmount = voucher.max_discount_amount;
    }
  } else {
    // Fixed discount
    discountAmount = voucher.discount_value;
  }

  // Ensure discount doesn't exceed order amount
  discountAmount = Math.min(discountAmount, originalAmount);
  const finalAmount = Math.max(originalAmount - discountAmount, 0);

  return {
    discountAmount,
    finalAmount,
    voucherId: voucher.id,
  };
}

export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment processing not configured' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { amount, currency = 'usd', orderData, voucherCode, orderId } = body;

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Validate orderId for idempotency
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required for payment processing' },
        { status: 400 }
      );
    }

    // Convert amount to cents for Stripe
    let amountInCents = Math.round(amount * 100);
    let discountAmount = 0;
    let voucherId: string | null = null;

    // Apply voucher discount if provided
    if (voucherCode) {
      const voucherResult = await calculateVoucherDiscount(
        voucherCode,
        amount,
        orderData?.email
      );

      if (voucherResult) {
        discountAmount = voucherResult.discountAmount;
        amountInCents = Math.round(voucherResult.finalAmount * 100);
        voucherId = voucherResult.voucherId;
      }
    }

    // Ensure minimum charge amount (Stripe requires at least $0.50 USD)
    if (amountInCents < 50) {
      return NextResponse.json(
        { error: 'Payment amount too small. Minimum $0.50 required.' },
        { status: 400 }
      );
    }

    // Initialize Stripe only when needed
    const stripe = getStripe();

    // Generate idempotency key from orderId to prevent duplicate payment intents
    // This ensures that retrying the same order always returns the same payment intent
    const idempotencyKey = `order_${orderId}_payment_intent`;

    // Create a payment intent with idempotency key
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId: orderId,
        customerName: orderData?.customerName || '',
        email: orderData?.email || '',
        orderType: 'NFC Card',
        originalAmount: amount.toString(),
        discountAmount: discountAmount.toString(),
        voucherCode: voucherCode || '',
        voucherId: voucherId || '',
        // Add pricing breakdown for webhook
        subtotal: (orderData?.pricing?.subtotal || orderData?.subtotal || '0').toString(),
        shipping: (orderData?.pricing?.shipping || orderData?.shipping || '0').toString(),
        tax: (orderData?.pricing?.tax || orderData?.tax || '0').toString(),
      },
    }, {
      idempotencyKey: idempotencyKey,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountInCents,
      originalAmount: Math.round(amount * 100),
      discountAmount: Math.round(discountAmount * 100),
      voucherApplied: !!voucherCode && !!voucherId,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      {
        error: 'Failed to create payment intent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}