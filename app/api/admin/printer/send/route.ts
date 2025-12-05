import { NextRequest, NextResponse } from 'next/server'
import { SupabaseOrderStore } from '@/lib/supabase-order-store'
import { PrinterSettingsStore } from '@/lib/supabase-printer-settings-store'
import { printerBatchEmail, PrinterOrderData } from '@/lib/email-templates'
import { sendOrderEmail } from '@/lib/smtp-email-service'

// API key for cron authentication (optional but recommended)
const CRON_API_KEY = process.env.CRON_API_KEY

/**
 * POST /api/admin/printer/send
 * Called by external cron service (cron-job.org) at scheduled time
 * or manually from admin UI
 *
 * Auth: Bearer token (CRON_API_KEY) for cron, or admin session for manual trigger
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication - either cron API key or admin session
    const authHeader = request.headers.get('authorization')
    const isCronRequest = authHeader?.startsWith('Bearer ')

    if (isCronRequest) {
      // Verify cron API key
      const providedKey = authHeader?.replace('Bearer ', '')
      if (CRON_API_KEY && providedKey !== CRON_API_KEY) {
        console.error('🚫 Invalid cron API key')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }
    // For non-cron requests, you may want to add admin session verification here

    console.log('🖨️ Starting printer email send process...')

    // Get printer settings
    const settings = await PrinterSettingsStore.get()
    if (!settings) {
      console.log('⚠️ No printer settings configured')
      return NextResponse.json({
        success: false,
        message: 'Printer settings not configured. Please configure in Admin Settings.'
      }, { status: 400 })
    }

    if (!settings.isEnabled && isCronRequest) {
      console.log('⏸️ Printer notifications are disabled')
      return NextResponse.json({
        success: false,
        message: 'Printer notifications are disabled'
      })
    }

    if (!settings.printerEmail) {
      console.log('⚠️ No printer email configured')
      return NextResponse.json({
        success: false,
        message: 'Printer email address not configured'
      }, { status: 400 })
    }

    // Get unsent orders for today
    const pendingOrders = await SupabaseOrderStore.getUnsentToPrinter()

    if (pendingOrders.length === 0) {
      console.log('📭 No pending orders to send')
      return NextResponse.json({
        success: true,
        message: 'No pending orders to send to printer',
        orderCount: 0
      })
    }

    console.log(`📋 Found ${pendingOrders.length} orders to send to printer`)

    // Format orders for email template
    const printerOrders: PrinterOrderData[] = pendingOrders.map(order => ({
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
    }))

    // Generate email content
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const emailHtml = printerBatchEmail(printerOrders, today)

    console.log(`📧 Sending email to ${settings.printerEmail}...`)

    // Send email
    const result = await sendOrderEmail({
      to: settings.printerEmail,
      subject: `Linkist Print Orders - ${today} (${pendingOrders.length} order${pendingOrders.length !== 1 ? 's' : ''})`,
      html: emailHtml,
    })

    if (!result.success) {
      console.error('❌ Failed to send printer email:', result.error)
      // Ensure error is a string for proper display in UI
      const errorMessage = typeof result.error === 'string'
        ? result.error
        : (result.error as any)?.message || 'Failed to send email'
      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: 500 })
    }

    console.log('✅ Email sent successfully, marking orders as sent...')

    // Mark orders as sent to printer
    const orderIds = pendingOrders.map(o => o.id)
    await SupabaseOrderStore.markAsSentToPrinter(orderIds)

    // Update last sent timestamp
    await PrinterSettingsStore.updateLastSent()

    const response = {
      success: true,
      message: `Sent ${pendingOrders.length} order(s) to printer at ${settings.printerEmail}`,
      orderCount: pendingOrders.length,
      orderNumbers: pendingOrders.map(o => o.orderNumber),
      messageId: result.id,
      sentAt: new Date().toISOString()
    }

    console.log('🎉 Printer email process completed:', response)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Printer send error:', error)
    return NextResponse.json(
      { error: 'Failed to send printer email', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/printer/send
 * Manual trigger from admin UI - same functionality as POST
 */
export async function GET(request: NextRequest) {
  // For GET requests (manual trigger from admin), just call POST handler
  return POST(request)
}
