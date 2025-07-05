// Integration tests for authentication endpoints
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../../models/User');

// Test database connection
const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/advocate_app_test';

describe('Authentication Endpoints', () => {
  
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
  });

  afterAll(async () => {
    // Clean up and close database connection
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    
    test('should register a new client successfully', async () => {
      const clientData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'StrongPass123!',
        phone: '+1234567890',
        role: 'client'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(clientData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(clientData.email);
      expect(response.body.data.user.role).toBe('client');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('should register a new advocate successfully', async () => {
      const advocateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@lawfirm.com',
        password: 'SecurePass456!',
        phone: '+1234567890',
        role: 'advocate',
        licenseNumber: 'LAW123456',
        specialization: ['Family Law', 'Corporate Law'],
        experience: 10,
        education: 'Harvard Law School',
        barAdmission: 'New York State Bar'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(advocateData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('advocate');
      expect(response.body.data.user.licenseNumber).toBe(advocateData.licenseNumber);
      expect(response.body.data.user.isVerified).toBe(true);
    });

    test('should reject registration with missing required fields', async () => {
      const incompleteData = {
        firstName: 'John',
        // Missing lastName, email, password
        role: 'client'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details).toHaveProperty('fieldErrors');
      expect(response.body.details.fieldErrors).toHaveProperty('lastName');
      expect(response.body.details.fieldErrors).toHaveProperty('email');
      expect(response.body.details.fieldErrors).toHaveProperty('password');
    });

    test('should reject registration with invalid email format', async () => {
      const invalidEmailData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'StrongPass123!',
        role: 'client'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidEmailData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details.fieldErrors).toHaveProperty('email');
    });

    test('should reject registration with weak password', async () => {
      const weakPasswordData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'weak',
        role: 'client'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details.fieldErrors).toHaveProperty('password');
    });

    test('should reject duplicate email registration', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'StrongPass123!',
        role: 'client'
      };

      // First registration should succeed
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email should fail
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('CONFLICT_ERROR');
      expect(response.body.details.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    test('should reject advocate registration without license number', async () => {
      const advocateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@lawfirm.com',
        password: 'SecurePass456!',
        role: 'advocate'
        // Missing licenseNumber
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(advocateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details.fieldErrors).toHaveProperty('licenseNumber');
    });

    test('should reject registration with invalid Content-Type', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'StrongPass123!',
        role: 'client'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'text/plain')
        .send(JSON.stringify(userData))
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('HEADER_ERROR');
      expect(response.body.details.code).toBe('INVALID_CONTENT_TYPE');
    });

    test('should reject registration with malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"firstName": "John", "lastName": "Doe",}') // Invalid JSON with trailing comma
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('PARSE_ERROR');
      expect(response.body.details.code).toBe('INVALID_JSON');
    });
  });

  describe('POST /api/auth/login', () => {
    
    beforeEach(async () => {
      // Create a test user for login tests
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'StrongPass123!',
        role: 'client'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    test('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'john.doe@example.com',
        password: 'StrongPass123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(loginData.email);
    });

    test('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'StrongPass123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('AUTHENTICATION_ERROR');
      expect(response.body.details.code).toBe('INVALID_CREDENTIALS');
    });

    test('should reject login with invalid password', async () => {
      const loginData = {
        email: 'john.doe@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('AUTHENTICATION_ERROR');
      expect(response.body.details.code).toBe('INVALID_CREDENTIALS');
    });

    test('should reject login with missing credentials', async () => {
      const loginData = {
        email: 'john.doe@example.com'
        // Missing password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    test('should reject login for deactivated user', async () => {
      // Deactivate the user
      await User.findOneAndUpdate(
        { email: 'john.doe@example.com' },
        { isActive: false }
      );

      const loginData = {
        email: 'john.doe@example.com',
        password: 'StrongPass123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('AUTHENTICATION_ERROR');
      expect(response.body.details.code).toBe('ACCOUNT_DEACTIVATED');
    });
  });

  describe('Error Response Format', () => {
    
    test('should return consistent error format for validation errors', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('details');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('requestId');
      
      expect(response.body.success).toBe(false);
      expect(typeof response.body.error).toBe('string');
      expect(typeof response.body.message).toBe('string');
      expect(typeof response.body.details).toBe('object');
      expect(typeof response.body.timestamp).toBe('string');
      expect(typeof response.body.requestId).toBe('string');
    });

    test('should return consistent success format', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'StrongPass123!',
        role: 'client'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('requestId');
      
      expect(response.body.success).toBe(true);
      expect(typeof response.body.message).toBe('string');
      expect(typeof response.body.data).toBe('object');
      expect(typeof response.body.timestamp).toBe('string');
      expect(typeof response.body.requestId).toBe('string');
    });
  });
});
