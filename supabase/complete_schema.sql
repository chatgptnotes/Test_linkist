-- Complete Supabase schema for Linkist NFC Card System
-- This includes all missing tables and fixes inconsistencies
-- Run this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =============================================
-- CORE TABLES
-- =============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(20),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  email_verified BOOLEAN DEFAULT FALSE,
  mobile_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Card configurations table (for reusable card designs)
CREATE TABLE IF NOT EXISTS card_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- User-friendly name for the config
  config JSONB NOT NULL, -- Card configuration data
  is_template BOOLEAN DEFAULT FALSE, -- Whether this is a public template
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Orders table (enhanced with more fields)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Optional user link
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'production', 'shipped', 'delivered', 'cancelled', 'refunded')),
  
  -- Customer information
  customer_name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  
  -- Card configuration (JSON)
  card_config JSONB NOT NULL,
  
  -- Shipping information (JSON)
  shipping JSONB NOT NULL,
  
  -- Pricing information (JSON)
  pricing JSONB NOT NULL,
  
  -- Payment information
  payment_intent_id VARCHAR(255), -- Stripe payment intent ID
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'succeeded', 'failed', 'refunded')),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Fulfillment information
  estimated_delivery DATE,
  actual_delivery DATE,
  tracking_number VARCHAR(100),
  tracking_url TEXT,
  proof_images TEXT[], -- Array of image URLs
  
  -- Communication tracking
  emails_sent JSONB DEFAULT '{}',
  sms_sent JSONB DEFAULT '{}',
  
  -- Additional fields
  notes TEXT,
  internal_notes TEXT, -- Admin-only notes
  founder_member BOOLEAN DEFAULT FALSE,
  referral_code VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Payments table (separate from orders for better tracking)
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  payment_intent_id VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'disputed')),
  payment_method VARCHAR(50),
  failure_reason TEXT,
  refund_amount INTEGER DEFAULT 0,
  stripe_fee INTEGER DEFAULT 0,
  net_amount INTEGER, -- Amount after fees
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Shipping addresses table (for address management)
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  full_name VARCHAR(200) NOT NULL,
  company VARCHAR(200),
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Card assets table (for uploaded logos, photos, etc.)
CREATE TABLE IF NOT EXISTS card_assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  asset_type VARCHAR(20) CHECK (asset_type IN ('logo', 'photo', 'background', 'qr_code', 'proof', 'certification', 'other')),
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL, -- Supabase storage path
  file_size INTEGER,
  mime_type VARCHAR(100),
  width INTEGER,
  height INTEGER,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =============================================
-- VERIFICATION TABLES
-- =============================================

