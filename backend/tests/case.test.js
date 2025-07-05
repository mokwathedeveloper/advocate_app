// Case management unit tests for LegalPro v1.0.1
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Case = require('../models/Case');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Test database setup
const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/legalpro_test';

describe('Case Management API', () => {
  let advocateToken, adminToken, clientToken;
  let advocateUser, adminUser, clientUser;
  let testCase;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(MONGODB_URI);
    
    // Create test users
    advocateUser = await User.create({
      firstName: 'John',
      lastName: 'Advocate',
      email: 'advocate@test.com',
      password: 'password123',
      role: 'advocate',
      licenseNumber: 'ADV001',
      specialization: ['Family Law'],
      isVerified: true,
      isActive: true
    });

    adminUser = await User.create({
      firstName: 'Jane',
      lastName: 'Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      createdBy: advocateUser._id,
      permissions: {
        canManageCases: true,
        canUploadFiles: true,
        canOpenFiles: true,
        canDeleteFiles: true,
        canViewAllCases: true
      }
    });

    clientUser = await User.create({
      firstName: 'Bob',
      lastName: 'Client',
      email: 'client@test.com',
      password: 'password123',
      role: 'client'
    });

    // Generate tokens
    advocateToken = jwt.sign({ id: advocateUser._id }, process.env.JWT_SECRET);
    adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET);
    clientToken = jwt.sign({ id: clientUser._id }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    // Clean up test data
    await Case.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up cases before each test
    await Case.deleteMany({});
  });

  describe('POST /api/cases', () => {
    const validCaseData = {
      title: 'Test Case',
      description: 'This is a test case description',
      category: 'Family Law',
      priority: 'medium',
      clientId: null // Will be set in tests
    };

    beforeEach(() => {
      validCaseData.clientId = clientUser._id.toString();
    });

    test('should create case successfully as advocate', async () => {
      const response = await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${advocateToken}`)
        .send(validCaseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(validCaseData.title);
      expect(response.body.data.caseNumber).toMatch(/^CASE-\d{4}-\d{4}$/);
      expect(response.body.data.status).toBe('pending');
    });

    test('should create case successfully as admin with permissions', async () => {
      const response = await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCaseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(validCaseData.title);
    });

    test('should fail to create case as client', async () => {
      await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(validCaseData)
        .expect(403);
    });

    test('should fail with missing required fields', async () => {
      const invalidData = { ...validCaseData };
      delete invalidData.title;

      const response = await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${advocateToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    test('should fail with invalid client ID', async () => {
      const invalidData = { ...validCaseData, clientId: 'invalid-id' };

      const response = await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${advocateToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid client ID');
    });

    test('should fail with court date in the past', async () => {
      const invalidData = { 
        ...validCaseData, 
        courtDate: '2020-01-01' 
      };

      const response = await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${advocateToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('past');
    });
  });

  describe('GET /api/cases', () => {
    beforeEach(async () => {
      // Create test cases
      testCase = await Case.create({
        title: 'Test Case 1',
        description: 'Test description',
        category: 'Family Law',
        priority: 'high',
        clientId: clientUser._id,
        assignedTo: adminUser._id
      });

      await Case.create({
        title: 'Test Case 2',
        description: 'Another test description',
        category: 'Corporate Law',
        priority: 'low',
        clientId: clientUser._id,
        assignedTo: advocateUser._id
      });
    });

    test('should get all cases as advocate', async () => {
      const response = await request(app)
        .get('/api/cases')
        .set('Authorization', `Bearer ${advocateToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });

    test('should get only assigned cases as admin without viewAll permission', async () => {
      // Update admin to not have viewAll permission
      await User.findByIdAndUpdate(adminUser._id, {
        'permissions.canViewAllCases': false
      });

      const response = await request(app)
        .get('/api/cases')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].assignedTo._id).toBe(adminUser._id.toString());
    });

    test('should get only own cases as client', async () => {
      const response = await request(app)
        .get('/api/cases')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach(case_item => {
        expect(case_item.clientId._id).toBe(clientUser._id.toString());
      });
    });

    test('should filter cases by status', async () => {
      await Case.findByIdAndUpdate(testCase._id, { status: 'completed' });

      const response = await request(app)
        .get('/api/cases?status=completed')
        .set('Authorization', `Bearer ${advocateToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('completed');
    });

    test('should search cases by title', async () => {
      const response = await request(app)
        .get('/api/cases?search=Test Case 1')
        .set('Authorization', `Bearer ${advocateToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Test Case 1');
    });

    test('should paginate results', async () => {
      const response = await request(app)
        .get('/api/cases?page=1&limit=1')
        .set('Authorization', `Bearer ${advocateToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.total).toBe(2);
    });
  });

  describe('GET /api/cases/:id', () => {
    beforeEach(async () => {
      testCase = await Case.create({
        title: 'Test Case',
        description: 'Test description',
        category: 'Family Law',
        priority: 'high',
        clientId: clientUser._id,
        assignedTo: adminUser._id
      });
    });

    test('should get case details as advocate', async () => {
      const response = await request(app)
        .get(`/api/cases/${testCase._id}`)
        .set('Authorization', `Bearer ${advocateToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Case');
      expect(response.body.data.documentStats).toBeDefined();
    });

    test('should get case details as assigned admin', async () => {
      const response = await request(app)
        .get(`/api/cases/${testCase._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Case');
    });

    test('should get case details as client owner', async () => {
      const response = await request(app)
        .get(`/api/cases/${testCase._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Case');
    });

    test('should fail with invalid case ID', async () => {
      const response = await request(app)
        .get('/api/cases/invalid-id')
        .set('Authorization', `Bearer ${advocateToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid case ID');
    });

    test('should fail when case not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/cases/${nonExistentId}`)
        .set('Authorization', `Bearer ${advocateToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /api/cases/:id', () => {
    beforeEach(async () => {
      testCase = await Case.create({
        title: 'Test Case',
        description: 'Test description',
        category: 'Family Law',
        priority: 'high',
        clientId: clientUser._id,
        assignedTo: adminUser._id
      });
    });

    test('should update case as advocate', async () => {
      const updateData = {
        title: 'Updated Test Case',
        priority: 'urgent'
      };

      const response = await request(app)
        .put(`/api/cases/${testCase._id}`)
        .set('Authorization', `Bearer ${advocateToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Test Case');
      expect(response.body.data.priority).toBe('urgent');
    });

    test('should update case as admin with permissions', async () => {
      const updateData = { priority: 'low' };

      const response = await request(app)
        .put(`/api/cases/${testCase._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.priority).toBe('low');
    });

    test('should fail to update case as client', async () => {
      const updateData = { title: 'Hacked Title' };

      await request(app)
        .put(`/api/cases/${testCase._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updateData)
        .expect(403);
    });

    test('should fail with empty title', async () => {
      const updateData = { title: '' };

      const response = await request(app)
        .put(`/api/cases/${testCase._id}`)
        .set('Authorization', `Bearer ${advocateToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('empty');
    });
  });

  describe('DELETE /api/cases/:id', () => {
    beforeEach(async () => {
      testCase = await Case.create({
        title: 'Test Case',
        description: 'Test description',
        category: 'Family Law',
        priority: 'high',
        clientId: clientUser._id,
        assignedTo: adminUser._id
      });
    });

    test('should archive case as advocate', async () => {
      const response = await request(app)
        .delete(`/api/cases/${testCase._id}`)
        .set('Authorization', `Bearer ${advocateToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('archived');

      // Verify case is archived
      const archivedCase = await Case.findById(testCase._id);
      expect(archivedCase.isArchived).toBe(true);
    });

    test('should fail to archive case as admin', async () => {
      await request(app)
        .delete(`/api/cases/${testCase._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    test('should fail to archive case as client', async () => {
      await request(app)
        .delete(`/api/cases/${testCase._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/cases/:id/status', () => {
    beforeEach(async () => {
      testCase = await Case.create({
        title: 'Test Case',
        description: 'Test description',
        category: 'Family Law',
        priority: 'high',
        clientId: clientUser._id,
        assignedTo: adminUser._id
      });
    });

    test('should update case status as advocate', async () => {
      const response = await request(app)
        .put(`/api/cases/${testCase._id}/status`)
        .set('Authorization', `Bearer ${advocateToken}`)
        .send({ status: 'in_progress', reason: 'Starting work' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('in_progress');
    });

    test('should update case status as admin with permissions', async () => {
      const response = await request(app)
        .put(`/api/cases/${testCase._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'completed' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
    });

    test('should fail with invalid status', async () => {
      const response = await request(app)
        .put(`/api/cases/${testCase._id}/status`)
        .set('Authorization', `Bearer ${advocateToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/cases/stats', () => {
    beforeEach(async () => {
      await Case.create([
        {
          title: 'Case 1',
          description: 'Description 1',
          category: 'Family Law',
          priority: 'high',
          status: 'pending',
          clientId: clientUser._id
        },
        {
          title: 'Case 2',
          description: 'Description 2',
          category: 'Corporate Law',
          priority: 'medium',
          status: 'in_progress',
          clientId: clientUser._id
        },
        {
          title: 'Case 3',
          description: 'Description 3',
          category: 'Family Law',
          priority: 'urgent',
          status: 'completed',
          clientId: clientUser._id
        }
      ]);
    });

    test('should get case statistics as advocate', async () => {
      const response = await request(app)
        .get('/api/cases/stats')
        .set('Authorization', `Bearer ${advocateToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview.totalCases).toBe(3);
      expect(response.body.data.overview.pendingCases).toBe(1);
      expect(response.body.data.overview.inProgressCases).toBe(1);
      expect(response.body.data.overview.completedCases).toBe(1);
      expect(response.body.data.categoryBreakdown).toHaveLength(2);
    });

    test('should get filtered statistics as client', async () => {
      const response = await request(app)
        .get('/api/cases/stats')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview.totalCases).toBe(3);
    });
  });

  describe('Document Management', () => {
    beforeEach(async () => {
      testCase = await Case.create({
        title: 'Test Case',
        description: 'Test description',
        category: 'Family Law',
        priority: 'high',
        clientId: clientUser._id,
        assignedTo: adminUser._id
      });
    });

    describe('POST /api/cases/:id/documents', () => {
      test('should upload document as advocate', async () => {
        const response = await request(app)
          .post(`/api/cases/${testCase._id}/documents`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .attach('document', Buffer.from('test file content'), 'test.pdf')
          .field('name', 'Test Document')
          .field('description', 'Test document description')
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Test Document');
        expect(response.body.data.originalName).toBe('test.pdf');
      });

      test('should upload document as client to own case', async () => {
        const response = await request(app)
          .post(`/api/cases/${testCase._id}/documents`)
          .set('Authorization', `Bearer ${clientToken}`)
          .attach('document', Buffer.from('test file content'), 'client-doc.pdf')
          .expect(201);

        expect(response.body.success).toBe(true);
      });

      test('should fail without file', async () => {
        const response = await request(app)
          .post(`/api/cases/${testCase._id}/documents`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('No file uploaded');
      });

      test('should fail with invalid file type', async () => {
        const response = await request(app)
          .post(`/api/cases/${testCase._id}/documents`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .attach('document', Buffer.from('test content'), 'test.exe')
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      test('should fail when case not found', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();

        const response = await request(app)
          .post(`/api/cases/${nonExistentId}/documents`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .attach('document', Buffer.from('test content'), 'test.pdf')
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/cases/:id/documents', () => {
      beforeEach(async () => {
        // Add a test document to the case
        await Case.findByIdAndUpdate(testCase._id, {
          $push: {
            documents: {
              name: 'Test Document',
              originalName: 'test.pdf',
              type: 'application/pdf',
              size: 1024,
              url: 'https://example.com/test.pdf',
              publicId: 'test-public-id',
              uploadedBy: advocateUser._id
            }
          }
        });
      });

      test('should get case documents as advocate', async () => {
        const response = await request(app)
          .get(`/api/cases/${testCase._id}/documents`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].name).toBe('Test Document');
      });

      test('should get case documents as client owner', async () => {
        const response = await request(app)
          .get(`/api/cases/${testCase._id}/documents`)
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
      });

      test('should fail as admin without file permissions', async () => {
        // Remove file permissions from admin
        await User.findByIdAndUpdate(adminUser._id, {
          'permissions.canOpenFiles': false
        });

        await request(app)
          .get(`/api/cases/${testCase._id}/documents`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(403);
      });
    });

    describe('DELETE /api/cases/:id/documents/:docId', () => {
      let documentId;

      beforeEach(async () => {
        const updatedCase = await Case.findByIdAndUpdate(testCase._id, {
          $push: {
            documents: {
              name: 'Test Document',
              originalName: 'test.pdf',
              type: 'application/pdf',
              size: 1024,
              url: 'https://example.com/test.pdf',
              publicId: 'test-public-id',
              uploadedBy: clientUser._id
            }
          }
        }, { new: true });

        documentId = updatedCase.documents[0]._id;
      });

      test('should delete document as advocate', async () => {
        const response = await request(app)
          .delete(`/api/cases/${testCase._id}/documents/${documentId}`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted');
      });

      test('should delete own document as client', async () => {
        const response = await request(app)
          .delete(`/api/cases/${testCase._id}/documents/${documentId}`)
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      test('should fail to delete other user document as client', async () => {
        // Update document to be uploaded by advocate
        await Case.findOneAndUpdate(
          { _id: testCase._id, 'documents._id': documentId },
          { $set: { 'documents.$.uploadedBy': advocateUser._id } }
        );

        const response = await request(app)
          .delete(`/api/cases/${testCase._id}/documents/${documentId}`)
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
      });
    });
  });
});
