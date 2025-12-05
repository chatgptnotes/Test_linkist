import { NextRequest, NextResponse } from 'next/server'
import { SupabaseOrderStore } from '@/lib/supabase-order-store'
import { PrinterSettingsStore } from '@/lib/supabase-printer-settings-store'
import { printerBatchEmail, PrinterOrderData } from '@/lib/email-templates'
import { sendOrderEmail } from '@/lib/smtp-email-service'

/**
 * POST /api/admin/orders/[id]/resend-printer
 * Resend a single order to the printer (for re-printing purposes)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Note: In production, add admin authentication check here

    const { id: orderId } = await params

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    console.log(`🖨️ Resending order ${orderId} to printer...`)

    // Get the order
    const order = await SupabaseOrderStore.getById(orderId)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Get printer settings
    const settings = await PrinterSettingsStore.get()
    if (!settings || !settings.printerEmail) {
      return NextResponse.json({
        error: 'Printer email not configured. Please configure in Admin Settings.'
      }, { status: 400 })
    }

    // Format order for email
    const printerOrder: PrinterOrderData = {
      orderNumber: order.orderNumber,
      cardConfig: {
        cardFirstName: order.cardConfig.cardFirstName,
        cardLastName: order.cardConfig.cardLastName,
        firstName: order.cardConfig.firstName,
        lastName: order.cardConfig.lastName,
        title: order.cardConfig.title,
        baseMaterial: order.cardConfig.baseMaterial,
        color: order.cardConfig.color,
        colour: order.cardConfig.colour,
        texture: order.cardConfig.texture,
        pattern: order.cardConfig.pattern,
        quantity: order.cardConfig.quantity || 1,
      },
      shipping: {
        fullName: order.shipping.fullName,
        addressLine1: order.shipping.addressLine1,
        addressLine2: order.shipping.addressLine2,
        city: order.shipping.city,
        state: order.shipping.state,
        country: order.shipping.country,
        postalCode: order.shipping.postalCode,
        phoneNumber: order.shipping.phoneNumber,
      },
    }

    // Generate email content
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const emailHtml = printerBatchEmail([printerOrder], today)

    console.log(`📧 Sending RESEND email to ${settings.printerEmail}...`)

    // Send email with RESEND in subject
    const result = await sendOrderEmail({
      to: settings.printerEmail,
      subject: `[RESEND] Linkist Print Order - ${order.orderNumber}`,
      html: emailHtml,
    })

    if (!result.success) {
      console.error('❌ Failed to resend order to printer:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send email'
      }, { status: 500 })
    }

    // Update the order's printer sent status
    await SupabaseOrderStore.markSingleOrderAsSentToPrinter(orderId)

    const response = {
      success: true,
      message: `Order ${order.orderNumber} resent to printer at ${settings.printerEmail}`,
      orderNumber: order.orderNumber,
      messageId: result.id,
      sentAt: new Date().toISOString()
    }

    console.log('✅ Order resent to printer:', response)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Resend to printer error:', error)
    return NextResponse.json(
      { error: 'Failed to resend order to printer', details: String(error) },
      { status: 500 }
    )
  }
}
