// Supabase-based user management system
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

// User status type
export type UserStatus = 'pending' | 'active' | 'suspended';

// User interface matching database schema
export interface SupabaseUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone_number: string | null
  country: string | null
  country_code: string | null
  role: 'user' | 'admin'
  status: UserStatus
  email_verified: boolean
  mobile_verified: boolean
  created_at: string
  updated_at: string
}

// Input type for creating users
export interface CreateUserInput {
  email: string
  first_name?: string
  last_name?: string
  phone_number?: string
  country?: string
  country_code?: string
  role?: 'user' | 'admin'
  status?: UserStatus
  email_verified?: boolean
  mobile_verified?: boolean
  is_founding_member?: boolean
  founding_member_plan?: string | null
  founding_member_since?: string | null
}

export const SupabaseUserStore = {
  /**
   * Create a new user or get existing user by email
   * NOTE: Does NOT update existing users to prevent data overwrite
   */
  upsertByEmail: async (input: CreateUserInput): Promise<SupabaseUser> => {
    console.log('👤 [SupabaseUserStore.upsertByEmail] Starting user lookup for:', input.email);

    const supabase = createAdminClient()

    // First, try to get existing user
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', input.email)
      .single()

    if (existingUser && !fetchError) {
      console.log('👤 [SupabaseUserStore.upsertByEmail] User already exists, returning existing user:', existingUser.id);
      console.log('   ℹ️  Existing user data preserved (not overwritten)');

      // Return existing user WITHOUT updating
      // This prevents overwriting existing user data with possibly incomplete/incorrect data
      return existingUser
    }

    // User doesn't exist, create new one
    console.log('👤 [SupabaseUserStore.upsertByEmail] Creating new user');

    const newUser = {
      email: input.email,
      first_name: input.first_name || null,
      last_name: input.last_name || null,
      phone_number: input.phone_number || null,
      country: input.country || null,
      country_code: input.country_code || null,
      role: input.role || 'user',
      status: input.status || 'pending',
      email_verified: input.email_verified || false,
      mobile_verified: input.mobile_verified || false,
      is_founding_member: input.is_founding_member || false,
      founding_member_plan: input.founding_member_plan || null,
      founding_member_since: input.founding_member_since || null,
    }

    const { data, error } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single()

    if (error) {
      console.error('❌ [SupabaseUserStore.upsertByEmail] Create error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })

      // If duplicate phone number error, try to find user by phone
      if (error.code === '23505' && error.message.includes('idx_users_phone_unique') && input.phone_number) {
        console.log('👤 [SupabaseUserStore.upsertByEmail] Duplicate phone detected, looking up by phone:', input.phone_number)

        const { data: userByPhone, error: phoneError } = await supabase
          .from('users')
          .select('*')
          .eq('phone_number', input.phone_number)
          .single()

        if (userByPhone && !phoneError) {
          console.log('✅ [SupabaseUserStore.upsertByEmail] Found existing user by phone:', userByPhone.id)
          return userByPhone
        }
      }

      throw new Error(`Failed to create user: ${error.message}`)
    }

    console.log('✅ [SupabaseUserStore.upsertByEmail] User created successfully:', data.id)
    return data
  },

  /**
   * Get user by email
   */
  getByEmail: async (email: string): Promise<SupabaseUser | null> => {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      console.error('Error fetching user by email:', error)
      throw new Error(`Failed to fetch user: ${error.message}`)
    }

    return data
  },

  /**
   * Get user by phone number
   */
  getByPhone: async (phoneNumber: string): Promise<SupabaseUser | null> => {
    const supabase = createAdminClient()

    const { data, error} = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      console.error('Error fetching user by phone:', error)
      throw new Error(`Failed to fetch user: ${error.message}`)
    }

    return data
  },

  /**
   * Get user by ID
   */
  getById: async (id: string): Promise<SupabaseUser | null> => {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      console.error('Error fetching user by ID:', error)
      throw new Error(`Failed to fetch user: ${error.message}`)
    }

    return data
  },

  /**
   * Update user verification status
   */
  updateVerificationStatus: async (
    email: string,
    type: 'email' | 'mobile',
    verified: boolean = true
  ): Promise<SupabaseUser | null> => {
    const supabase = createAdminClient()

    const updates = {
      [type === 'email' ? 'email_verified' : 'mobile_verified']: verified,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('email', email)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      console.error('Error updating verification status:', error)
      throw new Error(`Failed to update user: ${error.message}`)
    }

    return data
  },

  /**
   * Get all users (for admin)
   */
  getAll: async (): Promise<SupabaseUser[]> => {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all users:', error)
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    return data
  },

  /**
   * Create or update user profile in profiles table
   * This links the user to their digital profile
   */
  createOrUpdateProfile: async (userId: string, profileData: {
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    company?: string;
  }): Promise<any> => {
    console.log('👤 [SupabaseUserStore.createOrUpdateProfile] Creating/updating profile for user:', userId);

    const supabase = createAdminClient()

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existingProfile) {
      console.log('👤 [SupabaseUserStore.createOrUpdateProfile] Profile exists, updating:', existingProfile.id);

      // Update existing profile
      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.first_name || null,
          last_name: profileData.last_name || null,
          phone_number: profileData.phone || null,
          company: profileData.company || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('❌ [SupabaseUserStore.createOrUpdateProfile] Update error:', error)
        throw new Error(`Failed to update profile: ${error.message}`)
      }

      return data
    }

    // Create new profile
    console.log('👤 [SupabaseUserStore.createOrUpdateProfile] Creating new profile');

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: userId, // Foreign key to users table
        email: profileData.email,
        first_name: profileData.first_name || null,
        last_name: profileData.last_name || null,
        phone_number: profileData.phone || null,
        company: profileData.company || null
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [SupabaseUserStore.createOrUpdateProfile] Create error:', error)
      throw new Error(`Failed to create profile: ${error.message}`)
    }

    console.log('✅ [SupabaseUserStore.createOrUpdateProfile] Profile created successfully:', data.id)
    return data
  },

  /**
   * Update user status
   */
  updateStatus: async (
    userId: string,
    status: UserStatus
  ): Promise<SupabaseUser | null> => {
    console.log('👤 [SupabaseUserStore.updateStatus] Updating user status:', userId, 'to', status);

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('users')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('❌ [SupabaseUserStore.updateStatus] Error:', error)
      throw new Error(`Failed to update status: ${error.message}`)
    }

    console.log('✅ [SupabaseUserStore.updateStatus] Status updated successfully');
    return data
  },

  /**
   * Activate a user (set status to 'active' and mark as verified)
   * Used after successful OTP verification
   */
  activateUser: async (
    userId: string,
    verificationType: 'email' | 'mobile'
  ): Promise<SupabaseUser | null> => {
    console.log('👤 [SupabaseUserStore.activateUser] Activating user:', userId, 'via', verificationType);

    const supabase = createAdminClient()

    const updates: any = {
      status: 'active' as UserStatus,
      updated_at: new Date().toISOString()
    }

    // Also mark the appropriate field as verified
    if (verificationType === 'email') {
      updates.email_verified = true
    } else {
      updates.mobile_verified = true
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('❌ [SupabaseUserStore.activateUser] Error:', error)
      throw new Error(`Failed to activate user: ${error.message}`)
    }

    console.log('✅ [SupabaseUserStore.activateUser] User activated successfully');
    return data
  },

  /**
   * Suspend a user account
   */
  suspendUser: async (userId: string): Promise<SupabaseUser | null> => {
    console.log('👤 [SupabaseUserStore.suspendUser] Suspending user:', userId);
    return SupabaseUserStore.updateStatus(userId, 'suspended')
  },

  /**
   * Reactivate a suspended user
   */
  reactivateUser: async (userId: string): Promise<SupabaseUser | null> => {
    console.log('👤 [SupabaseUserStore.reactivateUser] Reactivating user:', userId);
    return SupabaseUserStore.updateStatus(userId, 'active')
  },
}
