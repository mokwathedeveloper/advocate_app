// Enhanced Authentication Routes - LegalPro v1.0.1
// JWT-based authentication with RBAC support

const express = require('express');
const router = express.Router();

// Import controllers
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyAdvocate,
  enhancedLogin,
  refreshAccessToken,
  logout,
  logoutAll,
  getUserPermissions
} = require('../controllers/authController');

// Import middleware
const { 
  authenticate, 
  protect, 
  authorize, 
  requireRole, 
  requireMinimumRole,
  requireOwnershipOrAdmin 
} = require('../middleware/auth');

const { 
  validateRegistration, 
  validateLogin, 
  validatePasswordUpdate, 
  validateRefreshToken,
  validateUserId 
} = require('../middleware/validation');

const { RESOURCE_PERMISSIONS, USER_ROLES } = require('../config/auth');

// Public routes (no authentication required)

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateRegistration, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user (legacy endpoint)
 * @access  Public
 */
router.post('/login', validateLogin, login);

/**
 * @route   POST /api/auth/enhanced-login
 * @desc    Enhanced login with account lockout and session management
 * @access  Public
 */
router.post('/enhanced-login', validateLogin, enhancedLogin);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh-token', validateRefreshToken, refreshAccessToken);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   PUT /api/auth/reset-password/:resettoken
 * @desc    Reset password using reset token
 * @access  Public
 */
router.put('/reset-password/:resettoken', resetPassword);

// Protected routes (authentication required)

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, getMe);

/**
 * @route   PUT /api/auth/update-details
 * @desc    Update user profile details
 * @access  Private
 */
router.put('/update-details', authenticate, updateDetails);

/**
 * @route   PUT /api/auth/update-password
 * @desc    Update user password
 * @access  Private
 */
router.put('/update-password', authenticate, validatePasswordUpdate, updatePassword);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout from current device
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post('/logout-all', authenticate, logoutAll);

/**
 * @route   GET /api/auth/permissions
 * @desc    Get current user's permissions
 * @access  Private
 */
router.get('/permissions', authenticate, getUserPermissions);

// Admin routes (role-based access)

/**
 * @route   POST /api/auth/verify-advocate/:id
 * @desc    Verify advocate account (Admin only)
 * @access  Private/Admin
 */
router.post(
  '/verify-advocate/:id', 
  authenticate, 
  requireMinimumRole(USER_ROLES.ADMIN),
  validateUserId,
  verifyAdvocate
);

/**
 * @route   GET /api/auth/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 */
router.get(
  '/users', 
  authenticate, 
  authorize([RESOURCE_PERMISSIONS.USERS.READ]),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, role, isActive, search } = req.query;
      
      // Build query
      let query = {};
      
      if (role) query.role = role;
      if (isActive !== undefined) query.isActive = isActive === 'true';
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const User = require('../models/User');
      
      const users = await User.find(query)
        .select('-password -refreshTokens')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            current: page,
            pages: Math.ceil(total / limit),
            total
          }
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: 'FETCH_USERS_ERROR'
      });
    }
  }
);

/**
 * @route   GET /api/auth/users/:id
 * @desc    Get user by ID
 * @access  Private (Own profile or Admin)
 */
router.get(
  '/users/:id', 
  authenticate, 
  validateUserId,
  requireOwnershipOrAdmin(),
  async (req, res) => {
    try {
      const User = require('../models/User');
      const user = await User.findById(req.params.id).select('-password -refreshTokens');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user',
        error: 'FETCH_USER_ERROR'
      });
    }
  }
);

/**
 * @route   PUT /api/auth/users/:id/role
 * @desc    Update user role (Super Admin only)
 * @access  Private/Super Admin
 */
router.put(
  '/users/:id/role', 
  authenticate, 
  requireRole(USER_ROLES.SUPER_ADMIN),
  validateUserId,
  async (req, res) => {
    try {
      const { role, reason } = req.body;
      
      if (!Object.values(USER_ROLES).includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified',
          error: 'INVALID_ROLE'
        });
      }

      const User = require('../models/User');
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        });
      }

      const oldRole = user.role;
      user.role = role;
      await user.save();

      // Log role change
      console.log(`Role changed for user ${user.email}: ${oldRole} -> ${role} by ${req.user.email}. Reason: ${reason || 'Not provided'}`);

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            oldRole,
            newRole: role
          }
        }
      });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user role',
        error: 'UPDATE_ROLE_ERROR'
      });
    }
  }
);

/**
 * @route   PUT /api/auth/users/:id/status
 * @desc    Update user account status (Admin only)
 * @access  Private/Admin
 */
router.put(
  '/users/:id/status', 
  authenticate, 
  requireMinimumRole(USER_ROLES.ADMIN),
  validateUserId,
  async (req, res) => {
    try {
      const { isActive, reason } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isActive must be a boolean',
          error: 'INVALID_STATUS'
        });
      }

      const User = require('../models/User');
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        });
      }

      // Prevent deactivating super admin accounts
      if (user.role === USER_ROLES.SUPER_ADMIN && !isActive) {
        return res.status(403).json({
          success: false,
          message: 'Cannot deactivate super admin account',
          error: 'CANNOT_DEACTIVATE_SUPER_ADMIN'
        });
      }

      const oldStatus = user.isActive;
      user.isActive = isActive;
      await user.save();

      // Log status change
      console.log(`Account status changed for user ${user.email}: ${oldStatus} -> ${isActive} by ${req.user.email}. Reason: ${reason || 'Not provided'}`);

      res.json({
        success: true,
        message: 'User account status updated successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            oldStatus,
            newStatus: isActive
          }
        }
      });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user status',
        error: 'UPDATE_STATUS_ERROR'
      });
    }
  }
);

module.exports = router;
