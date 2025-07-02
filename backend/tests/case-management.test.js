// Case Management System Tests - LegalPro v1.0.1
// Comprehensive test suite for case management functionality

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Case = require('../models/Case');
const CaseDocument = require('../models/CaseDocument');
const CaseNote = require('../models/CaseNote');
const CaseActivity = require('../models/CaseActivity');
const { CASE_STATUS, CASE_TYPE, CASE_PRIORITY } = require('../models/Case');
const { USER_ROLES } = require('../config/auth');

// Test database setup
const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/legalpro_test';

describe('Case Management System', () => {
  let adminToken, advocateToken, clientToken, superAdminToken;
  let adminUser, advocateUser, clientUser, superAdminUser;
  let testCase, testDocument, testNote;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(MONGODB_URI);
    
    // Clear test data
    await Promise.all([
      User.deleteMany({}),
      Case.deleteMany({}),
      CaseDocument.deleteMany({}),
      CaseNote.deleteMany({}),
      CaseActivity.deleteMany({})
    ]);

    // Create test users
    const users = await User.create([
      {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'superadmin@test.com',
        password: 'Password123!',
        role: USER_ROLES.SUPER_ADMIN,
        isVerified: true,
        isActive: true
      },
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        password: 'Password123!',
        role: USER_ROLES.ADMIN,
        isVerified: true,
        isActive: true
      },
      {
        firstName: 'John',
        lastName: 'Advocate',
        email: 'advocate@test.com',
        password: 'Password123!',
        role: USER_ROLES.ADVOCATE,
        specialization: 'Corporate Law',
        isVerified: true,
        isActive: true
      },
      {
        firstName: 'Jane',
        lastName: 'Client',
        email: 'client@test.com',
        password: 'Password123!',
        role: USER_ROLES.CLIENT,
        isVerified: true,
        isActive: true
      }
    ]);

    [superAdminUser, adminUser, advocateUser, clientUser] = users;

    // Get authentication tokens
    const superAdminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'superadmin@test.com', password: 'Password123!' });
    superAdminToken = superAdminLogin.body.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Password123!' });
    adminToken = adminLogin.body.token;

    const advocateLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'advocate@test.com', password: 'Password123!' });
    advocateToken = advocateLogin.body.token;

    const clientLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'client@test.com', password: 'Password123!' });
    clientToken = clientLogin.body.token;
  });

  afterAll(async () => {
    // Clean up test data
    await Promise.all([
      User.deleteMany({}),
      Case.deleteMany({}),
      CaseDocument.deleteMany({}),
      CaseNote.deleteMany({}),
      CaseActivity.deleteMany({})
    ]);
    
    await mongoose.connection.close();
  });

  describe('Case CRUD Operations', () => {
    describe('POST /api/cases - Create Case', () => {
      test('Should create case successfully with valid data', async () => {
        const caseData = {
          title: 'Test Corporate Case',
          description: 'A test case for corporate law matters',
          caseType: CASE_TYPE.CORPORATE,
          priority: CASE_PRIORITY.HIGH,
          clientId: clientUser._id,
          advocateId: advocateUser._id,
          courtDetails: {
            courtName: 'Supreme Court',
            judge: 'Justice Smith'
          },
          billing: {
            billingType: 'hourly',
            hourlyRate: 500
          },
          tags: ['corporate', 'urgent']
        };

        const response = await request(app)
          .post('/api/cases')
          .set('Authorization', `Bearer ${advocateToken}`)
          .send(caseData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(caseData.title);
        expect(response.body.data.caseNumber).toMatch(/^CASE-\d{4}-\d{4}$/);
        expect(response.body.data.client.primary).toBe(clientUser._id.toString());
        expect(response.body.data.advocate.primary).toBe(advocateUser._id.toString());

        testCase = response.body.data;
      });

      test('Should fail to create case with invalid client ID', async () => {
        const caseData = {
          title: 'Invalid Case',
          clientId: new mongoose.Types.ObjectId(),
          advocateId: advocateUser._id
        };

        await request(app)
          .post('/api/cases')
          .set('Authorization', `Bearer ${advocateToken}`)
          .send(caseData)
          .expect(400);
      });

      test('Should fail to create case without authentication', async () => {
        const caseData = {
          title: 'Unauthorized Case',
          clientId: clientUser._id
        };

        await request(app)
          .post('/api/cases')
          .send(caseData)
          .expect(401);
      });
    });

    describe('GET /api/cases - Get Cases', () => {
      test('Should get cases for advocate', async () => {
        const response = await request(app)
          .get('/api/cases')
          .set('Authorization', `Bearer ${advocateToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.pagination).toBeDefined();
      });

      test('Should filter cases by status', async () => {
        const response = await request(app)
          .get('/api/cases?status=draft')
          .set('Authorization', `Bearer ${advocateToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.forEach(caseItem => {
          expect(caseItem.status).toBe('draft');
        });
      });

      test('Should search cases by title', async () => {
        const response = await request(app)
          .get('/api/cases?search=Corporate')
          .set('Authorization', `Bearer ${advocateToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });

      test('Should paginate cases correctly', async () => {
        const response = await request(app)
          .get('/api/cases?page=1&limit=5')
          .set('Authorization', `Bearer ${advocateToken}`)
          .expect(200);

        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(5);
      });
    });

    describe('GET /api/cases/:id - Get Single Case', () => {
      test('Should get case details for authorized user', async () => {
        const response = await request(app)
          .get(`/api/cases/${testCase._id}`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.case._id).toBe(testCase._id);
        expect(response.body.data.permissions).toBeDefined();
        expect(response.body.data.permissions.canEdit).toBe(true);
      });

      test('Should deny access to unauthorized user', async () => {
        // Create another advocate
        const otherAdvocate = await User.create({
          firstName: 'Other',
          lastName: 'Advocate',
          email: 'other@test.com',
          password: 'Password123!',
          role: USER_ROLES.ADVOCATE,
          isVerified: true,
          isActive: true
        });

        const otherLogin = await request(app)
          .post('/api/auth/login')
          .send({ email: 'other@test.com', password: 'Password123!' });

        await request(app)
          .get(`/api/cases/${testCase._id}`)
          .set('Authorization', `Bearer ${otherLogin.body.token}`)
          .expect(403);
      });

      test('Should return 404 for non-existent case', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        await request(app)
          .get(`/api/cases/${fakeId}`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .expect(404);
      });
    });

    describe('PUT /api/cases/:id - Update Case', () => {
      test('Should update case successfully', async () => {
        const updateData = {
          title: 'Updated Corporate Case',
          priority: CASE_PRIORITY.URGENT,
          notes: 'Updated case notes'
        };

        const response = await request(app)
          .put(`/api/cases/${testCase._id}`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(updateData.title);
        expect(response.body.data.priority).toBe(updateData.priority);
      });

      test('Should deny update to unauthorized user', async () => {
        const updateData = { title: 'Unauthorized Update' };

        await request(app)
          .put(`/api/cases/${testCase._id}`)
          .set('Authorization', `Bearer ${clientToken}`)
          .send(updateData)
          .expect(403);
      });
    });
  });

  describe('Case Status Management', () => {
    describe('PUT /api/cases/:id/status - Change Status', () => {
      test('Should change case status successfully', async () => {
        const response = await request(app)
          .put(`/api/cases/${testCase._id}/status`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .send({
            status: CASE_STATUS.OPEN,
            reason: 'Starting case work'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.newStatus).toBe(CASE_STATUS.OPEN);
        expect(response.body.data.previousStatus).toBe(CASE_STATUS.DRAFT);
      });

      test('Should fail invalid status transition', async () => {
        await request(app)
          .put(`/api/cases/${testCase._id}/status`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .send({
            status: CASE_STATUS.ARCHIVED
          })
          .expect(400);
      });
    });

    describe('GET /api/cases/:id/transitions - Get Available Transitions', () => {
      test('Should get available status transitions', async () => {
        const response = await request(app)
          .get(`/api/cases/${testCase._id}/transitions`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.currentStatus).toBe(CASE_STATUS.OPEN);
        expect(response.body.data.availableTransitions).toBeInstanceOf(Array);
        expect(response.body.data.availableTransitions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Case Assignment', () => {
    describe('PUT /api/cases/:id/assign/primary - Assign Primary Advocate', () => {
      test('Should assign primary advocate successfully', async () => {
        // Create another advocate
        const newAdvocate = await User.create({
          firstName: 'New',
          lastName: 'Advocate',
          email: 'newadvocate@test.com',
          password: 'Password123!',
          role: USER_ROLES.ADVOCATE,
          isVerified: true,
          isActive: true
        });

        const response = await request(app)
          .put(`/api/cases/${testCase._id}/assign/primary`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            advocateId: newAdvocate._id,
            reason: 'Reassignment for specialization'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.advocate._id).toBe(newAdvocate._id.toString());
      });

      test('Should deny assignment to non-admin user', async () => {
        await request(app)
          .put(`/api/cases/${testCase._id}/assign/primary`)
          .set('Authorization', `Bearer ${clientToken}`)
          .send({ advocateId: advocateUser._id })
          .expect(403);
      });
    });

    describe('GET /api/advocates/available - Get Available Advocates', () => {
      test('Should get available advocates for admin', async () => {
        const response = await request(app)
          .get('/api/advocates/available')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
      });

      test('Should deny access to non-admin user', async () => {
        await request(app)
          .get('/api/advocates/available')
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(403);
      });
    });
  });

  describe('Case Documents', () => {
    describe('POST /api/cases/:id/documents - Upload Document', () => {
      test('Should upload document successfully', async () => {
        const response = await request(app)
          .post(`/api/cases/${testCase._id}/documents`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .attach('document', Buffer.from('test file content'), 'test.pdf')
          .field('documentType', 'pleading')
          .field('description', 'Test document upload')
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.originalName).toBe('test.pdf');
        expect(response.body.data.documentType).toBe('pleading');

        testDocument = response.body.data;
      });

      test('Should fail upload without file', async () => {
        await request(app)
          .post(`/api/cases/${testCase._id}/documents`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .field('documentType', 'pleading')
          .expect(400);
      });
    });

    describe('GET /api/cases/:id/documents - Get Case Documents', () => {
      test('Should get case documents', async () => {
        const response = await request(app)
          .get(`/api/cases/${testCase._id}/documents`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
      });

      test('Should filter documents by type', async () => {
        const response = await request(app)
          .get(`/api/cases/${testCase._id}/documents?documentType=pleading`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.forEach(doc => {
          expect(doc.documentType).toBe('pleading');
        });
      });
    });
  });

  describe('Case Notes', () => {
    describe('POST /api/cases/:id/notes - Create Note', () => {
      test('Should create note successfully', async () => {
        const noteData = {
          title: 'Test Case Note',
          content: 'This is a test note for the case',
          noteType: 'general',
          priority: 'medium',
          tags: ['test', 'note']
        };

        const response = await request(app)
          .post(`/api/cases/${testCase._id}/notes`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .send(noteData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(noteData.title);
        expect(response.body.data.content).toBe(noteData.content);

        testNote = response.body.data;
      });

      test('Should fail to create note without required fields', async () => {
        await request(app)
          .post(`/api/cases/${testCase._id}/notes`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .send({ title: 'Incomplete Note' })
          .expect(400);
      });
    });

    describe('GET /api/cases/:id/notes - Get Case Notes', () => {
      test('Should get case notes', async () => {
        const response = await request(app)
          .get(`/api/cases/${testCase._id}/notes`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
      });

      test('Should search notes by content', async () => {
        const response = await request(app)
          .get(`/api/cases/${testCase._id}/notes?search=test`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Case Activities', () => {
    describe('GET /api/cases/:id/activities - Get Case Activities', () => {
      test('Should get case activities', async () => {
        const response = await request(app)
          .get(`/api/cases/${testCase._id}/activities`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
      });

      test('Should filter activities by type', async () => {
        const response = await request(app)
          .get(`/api/cases/${testCase._id}/activities?types=case_created,status_changed`)
          .set('Authorization', `Bearer ${advocateToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.forEach(activity => {
          expect(['case_created', 'status_changed']).toContain(activity.activityType);
        });
      });
    });
  });

  describe('Search Functionality', () => {
    describe('GET /api/search/cases - Search Cases', () => {
      test('Should search cases by query', async () => {
        const response = await request(app)
          .get('/api/search/cases?q=Corporate')
          .set('Authorization', `Bearer ${advocateToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });

      test('Should search with multiple filters', async () => {
        const response = await request(app)
          .get('/api/search/cases?status=open&caseType=corporate&priority=high')
          .set('Authorization', `Bearer ${advocateToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.appliedFilters).toBeDefined();
      });
    });

    describe('GET /api/search/suggestions - Get Search Suggestions', () => {
      test('Should get search suggestions', async () => {
        const response = await request(app)
          .get('/api/search/suggestions?q=Corp')
          .set('Authorization', `Bearer ${advocateToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.suggestions).toBeDefined();
      });
    });
  });

  describe('Statistics and Reports', () => {
    describe('GET /api/cases/stats - Get Case Statistics', () => {
      test('Should get case statistics', async () => {
        const response = await request(app)
          .get('/api/cases/stats')
          .set('Authorization', `Bearer ${advocateToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.statusCounts).toBeDefined();
        expect(response.body.data.totalCases).toBeDefined();
      });
    });

    describe('GET /api/workflow/statistics - Get Workflow Statistics', () => {
      test('Should get workflow statistics for admin', async () => {
        const response = await request(app)
          .get('/api/workflow/statistics')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.byStatus).toBeDefined();
        expect(response.body.data.metrics).toBeDefined();
      });

      test('Should deny access to non-admin user', async () => {
        await request(app)
          .get('/api/workflow/statistics')
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(403);
      });
    });
  });

  describe('Error Handling', () => {
    test('Should handle invalid case ID format', async () => {
      await request(app)
        .get('/api/cases/invalid-id')
        .set('Authorization', `Bearer ${advocateToken}`)
        .expect(400);
    });

    test('Should handle database connection errors gracefully', async () => {
      // This would require mocking database errors
      // For now, we'll test that the error response format is correct
      const response = await request(app)
        .get('/api/cases/507f1f77bcf86cd799439011') // Valid ObjectId but non-existent
        .set('Authorization', `Bearer ${advocateToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('Should handle large case list efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/cases?limit=100')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
      expect(response.body.success).toBe(true);
    });

    test('Should handle concurrent requests', async () => {
      const requests = Array(5).fill().map(() =>
        request(app)
          .get('/api/cases')
          .set('Authorization', `Bearer ${advocateToken}`)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});

// Helper function to create test data
async function createTestData() {
  // This function can be used to create additional test data if needed
  return {
    cases: [],
    documents: [],
    notes: [],
    activities: []
  };
}

module.exports = {
  createTestData
};
