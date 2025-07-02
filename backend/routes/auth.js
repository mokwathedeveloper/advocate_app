// Enhanced Authentication routes for LegalPro v1.0.1
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

module.exports = router;