-- Email OTPs table (existing, enhanced)
CREATE TABLE IF NOT EXISTS email_otps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  purpose VARCHAR(20) DEFAULT 'verification' CHECK (purpose IN ('verification', 'login', 'password_reset')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Mobile OTPs table (existing, enhanced)
CREATE TABLE IF NOT EXISTS mobile_otps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mobile VARCHAR(20) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  purpose VARCHAR(20) DEFAULT 'verification' CHECK (purpose IN ('verification', 'login', 'password_reset')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  sms_provider VARCHAR(20) DEFAULT 'fast2sms',
  sms_message_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =============================================
-- COMPLIANCE & ADMIN TABLES
-- =============================================

-- GDPR consents table (existing, enhanced)
CREATE TABLE IF NOT EXISTS gdpr_consents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  consents JSONB NOT NULL, -- Store consent details
  consent_version VARCHAR(10) DEFAULT '1.0',
  ip_address INET,
  user_agent TEXT,
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Settings table (for application configuration)
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Audit logs table (for security and compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Admin sessions table (for secure admin access tracking)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_token VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Card configs indexes
CREATE INDEX IF NOT EXISTS idx_card_configs_user_id ON card_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_card_configs_is_template ON card_configs(is_template);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_estimated_delivery ON orders(estimated_delivery);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_intent_id ON payments(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Shipping addresses indexes
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_id ON shipping_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_order_id ON shipping_addresses(order_id);

-- Card assets indexes
CREATE INDEX IF NOT EXISTS idx_card_assets_user_id ON card_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_card_assets_order_id ON card_assets(order_id);
CREATE INDEX IF NOT EXISTS idx_card_assets_asset_type ON card_assets(asset_type);

-- OTP indexes
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON email_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_otps_verified ON email_otps(verified);
CREATE INDEX IF NOT EXISTS idx_mobile_otps_mobile ON mobile_otps(mobile);
CREATE INDEX IF NOT EXISTS idx_mobile_otps_expires_at ON mobile_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_mobile_otps_verified ON mobile_otps(verified);

-- Admin and compliance indexes
CREATE INDEX IF NOT EXISTS idx_gdpr_consents_email ON gdpr_consents(email);
CREATE INDEX IF NOT EXISTS idx_gdpr_consents_user_id ON gdpr_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_session_token ON admin_sessions(session_token);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Card configs policies
CREATE POLICY "Users can manage their own card configs" ON card_configs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public templates" ON card_configs
  FOR SELECT USING (is_template = true);

-- Orders policies
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id OR email = auth.jwt() ->> 'email');

CREATE POLICY "Allow anonymous order creation" ON orders
  FOR INSERT WITH CHECK (true);

-- Service role policies (for admin functions and webhooks)
CREATE POLICY "Service role full access on profiles" ON profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access on orders" ON orders
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access on payments" ON payments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Anonymous access for OTPs (needed for verification flow)
CREATE POLICY "Allow anonymous access to email OTPs" ON email_otps
  FOR ALL USING (true);

CREATE POLICY "Allow anonymous access to mobile OTPs" ON mobile_otps
  FOR ALL USING (true);

-- Settings policies
CREATE POLICY "Public settings are viewable" ON settings
  FOR SELECT USING (is_public = true);

CREATE POLICY "Service role can manage settings" ON settings
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_configs_updated_at BEFORE UPDATE ON card_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean expired OTPs
CREATE OR REPLACE FUNCTION clean_expired_otps()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete expired email OTPs
    DELETE FROM email_otps WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete expired mobile OTPs
    DELETE FROM mobile_otps WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    -- Delete expired admin sessions
    DELETE FROM admin_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log(
    p_user_id UUID,
    p_action VARCHAR(50),
    p_resource_type VARCHAR(50),
    p_resource_id VARCHAR(255),
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values)
    VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_old_values, p_new_values)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get order statistics
CREATE OR REPLACE FUNCTION get_order_stats(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_orders BIGINT,
    total_revenue NUMERIC,
    avg_order_value NUMERIC,
    status_breakdown JSONB,
    daily_orders JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH order_data AS (
        SELECT 
            o.*,
            (o.pricing->>'total')::NUMERIC as total_amount
        FROM orders o
        WHERE 
            (start_date IS NULL OR o.created_at::DATE >= start_date)
            AND (end_date IS NULL OR o.created_at::DATE <= end_date)
    ),
    stats AS (
        SELECT 
            COUNT(*) as total_orders,
            COALESCE(SUM(total_amount), 0) as total_revenue,
            COALESCE(AVG(total_amount), 0) as avg_order_value
        FROM order_data
    ),
    status_counts AS (
        SELECT jsonb_object_agg(status, count) as status_breakdown
        FROM (
            SELECT status, COUNT(*) as count
            FROM order_data
            GROUP BY status
        ) s
    ),
    daily_data AS (
        SELECT jsonb_object_agg(order_date, daily_count) as daily_orders
        FROM (
            SELECT 
                created_at::DATE as order_date,
                COUNT(*) as daily_count
            FROM order_data
            GROUP BY created_at::DATE
            ORDER BY created_at::DATE
        ) d
    )
    SELECT 
        s.total_orders,
        s.total_revenue,
        s.avg_order_value,
        COALESCE(sc.status_breakdown, '{}'::jsonb),
        COALESCE(dd.daily_orders, '{}'::jsonb)
    FROM stats s
    CROSS JOIN status_counts sc
    CROSS JOIN daily_data dd;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default settings
INSERT INTO settings (key, value, category, description, is_public) VALUES
('site_name', '"Linkist NFC"', 'general', 'Site name', true),
('support_email', '"support@linkist.ai"', 'general', 'Support email address', true),
('card_base_price', '29.99', 'pricing', 'Base price for NFC card in USD', false),
('shipping_cost_domestic', '5.00', 'pricing', 'Domestic shipping cost', false),
('shipping_cost_international', '10.00', 'pricing', 'International shipping cost', false),
('tax_rate', '0.0575', 'pricing', 'Default tax rate (5.75%)', false),
('max_file_size_mb', '10', 'uploads', 'Maximum file size for uploads in MB', false),
('allowed_file_types', '["image/jpeg", "image/png", "image/webp"]', 'uploads', 'Allowed file types for uploads', false)
ON CONFLICT (key) DO NOTHING;

-- Create a cron job to clean expired OTPs (if pg_cron is available)
-- SELECT cron.schedule('clean-expired-otps', '0 */6 * * *', 'SELECT clean_expired_otps();');

COMMIT;