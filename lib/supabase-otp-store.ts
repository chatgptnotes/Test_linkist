// Supabase-powered OTP management system
import { createClient } from '@supabase/supabase-js';

export interface TempUserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

export interface EmailOTPRecord {
  id?: string;
  user_id?: string | null;
  email: string;
  otp: string;
  expires_at: string;
  verified: boolean;
  created_at?: string;
  temp_user_data?: TempUserData | null;
}

export interface MobileOTPRecord {
  id?: string;
  user_id?: string | null;
  mobile: string;
  otp: string;
  expires_at: string;
  verified: boolean;
  created_at?: string;
  temp_user_data?: TempUserData | null;
}

// Get Supabase client with service role key for server operations
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// Email OTP Store
export const SupabaseEmailOTPStore = {
  set: async (email: string, record: Omit<EmailOTPRecord, 'id' | 'created_at'>): Promise<boolean> => {
    const supabase = getSupabaseClient();
    
    try {
      // First, delete any existing OTPs for this email
      await supabase
        .from('email_otps')
        .delete()
        .eq('email', email);

      // Insert new OTP
      const { error } = await supabase
        .from('email_otps')
        .insert([{
          user_id: record.user_id || null,
          email: record.email,
          otp: record.otp,
          expires_at: record.expires_at,
          verified: record.verified,
          temp_user_data: record.temp_user_data || null,
        }]);

      if (error) {
        console.error('Error setting email OTP:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception setting email OTP:', error);
      return false;
    }
  },

  get: async (email: string): Promise<EmailOTPRecord | null> => {
    const supabase = getSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('email_otps')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // No record found is not an error
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error getting email OTP:', error);
        return null;
      }

      return data as EmailOTPRecord;
    } catch (error) {
      console.error('Exception getting email OTP:', error);
      return null;
    }
  },

  delete: async (email: string): Promise<boolean> => {
    const supabase = getSupabaseClient();
    
    try {
      const { error } = await supabase
        .from('email_otps')
        .delete()
        .eq('email', email);

      if (error) {
        console.error('Error deleting email OTP:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception deleting email OTP:', error);
      return false;
    }
  },

  clear: async (): Promise<boolean> => {
    const supabase = getSupabaseClient();
    
    try {
      const { error } = await supabase
        .from('email_otps')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) {
        console.error('Error clearing email OTPs:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception clearing email OTPs:', error);
      return false;
    }
  },

  getAllForDev: async (): Promise<EmailOTPRecord[]> => {
    if (process.env.NODE_ENV !== 'development') {
      return [];
    }

    const supabase = getSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('email_otps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting all email OTPs:', error);
        return [];
      }

      return data as EmailOTPRecord[];
    } catch (error) {
      console.error('Exception getting all email OTPs:', error);
      return [];
    }
  },
};

// Mobile OTP Store
export const SupabaseMobileOTPStore = {
  set: async (mobile: string, record: Omit<MobileOTPRecord, 'id' | 'created_at'>): Promise<boolean> => {
    const supabase = getSupabaseClient();
    
    try {
      // First, delete any existing OTPs for this mobile
      await supabase
        .from('mobile_otps')
        .delete()
        .eq('mobile', mobile);

      // Insert new OTP
      const { error } = await supabase
        .from('mobile_otps')
        .insert([{
          user_id: record.user_id || null,
          mobile: record.mobile,
          otp: record.otp,
          expires_at: record.expires_at,
          verified: record.verified,
          temp_user_data: record.temp_user_data || null,
        }]);

      if (error) {
        console.error('Error setting mobile OTP:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception setting mobile OTP:', error);
      return false;
    }
  },

  get: async (mobile: string): Promise<MobileOTPRecord | null> => {
    const supabase = getSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('mobile_otps')
        .select('*')
        .eq('mobile', mobile)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // No record found is not an error
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error getting mobile OTP:', error);
        return null;
      }

      return data as MobileOTPRecord;
    } catch (error) {
      console.error('Exception getting mobile OTP:', error);
      return null;
    }
  },

  delete: async (mobile: string): Promise<boolean> => {
    const supabase = getSupabaseClient();
    
    try {
      const { error } = await supabase
        .from('mobile_otps')
        .delete()
        .eq('mobile', mobile);

      if (error) {
        console.error('Error deleting mobile OTP:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception deleting mobile OTP:', error);
      return false;
    }
  },

  clear: async (): Promise<boolean> => {
    const supabase = getSupabaseClient();
    
    try {
      const { error } = await supabase
        .from('mobile_otps')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) {
        console.error('Error clearing mobile OTPs:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception clearing mobile OTPs:', error);
      return false;
    }
  },

  getAllForDev: async (): Promise<MobileOTPRecord[]> => {
    if (process.env.NODE_ENV !== 'development') {
      return [];
    }

    const supabase = getSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('mobile_otps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting all mobile OTPs:', error);
        return [];
      }

      return data as MobileOTPRecord[];
    } catch (error) {
      console.error('Exception getting all mobile OTPs:', error);
      return [];
    }
  },
};

// Clean expired OTPs function
export async function cleanExpiredOTPs(): Promise<{ email: number; mobile: number }> {
  const supabase = getSupabaseClient();
  
  try {
    const now = new Date().toISOString();
    
    // Clean expired email OTPs
    const { data: emailDeleted, error: emailError } = await supabase
      .from('email_otps')
      .delete()
      .lt('expires_at', now)
      .select('id');

    if (emailError) {
      console.error('Error cleaning expired email OTPs:', emailError);
    }

    // Clean expired mobile OTPs
    const { data: mobileDeleted, error: mobileError } = await supabase
      .from('mobile_otps')
      .delete()
      .lt('expires_at', now)
      .select('id');

    if (mobileError) {
      console.error('Error cleaning expired mobile OTPs:', mobileError);
    }

    return {
      email: emailDeleted?.length || 0,
      mobile: mobileDeleted?.length || 0,
    };
  } catch (error) {
    console.error('Exception cleaning expired OTPs:', error);
    return { email: 0, mobile: 0 };
  }
}

// Generate OTP functions
export function generateEmailOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateMobileOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}