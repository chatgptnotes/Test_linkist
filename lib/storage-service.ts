// Production-ready file upload service using Supabase Storage
import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'

// Storage configuration
const STORAGE_CONFIG = {
  bucket: 'card-assets', // Main bucket for card assets
  maxFileSize: 10 * 1024 * 1024, // 10MB max
  allowedTypes: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/svg+xml',
    'application/pdf' // For proofs and documents
  ],
  folders: {
    logos: 'logos',
    photos: 'photos',
    backgrounds: 'backgrounds',
    qr_codes: 'qr_codes',
    proofs: 'proofs',
    certifications: 'certifications', // For certificates and attachments
    temp: 'temp' // For temporary uploads
  },
  imageResolutions: {
    thumbnail: { width: 150, height: 150 },
    medium: { width: 500, height: 500 },
    large: { width: 1200, height: 1200 }
  }
}

// Create Supabase client with service role for server operations
const createStorageClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for storage operations')
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export interface UploadOptions {
  folder?: keyof typeof STORAGE_CONFIG.folders
  userId?: string
  orderId?: string
  isPublic?: boolean
  generateThumbnail?: boolean
}

export interface UploadResult {
  success: boolean
  data?: {
    id: string
    path: string
    publicUrl?: string
    fileName: string
    fileSize: number
    mimeType: string
    width?: number
    height?: number
  }
  error?: string
}

export interface FileMetadata {
  name: string
  size: number
  type: string
  lastModified?: number
}

export class SupabaseStorageService {
  private supabase: ReturnType<typeof createStorageClient>

  constructor() {
    this.supabase = createStorageClient()
  }

