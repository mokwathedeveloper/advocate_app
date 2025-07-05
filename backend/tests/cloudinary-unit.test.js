// Simple Cloudinary unit tests for LegalPro v1.0.1 (without database dependencies)
const cloudinaryService = require('../utils/cloudinaryService');

// Mock Cloudinary for testing
jest.mock('../config/cloudinary', () => ({
  uploader: {
    upload: jest.fn(),
    upload_stream: jest.fn(),
    destroy: jest.fn()
  },
  api: {
    resource: jest.fn(),
    delete_resources: jest.fn(),
    usage: jest.fn()
  },
  search: {
    execute: jest.fn()
  },
  utils: {
    private_download_url: jest.fn(),
    url: jest.fn()
  }
}));

describe('Cloudinary Service Unit Tests (No DB)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('File Validation', () => {
    test('should validate file size correctly', () => {
      const validFile = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024 * 1024 // 1MB
      };

      const validation = cloudinaryService.validateFile(validFile);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject oversized files', () => {
      const largeFile = {
        originalname: 'large.pdf',
        mimetype: 'application/pdf',
        size: 100 * 1024 * 1024 // 100MB
      };

      const validation = cloudinaryService.validateFile(largeFile);
      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain('File size exceeds');
    });

    test('should reject invalid file types', () => {
      const invalidFile = {
        originalname: 'virus.exe',
        mimetype: 'application/x-msdownload',
        size: 1024
      };

      const validation = cloudinaryService.validateFile(invalidFile);
      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain('File type .exe is not allowed');
    });

    test('should reject files with long names', () => {
      const longNameFile = {
        originalname: 'a'.repeat(300) + '.pdf',
        mimetype: 'application/pdf',
        size: 1024
      };

      const validation = cloudinaryService.validateFile(longNameFile);
      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain('Invalid filename or filename too long');
    });
  });

  describe('Folder Path Generation', () => {
    test('should generate correct folder path for case files', () => {
      const context = { caseId: '507f1f77bcf86cd799439011', type: 'documents' };
      const folderPath = cloudinaryService.generateFolderPath(context);

      expect(folderPath).toBe('legalpro-test/cases/507f1f77bcf86cd799439011/documents');
    });

    test('should generate correct folder path for user files', () => {
      const context = { userId: '507f1f77bcf86cd799439012', type: 'profile' };
      const folderPath = cloudinaryService.generateFolderPath(context);

      expect(folderPath).toBe('legalpro-test/users/507f1f77bcf86cd799439012/profile');
    });

    test('should generate default folder path', () => {
      const context = { type: 'templates' };
      const folderPath = cloudinaryService.generateFolderPath(context);

      expect(folderPath).toBe('legalpro-test/shared/templates');
    });

    test('should handle missing context gracefully', () => {
      const folderPath = cloudinaryService.generateFolderPath({});
      expect(folderPath).toBe('legalpro-test/shared/general');
    });
  });

  describe('File Type Parsing', () => {
    test('should parse allowed file types correctly', () => {
      const allowedTypes = cloudinaryService.allowedTypes;

      // Check document types
      expect(allowedTypes).toContain('pdf');
      expect(allowedTypes).toContain('doc');
      expect(allowedTypes).toContain('docx');

      // Check image types
      expect(allowedTypes).toContain('jpg');
      expect(allowedTypes).toContain('jpeg');
      expect(allowedTypes).toContain('png');

      // Note: Media types may not be included in current configuration
      // This is based on the environment variable ALLOWED_FILE_TYPES

      // Should not contain dangerous types
      expect(allowedTypes).not.toContain('exe');
      expect(allowedTypes).not.toContain('bat');
      expect(allowedTypes).not.toContain('scr');
    });
  });

  describe('Configuration Validation', () => {
    test('should have correct folder prefix from environment', () => {
      expect(cloudinaryService.folderPrefix).toBe('legalpro-test');
    });

    test('should have correct max file size from environment', () => {
      expect(cloudinaryService.maxFileSize).toBe(52428800); // 50MB
    });
  });

  describe('Utility Functions', () => {
    test('should have service methods available', () => {
      expect(cloudinaryService.validateFile).toBeDefined();
      expect(cloudinaryService.generateFolderPath).toBeDefined();
      expect(cloudinaryService.uploadFile).toBeDefined();
    });

    test('should generate unique folder paths', () => {
      const context1 = { caseId: 'case1', type: 'documents' };
      const context2 = { caseId: 'case2', type: 'documents' };

      const path1 = cloudinaryService.generateFolderPath(context1);
      const path2 = cloudinaryService.generateFolderPath(context2);

      expect(path1).not.toBe(path2);
      expect(path1).toContain('case1');
      expect(path2).toContain('case2');
    });
  });
});
