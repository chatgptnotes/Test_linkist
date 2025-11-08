-- Add services section to profiles
-- This allows users to showcase their services/products with title, description, pricing, and category

-- Create profile_services table
CREATE TABLE IF NOT EXISTS profile_services (
  id SERIAL PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Add visibility column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'visibility'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN visibility TEXT DEFAULT 'public';
    CREATE INDEX IF NOT EXISTS idx_profiles_visibility ON public.profiles(visibility);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE profile_services ENABLE ROW LEVEL SECURITY;

-- Services policies - Users can view all services (public by default)
-- This policy works whether visibility column exists or not
CREATE POLICY "Users can view services on profiles"
  ON profile_services FOR SELECT
  USING (true); -- Allow viewing all services for now

-- Users can manage their own services
-- This checks via profile_users junction table
CREATE POLICY "Users can manage their own services"
  ON profile_services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profile_users
      WHERE profile_users.profile_id = profile_services.profile_id
      AND profile_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profile_users
      WHERE profile_users.profile_id = profile_services.profile_id
      AND profile_users.user_id = auth.uid()
    )
  );

-- Insert sample data (optional - can be removed)
-- This is just for testing purposes
COMMENT ON TABLE profile_services IS 'Stores user services/products with pricing and categories';
COMMENT ON COLUMN profile_services.title IS 'Service or product name';
COMMENT ON COLUMN profile_services.description IS 'Detailed description of the service';
COMMENT ON COLUMN profile_services.pricing IS 'Price information - can be text or numeric format';
COMMENT ON COLUMN profile_services.category IS 'Service category for filtering and grouping';
COMMENT ON COLUMN profile_services.display_order IS 'Order in which services are displayed';
