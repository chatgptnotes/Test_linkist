import { NextRequest, NextResponse } from 'next/server'
import { SupabaseProfileStore, ProfileInput } from '@/lib/supabase-profile-store'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth-middleware'
import { linkProfileToUser } from '@/lib/profile-users-helpers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [POST /api/profiles/save] Request received')

    // Get authenticated user
    const authSession = await getCurrentUser(request)

    if (!authSession.isAuthenticated || !authSession.user) {
      console.error('❌ [POST /api/profiles/save] Authentication required')
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = authSession.user.id
    console.log('✅ [POST /api/profiles/save] Authenticated user:', userId)

    const data = await request.json()

    // Log basic request metadata to help debug environment-specific failures
    const originHeader = request.headers.get('origin') || request.headers.get('referer') || ''
    const userAgent = request.headers.get('user-agent') || ''
    const bodySize = JSON.stringify(data).length

    console.log('📦 [POST /api/profiles/save] Request metadata:', {
      origin: originHeader,
      userAgent: userAgent.split(' ')[0] || userAgent,
      bodySize
    })

    console.log('📦 [POST /api/profiles/save] Request data:', {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      hasPreferences: !!data.preferences
    })

    // Validate required fields
    if (!data.email) {
      console.error('❌ [POST /api/profiles/save] Missing required field: email')
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!data.firstName || !data.lastName) {
      console.error('❌ [POST /api/profiles/save] Missing required fields: firstName or lastName')
      return NextResponse.json(
        { success: false, error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if this user already has a profile with a claimed custom_url
    // Query via profile_users junction table to ensure we get THIS user's profile only
    const { data: existingProfileResult } = await supabase
      .from('profile_users')
      .select(`
        profile_id,
        profiles (
          id,
          custom_url
        )
      `)
      .eq('user_id', userId)
      .maybeSingle()

    const existingUserProfile = existingProfileResult?.profiles as any

    let finalCustomUrl: string

    if (existingUserProfile?.custom_url) {
      // User already claimed a custom URL - preserve it!
      finalCustomUrl = existingUserProfile.custom_url
      console.log('✅ [POST /api/profiles/save] Preserving claimed custom URL:', finalCustomUrl)
    } else {
      // No claimed URL - generate custom_url from firstName-lastName
      let customUrl = `${data.firstName}-${data.lastName}`
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

      console.log('🔗 [POST /api/profiles/save] Generated custom URL:', customUrl)

      // Check for uniqueness and append number if needed
      finalCustomUrl = customUrl
      let counter = 1

      // Check if custom_url already exists for another user
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('custom_url, email')
        .eq('custom_url', finalCustomUrl)
        .maybeSingle()

      // If URL exists and belongs to a different email, find a unique one
      if (existingProfile && existingProfile.email !== data.email) {
        console.log('⚠️ [POST /api/profiles/save] Custom URL already exists, finding unique URL...')

        while (true) {
          const testUrl = `${customUrl}-${counter}`
          const { data: testProfile } = await supabase
            .from('profiles')
            .select('custom_url')
            .eq('custom_url', testUrl)
            .maybeSingle()

          if (!testProfile) {
            finalCustomUrl = testUrl
            console.log('✅ [POST /api/profiles/save] Found unique custom URL:', finalCustomUrl)
            break
          }
          counter++
        }
      }

      console.log('🔗 [POST /api/profiles/save] Final custom URL:', finalCustomUrl)
    }

    // Get base URL from request origin or referer
    const origin = request.headers.get('origin') || request.headers.get('referer') || '';
    let baseUrl = '';

    if (origin) {
      // Extract protocol and hostname from origin
      try {
        const url = new URL(origin);
        baseUrl = `${url.protocol}//${url.host}`;
      } catch (e) {
        console.warn('⚠️ [POST /api/profiles/save] Failed to parse origin, using fallback');
      }
    }

    // Fallback to environment variable if origin not available
    if (!baseUrl) {
      baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://linkist.ai';
    }

    // Generate full profile URL
    const fullProfileUrl = `${baseUrl}/${finalCustomUrl}`;

    console.log('🌐 [POST /api/profiles/save] Base URL:', baseUrl);
    console.log('🔗 [POST /api/profiles/save] Full profile URL:', fullProfileUrl);

    // Prepare profile data for database
    const profileInput: ProfileInput = {
      email: data.email,
      user_id: userId, // Use authenticated user ID
      first_name: data.firstName,
      last_name: data.lastName,
      phone_number: data.mobileNumber || null,
      company: data.companyName || null,
      is_founder_member: data.isFounderMember || false,
      avatar_url: data.profilePhoto || null,
      custom_url: finalCustomUrl,
      profile_url: fullProfileUrl,
      display_settings: {
        // Save visibility toggles to display_settings for preview page
        showEmailPublicly: data.showEmailPublicly ?? true,
        showSecondaryEmailPublicly: data.showSecondaryEmailPublicly ?? true,
        showMobilePublicly: data.showMobilePublicly ?? true,
        showWhatsappPublicly: data.showWhatsappPublicly ?? false,
        showJobTitle: data.showJobTitle ?? true,
        showCompanyName: data.showCompanyName ?? true,
        showCompanyWebsite: data.showCompanyWebsite ?? true,
        showCompanyAddress: data.showCompanyAddress ?? true,
        showIndustry: data.showIndustry ?? true,
        showSkills: data.showSkills ?? true,
        showLinkedin: data.showLinkedin ?? false,
        showInstagram: data.showInstagram ?? false,
        showFacebook: data.showFacebook ?? false,
        showTwitter: data.showTwitter ?? false,
        showBehance: data.showBehance ?? false,
        showDribbble: data.showDribbble ?? false,
        showGithub: data.showGithub ?? false,
        showYoutube: data.showYoutube ?? false,
        showProfilePhoto: data.showProfilePhoto ?? true,
        showBackgroundImage: data.showBackgroundImage ?? true
      },
      preferences: {
        // Basic Information
        salutation: data.salutation || '',
        secondaryEmail: data.secondaryEmail || '',
        whatsappNumber: data.whatsappNumber || '',
        showEmailPublicly: data.showEmailPublicly ?? true,
        showMobilePublicly: data.showMobilePublicly ?? true,
        showWhatsappPublicly: data.showWhatsappPublicly ?? false,

        // Professional Information
        jobTitle: data.jobTitle || '',
        companyWebsite: data.companyWebsite || '',
        companyAddress: data.companyAddress || '',
        companyLogo: data.companyLogo || null,
        industry: data.industry || '',
        subDomain: data.subDomain || '',
        skills: data.skills || [],
        professionalSummary: data.professionalSummary || '',
        showJobTitle: data.showJobTitle ?? true,
        showCompanyName: data.showCompanyName ?? true,
        showCompanyWebsite: data.showCompanyWebsite ?? true,
        showCompanyAddress: data.showCompanyAddress ?? true,
        showIndustry: data.showIndustry ?? true,
        showSkills: data.showSkills ?? true,

        // Social & Digital Presence
        linkedinUrl: data.linkedinUrl || '',
        instagramUrl: data.instagramUrl || '',
        facebookUrl: data.facebookUrl || '',
        twitterUrl: data.twitterUrl || '',
        behanceUrl: data.behanceUrl || '',
        dribbbleUrl: data.dribbbleUrl || '',
        githubUrl: data.githubUrl || '',
        youtubeUrl: data.youtubeUrl || '',
        showLinkedin: data.showLinkedin ?? false,
        showInstagram: data.showInstagram ?? false,
        showFacebook: data.showFacebook ?? false,
        showTwitter: data.showTwitter ?? false,
        showBehance: data.showBehance ?? false,
        showDribbble: data.showDribbble ?? false,
        showGithub: data.showGithub ?? false,
        showYoutube: data.showYoutube ?? false,

        // Profile Photo & Background
        backgroundImage: data.backgroundImage || null,
        showProfilePhoto: data.showProfilePhoto ?? true,
        showBackgroundImage: data.showBackgroundImage ?? true,

        // Media Gallery
        photos: data.photos || [],
        videos: data.videos || [],

        // Certifications
        certifications: data.certifications || [],
      }
    }

    console.log('💾 [POST /api/profiles/save] Saving profile to database...')

    // Save to database using profile store with user_id
    // Pass existing profile ID if user already has one to update instead of create
    const savedProfile = await SupabaseProfileStore.upsertByEmail(profileInput, userId, existingUserProfile?.id)

    console.log('✅ [POST /api/profiles/save] Profile saved successfully:', savedProfile.id)

  // Ensure profile is linked to user in profile_users junction table
  // linkProfileToUser expects (profileId, userId)
  await linkProfileToUser(savedProfile.id, userId)
    console.log('✅ [POST /api/profiles/save] Profile linked to user in junction table')

    // Save services if provided
    if (data.services && Array.isArray(data.services)) {
      console.log('💼 [POST /api/profiles/save] Saving services...', data.services.length)

      // Delete existing services for this profile
      await supabase
        .from('profile_services')
        .delete()
        .eq('profile_id', savedProfile.id)

      // Insert new services
      if (data.services.length > 0) {
        const servicesToInsert = data.services
          .filter((service: any) => service.title) // Only save services with a title
          .map((service: any, index: number) => ({
            profile_id: savedProfile.id,
            title: service.title,
            description: service.description || '',
            pricing: service.pricing || '',
            pricing_unit: service.pricingUnit || '',
            category: service.category || '',
            currency: service.currency || 'USD',
            is_active: service.showPublicly !== false,
            display_order: index
          }))

        if (servicesToInsert.length > 0) {
          const { error: servicesError } = await supabase
            .from('profile_services')
            .insert(servicesToInsert)

          if (servicesError) {
            console.error('❌ [POST /api/profiles/save] Error saving services:', servicesError)
          } else {
            console.log('✅ [POST /api/profiles/save] Services saved successfully')
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profile saved successfully',
      profile: {
        id: savedProfile.id,
        email: savedProfile.email,
        first_name: savedProfile.first_name,
        last_name: savedProfile.last_name,
        custom_url: savedProfile.custom_url,
      }
    })

  } catch (error) {
    // Log expanded error details (including non-enumerable properties) to server logs
    try {
      const errDump = JSON.stringify(error, Object.getOwnPropertyNames(error))
      console.error('❌ [POST /api/profiles/save] Error saving profile (details):', errDump)
    } catch (dumpErr) {
      console.error('❌ [POST /api/profiles/save] Error saving profile:', error)
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save profile'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authSession = await getCurrentUser(request)

    if (!authSession.isAuthenticated || !authSession.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = authSession.user.id
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId')

    console.log('🔍 [GET /api/profiles/save] Fetching profile for user:', userId)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch profile via profile_users junction table
    let profileQuery = supabase
      .from('profile_users')
      .select(`
        profile_id,
        profiles (*)
      `)
      .eq('user_id', userId)

    if (profileId) {
      profileQuery = profileQuery.eq('profile_id', profileId)
    }

    const { data: result, error } = await profileQuery.maybeSingle()

    if (error) {
      console.error('❌ [GET /api/profiles/save] Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    if (!result || !result.profiles) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: result.profiles
    })

  } catch (error) {
    console.error('❌ [GET /api/profiles/save] Error fetching profile:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profile'
      },
      { status: 500 }
    )
  }
}
