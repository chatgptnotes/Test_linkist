import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-middleware'
import { createClient } from '@supabase/supabase-js'
import { linkProfileToUser } from '@/lib/profile-users-helpers'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user (optional for GET requests)
    const authSession = await getCurrentUser(request)

    // If not authenticated, return empty profiles array (client will use localStorage fallback)
    if (!authSession.isAuthenticated || !authSession.user) {
      console.log('⚠️ No authentication found, returning empty profiles (client will use localStorage)')
      return NextResponse.json({
        success: true,
        profiles: [],
        unauthenticated: true
      })
    }

    const userId = authSession.user.id

    console.log('🔍 Fetching profiles for user_id:', userId)

    // Fetch profiles via profile_users junction table
    const { data: result, error } = await supabase
      .from('profile_users')
      .select(`
        profile_id,
        profiles (*)
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Supabase fetch error:', error)
      return NextResponse.json({
        error: 'Failed to fetch profiles from database',
        details: error.message
      }, { status: 500 })
    }

    // Extract profiles from junction table results
    const profiles = result?.map(item => item.profiles).filter(Boolean) || []

    console.log('✅ Found', profiles.length, 'profile(s) for user')

    // Fetch services for each profile
    const profilesWithServices = await Promise.all(
      profiles.map(async (profile: any) => {
        const { data: services } = await supabase
          .from('profile_services')
          .select('*')
          .eq('profile_id', profile.id)
          .order('display_order', { ascending: true })

        return {
          ...profile,
          services: (services || []).map(service => ({
            id: service.id.toString(),
            title: service.title,
            description: service.description || '',
            pricing: service.pricing || '',
            pricingUnit: service.pricing_unit || '',
            category: service.category || '',
            currency: service.currency || 'USD',
            showPublicly: service.is_active
          }))
        }
      })
    )

    console.log('✅ Loaded services for all profiles')

    return NextResponse.json({
      success: true,
      profiles: profilesWithServices
    })
  } catch (error) {
    console.error('Error fetching profiles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authSession = await getCurrentUser(request)

    if (!authSession.isAuthenticated || !authSession.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = authSession.user.id
    const data = await request.json()

    // Generate a unique profile ID (UUID v4)
    const profileId = crypto.randomUUID()

    console.log('💾 Saving profile for user_id:', userId)

    // Prepare data for Supabase with existing columns
    const profileData = {
      id: profileId,
      user_id: userId,
      email: data.email,
      alternate_email: data.alternateEmail || null,
      first_name: data.firstName,
      last_name: data.lastName,
      // Additional fields will be added after migration
      template: data.template || null,
      title: data.title || null,
      bio: data.bio || null,
      phone_number: data.phone || data.mobileNumber || null,
      whatsapp: data.whatsapp || data.whatsappNumber || null,
      location: data.location || null,

      // Professional Information (from Figma design)
      job_title: data.jobTitle || null,
      company_name: data.companyName || data.company || null,
      company_website: data.companyWebsite || null,
      company_address: data.companyAddress || null,
      company_logo_url: data.companyLogo || null,
      industry: data.industry || null,
      sub_domain: data.subDomain || null,
      professional_summary: data.professionalSummary || null,

      skills: data.skills || [],
      social_links: data.socialLinks || data.social_links || {},
      profile_photo_url: data.profilePhoto || null,
      background_image_url: data.backgroundImage || null,
      display_settings: data.displaySettings || data.display_settings || {
        // Collect all show* fields into display_settings
        showEmailPublicly: data.showEmailPublicly,
        showSecondaryEmailPublicly: data.showSecondaryEmailPublicly,
        showMobilePublicly: data.showMobilePublicly,
        showWhatsappPublicly: data.showWhatsappPublicly,
        showJobTitle: data.showJobTitle,
        showCompanyName: data.showCompanyName,
        showCompanyWebsite: data.showCompanyWebsite,
        showCompanyAddress: data.showCompanyAddress,
        showIndustry: data.showIndustry,
        showSkills: data.showSkills,
        showLinkedin: data.showLinkedin,
        showInstagram: data.showInstagram,
        showFacebook: data.showFacebook,
        showTwitter: data.showTwitter,
        showBehance: data.showBehance,
        showDribbble: data.showDribbble,
        showGithub: data.showGithub,
        showYoutube: data.showYoutube,
        showProfilePhoto: data.showProfilePhoto,
        showBackgroundImage: data.showBackgroundImage
      },
      gallery_urls: data.gallery_urls || [],
      document_urls: data.document_urls || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Save to Supabase
    const { data: insertedData, error } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({
        error: 'Failed to save profile to database',
        details: error.message
      }, { status: 500 })
    }

    // Link profile to user via profile_users junction table
    try {
      await linkProfileToUser(profileId, userId)
      console.log('✅ Profile linked to user via profile_users')
    } catch (linkError) {
      console.error('⚠️ Profile linking failed (may already be linked):', linkError)
      // Non-critical - trigger might have already linked it
    }

    return NextResponse.json({
      success: true,
      profileId,
      message: 'Profile created successfully',
      data: insertedData
    })
  } catch (error) {
    console.error('Error creating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user
    const authSession = await getCurrentUser(request)

    if (!authSession.isAuthenticated || !authSession.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = authSession.user.id
    const data = await request.json()

    if (!data.id) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 })
    }

    console.log('✏️ Updating profile for user_id:', userId, 'profile_id:', data.id)

    // TODO: Update in Supabase
    const profileData = {
      template: data.template,
      first_name: data.firstName,
      last_name: data.lastName,
      title: data.title,
      bio: data.bio,
      email: data.email,
      alternate_email: data.alternateEmail,
      phone_number: data.phone || data.mobileNumber,
      whatsapp: data.whatsapp || data.whatsappNumber,
      location: data.location,

      // Professional Information (from Figma design)
      job_title: data.jobTitle,
      company_name: data.companyName || data.company,
      company_website: data.companyWebsite,
      company_address: data.companyAddress,
      company_logo_url: data.companyLogo,
      industry: data.industry,
      sub_domain: data.subDomain,
      professional_summary: data.professionalSummary,

      skills: data.skills,
      social_links: data.socialLinks || data.social_links,
      profile_photo_url: data.profilePhoto,
      background_image_url: data.backgroundImage,
      display_settings: data.displaySettings || data.display_settings || {
        // Collect all show* fields into display_settings
        showEmailPublicly: data.showEmailPublicly,
        showSecondaryEmailPublicly: data.showSecondaryEmailPublicly,
        showMobilePublicly: data.showMobilePublicly,
        showWhatsappPublicly: data.showWhatsappPublicly,
        showJobTitle: data.showJobTitle,
        showCompanyName: data.showCompanyName,
        showCompanyWebsite: data.showCompanyWebsite,
        showCompanyAddress: data.showCompanyAddress,
        showIndustry: data.showIndustry,
        showSkills: data.showSkills,
        showLinkedin: data.showLinkedin,
        showInstagram: data.showInstagram,
        showFacebook: data.showFacebook,
        showTwitter: data.showTwitter,
        showBehance: data.showBehance,
        showDribbble: data.showDribbble,
        showGithub: data.showGithub,
        showYoutube: data.showYoutube,
        showProfilePhoto: data.showProfilePhoto,
        showBackgroundImage: data.showBackgroundImage
      },
      gallery_urls: data.gallery_urls,
      document_urls: data.document_urls,
      updated_at: new Date().toISOString()
    }

    // Update in Supabase
    const { data: updatedData, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', data.id)
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({
        error: 'Failed to update profile in database',
        details: error.message
      }, { status: 500 })
    }

    if (!updatedData || updatedData.length === 0) {
      return NextResponse.json({
        error: 'Profile not found or unauthorized'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      profileId: data.id,
      message: 'Profile updated successfully',
      data: updatedData
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}