import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch profile from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        return NextResponse.json({
          success: false,
          error: 'Profile not found',
          profile: null
        });
      }
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Fetch services for this profile
    const { data: services } = await supabase
      .from('profile_services')
      .select('*')
      .eq('profile_id', profile.id)
      .order('display_order', { ascending: true });

    // Transform database fields to match frontend expectations
    const transformedProfile = {
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      primaryEmail: profile.primary_email || profile.email,
      mobileNumber: profile.mobile_number || profile.phone_number,
      whatsappNumber: profile.whatsapp_number,

      // Professional info
      jobTitle: profile.job_title,
      companyName: profile.company_name || profile.company,
      companyWebsite: profile.company_website,
      companyAddress: profile.company_address,
      companyLogoUrl: profile.company_logo_url,
      industry: profile.industry,
      subDomain: profile.sub_domain,
      skills: profile.skills || [],
      professionalSummary: profile.professional_summary,

      // Photo/Media
      profilePhoto: profile.profile_photo_url || profile.avatar_url,
      backgroundImage: profile.background_image_url,

      // Social links - parse from JSONB
      ...parseSocialLinks(profile.social_links),

      // Settings
      displaySettings: profile.display_settings || {},
      preferences: profile.preferences || {},

      // URLs
      customUrl: profile.custom_url,
      profileUrl: profile.profile_url,

      // Founder member
      isFounderMember: profile.is_founder_member,

      // Services
      services: (services || []).map(service => ({
        id: service.id.toString(),
        title: service.title,
        description: service.description || '',
        pricing: service.pricing || '',
        category: service.category || '',
        showPublicly: service.is_active
      })),

      // Metadata
      userId: profile.user_id,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };

    return NextResponse.json({
      success: true,
      profile: transformedProfile
    });

  } catch (error) {
    console.error('Error in /api/profiles/get:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to parse social links from JSONB
function parseSocialLinks(socialLinks: any) {
  if (!socialLinks || typeof socialLinks !== 'object') {
    return {};
  }

  return {
    linkedinUrl: socialLinks.linkedin || socialLinks.linkedinUrl || null,
    instagramUrl: socialLinks.instagram || socialLinks.instagramUrl || null,
    facebookUrl: socialLinks.facebook || socialLinks.facebookUrl || null,
    twitterUrl: socialLinks.twitter || socialLinks.twitterUrl || null,
    githubUrl: socialLinks.github || socialLinks.githubUrl || null,
    youtubeUrl: socialLinks.youtube || socialLinks.youtubeUrl || null,
    behanceUrl: socialLinks.behance || socialLinks.behanceUrl || null,
    dribbbleUrl: socialLinks.dribbble || socialLinks.dribbbleUrl || null,
  };
}
