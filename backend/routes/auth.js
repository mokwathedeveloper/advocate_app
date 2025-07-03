// Authentication routes for LegalPro v1.0.1
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  validateContentType,
  validateRegistration,
  validateLogin,
  validatePasswordUpdate,
  validateForgotPassword,
  validateResetPassword
} = require('../middleware/validation');
const authController = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register',
  validateContentType,
  validateRegistration,
  authController.register
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login',
  validateContentType,
  validateLogin,
  authController.login
);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, authController.getMe);

// @route   PUT /api/auth/updatedetails
// @desc    Update user details
// @access  Private
router.put('/updatedetails', protect, authController.updateDetails);

// @route   PUT /api/auth/updatepassword
// @desc    Update password
// @access  Private
router.put('/updatepassword',
  protect,
  validateContentType,
  validatePasswordUpdate,
  authController.updatePassword
);

// @route   POST /api/auth/forgotpassword
// @desc    Forgot password
// @access  Public
router.post('/forgotpassword',
  validateContentType,
  validateForgotPassword,
  authController.forgotPassword
);

// @route   PUT /api/auth/resetpassword/:resettoken
// @desc    Reset password
// @access  Public
router.put('/resetpassword/:resettoken',
  validateContentType,
  validateResetPassword,
  authController.resetPassword
);

// @route   POST /api/auth/verify-advocate
// @desc    Verify advocate account (temporary fix)
// @access  Public (with super key)
router.post('/verify-advocate', authController.verifyAdvocate);

module.exports = router;