  // Validate file before upload
  validateFile(file: FileMetadata): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > STORAGE_CONFIG.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds ${STORAGE_CONFIG.maxFileSize / 1024 / 1024}MB limit`
      }
    }

    // Check file type
    if (!STORAGE_CONFIG.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} not allowed. Allowed types: ${STORAGE_CONFIG.allowedTypes.join(', ')}`
      }
    }

    // Check file name
    if (!file.name || file.name.length > 255) {
      return {
        valid: false,
        error: 'Invalid file name'
      }
    }

    return { valid: true }
  }

  // Generate unique file path
  private generateFilePath(
    originalName: string,
    options: UploadOptions = {}
  ): string {
    const { folder = 'temp', userId, orderId } = options
    const timestamp = Date.now()
    const randomId = nanoid(8)
    const extension = originalName.split('.').pop()?.toLowerCase() || ''
    const baseName = originalName.split('.').slice(0, -1).join('.')
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-').substring(0, 50)
    
    const fileName = `${sanitizedName}-${timestamp}-${randomId}.${extension}`
    
    let path = `${STORAGE_CONFIG.folders[folder]}/${fileName}`
    
    // Add user/order organization if provided
    if (userId) {
      path = `${STORAGE_CONFIG.folders[folder]}/users/${userId}/${fileName}`
    } else if (orderId) {
      path = `${STORAGE_CONFIG.folders[folder]}/orders/${orderId}/${fileName}`
    }
    
    return path
  }

  // Get image dimensions (for images only)
  private async getImageDimensions(file: Buffer, mimeType: string): Promise<{ width?: number; height?: number }> {
    try {
      if (!mimeType.startsWith('image/')) return {}
      
      // For production, you'd use a proper image library like 'sharp' or 'image-size'
      // For now, we'll return default dimensions
      return { width: 1024, height: 1024 }
    } catch (error) {
      console.warn('Could not determine image dimensions:', error)
      return {}
    }
  }

  // Upload file to Supabase storage
  async uploadFile(
    file: Buffer | Uint8Array | File,
    fileName: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      console.log(`📤 Uploading file: ${fileName}`)

      // Validate file metadata
      const fileMetadata = {
        name: fileName,
        size: file instanceof File ? file.size : file.length,
        type: file instanceof File ? file.type : 'application/octet-stream'
      }

      const validation = this.validateFile(fileMetadata)
      if (!validation.valid) {
        console.error('❌ File validation failed:', validation.error)
        return { success: false, error: validation.error }
      }

      // Generate unique file path
      const filePath = this.generateFilePath(fileName, options)
      console.log(`📁 Generated file path: ${filePath}`)

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from(STORAGE_CONFIG.bucket)
        .upload(filePath, file, {
          cacheControl: '3600', // Cache for 1 hour
          upsert: false // Don't overwrite existing files
        })

      if (uploadError) {
        console.error('❌ Supabase storage upload error:', uploadError)
        return { success: false, error: uploadError.message }
      }

      console.log(`✅ File uploaded to storage: ${uploadData.path}`)

      // Get public URL if requested
      let publicUrl: string | undefined
      if (options.isPublic) {
        const { data: urlData } = this.supabase.storage
          .from(STORAGE_CONFIG.bucket)
          .getPublicUrl(uploadData.path)
        publicUrl = urlData.publicUrl
      }

      // Get image dimensions for images
      const dimensions = await this.getImageDimensions(
        file instanceof File ? await file.arrayBuffer().then(b => Buffer.from(b)) : Buffer.from(file),
        fileMetadata.type
      )

      // Save file metadata to database
      const assetRecord = await this.saveAssetToDatabase({
        filePath: uploadData.path,
        fileName: fileName,
        fileSize: fileMetadata.size,
        mimeType: fileMetadata.type,
        userId: options.userId,
        orderId: options.orderId,
        assetType: this.getAssetType(options.folder),
        isPublic: options.isPublic || false,
        width: dimensions.width,
        height: dimensions.height
      })

      console.log(`✅ File upload completed: ${assetRecord.id}`)

      return {
        success: true,
        data: {
          id: assetRecord.id,
          path: uploadData.path,
          publicUrl,
          fileName,
          fileSize: fileMetadata.size,
          mimeType: fileMetadata.type,
          width: dimensions.width,
          height: dimensions.height
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      console.error('💥 File upload error:', error)
      return { success: false, error: errorMessage }
    }
  }

  // Get asset type from folder
  private getAssetType(folder?: keyof typeof STORAGE_CONFIG.folders): string {
    switch (folder) {
      case 'logos': return 'logo'
      case 'photos': return 'photo'
      case 'backgrounds': return 'background'
      case 'qr_codes': return 'qr_code'
      case 'proofs': return 'proof'
      case 'certifications': return 'certification'
      default: return 'other'
    }
  }

  // Save asset metadata to database
  private async saveAssetToDatabase(asset: {
    filePath: string
    fileName: string
    fileSize: number
    mimeType: string
    userId?: string
    orderId?: string
    assetType: string
    isPublic: boolean
    width?: number
    height?: number
  }) {
    const { data, error } = await this.supabase
      .from('card_assets')
      .insert({
        user_id: asset.userId || null,
        order_id: asset.orderId || null,
        asset_type: asset.assetType,
        file_name: asset.fileName,
        file_path: asset.filePath,
        file_size: asset.fileSize,
        mime_type: asset.mimeType,
        width: asset.width || null,
        height: asset.height || null,
        is_public: asset.isPublic
      })
      .select()
      .single()

    if (error) {
      console.error('Database asset save error:', error)
      throw new Error(`Failed to save asset metadata: ${error.message}`)
    }

    return data
  }

  // Get signed URL for private files
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(STORAGE_CONFIG.bucket)
        .createSignedUrl(filePath, expiresIn)

      if (error) {
        console.error('Error creating signed URL:', error)
        return null
      }

      return data.signedUrl
    } catch (error) {
      console.error('Signed URL generation error:', error)
      return null
    }
  }

  // Delete file from storage and database
  async deleteFile(assetId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get asset info from database
      const { data: asset, error: fetchError } = await this.supabase
        .from('card_assets')
        .select('file_path')
        .eq('id', assetId)
        .single()

      if (fetchError || !asset) {
        return { success: false, error: 'Asset not found' }
      }

      // Delete from storage
      const { error: storageError } = await this.supabase.storage
        .from(STORAGE_CONFIG.bucket)
        .remove([asset.file_path])

      if (storageError) {
        console.error('Storage deletion error:', storageError)
        // Continue to delete from database even if storage deletion fails
      }

      // Delete from database
      const { error: dbError } = await this.supabase
        .from('card_assets')
        .delete()
        .eq('id', assetId)

      if (dbError) {
        return { success: false, error: dbError.message }
      }

      console.log(`✅ Asset deleted: ${assetId}`)
      return { success: true }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed'
      console.error('File deletion error:', error)
      return { success: false, error: errorMessage }
    }
  }

  // Get assets for a user or order
  async getAssets(filter: { userId?: string; orderId?: string; assetType?: string }) {
    try {
      let query = this.supabase.from('card_assets').select('*')

      if (filter.userId) {
        query = query.eq('user_id', filter.userId)
      }
      
      if (filter.orderId) {
        query = query.eq('order_id', filter.orderId)
      }

      if (filter.assetType) {
        query = query.eq('asset_type', filter.assetType)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching assets:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fetch failed'
      console.error('Assets fetch error:', error)
      return { success: false, error: errorMessage }
    }
  }

  // Clean up temporary files (run periodically)
  async cleanupTempFiles(olderThanHours: number = 24): Promise<number> {
    try {
      const cutoffTime = new Date()
      cutoffTime.setHours(cutoffTime.getHours() - olderThanHours)

      // Get temp files older than cutoff
      const { data: tempFiles, error } = await this.supabase
        .from('card_assets')
        .select('id, file_path')
        .like('file_path', `${STORAGE_CONFIG.folders.temp}%`)
        .lt('created_at', cutoffTime.toISOString())

      if (error) {
        console.error('Error fetching temp files:', error)
        return 0
      }

      let cleanedCount = 0
      for (const file of tempFiles) {
        const result = await this.deleteFile(file.id)
        if (result.success) {
          cleanedCount++
        }
      }

      console.log(`🧹 Cleaned up ${cleanedCount} temporary files`)
      return cleanedCount

    } catch (error) {
      console.error('Cleanup error:', error)
      return 0
    }
  }

  // Health check for storage service
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      // Test bucket access
      const { data, error } = await this.supabase.storage.listBuckets()
      
      if (error) {
        return { healthy: false, message: `Storage access error: ${error.message}` }
      }

      const bucketExists = data.some(bucket => bucket.name === STORAGE_CONFIG.bucket)
      
      if (!bucketExists) {
        return { healthy: false, message: `Bucket ${STORAGE_CONFIG.bucket} not found` }
      }

      return { healthy: true, message: 'Storage service healthy' }

    } catch (error) {
      return {
        healthy: false,
        message: `Storage health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Get storage configuration
  getConfig() {
    return {
      bucket: STORAGE_CONFIG.bucket,
      maxFileSize: STORAGE_CONFIG.maxFileSize,
      allowedTypes: STORAGE_CONFIG.allowedTypes,
      folders: STORAGE_CONFIG.folders
    }
  }
}

// Export singleton instance
export const storageService = new SupabaseStorageService()