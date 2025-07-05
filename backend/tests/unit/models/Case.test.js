// Case model unit tests for LegalPro v1.0.1
const mongoose = require('mongoose');
const Case = require('../../../models/Case');
const User = require('../../../models/User');

describe('Case Model Unit Tests', () => {
  let clientUser, advocateUser;

  beforeEach(async () => {
    // Create test users
    clientUser = await global.testUtils.createTestUser('client');
    advocateUser = await global.testUtils.createTestUser('advocate');
  });

  describe('Case Creation', () => {
    test('should create a case with valid data', async () => {
      const caseData = {
        title: 'Test Case',
        description: 'Test case description',
        category: 'Family Law',
        priority: 'medium',
        clientId: clientUser._id,
        assignedTo: advocateUser._id
      };

      const case_item = await Case.create(caseData);

      expect(case_item).toBeDefined();
      expect(case_item.title).toBe(caseData.title);
      expect(case_item.caseNumber).toMatch(/^CASE-\d{4}-\d{4}$/);
      expect(case_item.status).toBe('pending');
      expect(case_item.isArchived).toBe(false);
    });

    test('should auto-generate case number', async () => {
      const case1 = await Case.create({
        title: 'Case 1',
        description: 'Description 1',
        category: 'Family Law',
        clientId: clientUser._id
      });

      const case2 = await Case.create({
        title: 'Case 2',
        description: 'Description 2',
        category: 'Corporate Law',
        clientId: clientUser._id
      });

      expect(case1.caseNumber).toMatch(/^CASE-\d{4}-\d{4}$/);
      expect(case2.caseNumber).toMatch(/^CASE-\d{4}-\d{4}$/);
      expect(case1.caseNumber).not.toBe(case2.caseNumber);
    });

    test('should fail with missing required fields', async () => {
      const invalidCaseData = {
        description: 'Missing title and other required fields'
      };

      await expect(Case.create(invalidCaseData)).rejects.toThrow();
    });

    test('should fail with invalid category', async () => {
      const invalidCaseData = {
        title: 'Test Case',
        description: 'Test description',
        category: 'Invalid Category',
        clientId: clientUser._id
      };

      await expect(Case.create(invalidCaseData)).rejects.toThrow();
    });

    test('should fail with invalid priority', async () => {
      const invalidCaseData = {
        title: 'Test Case',
        description: 'Test description',
        category: 'Family Law',
        priority: 'invalid',
        clientId: clientUser._id
      };

      await expect(Case.create(invalidCaseData)).rejects.toThrow();
    });

    test('should fail with title exceeding max length', async () => {
      const longTitle = 'a'.repeat(201);
      const invalidCaseData = {
        title: longTitle,
        description: 'Test description',
        category: 'Family Law',
        clientId: clientUser._id
      };

      await expect(Case.create(invalidCaseData)).rejects.toThrow();
    });

    test('should fail with description exceeding max length', async () => {
      const longDescription = 'a'.repeat(5001);
      const invalidCaseData = {
        title: 'Test Case',
        description: longDescription,
        category: 'Family Law',
        clientId: clientUser._id
      };

      await expect(Case.create(invalidCaseData)).rejects.toThrow();
    });
  });

  describe('Case Methods', () => {
    let testCase;

    beforeEach(async () => {
      testCase = await Case.create({
        title: 'Test Case',
        description: 'Test description',
        category: 'Family Law',
        priority: 'medium',
        clientId: clientUser._id,
        assignedTo: advocateUser._id
      });
    });

    test('should add timeline event', async () => {
      await testCase.addTimelineEvent(
        'test_event',
        'Test event description',
        advocateUser._id,
        { testData: 'value' }
      );

      const updatedCase = await Case.findById(testCase._id);
      expect(updatedCase.timeline).toHaveLength(2); // Including case_created event
      
      const newEvent = updatedCase.timeline[1];
      expect(newEvent.event).toBe('test_event');
      expect(newEvent.description).toBe('Test event description');
      expect(newEvent.user.toString()).toBe(advocateUser._id.toString());
      expect(newEvent.metadata.testData).toBe('value');
    });

    test('should update status with timeline event', async () => {
      await testCase.updateStatus('in_progress', advocateUser._id, 'Starting work');

      const updatedCase = await Case.findById(testCase._id);
      expect(updatedCase.status).toBe('in_progress');
      expect(updatedCase.timeline).toHaveLength(2);
      
      const statusEvent = updatedCase.timeline[1];
      expect(statusEvent.event).toBe('status_changed');
      expect(statusEvent.metadata.newStatus).toBe('in_progress');
      expect(statusEvent.metadata.oldStatus).toBe('pending');
    });

    test('should add document with validation', async () => {
      const documentData = {
        name: 'Test Document',
        originalName: 'test.pdf',
        type: 'application/pdf',
        size: 1024,
        url: 'https://test.com/test.pdf',
        publicId: 'test-public-id',
        uploadedBy: advocateUser._id
      };

      await testCase.addDocument(documentData, advocateUser._id);

      const updatedCase = await Case.findById(testCase._id);
      expect(updatedCase.documents).toHaveLength(1);
      expect(updatedCase.documents[0].name).toBe('Test Document');
      expect(updatedCase.timeline).toHaveLength(2);
    });

    test('should fail to add document when limit exceeded', async () => {
      // Add 50 documents (the limit)
      for (let i = 0; i < 50; i++) {
        const documentData = {
          name: `Document ${i}`,
          originalName: `doc${i}.pdf`,
          type: 'application/pdf',
          size: 1024,
          url: `https://test.com/doc${i}.pdf`,
          publicId: `test-public-id-${i}`,
          uploadedBy: advocateUser._id
        };
        testCase.documents.push(documentData);
      }
      await testCase.save();

      // Try to add 51st document
      const documentData = {
        name: 'Document 51',
        originalName: 'doc51.pdf',
        type: 'application/pdf',
        size: 1024,
        url: 'https://test.com/doc51.pdf',
        publicId: 'test-public-id-51',
        uploadedBy: advocateUser._id
      };

      await expect(testCase.addDocument(documentData, advocateUser._id))
        .rejects.toThrow('Maximum 50 documents allowed per case');
    });

    test('should fail to add document when size limit exceeded', async () => {
      const largeDocumentData = {
        name: 'Large Document',
        originalName: 'large.pdf',
        type: 'application/pdf',
        size: 524288001, // Exceeds 500MB limit
        url: 'https://test.com/large.pdf',
        publicId: 'test-large-public-id',
        uploadedBy: advocateUser._id
      };

      await expect(testCase.addDocument(largeDocumentData, advocateUser._id))
        .rejects.toThrow('Total document size would exceed 500MB limit');
    });

    test('should remove document', async () => {
      // Add a document first
      const documentData = {
        name: 'Test Document',
        originalName: 'test.pdf',
        type: 'application/pdf',
        size: 1024,
        url: 'https://test.com/test.pdf',
        publicId: 'test-public-id',
        uploadedBy: advocateUser._id
      };

      await testCase.addDocument(documentData, advocateUser._id);
      const documentId = testCase.documents[0]._id;

      await testCase.removeDocument(documentId, advocateUser._id);

      const updatedCase = await Case.findById(testCase._id);
      expect(updatedCase.documents).toHaveLength(0);
      expect(updatedCase.timeline).toHaveLength(3); // case_created, document_uploaded, document_removed
    });

    test('should get document statistics', () => {
      // Add some test documents
      testCase.documents.push({
        name: 'Doc 1',
        originalName: 'doc1.pdf',
        type: 'application/pdf',
        size: 1024,
        url: 'https://test.com/doc1.pdf',
        publicId: 'test-1',
        uploadedBy: advocateUser._id
      });

      testCase.documents.push({
        name: 'Doc 2',
        originalName: 'doc2.jpg',
        type: 'image/jpeg',
        size: 2048,
        url: 'https://test.com/doc2.jpg',
        publicId: 'test-2',
        uploadedBy: advocateUser._id
      });

      const stats = testCase.getDocumentStats();

      expect(stats.totalDocuments).toBe(2);
      expect(stats.totalSize).toBe(3072);
      expect(stats.remainingSlots).toBe(48);
      expect(stats.remainingSize).toBe(524284928);
      expect(stats.typeBreakdown.pdf).toBe(1);
      expect(stats.typeBreakdown.jpeg).toBe(1);
    });
  });

  describe('Case Validation', () => {
    test('should validate court date is not in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const invalidCaseData = {
        title: 'Test Case',
        description: 'Test description',
        category: 'Family Law',
        clientId: clientUser._id,
        courtDate: pastDate
      };

      await expect(Case.create(invalidCaseData)).rejects.toThrow();
    });

    test('should allow future court date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const validCaseData = {
        title: 'Test Case',
        description: 'Test description',
        category: 'Family Law',
        clientId: clientUser._id,
        courtDate: futureDate
      };

      const case_item = await Case.create(validCaseData);
      expect(case_item.courtDate).toEqual(futureDate);
    });

    test('should validate document limits before saving', async () => {
      const testCase = new Case({
        title: 'Test Case',
        description: 'Test description',
        category: 'Family Law',
        clientId: clientUser._id
      });

      // Add 51 documents (exceeds limit)
      for (let i = 0; i < 51; i++) {
        testCase.documents.push({
          name: `Document ${i}`,
          originalName: `doc${i}.pdf`,
          type: 'application/pdf',
          size: 1024,
          url: `https://test.com/doc${i}.pdf`,
          publicId: `test-${i}`,
          uploadedBy: advocateUser._id
        });
      }

      await expect(testCase.save()).rejects.toThrow('Maximum 50 documents allowed per case');
    });

    test('should validate total document size before saving', async () => {
      const testCase = new Case({
        title: 'Test Case',
        description: 'Test description',
        category: 'Family Law',
        clientId: clientUser._id
      });

      // Add documents exceeding total size limit
      testCase.documents.push({
        name: 'Large Document',
        originalName: 'large.pdf',
        type: 'application/pdf',
        size: 524288001, // Exceeds 500MB limit
        url: 'https://test.com/large.pdf',
        publicId: 'test-large',
        uploadedBy: advocateUser._id
      });

      await expect(testCase.save()).rejects.toThrow('Total document size cannot exceed 500MB');
    });
  });

  describe('Case Indexes', () => {
    test('should have unique case number index', async () => {
      const case1 = await Case.create({
        title: 'Case 1',
        description: 'Description 1',
        category: 'Family Law',
        clientId: clientUser._id
      });

      // Try to create another case with the same case number
      const case2 = new Case({
        title: 'Case 2',
        description: 'Description 2',
        category: 'Corporate Law',
        clientId: clientUser._id,
        caseNumber: case1.caseNumber
      });

      await expect(case2.save()).rejects.toThrow();
    });
  });
});
