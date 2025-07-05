// Unit tests for Authentication Controller - LegalPro v1.0.1
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../../models/User');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('Authentication Controller', () => {
  let mongoServer;

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
  });

  describe('POST /api/auth/register', () => {
    const validAdvocateData = {
      firstName: 'John',
      lastName: 'Advocate',
      email: 'john.advocate@test.com',
      password: 'SecurePass123!',
      phone: '+254712345678',
      role: 'advocate',
      licenseNumber: 'ADV-2024-001',
      specialization: 'Corporate Law',
      experience: '5 years of corporate law experience',
      education: 'LLB University of Nairobi, LLM Harvard Law School',
      barAdmission: 'Kenya Law Society 2019',
      superKey: 'ADVOCATE-SUPER-2024-DEV-KEY'
    };

    describe('Successful Registration', () => {
      it('should register a new advocate with valid data', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send(validAdvocateData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Registration successful');
        expect(response.body.token).toBeDefined();
        expect(response.body.user).toBeDefined();
        expect(response.body.user.email).toBe(validAdvocateData.email);
        expect(response.body.user.role).toBe('advocate');
        expect(response.body.user.isVerified).toBe(true);
        expect(response.body.nextSteps).toBeDefined();
        expect(response.body.nextSteps.emailVerificationRequired).toBe(true);
      });

      it('should hash the password', async () => {
        await request(app)
          .post('/api/auth/register')
          .send(validAdvocateData)
          .expect(201);

        const user = await User.findOne({ email: validAdvocateData.email }).select('+password');
        expect(user.password).not.toBe(validAdvocateData.password);
        expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
      });

      it('should set advocate-specific fields correctly', async () => {
        await request(app)
          .post('/api/auth/register')
          .send(validAdvocateData)
          .expect(201);

        const user = await User.findOne({ email: validAdvocateData.email });
        expect(user.licenseNumber).toBe(validAdvocateData.licenseNumber);
        expect(user.specialization).toContain(validAdvocateData.specialization);
        expect(user.experience).toBe(validAdvocateData.experience);
        expect(user.education).toBe(validAdvocateData.education);
        expect(user.barAdmission).toBe(validAdvocateData.barAdmission);
        expect(user.isVerified).toBe(true);
        expect(user.isActive).toBe(true);
      });
    });

    describe('Validation Errors', () => {
      it('should reject registration without required fields', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed');
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors.length).toBeGreaterThan(0);
      });

      it('should reject invalid email format', async () => {
        const invalidData = { ...validAdvocateData, email: 'invalid-email' };
        
        const response = await request(app)
          .post('/api/auth/register')
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toContainEqual(
          expect.objectContaining({
            field: 'email',
            message: expect.stringContaining('valid email')
          })
        );
      });

      it('should reject weak passwords', async () => {
        const weakPasswords = ['123', 'password', 'Password1', 'PASSWORD123'];
        
        for (const weakPassword of weakPasswords) {
          const invalidData = { ...validAdvocateData, password: weakPassword };
          
          const response = await request(app)
            .post('/api/auth/register')
            .send(invalidData)
            .expect(400);

          expect(response.body.success).toBe(false);
          expect(response.body.errors).toContainEqual(
            expect.objectContaining({
              field: 'password',
              message: expect.stringContaining('security requirements')
            })
          );
        }
      });

      it('should reject invalid phone numbers', async () => {
        const invalidData = { ...validAdvocateData, phone: 'invalid-phone' };
        
        const response = await request(app)
          .post('/api/auth/register')
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toContainEqual(
          expect.objectContaining({
            field: 'phone',
            message: expect.stringContaining('valid phone number')
          })
        );
      });
    });

    describe('Super Key Validation', () => {
      it('should reject advocate registration without super key', async () => {
        const dataWithoutSuperKey = { ...validAdvocateData };
        delete dataWithoutSuperKey.superKey;
        
        const response = await request(app)
          .post('/api/auth/register')
          .send(dataWithoutSuperKey)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toContainEqual(
          expect.objectContaining({
            field: 'superKey',
            message: expect.stringContaining('Super key is required')
          })
        );
      });

      it('should reject invalid super key', async () => {
        const invalidData = { ...validAdvocateData, superKey: 'INVALID-KEY' };
        
        const response = await request(app)
          .post('/api/auth/register')
          .send(invalidData)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Invalid super key');
      });
    });

    describe('Duplicate Registration', () => {
      it('should reject duplicate email registration', async () => {
        // First registration
        await request(app)
          .post('/api/auth/register')
          .send(validAdvocateData)
          .expect(201);

        // Attempt duplicate registration
        const response = await request(app)
          .post('/api/auth/register')
          .send(validAdvocateData)
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('already exists with this email');
      });

      it('should reject duplicate license number', async () => {
        // First registration
        await request(app)
          .post('/api/auth/register')
          .send(validAdvocateData)
          .expect(201);

        // Attempt registration with same license number but different email
        const duplicateLicenseData = {
          ...validAdvocateData,
          email: 'different@test.com',
          licenseNumber: validAdvocateData.licenseNumber
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(duplicateLicenseData)
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('already exists with this license number');
      });
    });

    describe('Advocate-Specific Validation', () => {
      it('should require all advocate fields for advocate role', async () => {
        const requiredFields = ['licenseNumber', 'specialization', 'experience', 'education', 'barAdmission'];
        
        for (const field of requiredFields) {
          const invalidData = { ...validAdvocateData };
          delete invalidData[field];
          
          const response = await request(app)
            .post('/api/auth/register')
            .send(invalidData)
            .expect(400);

          expect(response.body.success).toBe(false);
          expect(response.body.errors).toContainEqual(
            expect.objectContaining({
              field: field,
              message: expect.stringContaining('required')
            })
          );
        }
      });

      it('should validate minimum length for advocate fields', async () => {
        const shortData = {
          ...validAdvocateData,
          licenseNumber: 'AB',
          specialization: 'La',
          experience: 'Ex',
          education: 'Ed',
          barAdmission: 'Bar'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(shortData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors.length).toBeGreaterThan(0);
      });
    });

    describe('Security Features', () => {
      it('should log registration attempts', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        await request(app)
          .post('/api/auth/register')
          .send(validAdvocateData)
          .expect(201);

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Registration request received'),
          expect.objectContaining({
            email: validAdvocateData.email,
            role: 'advocate'
          })
        );

        consoleSpy.mockRestore();
      });

      it('should not expose sensitive data in response', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send(validAdvocateData)
          .expect(201);

        expect(response.body.user.password).toBeUndefined();
        expect(response.body.user.superKey).toBeUndefined();
      });
    });
  });
});
