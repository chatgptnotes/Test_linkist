// Supabase-based profile management system
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

// Profile interface matching database schema
export interface SupabaseProfile {
  id: string
  user_id: string | null
  email: string
  first_name: string | null
  last_name: string | null
  phone_number: string | null
  company: string | null
  is_founder_member: boolean
  avatar_url: string | null
  preferences: Record<string, any>
  created_at: string
  updated_at: string
  job_title: string | null
  company_name: string | null
  company_website: string | null
  company_address: string | null
  company_logo_url: string | null
  industry: string | null
  sub_domain: string | null
  skills: string[]
  professional_summary: string | null
  profile_photo_url: string | null
  background_image_url: string | null
  social_links: Record<string, any>
  display_settings: Record<string, any>
  primary_email: string | null
  alternate_email: string | null
  mobile_number: string | null
  whatsapp_number: string | null
  custom_url: string | null
  profile_url: string | null
}

// Input type for creating/updating profiles
export interface ProfileInput {
  email: string
  user_id?: string | null
  first_name?: string | null
  last_name?: string | null
  phone_number?: string | null
  company?: string | null
  is_founder_member?: boolean
  avatar_url?: string | null
  custom_url?: string | null
  profile_url?: string | null
  preferences?: {
    // Basic Information
    salutation?: string
    secondaryEmail?: string
    whatsappNumber?: string
    showEmailPublicly?: boolean
    showMobilePublicly?: boolean
    showWhatsappPublicly?: boolean

    // Professional Information
    jobTitle?: string
    companyWebsite?: string
    companyAddress?: string
    companyLogo?: string | null
    industry?: string
    subDomain?: string
    skills?: string[]
    professionalSummary?: string
    showJobTitle?: boolean
    showCompanyName?: boolean
    showCompanyWebsite?: boolean
    showCompanyAddress?: boolean
    showIndustry?: boolean
    showSkills?: boolean

    // Social & Digital Presence
    linkedinUrl?: string
    instagramUrl?: string
    facebookUrl?: string
    twitterUrl?: string
    behanceUrl?: string
    dribbbleUrl?: string
    githubUrl?: string
    youtubeUrl?: string
    showLinkedin?: boolean
    showInstagram?: boolean
    showFacebook?: boolean
    showTwitter?: boolean
    showBehance?: boolean
    showDribbble?: boolean
    showGithub?: boolean
    showYoutube?: boolean

    // Profile Photo & Background
    backgroundImage?: string | null
    showProfilePhoto?: boolean
    showBackgroundImage?: boolean

    // Media Gallery
    photos?: Array<{ id: string; url: string; title: string; showPublicly: boolean }>
    videos?: Array<{ id: string; url: string; title: string; showPublicly: boolean }>

    // Certifications
    certifications?: Array<{ id: string; name: string; title: string; url: string; size: number; type: string; showPublicly: boolean }>
  }
}

