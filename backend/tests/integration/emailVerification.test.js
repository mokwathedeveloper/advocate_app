// Integration tests for Email Verification System - LegalPro v1.0.1
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../../models/User');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { generateVerificationToken, generateVerificationCode } = require('../../utils/emailVerification');

describe('Email Verification Integration', () => {
  let mongoServer;
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Setup in-memory MongoDB for testing
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Close existing connection if any
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database before each test
    await User.deleteMany({});
    
    // Create test user
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'TestPassword123!',
      role: 'advocate',
      licenseNumber: 'TEST-001',
      specialization: ['Corporate Law'],
      experience: 5,
      education: 'Test University',
      barAdmission: 'Test Bar 2020',
      isVerified: true,
      isActive: true,
      isEmailVerified: false
    });

    // Generate auth token for protected routes
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123!'
      });
    
    authToken = loginResponse.body.token;
  });

  describe('POST /api/email-verification/send', () => {
    it('should send verification email to authenticated user', async () => {
      const response = await request(app)
        .post('/api/email-verification/send')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('sent successfully');
      expect(response.body.expiresAt).toBeDefined();

      // Check that user has verification data
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.emailVerificationToken).toBeDefined();
      expect(updatedUser.emailVerificationCode).toBeDefined();
      expect(updatedUser.emailVerificationExpires).toBeDefined();
      expect(updatedUser.emailVerificationSentAt).toBeDefined();
    });

    it('should reject request for already verified user', async () => {
      // Mark user as verified
      await User.findByIdAndUpdate(testUser._id, { isEmailVerified: true });

      const response = await request(app)
        .post('/api/email-verification/send')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already verified');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/email-verification/send')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/email-verification/verify/:token', () => {
    let verificationToken;

    beforeEach(async () => {
      // Setup verification token
      verificationToken = generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await User.findByIdAndUpdate(testUser._id, {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: expiresAt
      });
    });

    it('should verify email with valid token', async () => {
      const response = await request(app)
        .get(`/api/email-verification/verify/${verificationToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('verified successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);

      // Check that user is marked as verified
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.isEmailVerified).toBe(true);
      expect(updatedUser.emailVerifiedAt).toBeDefined();
      expect(updatedUser.emailVerificationToken).toBeUndefined();
      expect(updatedUser.emailVerificationCode).toBeUndefined();
      expect(updatedUser.emailVerificationExpires).toBeUndefined();
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/email-verification/verify/invalid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired');
    });

    it('should reject expired token', async () => {
      // Set token as expired
      await User.findByIdAndUpdate(testUser._id, {
        emailVerificationExpires: new Date(Date.now() - 1000) // 1 second ago
      });

      const response = await request(app)
        .get(`/api/email-verification/verify/${verificationToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired');
    });

    it('should handle missing token', async () => {
      const response = await request(app)
        .get('/api/email-verification/verify/')
        .expect(404);
    });
  });

  describe('POST /api/email-verification/verify-code', () => {
    let verificationCode;

    beforeEach(async () => {
      // Setup verification code
      verificationCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await User.findByIdAndUpdate(testUser._id, {
        emailVerificationCode: verificationCode,
        emailVerificationExpires: expiresAt
      });
    });

    it('should verify email with valid code', async () => {
      const response = await request(app)
        .post('/api/email-verification/verify-code')
        .send({
          email: testUser.email,
          code: verificationCode
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('verified successfully');
      expect(response.body.user).toBeDefined();

      // Check that user is marked as verified
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.isEmailVerified).toBe(true);
      expect(updatedUser.emailVerifiedAt).toBeDefined();
    });

    it('should reject invalid code', async () => {
      const response = await request(app)
        .post('/api/email-verification/verify-code')
        .send({
          email: testUser.email,
          code: '000000'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired');
    });

    it('should reject expired code', async () => {
      // Set code as expired
      await User.findByIdAndUpdate(testUser._id, {
        emailVerificationExpires: new Date(Date.now() - 1000) // 1 second ago
      });

      const response = await request(app)
        .post('/api/email-verification/verify-code')
        .send({
          email: testUser.email,
          code: verificationCode
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired');
    });

    it('should require email and code', async () => {
      const response = await request(app)
        .post('/api/email-verification/verify-code')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email and verification code are required');
    });

    it('should handle case-insensitive email', async () => {
      const response = await request(app)
        .post('/api/email-verification/verify-code')
        .send({
          email: testUser.email.toUpperCase(),
          code: verificationCode
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/email-verification/resend', () => {
    it('should resend verification email', async () => {
      const response = await request(app)
        .post('/api/email-verification/resend')
        .send({
          email: testUser.email
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('sent successfully');
      expect(response.body.expiresAt).toBeDefined();

      // Check that user has new verification data
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.emailVerificationToken).toBeDefined();
      expect(updatedUser.emailVerificationCode).toBeDefined();
      expect(updatedUser.emailVerificationSentAt).toBeDefined();
    });

    it('should reject resend for verified user', async () => {
      // Mark user as verified
      await User.findByIdAndUpdate(testUser._id, { isEmailVerified: true });

      const response = await request(app)
        .post('/api/email-verification/resend')
        .send({
          email: testUser.email
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found or already verified');
    });

    it('should reject resend for non-existent user', async () => {
      const response = await request(app)
        .post('/api/email-verification/resend')
        .send({
          email: 'nonexistent@example.com'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found or already verified');
    });

    it('should require email', async () => {
      const response = await request(app)
        .post('/api/email-verification/resend')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email is required');
    });
  });

  describe('GET /api/email-verification/status', () => {
    it('should return verification status for authenticated user', async () => {
      const response = await request(app)
        .get('/api/email-verification/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.isEmailVerified).toBe(false);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.verificationRequired).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/email-verification/status')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on verification attempts', async () => {
      const verificationCode = generateVerificationCode();
      await User.findByIdAndUpdate(testUser._id, {
        emailVerificationCode: verificationCode,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      // Make multiple rapid requests
      const requests = Array(6).fill().map(() =>
        request(app)
          .post('/api/email-verification/verify-code')
          .send({
            email: testUser.email,
            code: '000000' // Invalid code
          })
      );

      const responses = await Promise.all(requests);
      
      // Should have at least one rate-limited response
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should enforce rate limiting on resend requests', async () => {
      // Make multiple rapid resend requests
      const requests = Array(3).fill().map(() =>
        request(app)
          .post('/api/email-verification/resend')
          .send({
            email: testUser.email
          })
      );

      const responses = await Promise.all(requests);
      
      // Should have at least one rate-limited response
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
