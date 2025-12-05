// Supabase-based printer settings management
// Stores printer email configuration for automated order notifications

import { createClient } from '@supabase/supabase-js'

// Create admin client with service role key for server-side operations
const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Database row type
interface PrinterSettingsRow {
  id: string
  printer_email: string
  scheduled_hour: number
  scheduled_minute: number
  timezone: string
  is_enabled: boolean
  last_sent_at: string | null
  created_at: string
  updated_at: string
}

// Application interface
export interface PrinterSettings {
  id: string
  printerEmail: string
  scheduledHour: number      // 0-23
  scheduledMinute: number    // 0-59
  timezone: string
  isEnabled: boolean
  lastSentAt: number | null
  createdAt: number
  updatedAt: number
}

// Convert database row to application interface
const rowToSettings = (row: PrinterSettingsRow): PrinterSettings => ({
  id: row.id,
  printerEmail: row.printer_email,
  scheduledHour: row.scheduled_hour,
  scheduledMinute: row.scheduled_minute,
  timezone: row.timezone,
  isEnabled: row.is_enabled,
  lastSentAt: row.last_sent_at ? new Date(row.last_sent_at).getTime() : null,
  createdAt: new Date(row.created_at).getTime(),
  updatedAt: new Date(row.updated_at).getTime(),
})

// Convert application interface to database insert/update format
const settingsToRow = (settings: Partial<PrinterSettings>): Partial<PrinterSettingsRow> => {
  const row: Partial<PrinterSettingsRow> = {}

  if (settings.printerEmail !== undefined) row.printer_email = settings.printerEmail
  if (settings.scheduledHour !== undefined) row.scheduled_hour = settings.scheduledHour
  if (settings.scheduledMinute !== undefined) row.scheduled_minute = settings.scheduledMinute
  if (settings.timezone !== undefined) row.timezone = settings.timezone
  if (settings.isEnabled !== undefined) row.is_enabled = settings.isEnabled

  return row
}

export const PrinterSettingsStore = {
  /**
   * Get the current printer settings (singleton - only one row exists)
   */
  get: async (): Promise<PrinterSettings | null> => {
    const supabase = createAdminClient()

    try {
      const { data, error } = await supabase
        .from('printer_settings')
        .select('*')
        .limit(1)
        .single()

      if (error) {
        // PGRST116 means no rows found - return null instead of throwing
        if (error.code === 'PGRST116') {
          console.log('No printer settings found')
          return null
        }
        console.error('Error fetching printer settings:', error)
        return null
      }

      return rowToSettings(data as PrinterSettingsRow)
    } catch (error) {
      console.error('Exception fetching printer settings:', error)
      return null
    }
  },

  /**
   * Create or update printer settings (upsert)
   */
  upsert: async (settings: Partial<PrinterSettings>): Promise<PrinterSettings | null> => {
    const supabase = createAdminClient()

    try {
      // First check if settings exist
      const existing = await PrinterSettingsStore.get()

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('printer_settings')
          .update(settingsToRow(settings))
          .eq('id', existing.id)
          .select()
          .single()

        if (error) {
          console.error('Error updating printer settings:', error)
          return null
        }

        return rowToSettings(data as PrinterSettingsRow)
      } else {
        // Create new
        const insertData = {
          printer_email: settings.printerEmail || 'printer@example.com',
          scheduled_hour: settings.scheduledHour ?? 18,
          scheduled_minute: settings.scheduledMinute ?? 0,
          timezone: settings.timezone || 'Asia/Dubai',
          is_enabled: settings.isEnabled ?? false,
        }

        const { data, error } = await supabase
          .from('printer_settings')
          .insert([insertData])
          .select()
          .single()

        if (error) {
          console.error('Error creating printer settings:', error)
          return null
        }

        return rowToSettings(data as PrinterSettingsRow)
      }
    } catch (error) {
      console.error('Exception upserting printer settings:', error)
      return null
    }
  },

  /**
   * Update the last_sent_at timestamp to current time
   */
  updateLastSent: async (): Promise<boolean> => {
    const supabase = createAdminClient()

    try {
      const { error } = await supabase
        .from('printer_settings')
        .update({ last_sent_at: new Date().toISOString() })
        .not('id', 'is', null) // Update all rows (there's only one due to singleton constraint)

      if (error) {
        console.error('Error updating last_sent_at:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Exception updating last_sent_at:', error)
      return false
    }
  },
}

export default PrinterSettingsStore
