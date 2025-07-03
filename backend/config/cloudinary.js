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