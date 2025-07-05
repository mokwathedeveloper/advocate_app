// File upload middleware for LegalPro v1.0.1
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isValidFileType, isValidFileSize, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } = require('../config/cloudinary');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up storage engine for temporary file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitizedOriginalName);
  }
});

// File filter with comprehensive validation
const fileFilter = (req, file, cb) => {
  // Check file type
  if (!isValidFileType(file.mimetype)) {
    const error = new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`);
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }

  // Additional filename validation
  if (!file.originalname || file.originalname.length > 255) {
    const error = new Error('Invalid filename or filename too long (max 255 characters)');
    error.code = 'INVALID_FILENAME';
    return cb(error, false);
  }

  // Check for potentially dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js', '.jar'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (dangerousExtensions.includes(fileExtension)) {
    const error = new Error('File extension not allowed for security reasons');
    error.code = 'DANGEROUS_FILE_TYPE';
    return cb(error, false);
  }

  cb(null, true);
};

// Custom file size validation middleware
const validateFileSize = (req, res, next) => {
  if (req.file && !isValidFileSize(req.file.size)) {
    // Clean up uploaded file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(400).json({
      success: false,
      message: `File size too large. Maximum allowed size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      code: 'FILE_TOO_LARGE'
    });
  }

  if (req.files) {
    for (const file of req.files) {
      if (!isValidFileSize(file.size)) {
        // Clean up uploaded files
        req.files.forEach(f => {
          if (fs.existsSync(f.path)) {
            fs.unlinkSync(f.path);
          }
        });

        return res.status(400).json({
          success: false,
          message: `File size too large. Maximum allowed size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          code: 'FILE_TOO_LARGE'
        });
      }
    }
  }

  next();
};

// Initialize multer upload with enhanced configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Maximum 10 files per upload
    fieldSize: 1024 * 1024, // 1MB field size limit
    fieldNameSize: 100, // Field name size limit
    headerPairs: 2000 // Maximum header pairs
  }
});

// Error handling middleware for multer errors
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    // Clean up any uploaded files on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: `File too large. Maximum size allowed is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          code: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 10 files allowed per upload',
          code: 'TOO_MANY_FILES'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field',
          code: 'UNEXPECTED_FILE'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          code: 'UPLOAD_ERROR'
        });
    }
  }

  // Handle custom file filter errors
  if (error.code === 'INVALID_FILE_TYPE' || error.code === 'INVALID_FILENAME' || error.code === 'DANGEROUS_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }

  next(error);
};

// Clean up temporary files utility
const cleanupTempFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error cleaning up temp file:', error);
  }
};

module.exports = {
  upload,
  validateFileSize,
  handleUploadError,
  cleanupTempFile
};
