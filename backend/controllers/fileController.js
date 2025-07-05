// File management controller for LegalPro v1.0.1 with Cloudinary integration
const cloudinaryService = require('../utils/cloudinaryService');
const { validationResult } = require('express-validator');

/**
 * Upload single file
 * POST /api/files/upload
 */
const uploadSingleFile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Extract metadata from request
    const {
      caseId,
      type = 'documents',
      description,
      tags = [],
      isPublic = false
    } = req.body;

    // Parse tags if it's a string
    const parsedTags = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags;

    // Upload options
    const uploadOptions = {
      userId: req.user.id,
      caseId,
      type,
      isPublic: isPublic === 'true' || isPublic === true,
      tags: parsedTags
    };

    // Upload file to Cloudinary
    const result = await cloudinaryService.uploadFile(req.file, uploadOptions);

    // Add additional metadata
    const fileData = {
      ...result,
      description,
      uploadedBy: {
        id: req.user.id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        role: req.user.role
      },
      caseId,
      type,
      isPublic
    };

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: fileData
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error.message
    });
  }
};

/**
 * Upload multiple files
 * POST /api/files/upload-multiple
 */
const uploadMultipleFiles = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Extract metadata from request
    const {
      caseId,
      type = 'documents',
      description,
      tags = [],
      isPublic = false
    } = req.body;

    // Parse tags if it's a string
    const parsedTags = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags;

    // Upload options
    const uploadOptions = {
      userId: req.user.id,
      caseId,
      type,
      isPublic: isPublic === 'true' || isPublic === true,
      tags: parsedTags
    };

    // Upload files to Cloudinary
    const result = await cloudinaryService.uploadMultipleFiles(req.files, uploadOptions);

    // Add additional metadata to successful uploads
    const enhancedSuccessful = result.successful.map(file => ({
      ...file,
      description,
      uploadedBy: {
        id: req.user.id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        role: req.user.role
      },
      caseId,
      type,
      isPublic
    }));

    res.status(201).json({
      success: true,
      message: `${result.totalUploaded} files uploaded successfully`,
      files: enhancedSuccessful,
      failed: result.failed,
      summary: {
        totalUploaded: result.totalUploaded,
        totalFailed: result.totalFailed
      }
    });

  } catch (error) {
    console.error('Multiple file upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Multiple file upload failed',
      error: error.message
    });
  }
};

/**
 * Get file details
 * GET /api/files/:fileId
 */
const getFileDetails = async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'File ID is required'
      });
    }

    // Get file details from Cloudinary
    const fileDetails = await cloudinaryService.getFileDetails(fileId);

    // Check if user has access to this file
    // This would typically involve checking database records for file ownership/permissions
    // For now, we'll allow access based on folder structure

    res.status(200).json({
      success: true,
      file: fileDetails
    });

  } catch (error) {
    console.error('Get file details error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get file details',
      error: error.message
    });
  }
};

/**
 * Delete file
 * DELETE /api/files/:fileId
 */
const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'File ID is required'
      });
    }

    // TODO: Add permission check here
    // Check if user has permission to delete this file

    // Delete file from Cloudinary
    const result = await cloudinaryService.deleteFile(fileId);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      fileId
    });

  } catch (error) {
    console.error('Delete file error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
};

/**
 * Delete multiple files
 * DELETE /api/files/bulk-delete
 */
const deleteMultipleFiles = async (req, res) => {
  try {
    const { fileIds } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File IDs array is required'
      });
    }

    // TODO: Add permission check here for each file

    // Delete files from Cloudinary
    const result = await cloudinaryService.deleteMultipleFiles(fileIds);

    res.status(200).json({
      success: true,
      message: `${result.deleted.length} files deleted successfully`,
      deleted: result.deleted,
      notFound: result.notFound,
      partial: result.partial
    });

  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete files',
      error: error.message
    });
  }
};

/**
 * Generate signed URL for secure access
 * POST /api/files/:fileId/signed-url
 */
const generateSignedUrl = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { expiresIn = 3600, transformation } = req.body;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'File ID is required'
      });
    }

    // TODO: Add permission check here

    // Generate signed URL
    const result = await cloudinaryService.generateSignedUrl(fileId, {
      expiresIn,
      transformation
    });

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Generate signed URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate signed URL',
      error: error.message
    });
  }
};

/**
 * Search files
 * GET /api/files/search
 */
const searchFiles = async (req, res) => {
  try {
    const {
      folder,
      tags,
      type,
      caseId,
      userId,
      maxResults = 20,
      nextCursor
    } = req.query;

    // Build search criteria
    const criteria = {
      maxResults: parseInt(maxResults),
      nextCursor
    };

    // Build folder path based on parameters
    if (caseId) {
      criteria.folder = `legalpro/cases/${caseId}`;
    } else if (userId) {
      criteria.folder = `legalpro/users/${userId}`;
    } else if (folder) {
      criteria.folder = folder;
    }

    // Add tags if provided
    if (tags) {
      criteria.tags = typeof tags === 'string' ? tags.split(',') : tags;
    }

    // Search files
    const result = await cloudinaryService.searchFiles(criteria);

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Search files error:', error);
    res.status(500).json({
      success: false,
      message: 'File search failed',
      error: error.message
    });
  }
};

/**
 * Transform image
 * POST /api/files/:fileId/transform
 */
const transformImage = async (req, res) => {
  try {
    const { fileId } = req.params;
    const transformations = req.body;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'File ID is required'
      });
    }

    // TODO: Add permission check here

    // Transform image
    const result = await cloudinaryService.transformImage(fileId, transformations);

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Transform image error:', error);
    res.status(500).json({
      success: false,
      message: 'Image transformation failed',
      error: error.message
    });
  }
};

/**
 * Get storage usage statistics (Admin only)
 * GET /api/files/usage-stats
 */
const getUsageStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'advocate') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or advocate role required.'
      });
    }

    // Get usage statistics
    const stats = await cloudinaryService.getUsageStats();

    res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get usage stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get usage statistics',
      error: error.message
    });
  }
};

module.exports = {
  uploadSingleFile,
  uploadMultipleFiles,
  getFileDetails,
  deleteFile,
  deleteMultipleFiles,
  generateSignedUrl,
  searchFiles,
  transformImage,
  getUsageStats
};
