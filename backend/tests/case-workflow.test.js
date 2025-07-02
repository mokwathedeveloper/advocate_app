// Case Workflow Tests - LegalPro v1.0.1
// Test suite for case status management and workflow automation

const CaseWorkflowService = require('../services/caseWorkflowService');
const Case = require('../models/Case');
const User = require('../models/User');
const CaseActivity = require('../models/CaseActivity');
const { CASE_STATUS, CASE_TYPE, CASE_PRIORITY } = require('../models/Case');
const { USER_ROLES } = require('../config/auth');
const mongoose = require('mongoose');

describe('Case Workflow Service', () => {
  let testCase, advocateUser, adminUser, clientUser;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/legalpro_test');
    }

    // Create test users
    advocateUser = await User.create({
      firstName: 'Test',
      lastName: 'Advocate',
      email: 'workflow.advocate@test.com',
      password: 'Password123!',
      role: USER_ROLES.ADVOCATE,
      isVerified: true,
      isActive: true
    });

    adminUser = await User.create({
      firstName: 'Test',
      lastName: 'Admin',
      email: 'workflow.admin@test.com',
      password: 'Password123!',
      role: USER_ROLES.ADMIN,
      isVerified: true,
      isActive: true
    });

    clientUser = await User.create({
      firstName: 'Test',
      lastName: 'Client',
      email: 'workflow.client@test.com',
      password: 'Password123!',
      role: USER_ROLES.CLIENT,
      isVerified: true,
      isActive: true
    });

    // Create test case
    testCase = await Case.create({
      title: 'Workflow Test Case',
      description: 'Test case for workflow testing',
      caseType: CASE_TYPE.CORPORATE,
      priority: CASE_PRIORITY.MEDIUM,
      client: { primary: clientUser._id },
      advocate: { primary: advocateUser._id },
      createdBy: advocateUser._id,
      status: CASE_STATUS.DRAFT
    });
  });

  afterAll(async () => {
    // Clean up test data
    await Promise.all([
      User.deleteMany({ email: { $regex: /workflow\..*@test\.com/ } }),
      Case.deleteMany({ title: /Workflow Test/ }),
      CaseActivity.deleteMany({})
    ]);
  });

  describe('Status Transition Validation', () => {
    test('Should validate valid status transitions', () => {
      expect(CaseWorkflowService.isValidTransition(CASE_STATUS.DRAFT, CASE_STATUS.OPEN)).toBe(true);
      expect(CaseWorkflowService.isValidTransition(CASE_STATUS.OPEN, CASE_STATUS.IN_REVIEW)).toBe(true);
      expect(CaseWorkflowService.isValidTransition(CASE_STATUS.IN_REVIEW, CASE_STATUS.CLOSED)).toBe(true);
    });

    test('Should reject invalid status transitions', () => {
      expect(CaseWorkflowService.isValidTransition(CASE_STATUS.DRAFT, CASE_STATUS.CLOSED)).toBe(false);
      expect(CaseWorkflowService.isValidTransition(CASE_STATUS.ARCHIVED, CASE_STATUS.OPEN)).toBe(false);
      expect(CaseWorkflowService.isValidTransition(CASE_STATUS.CLOSED, CASE_STATUS.DRAFT)).toBe(false);
    });
  });

  describe('User Permission Validation', () => {
    test('Should allow advocate to change status of assigned case', () => {
      const canChange = CaseWorkflowService.canUserChangeStatus(
        CASE_STATUS.OPEN,
        advocateUser,
        testCase
      );
      expect(canChange).toBe(true);
    });

    test('Should allow admin to change any status', () => {
      const canChange = CaseWorkflowService.canUserChangeStatus(
        CASE_STATUS.ARCHIVED,
        adminUser,
        testCase
      );
      expect(canChange).toBe(true);
    });

    test('Should deny client from changing status', () => {
      const canChange = CaseWorkflowService.canUserChangeStatus(
        CASE_STATUS.OPEN,
        clientUser,
        testCase
      );
      expect(canChange).toBe(false);
    });
  });

  describe('Status Change Operations', () => {
    test('Should change status from DRAFT to OPEN successfully', async () => {
      const result = await CaseWorkflowService.changeStatus(
        testCase._id,
        CASE_STATUS.OPEN,
        advocateUser,
        { reason: 'Starting case work' }
      );

      expect(result.success).toBe(true);
      expect(result.newStatus).toBe(CASE_STATUS.OPEN);
      expect(result.previousStatus).toBe(CASE_STATUS.DRAFT);
      expect(result.case.status).toBe(CASE_STATUS.OPEN);
      expect(result.case.progress).toBe(10); // Auto-updated progress
    });

    test('Should change status from OPEN to IN_REVIEW', async () => {
      const result = await CaseWorkflowService.changeStatus(
        testCase._id,
        CASE_STATUS.IN_REVIEW,
        advocateUser,
        { reason: 'Case ready for review' }
      );

      expect(result.success).toBe(true);
      expect(result.newStatus).toBe(CASE_STATUS.IN_REVIEW);
      expect(result.case.progress).toBe(75); // Auto-updated progress
    });

    test('Should change status to CLOSED with outcome requirement', async () => {
      const result = await CaseWorkflowService.changeStatus(
        testCase._id,
        CASE_STATUS.CLOSED,
        advocateUser,
        {
          reason: 'Case completed successfully',
          outcome: 'Favorable settlement reached'
        }
      );

      expect(result.success).toBe(true);
      expect(result.newStatus).toBe(CASE_STATUS.CLOSED);
      expect(result.case.progress).toBe(100);
      expect(result.case.outcome).toBe('Favorable settlement reached');
      expect(result.case.actualCompletion).toBeDefined();
    });

    test('Should fail to change status without required outcome', async () => {
      // Reset case status for this test
      await Case.findByIdAndUpdate(testCase._id, { status: CASE_STATUS.IN_REVIEW });

      await expect(
        CaseWorkflowService.changeStatus(
          testCase._id,
          CASE_STATUS.CLOSED,
          advocateUser,
          { reason: 'Trying to close without outcome' }
        )
      ).rejects.toThrow('Outcome is required for this status change');
    });

    test('Should fail invalid status transition', async () => {
      await expect(
        CaseWorkflowService.changeStatus(
          testCase._id,
          CASE_STATUS.DRAFT,
          advocateUser,
          { reason: 'Invalid transition' }
        )
      ).rejects.toThrow('Invalid status transition');
    });

    test('Should fail without sufficient permissions', async () => {
      await expect(
        CaseWorkflowService.changeStatus(
          testCase._id,
          CASE_STATUS.OPEN,
          clientUser,
          { reason: 'Client trying to change status' }
        )
      ).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('Available Transitions', () => {
    test('Should get available transitions for current status', () => {
      // Set case to OPEN status
      testCase.status = CASE_STATUS.OPEN;

      const transitions = CaseWorkflowService.getAvailableTransitions(testCase, advocateUser);

      expect(transitions).toBeInstanceOf(Array);
      expect(transitions.length).toBeGreaterThan(0);
      
      const statusValues = transitions.map(t => t.status);
      expect(statusValues).toContain(CASE_STATUS.IN_REVIEW);
      expect(statusValues).toContain(CASE_STATUS.ON_HOLD);
      expect(statusValues).toContain(CASE_STATUS.PENDING);
    });

    test('Should filter transitions based on user permissions', () => {
      testCase.status = CASE_STATUS.CLOSED;

      const advocateTransitions = CaseWorkflowService.getAvailableTransitions(testCase, advocateUser);
      const adminTransitions = CaseWorkflowService.getAvailableTransitions(testCase, adminUser);

      // Advocate should not be able to archive
      const advocateStatuses = advocateTransitions.map(t => t.status);
      expect(advocateStatuses).not.toContain(CASE_STATUS.ARCHIVED);

      // Admin should be able to archive
      const adminStatuses = adminTransitions.map(t => t.status);
      expect(adminStatuses).toContain(CASE_STATUS.ARCHIVED);
    });
  });

  describe('Status Labels and Descriptions', () => {
    test('Should return correct status labels', () => {
      expect(CaseWorkflowService.getStatusLabel(CASE_STATUS.DRAFT)).toBe('Draft');
      expect(CaseWorkflowService.getStatusLabel(CASE_STATUS.IN_REVIEW)).toBe('In Review');
      expect(CaseWorkflowService.getStatusLabel(CASE_STATUS.ON_HOLD)).toBe('On Hold');
    });

    test('Should return status descriptions', () => {
      const description = CaseWorkflowService.getStatusDescription(CASE_STATUS.OPEN);
      expect(description).toContain('active');
      expect(description).toContain('progress');
    });

    test('Should return status requirements', () => {
      const requirements = CaseWorkflowService.getStatusRequirements(CASE_STATUS.CLOSED);
      expect(requirements.requiresOutcome).toBe(true);
      expect(requirements.autoUpdates.progress).toBe(100);
    });
  });

  describe('Activity Logging', () => {
    test('Should log status change activity', async () => {
      // Reset case for this test
      await Case.findByIdAndUpdate(testCase._id, { status: CASE_STATUS.DRAFT });

      await CaseWorkflowService.changeStatus(
        testCase._id,
        CASE_STATUS.OPEN,
        advocateUser,
        { reason: 'Testing activity logging' }
      );

      const activities = await CaseActivity.find({
        caseId: testCase._id,
        activityType: 'status_changed'
      }).sort({ performedAt: -1 });

      expect(activities.length).toBeGreaterThan(0);
      
      const latestActivity = activities[0];
      expect(latestActivity.action).toBe('Status Changed');
      expect(latestActivity.performedBy.toString()).toBe(advocateUser._id.toString());
      expect(latestActivity.details.newStatus).toBe(CASE_STATUS.OPEN);
      expect(latestActivity.details.reason).toBe('Testing activity logging');
    });
  });

  describe('Status Statistics', () => {
    test('Should calculate status statistics', async () => {
      const stats = await CaseWorkflowService.getStatusStatistics();

      expect(stats.statusBreakdown).toBeInstanceOf(Array);
      expect(stats.totalCases).toBeGreaterThan(0);
      expect(stats.averageProgress).toBeDefined();
    });

    test('Should filter statistics by criteria', async () => {
      const stats = await CaseWorkflowService.getStatusStatistics({
        caseType: CASE_TYPE.CORPORATE
      });

      expect(stats.statusBreakdown).toBeInstanceOf(Array);
    });
  });

  describe('Workflow Actions', () => {
    test('Should execute case closure workflow', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await CaseWorkflowService.handleCaseClosure(testCase, advocateUser, {
        outcome: 'Test closure'
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Executing case closure workflow')
      );

      consoleSpy.mockRestore();
    });

    test('Should execute case archival workflow', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await CaseWorkflowService.handleCaseArchival(testCase, adminUser, {
        reason: 'Test archival'
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Executing case archival workflow')
      );

      consoleSpy.mockRestore();
    });

    test('Should execute on hold workflow', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await CaseWorkflowService.handleCaseOnHold(testCase, advocateUser, {
        reason: 'Waiting for client response'
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Executing case on hold workflow')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('Should handle non-existent case', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await expect(
        CaseWorkflowService.changeStatus(
          fakeId,
          CASE_STATUS.OPEN,
          advocateUser,
          { reason: 'Test' }
        )
      ).rejects.toThrow('Case not found');
    });

    test('Should handle invalid user', async () => {
      const invalidUser = { _id: new mongoose.Types.ObjectId(), role: 'invalid' };

      await expect(
        CaseWorkflowService.changeStatus(
          testCase._id,
          CASE_STATUS.OPEN,
          invalidUser,
          { reason: 'Test' }
        )
      ).rejects.toThrow();
    });
  });

  describe('Concurrent Status Changes', () => {
    test('Should handle concurrent status change attempts', async () => {
      // Reset case status
      await Case.findByIdAndUpdate(testCase._id, { status: CASE_STATUS.DRAFT });

      // Attempt concurrent status changes
      const promises = [
        CaseWorkflowService.changeStatus(
          testCase._id,
          CASE_STATUS.OPEN,
          advocateUser,
          { reason: 'First change' }
        ),
        CaseWorkflowService.changeStatus(
          testCase._id,
          CASE_STATUS.OPEN,
          advocateUser,
          { reason: 'Second change' }
        )
      ];

      // One should succeed, one might fail or both might succeed
      // depending on timing and database handling
      const results = await Promise.allSettled(promises);
      
      // At least one should succeed
      const successfulResults = results.filter(r => r.status === 'fulfilled');
      expect(successfulResults.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    test('Should handle status change efficiently', async () => {
      const startTime = Date.now();

      await CaseWorkflowService.changeStatus(
        testCase._id,
        CASE_STATUS.PENDING,
        advocateUser,
        { reason: 'Performance test' }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('Should handle multiple status queries efficiently', async () => {
      const startTime = Date.now();

      const promises = Array(10).fill().map(() =>
        CaseWorkflowService.getAvailableTransitions(testCase, advocateUser)
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});
