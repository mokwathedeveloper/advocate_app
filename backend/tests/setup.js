
// Test Setup - LegalPro v1.0.1
// Global test setup and configuration

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Global test configuration
global.testConfig = {
  timeout: 30000,
  mongoServer: null,
  testDatabase: null
};

// Mock console methods to reduce noise during testing
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
  // Suppress console output during tests unless explicitly needed
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();

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

  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

// Database setup helpers
global.setupTestDatabase = async () => {
  try {
    // Use in-memory MongoDB for testing
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    global.testConfig.mongoServer = mongoServer;
    global.testConfig.testDatabase = mongoose.connection.db;

    return { mongoServer, mongoUri };
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
};

global.teardownTestDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }

    if (global.testConfig.mongoServer) {
      await global.testConfig.mongoServer.stop();
    }
  } catch (error) {
    console.error('Failed to teardown test database:', error);
    throw error;
  }
};

// Test data helpers
global.createTestUser = async (userData = {}) => {
  const User = require('../models/User');
  const defaultUserData = {
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@example.com`,
    password: 'Password123!',
    role: 'client',
    isVerified: true,
    isActive: true
  };

  return await User.create({ ...defaultUserData, ...userData });
};

global.createTestCase = async (caseData = {}) => {
  const Case = require('../models/Case');
  const User = require('../models/User');
  
  // Create required users if not provided
  let client = caseData.client;
  let advocate = caseData.advocate;
  
  if (!client) {
    client = await global.createTestUser({ role: 'client' });
  }
  
  if (!advocate) {
    advocate = await global.createTestUser({ role: 'advocate' });
  }

  const defaultCaseData = {
    title: 'Test Case',
    description: 'Test case description',
    caseType: 'corporate',
    priority: 'medium',
    client: { primary: client._id },
    advocate: { primary: advocate._id },
    createdBy: advocate._id,
    status: 'draft'
  };

  return await Case.create({ ...defaultCaseData, ...caseData });
};

global.createTestDocument = async (documentData = {}) => {
  const CaseDocument = require('../models/CaseDocument');
  
  const defaultDocumentData = {
    fileName: 'test-document.pdf',
    originalName: 'Test Document.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    filePath: '/test/path/test-document.pdf',
    fileUrl: '/uploads/documents/test-document.pdf',
    documentType: 'pleading',
    description: 'Test document',
    fileHash: 'testhash123',
    virusScanStatus: 'clean'
  };

  return await CaseDocument.create({ ...defaultDocumentData, ...documentData });
};

global.createTestNote = async (noteData = {}) => {
  const CaseNote = require('../models/CaseNote');
  
  const defaultNoteData = {
    title: 'Test Note',
    content: 'Test note content',
    noteType: 'general',
    priority: 'medium',
    status: 'active'
  };

  return await CaseNote.create({ ...defaultNoteData, ...noteData });
};

// Authentication helpers
global.generateAuthToken = (user) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

// API testing helpers
global.makeAuthenticatedRequest = (app, method, url, token, data = null) => {
  const request = require('supertest');
  let req = request(app)[method.toLowerCase()](url);
  
  if (token) {
    req = req.set('Authorization', `Bearer ${token}`);
  }
  
  if (data) {
    req = req.send(data);
  }
  
  return req;
};

// Mock external services
global.mockExternalServices = () => {
  // Mock email service
  jest.mock('../services/emailService', () => ({
    sendEmail: jest.fn().mockResolvedValue({ success: true }),
    sendCaseNotification: jest.fn().mockResolvedValue({ success: true }),
    sendStatusChangeNotification: jest.fn().mockResolvedValue({ success: true })
  }));

  // Mock file upload service
  jest.mock('../services/fileUploadService', () => ({
    uploadFile: jest.fn().mockResolvedValue({
      filename: 'test-file.pdf',
      path: '/uploads/test-file.pdf',
      size: 1024
    }),
    deleteFile: jest.fn().mockResolvedValue({ success: true })
  }));

  // Mock notification service
  jest.mock('../services/notificationService', () => ({
    sendNotification: jest.fn().mockResolvedValue({ success: true }),
    sendBulkNotification: jest.fn().mockResolvedValue({ success: true })
  }));
};

// Performance testing helpers
global.measurePerformance = async (fn, label = 'Operation') => {
  const startTime = process.hrtime.bigint();
  const result = await fn();
  const endTime = process.hrtime.bigint();
  const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

  console.log(`${label} took ${duration.toFixed(2)}ms`);
  
  return { result, duration };
};

// Data cleanup helpers
global.cleanupTestData = async () => {
  const collections = [
    'users',
    'cases',
    'casedocuments',
    'casenotes',
    'caseactivities'
  ];

  for (const collection of collections) {
    try {
      if (global.testConfig.testDatabase) {
        await global.testConfig.testDatabase.collection(collection).deleteMany({});
      }
    } catch (error) {
      // Ignore errors for non-existent collections
    }
  }
};

// Error handling helpers
global.expectValidationError = (error, field) => {
  expect(error.name).toBe('ValidationError');
  if (field) {
    expect(error.errors[field]).toBeDefined();
  }
};

global.expectAuthenticationError = (response) => {
  expect(response.status).toBe(401);
  expect(response.body.success).toBe(false);
  expect(response.body.message).toMatch(/auth|token|unauthorized/i);
};

global.expectAuthorizationError = (response) => {
  expect(response.status).toBe(403);
  expect(response.body.success).toBe(false);
  expect(response.body.message).toMatch(/access|permission|forbidden/i);
};

// Test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.BCRYPT_ROUNDS = '4'; // Faster hashing for tests

// Increase test timeout for database operations
jest.setTimeout(30000);

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);

  console.log = originalConsoleLog;
  console.error = originalConsoleError;

});
