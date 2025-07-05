// Unit tests for Appointment Controller - LegalPro v1.0.1
const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const Appointment = require('../../models/Appointment');
const User = require('../../models/User');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Create test app without starting server
const app = express();
app.use(express.json());
app.use('/api/appointments', require('../../routes/appointments'));
app.use('/api/auth', require('../../routes/auth'));

describe('Appointment Controller', () => {
  let mongoServer;
  let testAdvocate;
  let testClient;
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
    await Appointment.deleteMany({});
    
    // Create test users
    testAdvocate = await User.create({
      firstName: 'Test',
      lastName: 'Advocate',
      email: 'advocate@test.com',
      password: 'TestPassword123!',
      role: 'advocate',
      licenseNumber: 'ADV-001',
      specialization: ['Corporate Law'],
      experience: 5,
      education: 'LLB University',
      barAdmission: 'Bar 2020',
      isVerified: true,
      isActive: true,
      isEmailVerified: true
    });

    testClient = await User.create({
      firstName: 'Test',
      lastName: 'Client',
      email: 'client@test.com',
      password: 'TestPassword123!',
      role: 'client',
      isVerified: true,
      isActive: true,
      isEmailVerified: true
    });

    // Generate auth token for advocate
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'advocate@test.com',
        password: 'TestPassword123!'
      });
    
    authToken = loginResponse.body.token;
  });

  describe('POST /api/appointments', () => {
    it('should create a new appointment with valid data', async () => {
      const appointmentData = {
        title: 'Legal Consultation',
        description: 'Initial consultation for corporate law matters',
        clientId: testClient._id,
        advocateId: testAdvocate._id,
        startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        endDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
        type: 'consultation',
        priority: 'medium',
        location: {
          type: 'office'
        }
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(appointmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(appointmentData.title);
      expect(response.body.data.clientId._id).toBe(testClient._id.toString());
      expect(response.body.data.advocateId._id).toBe(testAdvocate._id.toString());
    });

    it('should reject appointment with missing required fields', async () => {
      const incompleteData = {
        title: 'Legal Consultation'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should reject appointment with invalid client ID', async () => {
      const appointmentData = {
        title: 'Legal Consultation',
        clientId: new mongoose.Types.ObjectId(),
        advocateId: testAdvocate._id,
        startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(appointmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid client');
    });

    it('should detect scheduling conflicts', async () => {
      // Create first appointment
      const firstAppointment = await Appointment.create({
        title: 'First Appointment',
        clientId: testClient._id,
        advocateId: testAdvocate._id,
        startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        bookedBy: testAdvocate._id
      });

      // Try to create conflicting appointment
      const conflictingData = {
        title: 'Conflicting Appointment',
        clientId: testClient._id,
        advocateId: testAdvocate._id,
        startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // 30 minutes after first starts
        endDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString() // 30 minutes after first ends
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(conflictingData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('conflicts with existing schedule');
      expect(response.body.conflicts).toBeDefined();
      expect(response.body.conflicts.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      const appointmentData = {
        title: 'Legal Consultation',
        clientId: testClient._id,
        advocateId: testAdvocate._id,
        startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/appointments')
        .send(appointmentData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/appointments', () => {
    beforeEach(async () => {
      // Create test appointments
      await Appointment.create([
        {
          title: 'Appointment 1',
          clientId: testClient._id,
          advocateId: testAdvocate._id,
          startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          endDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
          status: 'scheduled',
          type: 'consultation',
          bookedBy: testAdvocate._id
        },
        {
          title: 'Appointment 2',
          clientId: testClient._id,
          advocateId: testAdvocate._id,
          startDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
          endDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000 + 60 * 60 * 1000),
          status: 'completed',
          type: 'follow_up',
          bookedBy: testAdvocate._id
        }
      ]);
    });

    it('should get appointments with pagination', async () => {
      const response = await request(app)
        .get('/api/appointments?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should filter appointments by status', async () => {
      const response = await request(app)
        .get('/api/appointments?status=scheduled')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(apt => apt.status === 'scheduled')).toBe(true);
    });

    it('should filter appointments by type', async () => {
      const response = await request(app)
        .get('/api/appointments?type=consultation')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(apt => apt.type === 'consultation')).toBe(true);
    });

    it('should search appointments by title', async () => {
      const response = await request(app)
        .get('/api/appointments?search=Appointment 1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.some(apt => apt.title.includes('Appointment 1'))).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/appointments')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/appointments/:id', () => {
    let testAppointment;

    beforeEach(async () => {
      testAppointment = await Appointment.create({
        title: 'Test Appointment',
        clientId: testClient._id,
        advocateId: testAdvocate._id,
        startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        bookedBy: testAdvocate._id
      });
    });

    it('should get single appointment by ID', async () => {
      const response = await request(app)
        .get(`/api/appointments/${testAppointment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testAppointment._id.toString());
      expect(response.body.data.title).toBe('Test Appointment');
    });

    it('should return 404 for non-existent appointment', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/appointments/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/appointments/${testAppointment._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/appointments/:id', () => {
    let testAppointment;

    beforeEach(async () => {
      testAppointment = await Appointment.create({
        title: 'Test Appointment',
        clientId: testClient._id,
        advocateId: testAdvocate._id,
        startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        bookedBy: testAdvocate._id
      });
    });

    it('should update appointment with valid data', async () => {
      const updateData = {
        title: 'Updated Appointment Title',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/appointments/${testAppointment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.description).toBe(updateData.description);
    });

    it('should detect conflicts when updating time', async () => {
      // Create another appointment
      await Appointment.create({
        title: 'Blocking Appointment',
        clientId: testClient._id,
        advocateId: testAdvocate._id,
        startDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
        endDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000 + 60 * 60 * 1000),
        bookedBy: testAdvocate._id
      });

      // Try to update to conflicting time
      const updateData = {
        startDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        endDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .put(`/api/appointments/${testAppointment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('conflicts with existing schedule');
    });

    it('should return 404 for non-existent appointment', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .put(`/api/appointments/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /api/appointments/:id/cancel', () => {
    let testAppointment;

    beforeEach(async () => {
      testAppointment = await Appointment.create({
        title: 'Test Appointment',
        clientId: testClient._id,
        advocateId: testAdvocate._id,
        startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        status: 'scheduled',
        bookedBy: testAdvocate._id
      });
    });

    it('should cancel appointment successfully', async () => {
      const response = await request(app)
        .put(`/api/appointments/${testAppointment._id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Client requested cancellation' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
      expect(response.body.data.cancellationReason).toBe('Client requested cancellation');
      expect(response.body.data.cancelledBy).toBe(testAdvocate._id.toString());
    });

    it('should not allow cancellation of completed appointment', async () => {
      // Update appointment to completed
      await Appointment.findByIdAndUpdate(testAppointment._id, { status: 'completed' });

      const response = await request(app)
        .put(`/api/appointments/${testAppointment._id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Test cancellation' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('cannot be cancelled');
    });
  });

  describe('GET /api/appointments/availability/:advocateId', () => {
    it('should get available time slots for advocate', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/appointments/availability/${testAdvocate._id}?date=${dateString}&duration=60`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.advocateId).toBe(testAdvocate._id.toString());
      expect(response.body.data.date).toBe(dateString);
      expect(response.body.data.availableSlots).toBeDefined();
      expect(Array.isArray(response.body.data.availableSlots)).toBe(true);
    });

    it('should require date parameter', async () => {
      const response = await request(app)
        .get(`/api/appointments/availability/${testAdvocate._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Date is required');
    });

    it('should return 400 for invalid advocate ID', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/appointments/availability/${invalidId}?date=${dateString}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid advocate');
    });
  });
});
