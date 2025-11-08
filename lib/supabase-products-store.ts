import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client with service role key for full access
const getAdminClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  price: number;
  cost: number | null;
  compare_at_price: number | null;
  currency: string;
  stock_quantity: number;
  low_stock_threshold: number;
  weight: number | null;
  dimensions: any;
  images: any[];
  features: any[];
  specifications: any;
  is_active: boolean;
  is_featured: boolean;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  sku: string;
  name: string;
  slug: string;
  description?: string;
  category_id?: string;
  price: number;
  cost?: number;
  compare_at_price?: number;
  currency?: string;
  stock_quantity?: number;
  low_stock_threshold?: number;
  weight?: number;
  dimensions?: any;
  images?: any[];
  features?: any[];
  specifications?: any;
  is_active?: boolean;
  is_featured?: boolean;
  meta_title?: string;
  meta_description?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {}

export const SupabaseProductsStore = {
  /**
   * Get all products
   */
  async getAll(): Promise<Product[]> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    return data as Product[];
  },

  /**
   * Get active products only
   */
  async getActive(): Promise<Product[]> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active products:', error);
      throw new Error(`Failed to fetch active products: ${error.message}`);
    }

    return data as Product[];
  },

  /**
   * Get product by ID
   */
  async getById(id: string): Promise<Product | null> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching product:', error);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    return data as Product;
  },

  /**
   * Get product by SKU
   */
  async getBySku(sku: string): Promise<Product | null> {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('sku', sku)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching product by SKU:', error);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    return data as Product;
  },

  /**
   * Create a new product
   */
  async create(productData: CreateProductData): Promise<Product> {
    const supabase = getAdminClient();

    const newProduct = {
      sku: productData.sku,
      name: productData.name,
      slug: productData.slug,
      description: productData.description || null,
      category_id: productData.category_id || null,
      price: productData.price,
      cost: productData.cost || null,
      compare_at_price: productData.compare_at_price || null,
      currency: productData.currency || 'USD',
      stock_quantity: productData.stock_quantity || 0,
      low_stock_threshold: productData.low_stock_threshold || 10,
      weight: productData.weight || null,
      dimensions: productData.dimensions || null,
      images: productData.images || [],
      features: productData.features || [],
      specifications: productData.specifications || {},
      is_active: productData.is_active !== undefined ? productData.is_active : true,
      is_featured: productData.is_featured || false,
      meta_title: productData.meta_title || null,
      meta_description: productData.meta_description || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('products')
      .insert([newProduct])
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      throw new Error(`Failed to create product: ${error.message}`);
    }

    return data as Product;
  },

  /**
   * Update an existing product
   */
  async update(id: string, productData: UpdateProductData): Promise<Product> {
    const supabase = getAdminClient();

    const updateData = {
      ...productData,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      throw new Error(`Failed to update product: ${error.message}`);
    }

    return data as Product;
  },

  /**
   * Delete a product
   */
  async delete(id: string): Promise<void> {
    const supabase = getAdminClient();

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  },

  /**
   * Get product statistics
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    lowStock: number;
    avgPrice: number;
  }> {
    const products = await this.getAll();

    return {
      total: products.length,
      active: products.filter(p => p.is_active).length,
      inactive: products.filter(p => !p.is_active).length,
      lowStock: products.filter(p => p.stock_quantity <= p.low_stock_threshold).length,
      avgPrice: products.length > 0
        ? products.reduce((sum, p) => sum + p.price, 0) / products.length
        : 0
    };
  }
};
