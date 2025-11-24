import { NextRequest, NextResponse } from 'next/server';
import { SupabaseOrderStore, generateOrderNumber, OrderPlanType } from '@/lib/supabase-order-store';
import { SupabaseUserStore } from '@/lib/supabase-user-store';
import { SupabasePaymentStore } from '@/lib/supabase-payment-store';
import { SupabaseShippingAddressStore } from '@/lib/supabase-shipping-address-store';
import { formatOrderForEmail } from '@/lib/order-store';
import { emailService } from '@/lib/email-service';
import { createClient } from '@/lib/supabase/client';
import { calculatePricing } from '@/lib/pricing-utils';

export async function POST(request: NextRequest) {
  console.log('🚀 [process-order] API called');

  try {
    const body = await request.json();
    console.log('📦 [process-order] Request body received:', {
      hasCardConfig: !!body.cardConfig,
      hasCheckoutData: !!body.checkoutData,
      hasPaymentData: !!body.paymentData,
      hasOrderId: !!body.orderId
    });

    const { cardConfig, checkoutData, paymentData, orderId, pricing } = body;

    console.log('🔍 [process-order] Received data:', {
      cardConfig,
      checkoutData,
      paymentData: paymentData ? 'present' : 'null',
      orderId,
      pricing
    });

    if (!cardConfig || !checkoutData) {
      console.error('❌ [process-order] Missing required data:', {
        cardConfig: !!cardConfig,
        checkoutData: !!checkoutData
      });
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    console.log('✅ [process-order] Data validation passed');

    // Calculate pricing - use provided pricing if available (for digital-only $0 orders)
    let subtotal, shippingAmount, taxAmount, totalAmount;

    if (pricing) {
      // Use provided pricing from checkout
      subtotal = pricing.subtotal || 0;
      shippingAmount = pricing.shipping || 0;
      taxAmount = pricing.tax || 0;
      totalAmount = pricing.total || 0;
    } else {
      // FALLBACK: This should not happen - pricing should always be provided from checkout
      console.warn('⚠️ [process-order] No pricing provided! Using fallback values (this may be incorrect)');
      console.warn('⚠️ [process-order] Checkout page should send calculated pricing in the request');

      // Set to 0 as fallback - better than using outdated hardcoded values
      const quantity = cardConfig.quantity || 1;
      subtotal = 0;
      shippingAmount = 0;
      taxAmount = 0;
      totalAmount = 0;

      console.error('❌ [process-order] Cannot calculate pricing without pricing data from checkout');
    }

    console.log('💰 [process-order] Pricing calculated:', {
      subtotal,
      shippingAmount,
      taxAmount,
      totalAmount,
      providedPricing: !!pricing
    });

    // VALIDATION: Check if pricing looks suspiciously low (might be missing app subscription)
    // For physical cards (non-digital), total should be at least material price + tax
    // App subscription ($120) should be included unless user is founding member
    const MIN_EXPECTED_TOTAL = 50; // Minimum threshold to catch obvious errors

    if (cardConfig.baseMaterial !== 'digital' && totalAmount > 0 && totalAmount < MIN_EXPECTED_TOTAL) {
      console.warn('⚠️ [process-order] PRICING VALIDATION WARNING: Total amount seems suspiciously low');
      console.warn('⚠️ [process-order] This might indicate missing app subscription fee');
      console.warn('⚠️ [process-order] Provided pricing:', { subtotal, taxAmount, totalAmount });

      // Attempt to recalculate using unified pricing utility as a sanity check
      try {
        const recalculated = calculatePricing({
          cardConfig: {
            baseMaterial: cardConfig.baseMaterial,
            quantity: cardConfig.quantity || 1,
          },
          country: checkoutData.country || 'US',
          isFoundingMember: false, // Assume not founding member for validation
          includeAppSubscription: true,
        });

        console.warn('⚠️ [process-order] Recalculated pricing (with app subscription):', {
          materialPrice: recalculated.materialPrice,
          appSubscriptionPrice: recalculated.appSubscriptionPrice,
          taxAmount: recalculated.taxAmount,
          totalBeforeDiscount: recalculated.totalBeforeDiscount,
        });

        // Log the discrepancy for admin review
        console.error('🚨 [process-order] PRICING MISMATCH DETECTED!');
        console.error('🚨 Received total:', totalAmount);
        console.error('🚨 Expected total (non-founding):', recalculated.totalBeforeDiscount);
        console.error('🚨 Difference:', Math.abs(totalAmount - recalculated.totalBeforeDiscount));
      } catch (validationError) {
        console.error('❌ [process-order] Error during pricing validation:', validationError);
      }
    }

    // Create/update user in database
    console.log('👤 [process-order] Creating/updating user in database...');

    let user;
    try {
      user = await SupabaseUserStore.upsertByEmail({
        email: checkoutData.email,
        first_name: checkoutData.fullName?.split(' ')[0] || cardConfig.firstName,
        last_name: checkoutData.fullName?.split(' ').slice(1).join(' ') || cardConfig.lastName,
        phone_number: checkoutData.phoneNumber || null,
        email_verified: true, // They completed checkout, so email is verified
        mobile_verified: !!checkoutData.phoneNumber, // If they provided phone, assume verified
      });

      console.log('✅ [process-order] User created/updated:', {
        userId: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      });
    } catch (userError) {
      console.error('❌ [process-order] Error creating/updating user:', userError);
      throw new Error(`User creation failed: ${userError instanceof Error ? userError.message : 'Unknown error'}`);
    }

    // Determine order status - 'pending' if called from checkout, 'confirmed' if has payment
    const orderStatus = paymentData ? 'confirmed' : 'pending';

    let order;

    // Update existing order if orderId provided (payment flow), otherwise create new order (checkout flow)
    if (orderId) {
      console.log(`🔄 [process-order] Updating existing order ${orderId} with payment details...`);

      // Check if orderId is a UUID or order number
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

      let existingOrder;
      if (isUUID) {
        // It's a UUID, fetch by ID
        existingOrder = await SupabaseOrderStore.getById(orderId);
      } else {
        // It's an order number, fetch by order number
        existingOrder = await SupabaseOrderStore.getByOrderNumber(orderId);
      }

      if (!existingOrder) {
        console.error('❌ [process-order] Order not found:', orderId);
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      console.log('✅ [process-order] Found existing order:', {
        id: existingOrder.id,
        orderNumber: existingOrder.orderNumber
      });

      // Build update object with payment data
      const updateData: any = {
        status: orderStatus,
      };

      if (paymentData) {
        updateData.paymentMethod = paymentData.paymentMethod;
        updateData.paymentId = paymentData.paymentId;
        updateData.voucherCode = paymentData.voucherCode || null;
        updateData.voucherDiscount = paymentData.voucherDiscount || 0;

        // FIXED: Update pricing.total to reflect the final amount paid (after voucher discount)
        if (paymentData.voucherAmount && paymentData.voucherAmount > 0) {
          const originalTotal = existingOrder.pricing?.total || 0;
          const finalTotal = Math.max(0, originalTotal - paymentData.voucherAmount);

          updateData.pricing = {
            ...existingOrder.pricing,
            totalBeforeDiscount: originalTotal, // Save original total for reference
            total: finalTotal, // Update to actual amount paid
            voucherAmount: paymentData.voucherAmount, // Save voucher discount amount
          };

          console.log('💰 [process-order] Updating pricing with voucher discount:', {
            originalTotal,
            voucherAmount: paymentData.voucherAmount,
            finalTotal,
          });
        }
      }

      // Update using the UUID from the existing order
      order = await SupabaseOrderStore.update(existingOrder.id, updateData);

      if (!order) {
        console.error('❌ [process-order] Failed to update order in database');
        return NextResponse.json(
          { error: 'Failed to update order' },
          { status: 500 }
        );
      }

      console.log('✅ [process-order] Order updated successfully:', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status
      });

    } else {
      // Create new order
      console.log(`📝 [process-order] Creating new order in database with status: ${orderStatus}...`);

      // Determine plan type for order ID generation
      let planType: OrderPlanType = 'nfc-card-full'; // Default: NFC Card + Digital Profile + Linkist App

      // Check if it's a digital-only order (free tier)
      if (cardConfig.isDigitalOnly && totalAmount === 0) {
        planType = 'digital-only';
        console.log('📋 [process-order] Plan type: Digital Only (FREE)');
      }
      // Check if it's digital profile + app (digital with subscription)
      else if (cardConfig.baseMaterial === 'digital' && (cardConfig.isDigitalOnly || totalAmount > 0)) {
        planType = 'digital-profile-app';
        console.log('📋 [process-order] Plan type: Digital Profile + Linkist App');
      }
      // Physical NFC card + digital profile + app
      else {
        planType = 'nfc-card-full';
        console.log('📋 [process-order] Plan type: NFC Digital Card + Digital Profile + Linkist App');
      }

      try {
        order = await SupabaseOrderStore.create({
          orderNumber: await generateOrderNumber(planType),
          userId: user.id, // Link order to user
          status: orderStatus,
          customerName: checkoutData.fullName,
          email: checkoutData.email,
          phoneNumber: checkoutData.phoneNumber || '',
          cardConfig: cardConfig,
          pricing: {
            subtotal,
            shipping: shippingAmount,
            tax: taxAmount,
            total: totalAmount,
          },
          shipping: {
            fullName: checkoutData.fullName,
            addressLine1: checkoutData.addressLine1,
            addressLine2: checkoutData.addressLine2,
            city: checkoutData.city,
            state: checkoutData.state,
            country: checkoutData.country,
            postalCode: checkoutData.postalCode,
            phoneNumber: checkoutData.phoneNumber || '',
          },
          estimatedDelivery: 'Sep 06, 2025',
          emailsSent: {},
        });

        if (!order) {
          console.error('❌ [process-order] Failed to create order in database - returned null');
          throw new Error('Order creation returned null');
        }

        console.log('✅ [process-order] Order created successfully:', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerEmail: order.email,
          status: order.status
        });
      } catch (orderError) {
        console.error('❌ [process-order] Error creating order:', orderError);
        throw new Error(`Order creation failed: ${orderError instanceof Error ? orderError.message : 'Unknown error'}`);
      }
    }

    // Create payment record if payment data provided
    if (paymentData && order) {
      console.log('💳 [process-order] Creating payment record in database...');

      try {
        // Calculate amount in cents (totalAmount is already calculated above)
        const amount = Math.round(totalAmount * 100);

        const payment = await SupabasePaymentStore.create({
          orderId: order.id,
          paymentIntentId: paymentData.paymentId || `payment_${Date.now()}`,
          amount: amount,
          currency: checkoutData.country === 'IN' || checkoutData.country === 'India' ? 'INR' : 'USD',
          status: 'succeeded',
          paymentMethod: paymentData.paymentMethod || 'unknown',
          metadata: {
            voucherCode: paymentData.voucherCode,
            voucherDiscount: paymentData.voucherDiscount,
          },
        });

        console.log('✅ [process-order] Payment record created:', {
          paymentId: payment.id,
          orderId: payment.orderId,
          amount: payment.amount,
          status: payment.status
        });

        // Track voucher usage if voucher was used
        if (paymentData.voucherCode) {
          console.log('🎟️ [process-order] Tracking voucher usage...');
          try {
            const supabase = createClient();

            // Get voucher details
            const { data: voucher } = await supabase
              .from('vouchers')
              .select('*')
              .eq('code', paymentData.voucherCode.toUpperCase())
              .single();

            if (voucher) {
              // Calculate discount amount
              let discountAmount = 0;
              if (paymentData.voucherAmount !== undefined && paymentData.voucherAmount !== null) {
                // voucherAmount expected in same currency units as totalAmount (dollars)
                discountAmount = paymentData.voucherAmount;
              } else if (paymentData.voucherDiscount) {
                discountAmount = (totalAmount * paymentData.voucherDiscount) / 100;
              }

              // Create voucher usage record
              await supabase
                .from('voucher_usage')
                .insert({
                  voucher_id: voucher.id,
                  user_id: user.id,
                  user_email: checkoutData.email,
                  order_id: order.id,
                  discount_amount: discountAmount
                });

              // Increment voucher used_count
              await supabase
                .from('vouchers')
                .update({
                  used_count: voucher.used_count + 1
                })
                .eq('id', voucher.id);

              console.log('✅ [process-order] Voucher usage tracked:', {
                voucherCode: paymentData.voucherCode,
                discountAmount,
                newUsedCount: voucher.used_count + 1
              });
            }
          } catch (voucherError) {
            console.error('❌ [process-order] Error tracking voucher usage:', voucherError);
            // Continue even if voucher tracking fails
          }
        }
      } catch (error) {
        console.error('❌ [process-order] Error creating payment record:', error);
        // Continue even if payment record creation fails
        // Order is already created/updated
      }
    }

    // Create shipping address record for the order
    if (order && checkoutData) {
      console.log('📍 [process-order] Creating shipping address record in database...');

      try {
        const shippingAddress = await SupabaseShippingAddressStore.create({
          userId: user.id,
          orderId: order.id,
          fullName: checkoutData.fullName,
          addressLine1: checkoutData.addressLine1,
          addressLine2: checkoutData.addressLine2 || undefined,
          city: checkoutData.city,
          state: checkoutData.state,
          postalCode: checkoutData.postalCode,
          country: checkoutData.country,
          phoneNumber: checkoutData.phoneNumber || undefined,
          isDefault: false, // Don't auto-set as default
        });

        console.log('✅ [process-order] Shipping address record created:', {
          addressId: shippingAddress.id,
          orderId: shippingAddress.orderId,
          userId: shippingAddress.userId,
          city: shippingAddress.city,
          country: shippingAddress.country
        });
      } catch (error) {
        console.error('❌ [process-order] Error creating shipping address record:', error);
        // Continue even if shipping address creation fails
        // Order is already created/updated
      }
    }

    // Only send emails if order is confirmed (has payment)
    let finalOrder = order;
    if (orderStatus === 'confirmed') {
      console.log('📧 [process-order] Sending confirmation and receipt emails...');
      const emailData = formatOrderForEmail(order);
      const emailResults = await emailService.sendOrderLifecycleEmails(emailData);
      console.log('📧 [process-order] Email results:', {
        confirmationSent: emailResults.confirmation.success,
        receiptSent: emailResults.receipt.success
      });

      // Update order with email tracking in Supabase
      console.log('🔄 [process-order] Updating order with email tracking...');
      finalOrder = await SupabaseOrderStore.update(order.id, {
        emailsSent: {
          confirmation: {
            sent: emailResults.confirmation.success,
            timestamp: Date.now(),
            messageId: emailResults.confirmation.messageId
          },
          receipt: {
            sent: emailResults.receipt.success,
            timestamp: Date.now(),
            messageId: emailResults.receipt.messageId
          }
        }
      }) || order;

      console.log('🎉 [process-order] Order processed successfully!', {
        orderId: finalOrder.id,
        orderNumber: finalOrder.orderNumber
      });

      return NextResponse.json({
        success: true,
        order: finalOrder,
        emailResults: emailResults
      });
    } else {
      console.log('⏳ [process-order] Order created as pending, emails will be sent after payment');

      return NextResponse.json({
        success: true,
        order: finalOrder,
        message: 'Order created successfully, awaiting payment'
      });
    }

  } catch (error) {
    console.error('❌ [process-order] Error processing order:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      fullError: error
    });

    // Return more detailed error message in development
    const errorMessage = error instanceof Error ? error.message : 'Failed to process order';
    const detailedError = process.env.NODE_ENV === 'development'
      ? { error: errorMessage, details: error instanceof Error ? error.stack : String(error) }
      : { error: 'Failed to process order' };

    return NextResponse.json(
      detailedError,
      { status: 500 }
    );
  }
}