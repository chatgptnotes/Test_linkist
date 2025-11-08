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

// GET - Fetch single content item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const session = await getCurrentUser(request);
    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('cms_pages')
      .select(`
        id,
        title,
        slug,
        content,
        content_json,
        template,
        status,
        meta_title,
        meta_description,
        meta_keywords,
        published_at,
        author_id,
        created_at,
        updated_at
      `)
      .eq('id', params.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      content: data,
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

// PUT - Update content item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { title, slug, content, status, meta_title, meta_description, meta_keywords, template, content_json } = body;

    const supabase = getAdminClient();

    // Check if content exists
    const { data: existing, error: fetchError } = await supabase
      .from('cms_pages')
      .select('id, slug, status')
      .eq('id', params.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // If slug is being updated, check for conflicts
    if (slug && slug !== existing.slug) {
      const { data: existingSlug } = await supabase
        .from('cms_pages')
        .select('id')
        .eq('slug', slug)
        .neq('id', params.id)
        .single();

      if (existingSlug) {
        return NextResponse.json(
          { error: 'Content with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (content !== undefined) updateData.content = content;
    if (status !== undefined) updateData.status = status;
    if (meta_title !== undefined) updateData.meta_title = meta_title;
    if (meta_description !== undefined) updateData.meta_description = meta_description;
    if (meta_keywords !== undefined) updateData.meta_keywords = meta_keywords;
    if (template !== undefined) updateData.template = template;
    if (content_json !== undefined) updateData.content_json = content_json;

    // If status is changing to published and wasn't published before, set published_at
    if (status === 'published' && existing.status !== 'published') {
      updateData.published_at = new Date().toISOString();
    }

    // Update content
    const { data, error } = await supabase
      .from('cms_pages')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      content: data,
      success: true,
      message: 'Content updated successfully'
    });
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}

// DELETE - Delete content item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const session = await getCurrentUser(request);
    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getAdminClient();

    // Check if content exists
    const { data: existing, error: fetchError } = await supabase
      .from('cms_pages')
      .select('id')
      .eq('id', params.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Delete content
    const { error } = await supabase
      .from('cms_pages')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}
