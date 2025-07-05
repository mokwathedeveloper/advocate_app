// Integration tests for Appointment System - LegalPro v1.0.1
const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const Appointment = require('../../models/Appointment');
const User = require('../../models/User');
const Case = require('../../models/Case');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Create test app without starting server
const app = express();
app.use(express.json());
app.use('/api/appointments', require('../../routes/appointments'));
app.use('/api/auth', require('../../routes/auth'));

describe('Appointment System Integration', () => {
  let mongoServer;
  let testAdvocate;
  let testClient;
  let testAdmin;
  let testCase;
  let advocateToken;
  let clientToken;
  let adminToken;

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
    await Case.deleteMany({});
    
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

    testAdmin = await User.create({
      firstName: 'Test',
      lastName: 'Admin',
      email: 'admin@test.com',
      password: 'TestPassword123!',
      role: 'admin',
      permissions: ['canScheduleAppointments', 'canManageUsers'],
      isVerified: true,
      isActive: true,
      isEmailVerified: true
    });

    // Create test case
    testCase = await Case.create({
      title: 'Test Legal Case',
      caseNumber: 'CASE-001',
      description: 'Test case for appointment integration',
      category: 'Corporate Law',
      clientId: testClient._id,
      assignedTo: testAdvocate._id,
      status: 'pending',
      createdBy: testAdvocate._id
    });

    // Generate auth tokens
    const advocateLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'advocate@test.com',
        password: 'TestPassword123!'
      });
    advocateToken = advocateLogin.body.token;

    const clientLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'client@test.com',
        password: 'TestPassword123!'
      });
    clientToken = clientLogin.body.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'TestPassword123!'
      });
    adminToken = adminLogin.body.token;
  });

  describe('Complete Appointment Workflow', () => {
    it('should handle complete appointment lifecycle', async () => {
      // Step 1: Check availability
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      const availabilityResponse = await request(app)
        .get(`/api/appointments/availability/${testAdvocate._id}?date=${dateString}&duration=60`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(availabilityResponse.body.data.availableSlots.length).toBeGreaterThan(0);
      const firstSlot = availabilityResponse.body.data.availableSlots[0];

      // Step 2: Book appointment
      const appointmentData = {
        title: 'Legal Consultation',
        description: 'Initial consultation for corporate law matters',
        clientId: testClient._id,
        advocateId: testAdvocate._id,
        startDateTime: firstSlot.startTime,
        endDateTime: firstSlot.endTime,
        type: 'consultation',
        priority: 'medium',
        location: {
          type: 'office',
          address: '123 Legal Street, Nairobi'
        },
        caseId: testCase._id
      };

      const createResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(appointmentData)
        .expect(201);

      const appointmentId = createResponse.body.data._id;
      expect(createResponse.body.data.title).toBe(appointmentData.title);
      if (createResponse.body.data.caseId) {
        expect(createResponse.body.data.caseId._id).toBe(testCase._id.toString());
      }

      // Step 3: Verify appointment appears in listings
      const listResponse = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${advocateToken}`)
        .expect(200);

      expect(listResponse.body.data.some(apt => apt._id === appointmentId)).toBe(true);

      // Step 4: Update appointment
      const updateResponse = await request(app)
        .put(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${advocateToken}`)
        .send({
          description: 'Updated consultation details',
          priority: 'high'
        })
        .expect(200);

      expect(updateResponse.body.data.description).toBe('Updated consultation details');
      expect(updateResponse.body.data.priority).toBe('high');

      // Step 5: Complete appointment
      const completeResponse = await request(app)
        .put(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${advocateToken}`)
        .send({
          status: 'completed',
          outcome: 'Successful consultation completed'
        })
        .expect(200);

      expect(completeResponse.body.data.status).toBe('completed');
      expect(completeResponse.body.data.outcome).toBe('Successful consultation completed');
      expect(completeResponse.body.data.completedAt).toBeDefined();
    });

    it('should handle appointment cancellation workflow', async () => {
      // Create appointment
      const appointment = await Appointment.create({
        title: 'Test Appointment',
        clientId: testClient._id,
        advocateId: testAdvocate._id,
        startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        status: 'scheduled',
        bookedBy: testClient._id
      });

      // Cancel appointment
      const cancelResponse = await request(app)
        .put(`/api/appointments/${appointment._id}/cancel`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          reason: 'Client emergency - need to reschedule'
        })
        .expect(200);

      expect(cancelResponse.body.data.status).toBe('cancelled');
      expect(cancelResponse.body.data.cancellationReason).toBe('Client emergency - need to reschedule');
      expect(cancelResponse.body.data.cancelledBy).toBe(testClient._id.toString());
      expect(cancelResponse.body.data.cancelledAt).toBeDefined();
    });
  });

  describe('Role-based Access Control', () => {
    let testAppointment;

    beforeEach(async () => {
      testAppointment = await Appointment.create({
        title: 'Test Appointment',
        clientId: testClient._id,
        advocateId: testAdvocate._id,
        startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        bookedBy: testClient._id
      });
    });

    it('should allow client to view their own appointments', async () => {
      const response = await request(app)
        .get(`/api/appointments/${testAppointment._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.data._id).toBe(testAppointment._id.toString());
    });

    it('should allow advocate to view their appointments', async () => {
      const response = await request(app)
        .get(`/api/appointments/${testAppointment._id}`)
        .set('Authorization', `Bearer ${advocateToken}`)
        .expect(200);

      expect(response.body.data._id).toBe(testAppointment._id.toString());
    });

    it('should allow admin to view any appointment', async () => {
      const response = await request(app)
        .get(`/api/appointments/${testAppointment._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data._id).toBe(testAppointment._id.toString());
    });

    it('should filter appointments based on user role', async () => {
      // Create appointment for different advocate
      const otherAdvocate = await User.create({
        firstName: 'Other',
        lastName: 'Advocate',
        email: 'other@test.com',
        password: 'TestPassword123!',
        role: 'advocate',
        licenseNumber: 'ADV-002',
        specialization: ['Criminal Law'],
        experience: 3,
        education: 'LLB University',
        barAdmission: 'Bar 2022',
        isVerified: true,
        isActive: true,
        isEmailVerified: true
      });

      await Appointment.create({
        title: 'Other Appointment',
        clientId: testClient._id,
        advocateId: otherAdvocate._id,
        startDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
        endDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000 + 60 * 60 * 1000),
        bookedBy: testClient._id
      });

      // Advocate should only see their own appointments
      const advocateResponse = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${advocateToken}`)
        .expect(200);

      expect(advocateResponse.body.data.every(apt => 
        apt.advocateId._id === testAdvocate._id.toString()
      )).toBe(true);

      // Client should see all their appointments
      const clientResponse = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(clientResponse.body.data.length).toBe(2);
      expect(clientResponse.body.data.every(apt => 
        apt.clientId._id === testClient._id.toString()
      )).toBe(true);

      // Admin should see all appointments
      const adminResponse = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminResponse.body.data.length).toBe(2);
    });
  });

  describe('Conflict Detection and Prevention', () => {
    it('should prevent double booking for same advocate', async () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      // Create first appointment
      await Appointment.create({
        title: 'First Appointment',
        clientId: testClient._id,
        advocateId: testAdvocate._id,
        startDateTime: startTime,
        endDateTime: endTime,
        bookedBy: testClient._id
      });

      // Try to create overlapping appointment
      const conflictingData = {
        title: 'Conflicting Appointment',
        clientId: testClient._id,
        advocateId: testAdvocate._id,
        startDateTime: new Date(startTime.getTime() + 30 * 60 * 1000).toISOString(), // 30 minutes later
        endDateTime: new Date(endTime.getTime() + 30 * 60 * 1000).toISOString() // 30 minutes later
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(conflictingData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('conflicts with existing schedule');
      expect(response.body.conflicts).toBeDefined();
    });

    it('should allow appointments with different advocates at same time', async () => {
      // Create another advocate
      const otherAdvocate = await User.create({
        firstName: 'Other',
        lastName: 'Advocate',
        email: 'other@test.com',
        password: 'TestPassword123!',
        role: 'advocate',
        licenseNumber: 'ADV-002',
        specialization: ['Criminal Law'],
        experience: 3,
        education: 'LLB University',
        barAdmission: 'Bar 2022',
        isVerified: true,
        isActive: true,
        isEmailVerified: true
      });

      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      // Create appointment with first advocate
      await Appointment.create({
        title: 'First Appointment',
        clientId: testClient._id,
        advocateId: testAdvocate._id,
        startDateTime: startTime,
        endDateTime: endTime,
        bookedBy: testClient._id
      });

      // Create appointment with second advocate at same time
      const sameTimeData = {
        title: 'Same Time Appointment',
        clientId: testClient._id,
        advocateId: otherAdvocate._id,
        startDateTime: startTime.toISOString(),
        endDateTime: endTime.toISOString()
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(sameTimeData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Business Rules Validation', () => {
    it('should reject appointments in the past', async () => {
      const pastTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      
      const appointmentData = {
        title: 'Past Appointment',
        clientId: testClient._id,
        advocateId: testAdvocate._id,
        startDateTime: pastTime.toISOString(),
        endDateTime: new Date(pastTime.getTime() + 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(appointmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject appointments longer than 4 hours', async () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 5 * 60 * 60 * 1000); // 5 hours later
      
      const appointmentData = {
        title: 'Long Appointment',
        clientId: testClient._id,
        advocateId: testAdvocate._id,
        startDateTime: startTime.toISOString(),
        endDateTime: endTime.toISOString()
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(appointmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject appointments with end time before start time', async () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() - 60 * 60 * 1000); // 1 hour before start
      
      const appointmentData = {
        title: 'Invalid Time Appointment',
        clientId: testClient._id,
        advocateId: testAdvocate._id,
        startDateTime: startTime.toISOString(),
        endDateTime: endTime.toISOString()
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(appointmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Search and Filtering', () => {
    beforeEach(async () => {
      // Create multiple test appointments
      await Appointment.create([
        {
          title: 'Corporate Law Consultation',
          clientId: testClient._id,
          advocateId: testAdvocate._id,
          startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          endDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
          type: 'consultation',
          status: 'scheduled',
          bookedBy: testClient._id
        },
        {
          title: 'Follow-up Meeting',
          clientId: testClient._id,
          advocateId: testAdvocate._id,
          startDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
          endDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000 + 60 * 60 * 1000),
          type: 'follow_up',
          status: 'completed',
          bookedBy: testClient._id
        }
      ]);
    });

    it('should search appointments by title', async () => {
      const response = await request(app)
        .get('/api/appointments?search=Corporate')
        .set('Authorization', `Bearer ${advocateToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toContain('Corporate');
    });

    it('should filter appointments by status', async () => {
      const response = await request(app)
        .get('/api/appointments?status=completed')
        .set('Authorization', `Bearer ${advocateToken}`)
        .expect(200);

      expect(response.body.data.every(apt => apt.status === 'completed')).toBe(true);
    });

    it('should filter appointments by type', async () => {
      const response = await request(app)
        .get('/api/appointments?type=consultation')
        .set('Authorization', `Bearer ${advocateToken}`)
        .expect(200);

      expect(response.body.data.every(apt => apt.type === 'consultation')).toBe(true);
    });

    it('should filter appointments by date range', async () => {
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(today.getTime() + 48 * 60 * 60 * 1000);

      const response = await request(app)
        .get(`/api/appointments?startDate=${tomorrow.toISOString()}&endDate=${dayAfter.toISOString()}`)
        .set('Authorization', `Bearer ${advocateToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(apt => {
        const aptDate = new Date(apt.startDateTime);
        expect(aptDate >= tomorrow && aptDate <= dayAfter).toBe(true);
      });
    });
  });
});
