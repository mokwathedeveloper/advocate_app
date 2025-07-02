// Case Search Tests - LegalPro v1.0.1
// Test suite for case search and filtering functionality

const CaseSearchService = require('../services/caseSearchService');
const Case = require('../models/Case');
const CaseDocument = require('../models/CaseDocument');
const CaseNote = require('../models/CaseNote');
const User = require('../models/User');
const { CASE_STATUS, CASE_TYPE, CASE_PRIORITY } = require('../models/Case');
const { USER_ROLES } = require('../config/auth');
const mongoose = require('mongoose');

describe('Case Search Service', () => {
  let advocateUser, clientUser, adminUser;
  let testCases = [];

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/legalpro_test');
    }

    // Create test users
    advocateUser = await User.create({
      firstName: 'Search',
      lastName: 'Advocate',
      email: 'search.advocate@test.com',
      password: 'Password123!',
      role: USER_ROLES.ADVOCATE,
      specialization: 'Corporate Law',
      isVerified: true,
      isActive: true
    });

    clientUser = await User.create({
      firstName: 'Search',
      lastName: 'Client',
      email: 'search.client@test.com',
      password: 'Password123!',
      role: USER_ROLES.CLIENT,
      isVerified: true,
      isActive: true
    });

    adminUser = await User.create({
      firstName: 'Search',
      lastName: 'Admin',
      email: 'search.admin@test.com',
      password: 'Password123!',
      role: USER_ROLES.ADMIN,
      isVerified: true,
      isActive: true
    });

    // Create test cases with different attributes for comprehensive testing
    const caseData = [
      {
        title: 'Corporate Merger Case',
        description: 'Large corporate merger involving multiple entities',
        caseType: CASE_TYPE.CORPORATE,
        priority: CASE_PRIORITY.HIGH,
        status: CASE_STATUS.OPEN,
        client: { primary: clientUser._id },
        advocate: { primary: advocateUser._id },
        createdBy: advocateUser._id,
        tags: ['merger', 'corporate', 'urgent'],
        courtDetails: { courtName: 'Supreme Court', judge: 'Justice Smith' }
      },
      {
        title: 'Employment Dispute Resolution',
        description: 'Workplace harassment and wrongful termination case',
        caseType: CASE_TYPE.EMPLOYMENT,
        priority: CASE_PRIORITY.MEDIUM,
        status: CASE_STATUS.IN_REVIEW,
        client: { primary: clientUser._id },
        advocate: { primary: advocateUser._id },
        createdBy: advocateUser._id,
        tags: ['employment', 'harassment', 'termination'],
        courtDetails: { courtName: 'District Court', judge: 'Justice Johnson' }
      },
      {
        title: 'Property Rights Litigation',
        description: 'Boundary dispute between neighboring properties',
        caseType: CASE_TYPE.PROPERTY,
        priority: CASE_PRIORITY.LOW,
        status: CASE_STATUS.PENDING,
        client: { primary: clientUser._id },
        advocate: { primary: advocateUser._id },
        createdBy: advocateUser._id,
        tags: ['property', 'boundary', 'dispute'],
        courtDetails: { courtName: 'Local Court', judge: 'Justice Williams' }
      },
      {
        title: 'Family Custody Case',
        description: 'Child custody arrangement modification',
        caseType: CASE_TYPE.FAMILY,
        priority: CASE_PRIORITY.URGENT,
        status: CASE_STATUS.CLOSED,
        client: { primary: clientUser._id },
        advocate: { primary: advocateUser._id },
        createdBy: advocateUser._id,
        tags: ['family', 'custody', 'children'],
        courtDetails: { courtName: 'Family Court', judge: 'Justice Brown' }
      }
    ];

    testCases = await Case.create(caseData);
  });

  afterAll(async () => {
    // Clean up test data
    await Promise.all([
      User.deleteMany({ email: { $regex: /search\..*@test\.com/ } }),
      Case.deleteMany({ title: { $regex: /Corporate Merger|Employment Dispute|Property Rights|Family Custody/ } }),
      CaseDocument.deleteMany({}),
      CaseNote.deleteMany({})
    ]);
  });

  describe('Basic Search Functionality', () => {
    test('Should search cases by title', async () => {
      const searchParams = {
        query: 'Corporate Merger',
        page: 1,
        limit: 10
      };

      const results = await CaseSearchService.searchCases(searchParams, advocateUser);

      expect(results.cases.length).toBeGreaterThan(0);
      expect(results.cases[0].title).toContain('Corporate Merger');
      expect(results.pagination.total).toBeGreaterThan(0);
    });

    test('Should search cases by description', async () => {
      const searchParams = {
        query: 'harassment',
        page: 1,
        limit: 10
      };

      const results = await CaseSearchService.searchCases(searchParams, advocateUser);

      expect(results.cases.length).toBeGreaterThan(0);
      expect(results.cases[0].description).toContain('harassment');
    });

    test('Should search cases by case number', async () => {
      const caseNumber = testCases[0].caseNumber;
      const searchParams = {
        query: caseNumber,
        page: 1,
        limit: 10
      };

      const results = await CaseSearchService.searchCases(searchParams, advocateUser);

      expect(results.cases.length).toBe(1);
      expect(results.cases[0].caseNumber).toBe(caseNumber);
    });

    test('Should return empty results for non-existent search term', async () => {
      const searchParams = {
        query: 'NonExistentSearchTerm12345',
        page: 1,
        limit: 10
      };

      const results = await CaseSearchService.searchCases(searchParams, advocateUser);

      expect(results.cases.length).toBe(0);
      expect(results.pagination.total).toBe(0);
    });
  });

  describe('Filter Functionality', () => {
    test('Should filter cases by status', async () => {
      const searchParams = {
        status: CASE_STATUS.OPEN,
        page: 1,
        limit: 10
      };

      const results = await CaseSearchService.searchCases(searchParams, advocateUser);

      expect(results.cases.length).toBeGreaterThan(0);
      results.cases.forEach(caseItem => {
        expect(caseItem.status).toBe(CASE_STATUS.OPEN);
      });
    });

    test('Should filter cases by case type', async () => {
      const searchParams = {
        caseType: CASE_TYPE.CORPORATE,
        page: 1,
        limit: 10
      };

      const results = await CaseSearchService.searchCases(searchParams, advocateUser);

      expect(results.cases.length).toBeGreaterThan(0);
      results.cases.forEach(caseItem => {
        expect(caseItem.caseType).toBe(CASE_TYPE.CORPORATE);
      });
    });

    test('Should filter cases by priority', async () => {
      const searchParams = {
        priority: CASE_PRIORITY.HIGH,
        page: 1,
        limit: 10
      };

      const results = await CaseSearchService.searchCases(searchParams, advocateUser);

      expect(results.cases.length).toBeGreaterThan(0);
      results.cases.forEach(caseItem => {
        expect(caseItem.priority).toBe(CASE_PRIORITY.HIGH);
      });
    });

    test('Should filter cases by multiple criteria', async () => {
      const searchParams = {
        caseType: CASE_TYPE.EMPLOYMENT,
        status: CASE_STATUS.IN_REVIEW,
        priority: CASE_PRIORITY.MEDIUM,
        page: 1,
        limit: 10
      };

      const results = await CaseSearchService.searchCases(searchParams, advocateUser);

      expect(results.cases.length).toBeGreaterThan(0);
      results.cases.forEach(caseItem => {
        expect(caseItem.caseType).toBe(CASE_TYPE.EMPLOYMENT);
        expect(caseItem.status).toBe(CASE_STATUS.IN_REVIEW);
        expect(caseItem.priority).toBe(CASE_PRIORITY.MEDIUM);
      });
    });

    test('Should filter cases by tags', async () => {
      const searchParams = {
        tags: 'corporate,merger',
        page: 1,
        limit: 10
      };

      const results = await CaseSearchService.searchCases(searchParams, advocateUser);

      expect(results.cases.length).toBeGreaterThan(0);
      results.cases.forEach(caseItem => {
        expect(caseItem.tags.some(tag => ['corporate', 'merger'].includes(tag))).toBe(true);
      });
    });

    test('Should filter cases by court name', async () => {
      const searchParams = {
        courtName: 'Supreme',
        page: 1,
        limit: 10
      };

      const results = await CaseSearchService.searchCases(searchParams, advocateUser);

      expect(results.cases.length).toBeGreaterThan(0);
      results.cases.forEach(caseItem => {
        expect(caseItem.courtDetails.courtName).toContain('Supreme');
      });
    });
  });

  describe('Date Range Filtering', () => {
    test('Should filter cases by date range', async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const searchParams = {
        dateFrom: yesterday.toISOString(),
        dateTo: tomorrow.toISOString(),
        page: 1,
        limit: 10
      };

      const results = await CaseSearchService.searchCases(searchParams, advocateUser);

      expect(results.cases.length).toBeGreaterThan(0);
      results.cases.forEach(caseItem => {
        const caseDate = new Date(caseItem.dateCreated);
        expect(caseDate).toBeInstanceOf(Date);
        expect(caseDate.getTime()).toBeGreaterThanOrEqual(yesterday.getTime());
        expect(caseDate.getTime()).toBeLessThanOrEqual(tomorrow.getTime());
      });
    });
  });

  describe('Sorting Functionality', () => {
    test('Should sort cases by creation date descending', async () => {
      const searchParams = {
        sortBy: 'dateCreated',
        sortOrder: 'desc',
        page: 1,
        limit: 10
      };

      const results = await CaseSearchService.searchCases(searchParams, advocateUser);

      expect(results.cases.length).toBeGreaterThan(1);
      
      for (let i = 1; i < results.cases.length; i++) {
        const prevDate = new Date(results.cases[i - 1].dateCreated);
        const currDate = new Date(results.cases[i].dateCreated);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });

    test('Should sort cases by title ascending', async () => {
      const searchParams = {
        sortBy: 'title',
        sortOrder: 'asc',
        page: 1,
        limit: 10
      };

      const results = await CaseSearchService.searchCases(searchParams, advocateUser);

      expect(results.cases.length).toBeGreaterThan(1);
      
      for (let i = 1; i < results.cases.length; i++) {
        expect(results.cases[i - 1].title.localeCompare(results.cases[i].title)).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('Pagination', () => {
    test('Should paginate search results correctly', async () => {
      const searchParams = {
        page: 1,
        limit: 2
      };

      const results = await CaseSearchService.searchCases(searchParams, advocateUser);

      expect(results.pagination.page).toBe(1);
      expect(results.pagination.limit).toBe(2);
      expect(results.cases.length).toBeLessThanOrEqual(2);
      expect(results.pagination.total).toBeGreaterThanOrEqual(results.cases.length);
    });

    test('Should handle page beyond available results', async () => {
      const searchParams = {
        page: 999,
        limit: 10
      };

      const results = await CaseSearchService.searchCases(searchParams, advocateUser);

      expect(results.cases.length).toBe(0);
      expect(results.pagination.page).toBe(999);
    });
  });

  describe('User Access Control', () => {
    test('Should return only accessible cases for advocate', async () => {
      const searchParams = {
        page: 1,
        limit: 10
      };

      const results = await CaseSearchService.searchCases(searchParams, advocateUser);

      results.cases.forEach(caseItem => {
        expect(
          caseItem.advocate.primary.toString() === advocateUser._id.toString() ||
          (caseItem.advocate.secondary && caseItem.advocate.secondary.includes(advocateUser._id))
        ).toBe(true);
      });
    });

    test('Should return only accessible cases for client', async () => {
      const searchParams = {
        page: 1,
        limit: 10
      };

      const results = await CaseSearchService.searchCases(searchParams, clientUser);

      results.cases.forEach(caseItem => {
        expect(
          caseItem.client.primary.toString() === clientUser._id.toString() ||
          (caseItem.client.additional && caseItem.client.additional.includes(clientUser._id))
        ).toBe(true);
      });
    });

    test('Should return all cases for admin', async () => {
      const searchParams = {
        page: 1,
        limit: 10
      };

      const results = await CaseSearchService.searchCases(searchParams, adminUser);

      expect(results.cases.length).toBeGreaterThan(0);
      // Admin should see all cases, so we just verify we get results
    });
  });

  describe('Search Statistics', () => {
    test('Should return search statistics', async () => {
      const searchParams = {
        page: 1,
        limit: 10
      };

      const results = await CaseSearchService.searchCases(searchParams, advocateUser);

      expect(results.statistics).toBeDefined();
      expect(results.statistics.byStatus).toBeInstanceOf(Array);
      expect(results.statistics.byPriority).toBeInstanceOf(Array);
      expect(results.statistics.byType).toBeInstanceOf(Array);
    });
  });

  describe('Applied Filters Summary', () => {
    test('Should return applied filters summary', async () => {
      const searchParams = {
        query: 'test',
        status: CASE_STATUS.OPEN,
        caseType: CASE_TYPE.CORPORATE,
        priority: CASE_PRIORITY.HIGH,
        page: 1,
        limit: 10
      };

      const results = await CaseSearchService.searchCases(searchParams, advocateUser);

      expect(results.appliedFilters).toBeDefined();
      expect(results.appliedFilters.textSearch).toBe('test');
      expect(results.appliedFilters.status).toBe(CASE_STATUS.OPEN);
      expect(results.appliedFilters.caseType).toBe(CASE_TYPE.CORPORATE);
      expect(results.appliedFilters.priority).toBe(CASE_PRIORITY.HIGH);
    });
  });

  describe('Document Search', () => {
    test('Should search case documents', async () => {
      const caseId = testCases[0]._id;
      
      // Create a test document
      await CaseDocument.create({
        caseId: caseId,
        fileName: 'test-doc.pdf',
        originalName: 'Test Document.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        filePath: '/test/path',
        fileUrl: '/test/url',
        documentType: 'pleading',
        description: 'Test document for search',
        uploadedBy: advocateUser._id,
        fileHash: 'testhash123'
      });

      const documents = await CaseSearchService.searchCaseDocuments(caseId, 'Test Document', advocateUser);

      expect(documents.length).toBeGreaterThan(0);
      expect(documents[0].originalName).toContain('Test Document');
    });

    test('Should deny document search for unauthorized user', async () => {
      const caseId = testCases[0]._id;
      const unauthorizedUser = await User.create({
        firstName: 'Unauthorized',
        lastName: 'User',
        email: 'unauthorized@test.com',
        password: 'Password123!',
        role: USER_ROLES.ADVOCATE,
        isVerified: true,
        isActive: true
      });

      await expect(
        CaseSearchService.searchCaseDocuments(caseId, 'test', unauthorizedUser)
      ).rejects.toThrow('Access denied to case');
    });
  });

  describe('Note Search', () => {
    test('Should search case notes', async () => {
      const caseId = testCases[0]._id;
      
      // Create a test note
      await CaseNote.create({
        caseId: caseId,
        title: 'Test Note',
        content: 'This is a test note for searching',
        noteType: 'general',
        createdBy: advocateUser._id
      });

      const notes = await CaseSearchService.searchCaseNotes(caseId, 'test note', advocateUser);

      expect(notes.length).toBeGreaterThan(0);
      expect(notes[0].title).toContain('Test Note');
    });
  });

  describe('Search Suggestions', () => {
    test('Should return search suggestions', async () => {
      const suggestions = await CaseSearchService.getSearchSuggestions('Corp', advocateUser);

      expect(suggestions.suggestions).toBeDefined();
      expect(suggestions.suggestions.cases).toBeInstanceOf(Array);
      expect(suggestions.suggestions.clients).toBeInstanceOf(Array);
      expect(suggestions.suggestions.advocates).toBeInstanceOf(Array);
    });

    test('Should return empty suggestions for short query', async () => {
      const suggestions = await CaseSearchService.getSearchSuggestions('a', advocateUser);

      expect(suggestions.suggestions).toEqual([]);
    });
  });

  describe('Performance Tests', () => {
    test('Should perform search efficiently', async () => {
      const startTime = Date.now();

      const searchParams = {
        query: 'Corporate',
        status: CASE_STATUS.OPEN,
        page: 1,
        limit: 10
      };

      await CaseSearchService.searchCases(searchParams, advocateUser);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('Should handle complex search efficiently', async () => {
      const startTime = Date.now();

      const searchParams = {
        query: 'Corporate Merger Employment',
        status: [CASE_STATUS.OPEN, CASE_STATUS.IN_REVIEW],
        caseType: [CASE_TYPE.CORPORATE, CASE_TYPE.EMPLOYMENT],
        priority: [CASE_PRIORITY.HIGH, CASE_PRIORITY.MEDIUM],
        tags: 'corporate,employment',
        sortBy: 'lastActivity',
        sortOrder: 'desc',
        page: 1,
        limit: 20
      };

      await CaseSearchService.searchCases(searchParams, advocateUser);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });

  describe('Error Handling', () => {
    test('Should handle invalid search parameters gracefully', async () => {
      const searchParams = {
        status: 'invalid_status',
        caseType: 'invalid_type',
        page: 'invalid_page',
        limit: 'invalid_limit'
      };

      // Should not throw error, but handle gracefully
      const results = await CaseSearchService.searchCases(searchParams, advocateUser);
      expect(results).toBeDefined();
      expect(results.cases).toBeInstanceOf(Array);
    });

    test('Should handle database errors gracefully', async () => {
      // Mock a database error scenario
      const originalFind = Case.find;
      Case.find = jest.fn().mockRejectedValue(new Error('Database connection error'));

      await expect(
        CaseSearchService.searchCases({ query: 'test' }, advocateUser)
      ).rejects.toThrow('Database connection error');

      // Restore original method
      Case.find = originalFind;
    });
  });
});
