// Cloudinary configuration for LegalPro v1.0.1
const cloudinary = require('cloudinary').v2;
require('dotenv').config();


// Validate required environment variables
const requiredEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required Cloudinary environment variables: ${missingVars.join(', ')}`);
}



// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,

  secure: process.env.CLOUDINARY_SECURE !== 'false', // Default to true
  upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || 'legalpro_signed_upload'
});

// Configuration validation
const validateConfig = () => {
  try {
    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      throw new Error('Cloudinary configuration is incomplete');
    }
    console.log(`✅ Cloudinary configured successfully for cloud: ${config.cloud_name}`);
    return true;
  } catch (error) {
    console.error('❌ Cloudinary configuration failed:', error.message);
    throw error;
  }
};

// Validate configuration on startup
validateConfig();

module.exports = cloudinary;

  secure: true
});

// Allowed file types for document upload
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/rtf',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-rar-compressed'
];

// Maximum file size (10MB in bytes)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Upload file to Cloudinary
const uploadFile = async (filePath, options = {}) => {
  try {
    const defaultOptions = {
      resource_type: 'auto',
      folder: 'legalpro/cases',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      invalidate: true,
      ...options
    };

    const result = await cloudinary.uploader.upload(filePath, defaultOptions);
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to cloud storage');
  }
};

// Delete file from Cloudinary
const deleteFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete file from cloud storage');
  }
};

// Generate secure URL for file access
const getSecureUrl = (publicId, options = {}) => {
  try {
    return cloudinary.url(publicId, {
      secure: true,
      sign_url: true,
      type: 'authenticated',
      ...options
    });
  } catch (error) {
    console.error('Cloudinary URL generation error:', error);
    throw new Error('Failed to generate secure URL');
  }
};

// Validate file type
const isValidFileType = (mimeType) => {
  return ALLOWED_FILE_TYPES.includes(mimeType);
};

// Validate file size
const isValidFileSize = (size) => {
  return size <= MAX_FILE_SIZE;
};

// Get file type category
const getFileCategory = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || mimeType.includes('csv')) return 'spreadsheet';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'presentation';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive';
  return 'other';
};

console.log('Cloudinary service initialized with configuration');

module.exports = {
  cloudinary,
  uploadFile,
  deleteFile,
  getSecureUrl,
  isValidFileType,
  isValidFileSize,
  getFileCategory,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE
};

