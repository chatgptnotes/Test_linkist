-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true);

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true);

-- Create storage bucket for background images
INSERT INTO storage.buckets (id, name, public)
VALUES ('background-images', 'background-images', true);

-- Create storage bucket for card assets (logos, photos, backgrounds, qr codes, proofs, certifications)
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-assets', 'card-assets', true);

-- Set up storage policies for profile-photos bucket
CREATE POLICY "Public Access for profile photos" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can upload profile photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-photos'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own profile photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-photos'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own profile photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-photos'
  AND auth.role() = 'authenticated'
);

-- Set up storage policies for company-logos bucket
CREATE POLICY "Public Access for company logos" ON storage.objects
FOR SELECT USING (bucket_id = 'company-logos');

CREATE POLICY "Authenticated users can upload company logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'company-logos'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own company logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'company-logos'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own company logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'company-logos'
  AND auth.role() = 'authenticated'
);

-- Set up storage policies for background-images bucket
CREATE POLICY "Public Access for background images" ON storage.objects
FOR SELECT USING (bucket_id = 'background-images');

CREATE POLICY "Authenticated users can upload background images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'background-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own background images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'background-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own background images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'background-images'
  AND auth.role() = 'authenticated'
);

-- Set up storage policies for card-assets bucket
CREATE POLICY "Public Access for card assets" ON storage.objects
FOR SELECT USING (bucket_id = 'card-assets');

CREATE POLICY "Authenticated users can upload card assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'card-assets'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own card assets" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'card-assets'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own card assets" ON storage.objects
FOR DELETE USING (
  bucket_id = 'card-assets'
  AND auth.role() = 'authenticated'
);

-- Fix card_assets asset_type check constraint to include certifications and other types
-- Drop existing constraint and add new one with updated values
ALTER TABLE public.card_assets DROP CONSTRAINT IF EXISTS card_assets_asset_type_check;
ALTER TABLE public.card_assets ADD CONSTRAINT card_assets_asset_type_check
  CHECK (asset_type IN ('logo', 'photo', 'background', 'qr_code', 'proof', 'certification', 'other'));

-- Update profiles table to add new columns for complete profile data
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title character varying(200);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name character varying(200);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_website text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_logo_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS industry character varying(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sub_domain character varying(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS professional_summary text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS background_image_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_settings jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS primary_email character varying(255);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mobile_number character varying(20);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_number character varying(20);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_company_name ON public.profiles USING btree (company_name);
CREATE INDEX IF NOT EXISTS idx_profiles_industry ON public.profiles USING btree (industry);

-- RLS Policies for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" ON public.profiles
FOR DELETE USING (auth.uid() = user_id);
