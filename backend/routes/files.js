// File management routes for LegalPro v1.0.1 with Cloudinary integration
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

// Import middleware
const { protect } = require('../middleware/auth');
const {
  uploadSingle,
  uploadMultiple,
  validateUploadedFiles,
  handleUploadErrors
} = require('../middleware/upload');

// Import controller
const {
  uploadSingleFile,
  uploadMultipleFiles,
  getFileDetails,
  deleteFile,
  deleteMultipleFiles,
  generateSignedUrl,
  searchFiles,
  transformImage,
  getUsageStats
} = require('../controllers/fileController');

// Validation schemas
const uploadValidation = [
  body('type')
    .optional()
    .isIn(['documents', 'images', 'media', 'profile', 'evidence', 'contracts', 'correspondence', 'court-filings'])
    .withMessage('Invalid file type category'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        const tags = value.split(',').map(tag => tag.trim());
        return tags.every(tag => tag.length <= 50);
      }
      if (Array.isArray(value)) {
        return value.every(tag => typeof tag === 'string' && tag.length <= 50);
      }
      return false;
    })
    .withMessage('Tags must be strings with maximum 50 characters each'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean value'),
  body('caseId')
    .optional()
    .isMongoId()
    .withMessage('Invalid case ID format')
];

const fileIdValidation = [
  param('fileId')
    .notEmpty()
    .withMessage('File ID is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Invalid file ID format')
];

const signedUrlValidation = [
  body('expiresIn')
    .optional()
    .isInt({ min: 60, max: 86400 }) // 1 minute to 24 hours
    .withMessage('Expires in must be between 60 seconds and 24 hours'),
  body('transformation')
    .optional()
    .isObject()
    .withMessage('Transformation must be an object')
];

const searchValidation = [
  query('maxResults')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max results must be between 1 and 100'),
  query('caseId')
    .optional()
    .isMongoId()
    .withMessage('Invalid case ID format'),
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID format')
];

const bulkDeleteValidation = [
  body('fileIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('File IDs must be an array with 1-50 items'),
  body('fileIds.*')
    .notEmpty()
    .withMessage('Each file ID must not be empty')
];

const transformValidation = [
  body('width')
    .optional()
    .isInt({ min: 1, max: 4000 })
    .withMessage('Width must be between 1 and 4000 pixels'),
  body('height')
    .optional()
    .isInt({ min: 1, max: 4000 })
    .withMessage('Height must be between 1 and 4000 pixels'),
  body('quality')
    .optional()
    .isIn(['auto', 'auto:best', 'auto:good', 'auto:eco', 'auto:low'])
    .withMessage('Invalid quality setting'),
  body('format')
    .optional()
    .isIn(['jpg', 'png', 'webp', 'gif', 'svg', 'pdf'])
    .withMessage('Invalid format')
];

// Routes

/**
 * @route   POST /api/files/upload
 * @desc    Upload single file
 * @access  Private
 */
router.post('/upload',
  protect,
  uploadSingle('file'),
  uploadValidation,
  validateUploadedFiles,
  uploadSingleFile,
  handleUploadErrors
);

/**
 * @route   POST /api/files/upload-multiple
 * @desc    Upload multiple files
 * @access  Private
 */
router.post('/upload-multiple',
  protect,
  uploadMultiple('files', 10),
  uploadValidation,
  validateUploadedFiles,
  uploadMultipleFiles,
  handleUploadErrors
);

/**
 * @route   GET /api/files/search
 * @desc    Search files by criteria
 * @access  Private
 */
router.get('/search',
  protect,
  searchValidation,
  searchFiles
);

/**
 * @route   GET /api/files/usage-stats
 * @desc    Get storage usage statistics (Admin/Advocate only)
 * @access  Private (Admin/Advocate)
 */
router.get('/usage-stats',
  protect,
  getUsageStats
);

/**
 * @route   GET /api/files/:fileId
 * @desc    Get file details
 * @access  Private
 */
router.get('/:fileId',
  protect,
  fileIdValidation,
  getFileDetails
);

/**
 * @route   DELETE /api/files/:fileId
 * @desc    Delete single file
 * @access  Private
 */
router.delete('/:fileId',
  protect,
  fileIdValidation,
  deleteFile
);

/**
 * @route   DELETE /api/files/bulk-delete
 * @desc    Delete multiple files
 * @access  Private
 */
router.delete('/bulk-delete',
  protect,
  bulkDeleteValidation,
  deleteMultipleFiles
);

/**
 * @route   POST /api/files/:fileId/signed-url
 * @desc    Generate signed URL for secure file access
 * @access  Private
 */
router.post('/:fileId/signed-url',
  protect,
  fileIdValidation,
  signedUrlValidation,
  generateSignedUrl
);

/**
 * @route   POST /api/files/:fileId/transform
 * @desc    Transform image (resize, format conversion, etc.)
 * @access  Private
 */
router.post('/:fileId/transform',
  protect,
  fileIdValidation,
  transformValidation,
  transformImage
);

// Error handling middleware for this router
router.use(handleUploadErrors);

// 404 handler for file routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'File endpoint not found'
  });
});

module.exports = router;
