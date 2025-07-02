// Authentication System Tests - LegalPro v1.0.1
// Comprehensive tests for JWT authentication and RBAC

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const { authHelpers, USER_ROLES, TOKEN_TYPES } = require('../config/auth');

// Test database setup
const MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/legalpro_test';

describe('Authentication System', () => {
  let server;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(MONGODB_URI);
    server = app.listen(0); // Use random port for testing
  });

  afterAll(async () => {
    // Clean up and close connections
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
  });

  describe('User Registration', () => {
    const validUserData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      phone: '+254712345678',
      role: 'client'
    };

    test('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user).toHaveProperty('email', validUserData.email);
      expect(response.body.data.user).toHaveProperty('role', validUserData.role);
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    test('should not register user with invalid email', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Please provide a valid email address'
          })
        ])
      );
    });

    test('should not register user with weak password', async () => {
      const weakPasswordData = { ...validUserData, password: '123', confirmPassword: '123' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringContaining('Password must be at least')
          })
        ])
      );
    });

    test('should not register user with mismatched passwords', async () => {
      const mismatchedData = { ...validUserData, confirmPassword: 'DifferentPass123!' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(mismatchedData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Password confirmation does not match password'
          })
        ])
      );
    });

    test('should not register user with duplicate email', async () => {
      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      // Try to create second user with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User already exists with this email or phone number');
      expect(response.body.error).toBe('USER_EXISTS');
    });

    test('should not register user with invalid role', async () => {
      const invalidRoleData = { ...validUserData, role: 'invalid_role' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidRoleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Invalid role specified'
          })
        ])
      );
    });
  });

  describe('User Login', () => {
    let testUser;
    const userData = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      phone: '+254712345679',
      role: 'advocate'
    };

    beforeEach(async () => {
      // Create test user
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      testUser = response.body.data.user;
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/enhanced-login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user).toHaveProperty('email', userData.email);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('permissions');
      expect(Array.isArray(response.body.data.permissions)).toBe(true);
    });

    test('should not login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/enhanced-login')
        .send({
          email: 'nonexistent@example.com',
          password: userData.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
      expect(response.body.error).toBe('INVALID_CREDENTIALS');
    });

    test('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/enhanced-login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
      expect(response.body.error).toBe('INVALID_CREDENTIALS');
    });

    test('should handle remember me option', async () => {
      const response = await request(app)
        .post('/api/auth/enhanced-login')
        .send({
          email: userData.email,
          password: userData.password,
          rememberMe: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.expiresIn).toBe('30d');
    });

    test('should lock account after multiple failed attempts', async () => {
      // Make multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/enhanced-login')
          .send({
            email: userData.email,
            password: 'wrongpassword'
          });
      }

      // Next attempt should return account locked
      const response = await request(app)
        .post('/api/auth/enhanced-login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })
        .expect(423);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('ACCOUNT_LOCKED');
      expect(response.body.message).toContain('Account locked');
    });
  });

  describe('Token Management', () => {
    let testUser;
    let accessToken;
    let refreshToken;

    beforeEach(async () => {
      // Create and login test user
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test.user@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        phone: '+254712345680',
        role: 'client'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/auth/enhanced-login')
        .send({
          email: userData.email,
          password: userData.password
        });

      testUser = loginResponse.body.data.user;
      accessToken = loginResponse.body.data.tokens.accessToken;
      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    test('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.accessToken).not.toBe(accessToken);
    });

    test('should not refresh token with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_REFRESH_TOKEN');
    });

    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    test('should logout from all devices', async () => {
      const response = await request(app)
        .post('/api/auth/logout-all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out from all devices successfully');
    });
  });

  describe('Protected Routes', () => {
    let clientUser, advocateUser, adminUser;
    let clientToken, advocateToken, adminToken;

    beforeEach(async () => {
      // Create users with different roles
      const users = [
        {
          firstName: 'Client',
          lastName: 'User',
          email: 'client@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
          phone: '+254712345681',
          role: 'client'
        },
        {
          firstName: 'Advocate',
          lastName: 'User',
          email: 'advocate@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
          phone: '+254712345682',
          role: 'advocate'
        },
        {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
          phone: '+254712345683',
          role: 'admin'
        }
      ];

      for (const userData of users) {
        await request(app)
          .post('/api/auth/register')
          .send(userData);

        const loginResponse = await request(app)
          .post('/api/auth/enhanced-login')
          .send({
            email: userData.email,
            password: userData.password
          });

        if (userData.role === 'client') {
          clientUser = loginResponse.body.data.user;
          clientToken = loginResponse.body.data.tokens.accessToken;
        } else if (userData.role === 'advocate') {
          advocateUser = loginResponse.body.data.user;
          advocateToken = loginResponse.body.data.tokens.accessToken;
        } else if (userData.role === 'admin') {
          adminUser = loginResponse.body.data.user;
          adminToken = loginResponse.body.data.tokens.accessToken;
        }
      }
    });

    test('should access profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('email', clientUser.email);
    });

    test('should not access profile without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('MISSING_TOKEN');
    });

    test('should get user permissions', async () => {
      const response = await request(app)
        .get('/api/auth/permissions')
        .set('Authorization', `Bearer ${advocateToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('role', 'advocate');
      expect(response.body.data).toHaveProperty('permissions');
      expect(Array.isArray(response.body.data.permissions)).toBe(true);
      expect(response.body.data.permissions.length).toBeGreaterThan(0);
    });

    test('admin should access user list', async () => {
      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    test('client should not access user list', async () => {
      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('RBAC Helper Functions', () => {
    test('should validate user roles correctly', () => {
      expect(authHelpers.isValidRole(USER_ROLES.CLIENT)).toBe(true);
      expect(authHelpers.isValidRole(USER_ROLES.ADVOCATE)).toBe(true);
      expect(authHelpers.isValidRole(USER_ROLES.ADMIN)).toBe(true);
      expect(authHelpers.isValidRole('invalid_role')).toBe(false);
    });

    test('should check permissions correctly', () => {
      expect(authHelpers.hasPermission(USER_ROLES.ADMIN, 'case:create')).toBe(true);
      expect(authHelpers.hasPermission(USER_ROLES.CLIENT, 'case:create')).toBe(false);
      expect(authHelpers.hasPermission(USER_ROLES.ADVOCATE, 'case:read')).toBe(true);
    });

    test('should get role level correctly', () => {
      expect(authHelpers.getRoleLevel(USER_ROLES.CLIENT)).toBe(1);
      expect(authHelpers.getRoleLevel(USER_ROLES.ADVOCATE)).toBe(3);
      expect(authHelpers.getRoleLevel(USER_ROLES.ADMIN)).toBe(4);
      expect(authHelpers.getRoleLevel(USER_ROLES.SUPER_ADMIN)).toBe(5);
    });

    test('should generate and verify tokens correctly', () => {
      const payload = { userId: '123', email: 'test@example.com', role: 'client' };
      const token = authHelpers.generateToken(payload, TOKEN_TYPES.ACCESS);
      
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      const decoded = authHelpers.verifyToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.type).toBe(TOKEN_TYPES.ACCESS);
    });
  });
});
