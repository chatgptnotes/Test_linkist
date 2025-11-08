import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client
function getAdminClient() {
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

// GET - Fetch all content items
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const session = await getCurrentUser(request);
    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const supabase = getAdminClient();
    let query = supabase
      .from('cms_pages')
      .select(`
        id,
        title,
        slug,
        content,
        status,
        published_at,
        created_at,
        updated_at,
        author_id
      `)
      .order('updated_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch content' },
        { status: 500 }
      );
    }

    // Transform data to match frontend ContentItem interface
    const contentItems = (data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      type: 'page' as const, // All items from cms_pages are type 'page'
      status: item.status || 'draft',
      author: 'Admin', // Default author since we removed the join
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      views: 0, // Not tracked in DB yet
      excerpt: item.content ? item.content.substring(0, 150) : '',
      featured: false // Not tracked in DB yet
    }));

    return NextResponse.json({
      content: contentItems,
      success: true
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// POST - Create new content item
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const session = await getCurrentUser(request);
    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, slug, content, status, meta_title, meta_description } = body;

    // Validation
    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Check if slug already exists
    const { data: existingSlug } = await supabase
      .from('cms_pages')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingSlug) {
      return NextResponse.json(
        { error: 'Content with this slug already exists' },
        { status: 400 }
      );
    }

    // Create new content
    const { data, error } = await supabase
      .from('cms_pages')
      .insert({
        title,
        slug,
        content: content || '',
        status: status || 'draft',
        meta_title,
        meta_description,
        author_id: session.user.id,
        published_at: status === 'published' ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      content: data,
      success: true,
      message: 'Content created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json(
      { error: 'Failed to create content' },
      { status: 500 }
    );
  }
}
