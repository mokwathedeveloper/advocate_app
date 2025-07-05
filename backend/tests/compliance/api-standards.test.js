// API Standards Compliance Tests
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../../models/User');

const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/advocate_app_test';

describe('API Standards Compliance', () => {
  
  beforeAll(async () => {
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('HTTP Status Codes Compliance', () => {
    
    test('should return 201 for successful registration', async () => {
      const userData = global.testUtils.createValidUserData();

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('should return 200 for successful login', async () => {
      const userData = global.testUtils.createValidUserData();
      
      // Register user first
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Then login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should return 400 for validation errors', async () => {
      const invalidData = global.testUtils.createInvalidUserData('missing-email');

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    test('should return 401 for authentication failures', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('AUTHENTICATION_ERROR');
    });

    test('should return 409 for conflict errors', async () => {
      const userData = global.testUtils.createValidUserData();
      
      // Register user first
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Try to register same user again
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('CONFLICT_ERROR');
    });

    test('should return 400 for malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"invalid": "json",}')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('PARSE_ERROR');
    });

    test('should return 400 for missing Content-Type', async () => {
      const userData = global.testUtils.createValidUserData();

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('HEADER_ERROR');
    });
  });

  describe('Response Format Compliance', () => {
    
    test('success responses should have required fields', async () => {
      const userData = global.testUtils.createValidUserData();

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Check required fields
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('requestId');

      // Check field types
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.message).toBe('string');
      expect(typeof response.body.data).toBe('object');
      expect(typeof response.body.timestamp).toBe('string');
      expect(typeof response.body.requestId).toBe('string');

      // Check success is true
      expect(response.body.success).toBe(true);

      // Check timestamp is valid ISO 8601
      expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);

      // Check requestId is UUID format
      expect(response.body.requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    test('error responses should have required fields', async () => {
      const invalidData = global.testUtils.createInvalidUserData('missing-email');

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      // Check required fields
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('details');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('requestId');

      // Check field types
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.error).toBe('string');
      expect(typeof response.body.message).toBe('string');
      expect(typeof response.body.details).toBe('object');
      expect(typeof response.body.timestamp).toBe('string');
      expect(typeof response.body.requestId).toBe('string');

      // Check success is false
      expect(response.body.success).toBe(false);

      // Check details has code
      expect(response.body.details).toHaveProperty('code');
      expect(typeof response.body.details.code).toBe('string');
    });

    test('registration success response should include token and user', async () => {
      const userData = global.testUtils.createValidUserData();

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      
      expect(typeof response.body.data.token).toBe('string');
      expect(typeof response.body.data.user).toBe('object');
      
      // User should not contain password
      expect(response.body.data.user).not.toHaveProperty('password');
      
      // User should contain expected fields
      expect(response.body.data.user).toHaveProperty('email');
      expect(response.body.data.user).toHaveProperty('firstName');
      expect(response.body.data.user).toHaveProperty('lastName');
      expect(response.body.data.user).toHaveProperty('role');
    });

    test('validation error response should include field errors', async () => {
      const invalidData = {
        firstName: 'John',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.details).toHaveProperty('errors');
      expect(response.body.details).toHaveProperty('fieldErrors');
      
      expect(Array.isArray(response.body.details.errors)).toBe(true);
      expect(typeof response.body.details.fieldErrors).toBe('object');
      
      // Should have field-specific errors
      expect(response.body.details.fieldErrors).toHaveProperty('lastName');
      expect(response.body.details.fieldErrors).toHaveProperty('email');
      expect(response.body.details.fieldErrors).toHaveProperty('password');
    });
  });

  describe('Error Code Standards Compliance', () => {
    
    test('should use standard validation error codes', async () => {
      const invalidData = global.testUtils.createInvalidUserData('invalid-email');

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details.code).toBe('REGISTRATION_VALIDATION_FAILED');
      
      // Check for specific field error codes
      const emailErrors = response.body.details.fieldErrors.email;
      expect(emailErrors.some(err => err.code.includes('EMAIL'))).toBe(true);
    });

    test('should use standard authentication error codes', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).toBe('AUTHENTICATION_ERROR');
      expect(response.body.details.code).toBe('INVALID_CREDENTIALS');
    });

    test('should use standard conflict error codes', async () => {
      const userData = global.testUtils.createValidUserData();
      
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toBe('CONFLICT_ERROR');
      expect(response.body.details.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    test('should use standard parse error codes', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"invalid": "json",}')
        .expect(400);

      expect(response.body.error).toBe('PARSE_ERROR');
      expect(response.body.details.code).toBe('INVALID_JSON');
    });

    test('should use standard header error codes', async () => {
      const userData = global.testUtils.createValidUserData();

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('HEADER_ERROR');
      expect(response.body.details.code).toBe('INVALID_CONTENT_TYPE');
    });
  });

  describe('Data Sanitization Compliance', () => {
    
    test('should not return password in responses', async () => {
      const userData = global.testUtils.createValidUserData();

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('should normalize email to lowercase', async () => {
      const userData = global.testUtils.createValidUserData({
        email: 'JOHN.DOE@EXAMPLE.COM'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.data.user.email).toBe('john.doe@example.com');
    });

    test('should trim whitespace from names', async () => {
      const userData = global.testUtils.createValidUserData({
        firstName: '  John  ',
        lastName: '  Doe  '
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.data.user.firstName).toBe('John');
      expect(response.body.data.user.lastName).toBe('Doe');
    });
  });

  describe('Request Validation Compliance', () => {
    
    test('should require Content-Type header for POST requests', async () => {
      const userData = global.testUtils.createValidUserData();

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('HEADER_ERROR');
      expect(response.body.details.code).toBe('INVALID_CONTENT_TYPE');
    });

    test('should validate JSON format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.error).toBe('PARSE_ERROR');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details.fieldErrors).toHaveProperty('firstName');
      expect(response.body.details.fieldErrors).toHaveProperty('lastName');
      expect(response.body.details.fieldErrors).toHaveProperty('email');
      expect(response.body.details.fieldErrors).toHaveProperty('password');
    });

    test('should validate field types and formats', async () => {
      const invalidData = {
        firstName: 123, // Should be string
        lastName: 'Doe',
        email: 'invalid-email', // Invalid format
        password: 'weak', // Too weak
        role: 'invalid-role' // Invalid value
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details.fieldErrors).toHaveProperty('firstName');
      expect(response.body.details.fieldErrors).toHaveProperty('email');
      expect(response.body.details.fieldErrors).toHaveProperty('password');
      expect(response.body.details.fieldErrors).toHaveProperty('role');
    });
  });

  describe('Consistency Compliance', () => {
    
    test('should maintain consistent response structure across endpoints', async () => {
      const userData = global.testUtils.createValidUserData();

      // Test registration response structure
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Test login response structure
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      // Both should have same structure
      const requiredFields = ['success', 'message', 'data', 'timestamp', 'requestId'];
      
      requiredFields.forEach(field => {
        expect(registerResponse.body).toHaveProperty(field);
        expect(loginResponse.body).toHaveProperty(field);
        expect(typeof registerResponse.body[field]).toBe(typeof loginResponse.body[field]);
      });
    });

    test('should maintain consistent error structure across error types', async () => {
      // Validation error
      const validationError = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      // Authentication error
      const authError = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      // Both should have same error structure
      const requiredErrorFields = ['success', 'error', 'message', 'details', 'timestamp', 'requestId'];
      
      requiredErrorFields.forEach(field => {
        expect(validationError.body).toHaveProperty(field);
        expect(authError.body).toHaveProperty(field);
        expect(typeof validationError.body[field]).toBe(typeof authError.body[field]);
      });

      // Both should have success: false
      expect(validationError.body.success).toBe(false);
      expect(authError.body.success).toBe(false);
    });
  });
});
