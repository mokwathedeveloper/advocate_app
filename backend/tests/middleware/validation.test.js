// Unit tests for validation middleware
const request = require('supertest');
const express = require('express');
const {
  validateContentType,
  validateRegistration,
  validateLogin,
  handleJSONError
} = require('../../middleware/validation');
const User = require('../../models/User');

// Mock User model
jest.mock('../../models/User');

// Create test app
const createTestApp = (middleware) => {
  const app = express();
  app.use(express.json());
  app.use(handleJSONError);
  
  if (Array.isArray(middleware)) {
    middleware.forEach(mw => app.use(mw));
  } else {
    app.use(middleware);
  }
  
  app.post('/test', (req, res) => {
    res.json({ success: true, message: 'Test passed' });
  });
  
  return app;
};

describe('Validation Middleware', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateContentType', () => {
    const app = createTestApp(validateContentType);

    test('should pass with correct Content-Type', async () => {
      const response = await request(app)
        .post('/test')
        .set('Content-Type', 'application/json')
        .send({ test: 'data' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject missing Content-Type', async () => {
      const response = await request(app)
        .post('/test')
        .send({ test: 'data' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('HEADER_ERROR');
      expect(response.body.details.code).toBe('INVALID_CONTENT_TYPE');
    });

    test('should reject incorrect Content-Type', async () => {
      const response = await request(app)
        .post('/test')
        .set('Content-Type', 'text/plain')
        .send('test data')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('HEADER_ERROR');
      expect(response.body.details.code).toBe('INVALID_CONTENT_TYPE');
    });

    test('should allow GET requests without Content-Type', async () => {
      const getApp = express();
      getApp.use(validateContentType);
      getApp.get('/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(getApp)
        .get('/test')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('validateRegistration', () => {
    const app = createTestApp(validateRegistration);

    beforeEach(() => {
      User.findOne.mockResolvedValue(null); // No existing user by default
    });

    test('should pass with valid client data', async () => {
      const validData = global.testUtils.createValidUserData();

      const response = await request(app)
        .post('/test')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should pass with valid advocate data', async () => {
      const validData = global.testUtils.createValidAdvocateData();

      const response = await request(app)
        .post('/test')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject missing required fields', async () => {
      const invalidData = global.testUtils.createInvalidUserData('missing-email');

      const response = await request(app)
        .post('/test')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details.fieldErrors).toHaveProperty('email');
    });

    test('should reject invalid email format', async () => {
      const invalidData = global.testUtils.createInvalidUserData('invalid-email');

      const response = await request(app)
        .post('/test')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details.fieldErrors).toHaveProperty('email');
    });

    test('should reject weak password', async () => {
      const invalidData = global.testUtils.createInvalidUserData('weak-password');

      const response = await request(app)
        .post('/test')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details.fieldErrors).toHaveProperty('password');
    });

    test('should reject duplicate email', async () => {
      const existingUser = { email: 'john.doe@example.com' };
      User.findOne.mockResolvedValue(existingUser);

      const userData = global.testUtils.createValidUserData();

      const response = await request(app)
        .post('/test')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('CONFLICT_ERROR');
      expect(response.body.details.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    test('should reject advocate without license number', async () => {
      const invalidData = global.testUtils.createInvalidUserData('advocate-missing-license');

      const response = await request(app)
        .post('/test')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details.fieldErrors).toHaveProperty('licenseNumber');
    });

    test('should reject duplicate license number', async () => {
      const existingAdvocate = { 
        licenseNumber: 'LAW123456',
        role: 'advocate'
      };
      User.findOne
        .mockResolvedValueOnce(null) // No user with email
        .mockResolvedValueOnce(existingAdvocate); // Existing advocate with license

      const advocateData = global.testUtils.createValidAdvocateData();

      const response = await request(app)
        .post('/test')
        .send(advocateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('CONFLICT_ERROR');
      expect(response.body.details.code).toBe('LICENSE_NUMBER_ALREADY_EXISTS');
    });

    test('should handle database errors gracefully', async () => {
      User.findOne.mockRejectedValue(new Error('Database connection failed'));

      const userData = global.testUtils.createValidUserData();

      const response = await request(app)
        .post('/test')
        .send(userData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('SERVER_ERROR');
    });
  });

  describe('validateLogin', () => {
    const app = createTestApp(validateLogin);

    test('should pass with valid login data', async () => {
      const loginData = {
        email: 'john.doe@example.com',
        password: 'StrongPass123!'
      };

      const response = await request(app)
        .post('/test')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject missing email', async () => {
      const loginData = {
        password: 'StrongPass123!'
      };

      const response = await request(app)
        .post('/test')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    test('should reject missing password', async () => {
      const loginData = {
        email: 'john.doe@example.com'
      };

      const response = await request(app)
        .post('/test')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    test('should reject invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'StrongPass123!'
      };

      const response = await request(app)
        .post('/test')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    test('should normalize email', async () => {
      const loginData = {
        email: 'JOHN.DOE@EXAMPLE.COM',
        password: 'StrongPass123!'
      };

      const response = await request(app)
        .post('/test')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('handleJSONError', () => {
    test('should handle malformed JSON', async () => {
      const app = express();
      app.use(express.json());
      app.use(handleJSONError);
      app.post('/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/test')
        .set('Content-Type', 'application/json')
        .send('{"invalid": "json",}') // Trailing comma makes it invalid
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('PARSE_ERROR');
      expect(response.body.details.code).toBe('INVALID_JSON');
    });

    test('should pass valid JSON through', async () => {
      const app = express();
      app.use(express.json());
      app.use(handleJSONError);
      app.post('/test', (req, res) => {
        res.json({ success: true, received: req.body });
      });

      const testData = { valid: 'json' };

      const response = await request(app)
        .post('/test')
        .set('Content-Type', 'application/json')
        .send(testData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.received).toEqual(testData);
    });
  });

  describe('Error Response Format', () => {
    test('should include required fields in error responses', async () => {
      const app = createTestApp(validateRegistration);
      
      const response = await request(app)
        .post('/test')
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

    test('should include field-specific errors', async () => {
      const app = createTestApp(validateRegistration);
      
      const response = await request(app)
        .post('/test')
        .send({ firstName: 'John' }) // Missing other required fields
        .expect(400);

      expect(response.body.details).toHaveProperty('fieldErrors');
      expect(response.body.details.fieldErrors).toHaveProperty('lastName');
      expect(response.body.details.fieldErrors).toHaveProperty('email');
      expect(response.body.details.fieldErrors).toHaveProperty('password');
    });
  });
});
