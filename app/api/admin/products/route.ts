import { NextRequest, NextResponse } from 'next/server';
import { SupabaseProductsStore } from '@/lib/supabase-products-store';
import { getCurrentUser } from '@/lib/auth-middleware';

// GET - Fetch all products
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

    const products = await SupabaseProductsStore.getAll();
    const stats = await SupabaseProductsStore.getStats();

    return NextResponse.json({
      products,
      stats,
      success: true
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Create new product
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
    const { sku, name, slug, description, price, stock_quantity, is_active, category_id } = body;

    // Validation
    if (!sku || !name || !slug || price === undefined || price === null) {
      return NextResponse.json(
        { error: 'Missing required fields (sku, name, slug, price)' },
        { status: 400 }
      );
    }

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'Invalid price' },
        { status: 400 }
      );
    }

    // Check if SKU already exists
    const existingSku = await SupabaseProductsStore.getBySku(sku);
    if (existingSku) {
      return NextResponse.json(
        { error: 'Product with this SKU already exists' },
        { status: 400 }
      );
    }

    const product = await SupabaseProductsStore.create({
      sku,
      name,
      slug,
      description: description || '',
      price,
      stock_quantity: stock_quantity || 0,
      is_active: is_active !== undefined ? is_active : true,
      category_id: category_id || null
    });

    return NextResponse.json({
      product,
      success: true,
      message: 'Product created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(request: NextRequest) {
  try {
    // Verify admin access
    const session = await getCurrentUser(request);
    if (!session.isAdmin) {
      console.error('Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Update product request body:', body);

    const { id, ...updateData } = body;

    if (!id) {
      console.error('Product ID is missing');
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const existingProduct = await SupabaseProductsStore.getById(id);
    if (!existingProduct) {
      console.error('Product not found:', id);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Validate price if provided
    if (updateData.price !== undefined && (typeof updateData.price !== 'number' || updateData.price < 0)) {
      console.error('Invalid price:', updateData.price, 'Type:', typeof updateData.price);
      return NextResponse.json(
        { error: `Invalid price: ${updateData.price}. Must be a positive number.` },
        { status: 400 }
      );
    }

    // Validate stock_quantity if provided
    if (updateData.stock_quantity !== undefined && (typeof updateData.stock_quantity !== 'number' || updateData.stock_quantity < 0)) {
      console.error('Invalid stock quantity:', updateData.stock_quantity);
      return NextResponse.json(
        { error: `Invalid stock quantity: ${updateData.stock_quantity}. Must be a non-negative number.` },
        { status: 400 }
      );
    }

    // If SKU is being updated, check for conflicts (but SKU shouldn't be updated)
    if (updateData.sku && updateData.sku !== existingProduct.sku) {
      const existingSku = await SupabaseProductsStore.getBySku(updateData.sku);
      if (existingSku && existingSku.id !== id) {
        console.error('SKU conflict:', updateData.sku);
        return NextResponse.json(
          { error: 'Product with this SKU already exists' },
          { status: 400 }
        );
      }
    }

    console.log('Updating product with data:', updateData);
    const updatedProduct = await SupabaseProductsStore.update(id, updateData);
    console.log('Product updated successfully:', updatedProduct.id);

    return NextResponse.json({
      product: updatedProduct,
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to update product: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const existingProduct = await SupabaseProductsStore.getById(id);
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    await SupabaseProductsStore.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
