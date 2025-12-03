import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch profile by custom_url
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('custom_url', username)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Fetch services for this profile
    const { data: services } = await supabase
      .from('profile_services')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // Transform database profile to frontend format
    const socialLinks = profile.social_links || {};
    const preferences = profile.preferences || {};

    const profileData = {
      username: profile.custom_url,
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      fullName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.first_name || profile.email?.split('@')[0] || '',
      title: profile.job_title || '',
      company: profile.company_name || profile.company || '',
      bio: profile.professional_summary || '',
      profileImage: profile.profile_photo_url || profile.avatar_url || '',
      coverImage: profile.background_image_url || '',
      companyLogo: profile.company_logo_url || '',
      email: profile.primary_email || profile.email || '',
      alternate_email: profile.alternate_email || '',
      phone: profile.mobile_number || profile.phone_number || '',
      whatsapp: profile.whatsapp_number || '',
      website: profile.company_website || '',
      location: profile.company_address || '',
      linkedin: socialLinks.linkedin || '',
      twitter: socialLinks.twitter || '',
      instagram: socialLinks.instagram || '',
      facebook: socialLinks.facebook || '',
      youtube: socialLinks.youtube || '',
      github: socialLinks.github || '',
      skills: profile.skills || [],
      industry: profile.industry || '',
      // Include visibility preferences
      preferences: preferences,
      display_settings: profile.display_settings || {},
      // Include services
      services: (services || []).map(service => ({
        id: service.id.toString(),
        title: service.title,
        description: service.description || '',
        pricing: service.pricing || '',
        pricingUnit: service.pricing_unit || '',
        category: service.category || '',
        currency: service.currency || 'USD',
        showPublicly: true // Only active services are fetched
      }))
    };

    // Track profile view - fire-and-forget (don't await to avoid slowing response)
    const viewerIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const viewerUserAgent = request.headers.get('user-agent') || null;

    // Fire-and-forget: track the view without blocking the response
    (async () => {
      try {
        await supabase
          .from('profile_views')
          .insert({
            profile_email: profile.primary_email || profile.email,
            viewer_ip: viewerIp,
            viewer_user_agent: viewerUserAgent,
            viewed_at: new Date().toISOString()
          });
        console.log('Profile view tracked for:', profile.custom_url);
      } catch (err) {
        console.error('View tracking error:', err);
      }
    })();

    return NextResponse.json({
      success: true,
      profile: profileData
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
