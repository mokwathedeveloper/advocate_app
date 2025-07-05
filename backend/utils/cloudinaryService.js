// Comprehensive Cloudinary service for LegalPro v1.0.1
const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;
const path = require('path');

/**
 * Cloudinary Service Class
 * Provides comprehensive file management functionality
 */
class CloudinaryService {
  constructor() {
    this.folderPrefix = process.env.CLOUDINARY_FOLDER_PREFIX || 'legalpro';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 52428800; // 50MB default
    this.allowedTypes = this.parseAllowedTypes();
  }

  /**
   * Parse allowed file types from environment variable
   */
  parseAllowedTypes() {
    const defaultTypes = 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,jpg,jpeg,png,gif,webp,svg,mp4,mp3,wav,ogg';
    const typesString = process.env.ALLOWED_FILE_TYPES || defaultTypes;
    return typesString.split(',').map(type => type.trim().toLowerCase());
  }

  /**
   * Generate folder path based on context
   */
  generateFolderPath(context = {}) {
    const { userId, caseId, type = 'general' } = context;
    let folderPath = this.folderPrefix;

    if (caseId) {
      folderPath += `/cases/${caseId}`;
      if (type !== 'general') {
        folderPath += `/${type}`;
      }
    } else if (userId) {
      folderPath += `/users/${userId}`;
      if (type !== 'general') {
        folderPath += `/${type}`;
      }
    } else {
      folderPath += `/shared/${type}`;
    }

    return folderPath;
  }

  /**
   * Validate file before upload
   */
  validateFile(file) {
    const errors = [];

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File size exceeds maximum limit of ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Check file type
    const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
    if (!this.allowedTypes.includes(fileExtension)) {
      errors.push(`File type .${fileExtension} is not allowed. Allowed types: ${this.allowedTypes.join(', ')}`);
    }

    // Check filename
    if (!file.originalname || file.originalname.length > 255) {
      errors.push('Invalid filename or filename too long');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Upload single file to Cloudinary
   */
  async uploadFile(file, options = {}) {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }

      const {
        userId,
        caseId,
        type = 'documents',
        isPublic = false,
        tags = [],
        transformation = null
      } = options;

      // Generate folder path
      const folder = this.generateFolderPath({ userId, caseId, type });

      // Prepare upload options
      const uploadOptions = {
        folder,
        resource_type: 'auto',
        public_id: `${Date.now()}_${path.parse(file.originalname).name}`,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        tags: ['legalpro', ...tags],
        context: {
          originalName: file.originalname,
          uploadedBy: userId || 'system',
          caseId: caseId || '',
          fileType: type,
          uploadedAt: new Date().toISOString()
        }
      };

      // Add transformation if provided
      if (transformation) {
        uploadOptions.transformation = transformation;
      }

      // Set access mode
      if (!isPublic) {
        uploadOptions.type = 'authenticated';
      }

      // Upload file
      let result;
      if (file.buffer) {
        // Upload from buffer (memory storage)
        result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(file.buffer);
        });
      } else if (file.path) {
        // Upload from file path (disk storage)
        result = await cloudinary.uploader.upload(file.path, uploadOptions);
        
        // Clean up temporary file
        try {
          await fs.unlink(file.path);
        } catch (cleanupError) {
          console.warn('Failed to cleanup temporary file:', cleanupError.message);
        }
      } else {
        throw new Error('Invalid file object: missing buffer or path');
      }

