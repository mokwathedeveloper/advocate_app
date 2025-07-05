
// Jest setup file for backend testing
const mongoose = require('mongoose');
const path = require('path');

// Load test environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.test') });

// Global test setup
beforeAll(async () => {
  // Connect to test database (use existing MongoDB connection)
  const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/legalpro_test';

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.BCRYPT_ROUNDS = '1'; // Faster for testing
  
  // Mock Cloudinary for testing
  jest.mock('cloudinary', () => ({
    v2: {
      config: jest.fn(),
      uploader: {
        upload: jest.fn().mockResolvedValue({
          public_id: 'test-public-id',
          secure_url: 'https://test.cloudinary.com/test.pdf',
          format: 'pdf',
          bytes: 1024,
          pages: 1
        }),
        destroy: jest.fn().mockResolvedValue({ result: 'ok' })
      },
      url: jest.fn().mockReturnValue('https://test.cloudinary.com/test.pdf')
    }
  }));
  
  // Mock Nodemailer for testing
  jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({
        messageId: 'test-message-id',
        response: '250 OK'
      })
    })
  }));
  
  // Mock Twilio for testing
  jest.mock('twilio', () => {
    return jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          sid: 'test-message-sid',
          status: 'sent'
        })
      }
    }));
  });
  
  // Suppress console.log during tests unless explicitly needed
  if (!process.env.VERBOSE_TESTS) {
    console.log = jest.fn();
    console.info = jest.fn();
  }
});

// Clean up after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Global test teardown
afterAll(async () => {
  // Close database connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  // Restore console methods
  if (!process.env.VERBOSE_TESTS) {
    console.log.mockRestore?.();
    console.info.mockRestore?.();
  }
});

// Global test utilities
global.testUtils = {
  // Create a test user with specified role
  createTestUser: async (role = 'client', overrides = {}) => {
    const User = require('../models/User');
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: `test-${role}-${Date.now()}@example.com`,
      password: 'password123',
      role,
      isVerified: true,
      isActive: true,
      ...overrides
    };
    
    if (role === 'advocate') {
      userData.licenseNumber = `LIC-${Date.now()}`;
      userData.specialization = ['Family Law'];
    }
    
    if (role === 'admin') {
      userData.permissions = {
        canManageCases: true,
        canUploadFiles: true,
        canOpenFiles: true,
        canDeleteFiles: true,
        canViewAllCases: true,
        ...overrides.permissions
      };
    }
    
    return await User.create(userData);
  },
  
  // Create a test case
  createTestCase: async (clientId, assignedTo, overrides = {}) => {
    const Case = require('../models/Case');
    const caseData = {
      title: `Test Case ${Date.now()}`,
      description: 'This is a test case description',
      category: 'Family Law',
      priority: 'medium',
      clientId,
      assignedTo,
      ...overrides
    };
    
    return await Case.create(caseData);
  },
  
  // Generate JWT token for testing
  generateTestToken: (userId) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  },
  
  // Create test file for upload testing
  createTestFile: (filename = 'test.pdf', size = 1024, type = 'application/pdf') => {
    return {
      fieldname: 'document',
      originalname: filename,
      encoding: '7bit',
      mimetype: type,
      size,
      buffer: Buffer.from('test file content'),
      path: `/tmp/${filename}`
    };
  },
  
  // Wait for async operations
  wait: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Clean up uploaded files
  cleanupUploads: () => {
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach(file => {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(uploadsDir, file));
        }
      });
    }
  }
};

// Custom Jest matchers
expect.extend({
  toBeValidObjectId(received) {
    const mongoose = require('mongoose');
    const pass = mongoose.Types.ObjectId.isValid(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ObjectId`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ObjectId`,
        pass: false,
      };
    }
  },
  
  toHaveValidationError(received, field) {
    const hasError = received.errors && received.errors[field];
    
    if (hasError) {
      return {
        message: () => `expected not to have validation error for field ${field}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected to have validation error for field ${field}`,
        pass: false,
      };
    }
  }
});

// Error handling for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Increase timeout for database operations
jest.setTimeout(30000);
=======
// Test setup file for Jest
require('dotenv').config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRE = '1h';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/advocate_app_test';

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  // Helper function to create valid user data
  createValidUserData: (overrides = {}) => ({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'StrongPass123!',
    phone: '+12345678901',
    role: 'client',
    ...overrides
  }),

  // Helper function to create valid advocate data
  createValidAdvocateData: (overrides = {}) => ({
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@lawfirm.com',
    password: 'SecurePass456!',
    phone: '+12345678901',
    role: 'advocate',
    licenseNumber: 'LAW123456',
    specialization: ['Family Law', 'Corporate Law'],
    experience: 10,
    education: 'Harvard Law School',
    barAdmission: 'New York State Bar',
    ...overrides
  }),

  // Helper function to create invalid user data for testing
  createInvalidUserData: (type) => {
    const baseData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'StrongPass123!',
      role: 'client'
    };

    switch (type) {
      case 'missing-email':
        delete baseData.email;
        return baseData;
      
      case 'invalid-email':
        return { ...baseData, email: 'invalid-email' };
      
      case 'weak-password':
        return { ...baseData, password: 'weak' };
      
      case 'missing-firstName':
        delete baseData.firstName;
        return baseData;
      
      case 'missing-lastName':
        delete baseData.lastName;
        return baseData;
      
      case 'invalid-role':
        return { ...baseData, role: 'invalid-role' };
      
      case 'advocate-missing-license':
        return { ...baseData, role: 'advocate' };
      
      default:
        return baseData;
    }
  },

  // Helper function to generate random email
  generateRandomEmail: () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `test-${timestamp}-${random}@example.com`;
  },

  // Helper function to wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Console log suppression for cleaner test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  // Suppress console.log during tests unless explicitly needed
  console.log = jest.fn();
  
  // Keep console.error for debugging
  console.error = originalConsoleError;
});

afterAll(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

