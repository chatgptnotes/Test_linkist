-- Add services section to profiles
-- This allows users to showcase their services/products with title, description, pricing, and category

-- Create profile_services table
CREATE TABLE IF NOT EXISTS profile_services (
  id SERIAL PRIMARY KEY,
  profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  pricing TEXT, -- Can be numeric or text like "$100/hr" or "Contact for pricing"
  category TEXT, -- Service category like "Consulting", "Development", "Design", etc.
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_profile_services_profile_id ON profile_services(profile_id);
CREATE INDEX idx_profile_services_category ON profile_services(category);
CREATE INDEX idx_profile_services_is_active ON profile_services(is_active);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_profile_services_updated_at
  BEFORE UPDATE ON profile_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profile_services ENABLE ROW LEVEL SECURITY;

-- Services policies - Users can view services on public profiles
CREATE POLICY "Users can view services on public profiles"
  ON profile_services FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = profile_services.profile_id
    AND (profiles.visibility = 'public' OR profiles.visibility = 'unlisted')
  ));

-- Users can manage their own services
CREATE POLICY "Users can manage their own services"
  ON profile_services FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = profile_services.profile_id
    AND profiles.user_email = auth.email()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = profile_services.profile_id
    AND profiles.user_email = auth.email()
  ));

-- Insert sample data (optional - can be removed)
-- This is just for testing purposes
COMMENT ON TABLE profile_services IS 'Stores user services/products with pricing and categories';
COMMENT ON COLUMN profile_services.title IS 'Service or product name';
COMMENT ON COLUMN profile_services.description IS 'Detailed description of the service';
COMMENT ON COLUMN profile_services.pricing IS 'Price information - can be text or numeric format';
COMMENT ON COLUMN profile_services.category IS 'Service category for filtering and grouping';
COMMENT ON COLUMN profile_services.display_order IS 'Order in which services are displayed';
