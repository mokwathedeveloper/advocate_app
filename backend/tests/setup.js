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
