// Test setup for LegalPro backend tests
const mongoose = require('mongoose');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';
process.env.MONGODB_TEST_URI = 'mongodb://localhost:27017/legalpro_test';

// Cloudinary test configuration
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = '123456789012345';
process.env.CLOUDINARY_API_SECRET = 'test_api_secret';
process.env.CLOUDINARY_SECURE = 'true';
process.env.CLOUDINARY_FOLDER_PREFIX = 'legalpro-test';

// File upload test configuration
process.env.MAX_FILE_SIZE = '52428800';
process.env.MAX_FILES_PER_REQUEST = '10';
process.env.ALLOWED_FILE_TYPES = 'pdf,doc,docx,jpg,jpeg,png,gif';
process.env.SIGNED_URL_EXPIRY = '3600';
process.env.ENABLE_VIRUS_SCAN = 'false';
process.env.REQUIRE_AUTHENTICATION = 'true';

// Suppress console logs during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test teardown
afterAll(async () => {
  // Close mongoose connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  // Close any remaining connections
  await mongoose.disconnect();
});
