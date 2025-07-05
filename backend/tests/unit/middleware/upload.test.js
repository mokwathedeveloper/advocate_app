// Upload middleware unit tests for LegalPro v1.0.1
const multer = require('multer');
const { upload, validateFileSize, handleUploadError, cleanupTempFile } = require('../../../middleware/upload');
const fs = require('fs');
const path = require('path');

// Mock response object
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mock next function
const mockNext = jest.fn();

describe('Upload Middleware Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    global.testUtils.cleanupUploads();
  });

  describe('File validation', () => {
    test('should accept valid file types', () => {
      const validFiles = [
        { originalname: 'test.pdf', mimetype: 'application/pdf' },
        { originalname: 'test.doc', mimetype: 'application/msword' },
        { originalname: 'test.docx', mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
        { originalname: 'test.jpg', mimetype: 'image/jpeg' },
        { originalname: 'test.png', mimetype: 'image/png' },
        { originalname: 'test.txt', mimetype: 'text/plain' }
      ];

      validFiles.forEach(file => {
        const cb = jest.fn();
        upload.options.fileFilter(null, file, cb);
        expect(cb).toHaveBeenCalledWith(null, true);
      });
    });

    test('should reject invalid file types', () => {
      const invalidFiles = [
        { originalname: 'test.exe', mimetype: 'application/x-executable' },
        { originalname: 'test.bat', mimetype: 'application/x-bat' },
        { originalname: 'test.js', mimetype: 'application/javascript' },
        { originalname: 'test.php', mimetype: 'application/x-php' }
      ];

      invalidFiles.forEach(file => {
        const cb = jest.fn();
        upload.options.fileFilter(null, file, cb);
        expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
        expect(cb.mock.calls[0][0].code).toBe('INVALID_FILE_TYPE');
      });
    });

    test('should reject dangerous file extensions', () => {
      const dangerousFiles = [
        { originalname: 'test.exe', mimetype: 'application/pdf' }, // Mimetype spoofing
        { originalname: 'document.bat', mimetype: 'text/plain' },
        { originalname: 'script.vbs', mimetype: 'text/plain' },
        { originalname: 'malware.scr', mimetype: 'application/pdf' }
      ];

      dangerousFiles.forEach(file => {
        const cb = jest.fn();
        upload.options.fileFilter(null, file, cb);
        expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
        expect(cb.mock.calls[0][0].code).toBe('DANGEROUS_FILE_TYPE');
      });
    });

    test('should reject files with invalid filenames', () => {
      const invalidFiles = [
        { originalname: '', mimetype: 'application/pdf' },
        { originalname: 'a'.repeat(256), mimetype: 'application/pdf' },
        { originalname: null, mimetype: 'application/pdf' }
      ];

      invalidFiles.forEach(file => {
        const cb = jest.fn();
        upload.options.fileFilter(null, file, cb);
        expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
        expect(cb.mock.calls[0][0].code).toBe('INVALID_FILENAME');
      });
    });
  });

  describe('validateFileSize middleware', () => {
    test('should pass for valid file size', () => {
      const req = {
        file: {
          size: 5 * 1024 * 1024, // 5MB
          path: '/tmp/test-file'
        }
      };
      const res = mockResponse();

      validateFileSize(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject oversized single file', () => {
      const testFilePath = path.join(__dirname, '../../../uploads/test-large-file.pdf');
      fs.writeFileSync(testFilePath, 'test content');

      const req = {
        file: {
          size: 15 * 1024 * 1024, // 15MB (exceeds 10MB limit)
          path: testFilePath
        }
      };
      const res = mockResponse();

      validateFileSize(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'File size too large. Maximum allowed size is 10MB',
        code: 'FILE_TOO_LARGE'
      });
      expect(mockNext).not.toHaveBeenCalled();
      
      // File should be cleaned up
      expect(fs.existsSync(testFilePath)).toBe(false);
    });

    test('should reject oversized files in multiple upload', () => {
      const testFile1 = path.join(__dirname, '../../../uploads/test-file-1.pdf');
      const testFile2 = path.join(__dirname, '../../../uploads/test-file-2.pdf');
      
      fs.writeFileSync(testFile1, 'test content 1');
      fs.writeFileSync(testFile2, 'test content 2');

      const req = {
        files: [
          {
            size: 5 * 1024 * 1024, // 5MB
            path: testFile1
          },
          {
            size: 15 * 1024 * 1024, // 15MB (exceeds limit)
            path: testFile2
          }
        ]
      };
      const res = mockResponse();

      validateFileSize(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'File size too large. Maximum allowed size is 10MB',
        code: 'FILE_TOO_LARGE'
      });
      expect(mockNext).not.toHaveBeenCalled();
      
      // Both files should be cleaned up
      expect(fs.existsSync(testFile1)).toBe(false);
      expect(fs.existsSync(testFile2)).toBe(false);
    });

    test('should pass when no files are uploaded', () => {
      const req = {};
      const res = mockResponse();

      validateFileSize(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('handleUploadError middleware', () => {
    test('should handle LIMIT_FILE_SIZE error', () => {
      const error = new multer.MulterError('LIMIT_FILE_SIZE');
      const req = {};
      const res = mockResponse();

      handleUploadError(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'File too large. Maximum size allowed is 10MB',
        code: 'FILE_TOO_LARGE'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle LIMIT_FILE_COUNT error', () => {
      const error = new multer.MulterError('LIMIT_FILE_COUNT');
      const req = {};
      const res = mockResponse();

      handleUploadError(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Too many files. Maximum 10 files allowed per upload',
        code: 'TOO_MANY_FILES'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle LIMIT_UNEXPECTED_FILE error', () => {
      const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
      const req = {};
      const res = mockResponse();

      handleUploadError(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unexpected file field',
        code: 'UNEXPECTED_FILE'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle custom file filter errors', () => {
      const error = new Error('Invalid file type');
      error.code = 'INVALID_FILE_TYPE';
      const req = {};
      const res = mockResponse();

      handleUploadError(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid file type',
        code: 'INVALID_FILE_TYPE'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should pass through non-upload errors', () => {
      const error = new Error('Some other error');
      const req = {};
      const res = mockResponse();

      handleUploadError(error, req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should cleanup files on multer errors', () => {
      const testFilePath = path.join(__dirname, '../../../uploads/test-cleanup-file.pdf');
      fs.writeFileSync(testFilePath, 'test content');

      const error = new multer.MulterError('LIMIT_FILE_SIZE');
      const req = {
        file: {
          path: testFilePath
        }
      };
      const res = mockResponse();

      handleUploadError(error, req, res, mockNext);

      expect(fs.existsSync(testFilePath)).toBe(false);
    });

    test('should cleanup multiple files on multer errors', () => {
      const testFile1 = path.join(__dirname, '../../../uploads/test-cleanup-1.pdf');
      const testFile2 = path.join(__dirname, '../../../uploads/test-cleanup-2.pdf');
      
      fs.writeFileSync(testFile1, 'test content 1');
      fs.writeFileSync(testFile2, 'test content 2');

      const error = new multer.MulterError('LIMIT_FILE_COUNT');
      const req = {
        files: [
          { path: testFile1 },
          { path: testFile2 }
        ]
      };
      const res = mockResponse();

      handleUploadError(error, req, res, mockNext);

      expect(fs.existsSync(testFile1)).toBe(false);
      expect(fs.existsSync(testFile2)).toBe(false);
    });
  });

  describe('cleanupTempFile utility', () => {
    test('should remove existing file', () => {
      const testFilePath = path.join(__dirname, '../../../uploads/test-cleanup.pdf');
      fs.writeFileSync(testFilePath, 'test content');
      
      expect(fs.existsSync(testFilePath)).toBe(true);
      
      cleanupTempFile(testFilePath);
      
      expect(fs.existsSync(testFilePath)).toBe(false);
    });

    test('should handle non-existent file gracefully', () => {
      const nonExistentPath = path.join(__dirname, '../../../uploads/non-existent.pdf');
      
      expect(() => cleanupTempFile(nonExistentPath)).not.toThrow();
    });

    test('should handle invalid path gracefully', () => {
      expect(() => cleanupTempFile(null)).not.toThrow();
      expect(() => cleanupTempFile(undefined)).not.toThrow();
      expect(() => cleanupTempFile('')).not.toThrow();
    });
  });

  describe('Storage configuration', () => {
    test('should generate unique filenames', () => {
      const filename1 = upload.options.storage.getFilename(null, { originalname: 'test.pdf' }, () => {});
      const filename2 = upload.options.storage.getFilename(null, { originalname: 'test.pdf' }, () => {});
      
      // Both should be different due to timestamp and random components
      expect(filename1).not.toBe(filename2);
    });

    test('should sanitize original filenames', () => {
      const cb = jest.fn();
      const file = { originalname: 'test file with spaces & symbols!.pdf' };
      
      upload.options.storage.getFilename(null, file, cb);
      
      expect(cb).toHaveBeenCalled();
      const generatedFilename = cb.mock.calls[0][1];
      expect(generatedFilename).toMatch(/\d+-\d+-test_file_with_spaces___symbols_\.pdf$/);
    });

    test('should use correct destination directory', () => {
      const cb = jest.fn();
      
      upload.options.storage.getDestination(null, null, cb);
      
      expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('uploads'));
    });
  });

  describe('Upload limits', () => {
    test('should have correct file size limit', () => {
      expect(upload.options.limits.fileSize).toBe(10 * 1024 * 1024); // 10MB
    });

    test('should have correct file count limit', () => {
      expect(upload.options.limits.files).toBe(10);
    });

    test('should have correct field size limits', () => {
      expect(upload.options.limits.fieldSize).toBe(1024 * 1024); // 1MB
      expect(upload.options.limits.fieldNameSize).toBe(100);
      expect(upload.options.limits.headerPairs).toBe(2000);
    });
  });
});