export const SupabaseProfileStore = {
  /**
   * Create a new profile or update existing profile by user_id
   * @param input - Profile data to save
   * @param userId - Authenticated user ID (required)
   * @param existingProfileId - Optional existing profile ID to update
   */
  upsertByEmail: async (input: ProfileInput, userId: string, existingProfileId?: string): Promise<SupabaseProfile> => {
    const supabase = createAdminClient()

    console.log('🔍 [SupabaseProfileStore] Upserting profile for user:', userId, 'existingProfileId:', existingProfileId)

    // If existingProfileId is provided, fetch and update that specific profile
    // Otherwise, query via profile_users junction table to find user's profile
    let existingProfile: any = null
    let fetchError: any = null

    if (existingProfileId) {
      // Fetch specific profile and verify it belongs to this user
      const { data: profileResult, error } = await supabase
        .from('profile_users')
        .select(`
          profile_id,
          profiles (*)
        `)
        .eq('user_id', userId)
        .eq('profile_id', existingProfileId)
        .maybeSingle()

      existingProfile = profileResult?.profiles
      fetchError = error
    } else {
      // Try to find any existing profile for this user via junction table
      const { data: profileResult, error } = await supabase
        .from('profile_users')
        .select(`
          profile_id,
          profiles (*)
        `)
        .eq('user_id', userId)
        .maybeSingle()

      existingProfile = profileResult?.profiles
      fetchError = error

      // FALLBACK: If no junction entry found, check profiles table directly by email
      // This handles cases where profile exists but junction table link is missing (e.g., after migration)
      if (!existingProfile && input.email) {
        console.log('🔍 [SupabaseProfileStore] No junction entry found, checking profiles table by email...')
        const { data: profileByEmail, error: emailError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', input.email)
          .maybeSingle()

        if (profileByEmail && !emailError) {
          console.log('✅ [SupabaseProfileStore] Found existing profile by email, will update it')
          existingProfile = profileByEmail
          fetchError = null  // Clear fetchError so UPDATE path is taken
        }
      }
    }

    if (existingProfile && !fetchError) {
      // Update existing profile
      console.log('📝 [SupabaseProfileStore] Profile exists, updating...')

      const updates: any = {
        updated_at: new Date().toISOString()
      }

      if (input.user_id !== undefined) updates.user_id = input.user_id
      if (input.first_name !== undefined) updates.first_name = input.first_name
      if (input.last_name !== undefined) updates.last_name = input.last_name
      if (input.phone_number !== undefined) updates.phone_number = input.phone_number
      if (input.company !== undefined) updates.company = input.company
      if (input.is_founder_member !== undefined) updates.is_founder_member = input.is_founder_member
      if (input.avatar_url !== undefined) updates.avatar_url = input.avatar_url
      if (input.custom_url !== undefined) updates.custom_url = input.custom_url
      if (input.profile_url !== undefined) updates.profile_url = input.profile_url

      // Update new columns from preferences
      if (input.preferences) {
        if (input.preferences.jobTitle !== undefined) updates.job_title = input.preferences.jobTitle
        if (input.preferences.companyWebsite !== undefined) updates.company_website = input.preferences.companyWebsite
        if (input.preferences.companyAddress !== undefined) updates.company_address = input.preferences.companyAddress
        if (input.preferences.companyLogo !== undefined) updates.company_logo_url = input.preferences.companyLogo
        if (input.preferences.industry !== undefined) updates.industry = input.preferences.industry
        if (input.preferences.subDomain !== undefined) updates.sub_domain = input.preferences.subDomain
        if (input.preferences.skills !== undefined) updates.skills = input.preferences.skills
        if (input.preferences.professionalSummary !== undefined) updates.professional_summary = input.preferences.professionalSummary
        if (input.preferences.backgroundImage !== undefined) updates.background_image_url = input.preferences.backgroundImage
        if (input.preferences.whatsappNumber !== undefined) updates.whatsapp_number = input.preferences.whatsappNumber
        if (input.preferences.secondaryEmail !== undefined) updates.alternate_email = input.preferences.secondaryEmail

        updates.company_name = input.company || null
        updates.profile_photo_url = input.avatar_url || null
        updates.primary_email = input.email
        updates.mobile_number = input.phone_number || null

        // Store social links in JSONB column
        updates.social_links = {
          linkedin: input.preferences.linkedinUrl || '',
          instagram: input.preferences.instagramUrl || '',
          facebook: input.preferences.facebookUrl || '',
          twitter: input.preferences.twitterUrl || '',
          behance: input.preferences.behanceUrl || '',
          dribbble: input.preferences.dribbbleUrl || '',
          github: input.preferences.githubUrl || '',
          youtube: input.preferences.youtubeUrl || '',
        }

        // Store display settings in JSONB column
        updates.display_settings = {
          showLinkedin: input.preferences.showLinkedin ?? false,
          showInstagram: input.preferences.showInstagram ?? false,
          showFacebook: input.preferences.showFacebook ?? false,
          showTwitter: input.preferences.showTwitter ?? false,
          showBehance: input.preferences.showBehance ?? false,
          showDribbble: input.preferences.showDribbble ?? false,
          showGithub: input.preferences.showGithub ?? false,
          showYoutube: input.preferences.showYoutube ?? false,
          showProfilePhoto: input.preferences.showProfilePhoto ?? true,
          showBackgroundImage: input.preferences.showBackgroundImage ?? true,
          showEmailPublicly: input.preferences.showEmailPublicly ?? true,
          showSecondaryEmailPublicly: input.preferences.showSecondaryEmailPublicly ?? true,
          showMobilePublicly: input.preferences.showMobilePublicly ?? true,
          showWhatsappPublicly: input.preferences.showWhatsappPublicly ?? false,
          showJobTitle: input.preferences.showJobTitle ?? true,
          showCompanyName: input.preferences.showCompanyName ?? true,
          showCompanyWebsite: input.preferences.showCompanyWebsite ?? true,
          showCompanyAddress: input.preferences.showCompanyAddress ?? true,
          showIndustry: input.preferences.showIndustry ?? true,
          showSkills: input.preferences.showSkills ?? true,
        }

        // Keep preferences for backward compatibility
        updates.preferences = {
          ...(existingProfile.preferences || {}),
          ...input.preferences
        }
      }

      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', existingProfile.id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ [SupabaseProfileStore] Error updating profile:', updateError)
        throw new Error(`Failed to update profile: ${updateError.message}`)
      }

      console.log('✅ [SupabaseProfileStore] Profile updated successfully')
      return updated
    }

    // Create new profile
    console.log('➕ [SupabaseProfileStore] Creating new profile...')

    const newProfile: any = {
      email: input.email,
      user_id: input.user_id || null,
      first_name: input.first_name || null,
      last_name: input.last_name || null,
      phone_number: input.phone_number || null,
      company: input.company || null,
      is_founder_member: input.is_founder_member || false,
      avatar_url: input.avatar_url || null,
      custom_url: input.custom_url || null,
      profile_url: input.profile_url || null,
      preferences: input.preferences || {},
    }

    // Add new columns from preferences
    if (input.preferences) {
      newProfile.job_title = input.preferences.jobTitle || null
      newProfile.company_name = input.company || null
      newProfile.company_website = input.preferences.companyWebsite || null
      newProfile.company_address = input.preferences.companyAddress || null
      newProfile.company_logo_url = input.preferences.companyLogo || null
      newProfile.industry = input.preferences.industry || null
      newProfile.sub_domain = input.preferences.subDomain || null
      newProfile.skills = input.preferences.skills || []
      newProfile.professional_summary = input.preferences.professionalSummary || null
      newProfile.profile_photo_url = input.avatar_url || null
      newProfile.background_image_url = input.preferences.backgroundImage || null
      newProfile.primary_email = input.email
      newProfile.alternate_email = input.preferences.secondaryEmail || null
      newProfile.mobile_number = input.phone_number || null
      newProfile.whatsapp_number = input.preferences.whatsappNumber || null

      // Store social links in JSONB column
      newProfile.social_links = {
        linkedin: input.preferences.linkedinUrl || '',
        instagram: input.preferences.instagramUrl || '',
        facebook: input.preferences.facebookUrl || '',
        twitter: input.preferences.twitterUrl || '',
        behance: input.preferences.behanceUrl || '',
        dribbble: input.preferences.dribbbleUrl || '',
        github: input.preferences.githubUrl || '',
        youtube: input.preferences.youtubeUrl || '',
      }

      // Store display settings in JSONB column
      newProfile.display_settings = {
        showLinkedin: input.preferences.showLinkedin ?? false,
        showInstagram: input.preferences.showInstagram ?? false,
        showFacebook: input.preferences.showFacebook ?? false,
        showTwitter: input.preferences.showTwitter ?? false,
        showBehance: input.preferences.showBehance ?? false,
        showDribbble: input.preferences.showDribbble ?? false,
        showGithub: input.preferences.showGithub ?? false,
        showYoutube: input.preferences.showYoutube ?? false,
        showProfilePhoto: input.preferences.showProfilePhoto ?? true,
        showBackgroundImage: input.preferences.showBackgroundImage ?? true,
        showEmailPublicly: input.preferences.showEmailPublicly ?? true,
        showSecondaryEmailPublicly: input.preferences.showSecondaryEmailPublicly ?? true,
        showMobilePublicly: input.preferences.showMobilePublicly ?? true,
        showWhatsappPublicly: input.preferences.showWhatsappPublicly ?? false,
        showJobTitle: input.preferences.showJobTitle ?? true,
        showCompanyName: input.preferences.showCompanyName ?? true,
        showCompanyWebsite: input.preferences.showCompanyWebsite ?? true,
        showCompanyAddress: input.preferences.showCompanyAddress ?? true,
        showIndustry: input.preferences.showIndustry ?? true,
        showSkills: input.preferences.showSkills ?? true,
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single()

    if (error) {
      console.error('❌ [SupabaseProfileStore] Error creating profile:', error)
      throw new Error(`Failed to create profile: ${error.message}`)
    }

    console.log('✅ [SupabaseProfileStore] Profile created successfully')
    return data
  },

  /**
   * Get profile by email
   * WARNING: Email is NOT unique in the database. This function may return
   * unpredictable results if multiple profiles exist with the same email.
   * Use getByUserId() or query via profile_users junction table instead.
   * @deprecated Use user_id based queries instead
   */
  getByEmail: async (email: string): Promise<SupabaseProfile | null> => {
    const supabase = createAdminClient()

    console.log('⚠️ [SupabaseProfileStore] WARNING: Using deprecated getByEmail() - email is not unique')
    console.log('🔍 [SupabaseProfileStore] Fetching profile for email:', email)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle() // Changed from .single() to avoid errors with duplicates

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        console.log('ℹ️ [SupabaseProfileStore] No profile found for email:', email)
        return null
      }
      console.error('❌ [SupabaseProfileStore] Error fetching profile:', error)
      throw new Error(`Failed to fetch profile: ${error.message}`)
    }

    console.log('✅ [SupabaseProfileStore] Profile fetched successfully')
    return data
  },

  /**
   * Get profile by ID
   */
  getById: async (id: string): Promise<SupabaseProfile | null> => {
    const supabase = createAdminClient()

    console.log('🔍 [SupabaseProfileStore] Fetching profile by ID:', id)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('ℹ️ [SupabaseProfileStore] No profile found for ID:', id)
        return null
      }
      console.error('❌ [SupabaseProfileStore] Error fetching profile:', error)
      throw new Error(`Failed to fetch profile: ${error.message}`)
    }

    console.log('✅ [SupabaseProfileStore] Profile fetched successfully')
    return data
  },

  /**
   * Get all profiles
   */
  getAll: async (): Promise<SupabaseProfile[]> => {
    const supabase = createAdminClient()

    console.log('🔍 [SupabaseProfileStore] Fetching all profiles')

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ [SupabaseProfileStore] Error fetching profiles:', error)
      throw new Error(`Failed to fetch profiles: ${error.message}`)
    }

    console.log(`✅ [SupabaseProfileStore] Fetched ${data.length} profiles`)
    return data
  },

  /**
   * Delete profile by email
   */
  deleteByEmail: async (email: string): Promise<void> => {
    const supabase = createAdminClient()

    console.log('🗑️ [SupabaseProfileStore] Deleting profile for email:', email)

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('email', email)

    if (error) {
      console.error('❌ [SupabaseProfileStore] Error deleting profile:', error)
      throw new Error(`Failed to delete profile: ${error.message}`)
    }

    console.log('✅ [SupabaseProfileStore] Profile deleted successfully')
  }
}
