import { NextRequest, NextResponse } from 'next/server'
import { PrinterSettingsStore } from '@/lib/supabase-printer-settings-store'

// GET - Retrieve printer settings
export async function GET(request: NextRequest) {
  try {
    // Note: In production, add admin authentication check here
    // const session = await getCurrentUser(request)
    // if (!session?.isAdmin) {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
    // }

    const settings = await PrinterSettingsStore.get()

    // Return default settings if none exist
    if (!settings) {
      return NextResponse.json({
        success: true,
        settings: {
          printerEmail: '',
          scheduledHour: 18,
          scheduledMinute: 0,
          timezone: 'Asia/Dubai',
          isEnabled: false,
          lastSentAt: null,
        }
      })
    }

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Error fetching printer settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch printer settings', details: String(error) },
      { status: 500 }
    )
  }
}

// PUT - Update printer settings
export async function PUT(request: NextRequest) {
  try {
    // Note: In production, add admin authentication check here

    const body = await request.json()

    // Validate email format if provided
    if (body.printerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.printerEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate scheduled hour
    if (body.scheduledHour !== undefined) {
      const hour = parseInt(body.scheduledHour)
      if (isNaN(hour) || hour < 0 || hour > 23) {
        return NextResponse.json({ error: 'Invalid scheduled hour (must be 0-23)' }, { status: 400 })
      }
      body.scheduledHour = hour
    }

    // Validate scheduled minute
    if (body.scheduledMinute !== undefined) {
      const minute = parseInt(body.scheduledMinute)
      if (isNaN(minute) || minute < 0 || minute > 59) {
        return NextResponse.json({ error: 'Invalid scheduled minute (must be 0-59)' }, { status: 400 })
      }
      body.scheduledMinute = minute
    }

    const settings = await PrinterSettingsStore.upsert(body)

    if (!settings) {
      return NextResponse.json(
        { error: 'Failed to save printer settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Error updating printer settings:', error)
    return NextResponse.json(
      { error: 'Failed to update printer settings', details: String(error) },
      { status: 500 }
    )
  }
}
