// Authentication middleware unit tests for LegalPro v1.0.1
const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../../../middleware/auth');
const User = require('../../../models/User');

// Mock response object
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mock next function
const mockNext = jest.fn();

describe('Authentication Middleware Tests', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await global.testUtils.createTestUser('advocate');
    jest.clearAllMocks();
  });

  describe('protect middleware', () => {
    test('should authenticate user with valid token', async () => {
      const token = global.testUtils.generateTestToken(testUser._id);
      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = mockResponse();

      await protect(req, res, mockNext);

      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(testUser._id.toString());
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject request without authorization header', async () => {
      const req = { headers: {} };
      const res = mockResponse();

      await protect(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. No token provided.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request with malformed authorization header', async () => {
      const req = {
        headers: {
          authorization: 'InvalidFormat'
        }
      };
      const res = mockResponse();

      await protect(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Invalid token format.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request with invalid token', async () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      };
      const res = mockResponse();

      await protect(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Invalid token.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request with expired token', async () => {
      const expiredToken = jwt.sign(
        { id: testUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );
      
      const req = {
        headers: {
          authorization: `Bearer ${expiredToken}`
        }
      };
      const res = mockResponse();

      await protect(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Invalid token.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request for non-existent user', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const token = global.testUtils.generateTestToken(nonExistentUserId);
      
      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = mockResponse();

      await protect(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. User not found.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request for inactive user', async () => {
      // Deactivate the user
      await User.findByIdAndUpdate(testUser._id, { isActive: false });
      
      const token = global.testUtils.generateTestToken(testUser._id);
      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = mockResponse();

      await protect(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Account is inactive.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request for unverified user', async () => {
      // Mark user as unverified
      await User.findByIdAndUpdate(testUser._id, { isVerified: false });
      
      const token = global.testUtils.generateTestToken(testUser._id);
      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = mockResponse();

      await protect(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Account not verified.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    test('should allow access for authorized role', async () => {
      const req = { user: testUser };
      const res = mockResponse();
      const authorizeMiddleware = authorize('advocate');

      authorizeMiddleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow access for multiple authorized roles', async () => {
      const req = { user: testUser };
      const res = mockResponse();
      const authorizeMiddleware = authorize('admin', 'advocate');

      authorizeMiddleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should deny access for unauthorized role', async () => {
      const clientUser = await global.testUtils.createTestUser('client');
      const req = { user: clientUser };
      const res = mockResponse();
      const authorizeMiddleware = authorize('advocate');

      authorizeMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should deny access when user is not set', async () => {
      const req = {};
      const res = mockResponse();
      const authorizeMiddleware = authorize('advocate');

      authorizeMiddleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle admin permissions correctly', async () => {
      const adminUser = await global.testUtils.createTestUser('admin', {
        permissions: {
          canManageCases: true,
          canUploadFiles: true,
          canOpenFiles: true,
          canDeleteFiles: false,
          canViewAllCases: true
        }
      });

      const req = { user: adminUser };
      const res = mockResponse();
      const authorizeMiddleware = authorize('admin');

      authorizeMiddleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should handle case-insensitive role checking', async () => {
      const req = { user: testUser };
      const res = mockResponse();
      const authorizeMiddleware = authorize('ADVOCATE');

      authorizeMiddleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Combined auth flow', () => {
    test('should work with protect and authorize together', async () => {
      const token = global.testUtils.generateTestToken(testUser._id);
      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = mockResponse();
      const authorizeMiddleware = authorize('advocate');

      // First apply protect middleware
      await protect(req, res, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(req.user).toBeDefined();

      // Reset mock
      mockNext.mockClear();

      // Then apply authorize middleware
      authorizeMiddleware(req, res, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should fail authorization if protection fails', async () => {
      const req = { headers: {} };
      const res = mockResponse();
      const authorizeMiddleware = authorize('advocate');

      // First apply protect middleware (should fail)
      await protect(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();

      // Reset mocks
      jest.clearAllMocks();

      // Authorization should also fail since user is not set
      authorizeMiddleware(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    test('should handle database errors gracefully', async () => {
      const token = global.testUtils.generateTestToken(testUser._id);
      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = mockResponse();

      // Mock User.findById to throw an error
      const originalFindById = User.findById;
      User.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      await protect(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error during authentication'
      });
      expect(mockNext).not.toHaveBeenCalled();

      // Restore original method
      User.findById = originalFindById;
    });

    test('should handle JWT verification errors', async () => {
      const req = {
        headers: {
          authorization: 'Bearer malformed.jwt.token'
        }
      };
      const res = mockResponse();

      await protect(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Invalid token.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
