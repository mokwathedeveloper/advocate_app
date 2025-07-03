// Enhanced file upload middleware for LegalPro v1.0.1 with Cloudinary integration
const multer = require('multer');
const path = require('path');
const cloudinaryService = require('../utils/cloudinaryService');

// File type configurations
const FILE_TYPES = {
  DOCUMENTS: {
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/rtf'
    ],
    maxSize: 50 * 1024 * 1024 // 50MB
  },
  IMAGES: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    mimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ],
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  MEDIA: {
    extensions: ['.mp4', '.mpeg', '.mov', '.avi', '.mp3', '.wav', '.ogg', '.m4a'],
    mimeTypes: [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4'
    ],
    maxSize: 500 * 1024 * 1024 // 500MB
  }
};

// Get all allowed extensions and mime types
const getAllowedExtensions = () => {
  return Object.values(FILE_TYPES).flatMap(type => type.extensions);
};

const getAllowedMimeTypes = () => {
  return Object.values(FILE_TYPES).flatMap(type => type.mimeTypes);
};

// Get maximum file size for a specific file type
const getMaxFileSize = (filename, mimetype) => {
  const extension = path.extname(filename).toLowerCase();

  for (const [category, config] of Object.entries(FILE_TYPES)) {
    if (config.extensions.includes(extension) || config.mimeTypes.includes(mimetype)) {
      return config.maxSize;
    }
  }

  return 10 * 1024 * 1024; // Default 10MB
};

// Enhanced file filter with comprehensive validation
const fileFilter = (req, file, cb) => {
  try {
    const allowedExtensions = getAllowedExtensions();
    const allowedMimeTypes = getAllowedMimeTypes();
    const fileExtension = path.extname(file.originalname).toLowerCase();

    // Check file extension
    if (!allowedExtensions.includes(fileExtension)) {
      return cb(new Error(`File type ${fileExtension} is not allowed. Allowed types: ${allowedExtensions.join(', ')}`), false);
    }

    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error(`MIME type ${file.mimetype} is not allowed`), false);
    }

    // Check filename length
    if (file.originalname.length > 255) {
      return cb(new Error('Filename is too long (maximum 255 characters)'), false);
    }

    // Check for potentially dangerous filenames
    const dangerousPatterns = [/\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i, /\.com$/i];
    if (dangerousPatterns.some(pattern => pattern.test(file.originalname))) {
      return cb(new Error('File type is not allowed for security reasons'), false);
    }

    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

// Memory storage for direct Cloudinary upload
const memoryStorage = multer.memoryStorage();

// Disk storage for temporary files (fallback)
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/temp/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '_' + sanitizedName);
  }
});

// Dynamic limits based on file type
const dynamicLimits = (req, file, cb) => {
  const maxSize = getMaxFileSize(file.originalname, file.mimetype);
  cb(null, { fileSize: maxSize });
};

// Create different upload configurations
const createUploadMiddleware = (options = {}) => {
  const {
    storage = 'memory', // 'memory' or 'disk'
    maxFiles = 10,
    maxFileSize = null // Will be determined dynamically if null
  } = options;

  const uploadConfig = {
    storage: storage === 'memory' ? memoryStorage : diskStorage,
    fileFilter,
    limits: {
      files: maxFiles,
      fileSize: maxFileSize || 500 * 1024 * 1024, // 500MB max
      fieldSize: 10 * 1024 * 1024, // 10MB field size
      fields: 20 // Maximum number of non-file fields
    }
  };

  return multer(uploadConfig);
};

// Default upload middleware (memory storage for Cloudinary)
const upload = createUploadMiddleware({
  storage: 'memory',
  maxFiles: 10
});

// Specialized upload middlewares
const uploadSingle = (fieldName) => upload.single(fieldName);
const uploadMultiple = (fieldName, maxCount = 10) => upload.array(fieldName, maxCount);
const uploadFields = (fields) => upload.fields(fields);

// File validation middleware (additional server-side validation)
const validateUploadedFiles = (req, res, next) => {
  try {
    if (!req.files && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const files = req.files || [req.file];
    const validationErrors = [];

    files.forEach((file, index) => {
      // Additional validation using cloudinaryService
      const validation = cloudinaryService.validateFile(file);
      if (!validation.isValid) {
        validationErrors.push({
          file: file.originalname,
          errors: validation.errors
        });
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'File validation failed',
        errors: validationErrors
      });
    }

    next();
  } catch (error) {
    console.error('File validation error:', error);
    res.status(500).json({
      success: false,
      message: 'File validation failed',
      error: error.message
    });
  }
};

// Error handling middleware for multer errors
const handleUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size exceeds the allowed limit';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in the request';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name is too long';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value is too long';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields in the request';
        break;
    }

    return res.status(400).json({
      success: false,
      message,
      error: error.code
    });
  }

  if (error.message) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  validateUploadedFiles,
  handleUploadErrors,
  createUploadMiddleware,
  FILE_TYPES,
  getAllowedExtensions,
  getAllowedMimeTypes
};