      // Return formatted result
      return {
        id: result.public_id,
        cloudinaryId: result.public_id,
        originalName: file.originalname,
        url: result.url,
        secureUrl: result.secure_url,
        size: result.bytes,
        format: result.format,
        resourceType: result.resource_type,
        folder: result.folder,
        width: result.width,
        height: result.height,
        uploadedAt: new Date(),
        metadata: {
          etag: result.etag,
          version: result.version,
          signature: result.signature,
          tags: result.tags,
          context: result.context
        }
      };

    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(files, options = {}) {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, options));
      const results = await Promise.allSettled(uploadPromises);

      const successful = [];
      const failed = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value);
        } else {
          failed.push({
            filename: files[index].originalname,
            error: result.reason.message
          });
        }
      });

      return {
        successful,
        failed,
        totalUploaded: successful.length,
        totalFailed: failed.length
      };

    } catch (error) {
      console.error('Multiple file upload error:', error);
      throw new Error(`Multiple upload failed: ${error.message}`);
    }
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId, resourceType = 'auto') {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true // Invalidate CDN cache
      });

      if (result.result === 'ok') {
        return {
          success: true,
          message: 'File deleted successfully',
          publicId
        };
      } else {
        throw new Error(`Delete failed: ${result.result}`);
      }

    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(publicIds, resourceType = 'auto') {
    try {
      const result = await cloudinary.api.delete_resources(publicIds, {
        resource_type: resourceType,
        invalidate: true
      });

      return {
        deleted: Object.keys(result.deleted),
        notFound: Object.keys(result.not_found || {}),
        partial: Object.keys(result.partial || {})
      };

    } catch (error) {
      console.error('Multiple file delete error:', error);
      throw new Error(`Multiple delete failed: ${error.message}`);
    }
  }

  /**
   * Generate signed URL for secure access
   */
  generateSignedUrl(publicId, options = {}) {
    try {
      const {
        expiresIn = 3600, // 1 hour default
        transformation = null,
        resourceType = 'auto'
      } = options;

      const signedUrl = cloudinary.utils.private_download_url(
        publicId,
        resourceType,
        {
          expires_at: Math.floor(Date.now() / 1000) + expiresIn,
          transformation
        }
      );

      return {
        url: signedUrl,
        expiresAt: new Date(Date.now() + (expiresIn * 1000))
      };

    } catch (error) {
      console.error('Signed URL generation error:', error);
      throw new Error(`Signed URL generation failed: ${error.message}`);
    }
  }

  /**
   * Get file details
   */
  async getFileDetails(publicId, resourceType = 'auto') {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType
      });

      return {
        id: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        size: result.bytes,
        format: result.format,
        width: result.width,
        height: result.height,
        createdAt: new Date(result.created_at),
        folder: result.folder,
        tags: result.tags,
        context: result.context,
        metadata: {
          etag: result.etag,
          version: result.version,
          signature: result.signature
        }
      };

    } catch (error) {
      console.error('Get file details error:', error);
      throw new Error(`Failed to get file details: ${error.message}`);
    }
  }

  /**
   * Search files by criteria
   */
  async searchFiles(criteria = {}) {
    try {
      const {
        folder = '',
        tags = [],
        resourceType = 'auto',
        maxResults = 50,
        nextCursor = null
      } = criteria;

      let expression = '';
      
      if (folder) {
        expression += `folder:${folder}*`;
      }
      
      if (tags.length > 0) {
        const tagExpression = tags.map(tag => `tags:${tag}`).join(' AND ');
        expression += expression ? ` AND (${tagExpression})` : tagExpression;
      }

      const searchOptions = {
        expression: expression || 'folder:legalpro*',
        resource_type: resourceType,
        max_results: maxResults,
        sort_by: [['created_at', 'desc']]
      };

      if (nextCursor) {
        searchOptions.next_cursor = nextCursor;
      }

      const result = await cloudinary.search.execute();

      return {
        resources: result.resources.map(resource => ({
          id: resource.public_id,
          url: resource.url,
          secureUrl: resource.secure_url,
          size: resource.bytes,
          format: resource.format,
          createdAt: new Date(resource.created_at),
          folder: resource.folder,
          tags: resource.tags,
          context: resource.context
        })),
        totalCount: result.total_count,
        nextCursor: result.next_cursor
      };

    } catch (error) {
      console.error('File search error:', error);
      throw new Error(`File search failed: ${error.message}`);
    }
  }

  /**
   * Transform image
   */
  async transformImage(publicId, transformations) {
    try {
      const transformedUrl = cloudinary.utils.url(publicId, {
        ...transformations,
        sign_url: true
      });

      return {
        originalId: publicId,
        transformedUrl,
        transformations
      };

    } catch (error) {
      console.error('Image transformation error:', error);
      throw new Error(`Image transformation failed: ${error.message}`);
    }
  }

  /**
   * Get storage usage statistics
   */
  async getUsageStats() {
    try {
      const usage = await cloudinary.api.usage();
      
      return {
        storage: {
          used: usage.storage.used_bytes,
          limit: usage.storage.limit,
          percentage: (usage.storage.used_bytes / usage.storage.limit) * 100
        },
        bandwidth: {
          used: usage.bandwidth.used_bytes,
          limit: usage.bandwidth.limit,
          percentage: (usage.bandwidth.used_bytes / usage.bandwidth.limit) * 100
        },
        requests: {
          used: usage.requests,
          limit: usage.requests_limit,
          percentage: (usage.requests / usage.requests_limit) * 100
        },
        transformations: {
          used: usage.transformations,
          limit: usage.transformations_limit,
          percentage: (usage.transformations / usage.transformations_limit) * 100
        }
      };

    } catch (error) {
      console.error('Usage stats error:', error);
      throw new Error(`Failed to get usage stats: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new CloudinaryService();
