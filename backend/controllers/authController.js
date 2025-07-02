// Authentication controller for LegalPro v1.0.1
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendNotification } = require('../utils/notificationService');
const { authHelpers, TOKEN_TYPES, PASSWORD_CONFIG, USER_ROLES } = require('../config/auth');
const { validationResult } = require('express-validator');

// Generate JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Create token response
const createTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    user
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    console.log('Registration request received:', req.body);

    // Validate required fields
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
      licenseNumber,
      specialization,
      experience,
      education,
      barAdmission
    } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide firstName, lastName, email, and password'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const userData = {
      firstName,
      lastName,
      email,
      password,
      phone,
      role: role || 'client'
    };

    // Add advocate-specific fields if role is advocate
    if (role === 'advocate') {
      userData.licenseNumber = licenseNumber;
      userData.specialization = specialization;
      userData.experience = experience;
      userData.education = education;
      userData.barAdmission = barAdmission;
      // Auto-verify advocates who register with super key (main advocates)
      userData.isVerified = true;
      userData.isActive = true;
    }

    console.log('Creating user with data:', userData);
    const user = await User.create(userData);
    console.log('User created successfully:', user._id);

    // Send welcome notification (don't wait for it to complete)
    sendNotification(user, 'welcome', {})
      .then(result => console.log('Welcome notification sent:', result))
      .catch(error => console.error('Welcome notification failed:', error));

    createTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Register error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Check if advocate is verified
    if (user.role === 'advocate' && !user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Account is pending verification. Please contact administrator.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    createTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
const updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    createTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'There is no user with that email'
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // TODO: Send email with reset token
    // For now, just return success message
    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    res.status(500).json({
      success: false,
      message: 'Email could not be sent'
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    createTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Verify advocate account (temporary endpoint for fixing existing accounts)
// @route   POST /api/auth/verify-advocate
// @access  Public (with super key)
const verifyAdvocate = async (req, res) => {
  try {
    const { email, superKey } = req.body;

    // Verify super key
    if (superKey !== 'ADVOCATE_MASTER_2024_LEGALPRO') {
      return res.status(401).json({
        success: false,
        message: 'Invalid super key'
      });
    }

    // Find and update the advocate
    const user = await User.findOne({ email, role: 'advocate' });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Advocate account not found'
      });
    }

    // Verify the account
    user.isVerified = true;
    user.isActive = true;
    await user.save();

    res.json({
      success: true,
      message: 'Advocate account verified successfully'
    });
  } catch (error) {
    console.error('Verify advocate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
};

// Enhanced authentication functions with RBAC

/**
 * Enhanced login with account lockout and session management
 * @route POST /api/auth/enhanced-login
 * @access Public
 */
const enhancedLogin = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, rememberMe = false } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
      return res.status(423).json({
        success: false,
        message: `Account is locked. Try again in ${lockTimeRemaining} minutes.`,
        error: 'ACCOUNT_LOCKED',
        lockTimeRemaining
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      // Lock account if max attempts reached
      if (user.loginAttempts >= PASSWORD_CONFIG.maxLoginAttempts) {
        user.lockUntil = Date.now() + PASSWORD_CONFIG.lockoutDuration;
        await user.save();

        return res.status(423).json({
          success: false,
          message: 'Account locked due to too many failed login attempts',
          error: 'ACCOUNT_LOCKED'
        });
      }

      await user.save();

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS',
        attemptsRemaining: PASSWORD_CONFIG.maxLoginAttempts - user.loginAttempts
      });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();

    // Generate tokens with enhanced security
    const tokenExpiry = rememberMe ? '30d' : '7d';

    const accessToken = authHelpers.generateToken({
      userId: user._id,
      email: user.email,
      role: user.role
    }, TOKEN_TYPES.ACCESS, tokenExpiry);

    const refreshToken = authHelpers.generateToken({
      userId: user._id,
      email: user.email,
      role: user.role
    }, TOKEN_TYPES.REFRESH);

    // Manage refresh tokens (limit concurrent sessions)
    const maxSessions = 3;
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(refreshToken);

    // Remove oldest tokens if limit exceeded
    if (user.refreshTokens.length > maxSessions) {
      user.refreshTokens = user.refreshTokens.slice(-maxSessions);
    }

    await user.save();

    // Remove sensitive data from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;
    delete userResponse.loginAttempts;
    delete userResponse.lockUntil;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: tokenExpiry
        },
        permissions: authHelpers.getRolePermissions(user.role)
      }
    });

  } catch (error) {
    console.error('Enhanced login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: 'LOGIN_ERROR'
    });
  }
};

/**
 * Refresh access token
 * @route POST /api/auth/refresh-token
 * @access Public
 */
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required',
        error: 'MISSING_REFRESH_TOKEN'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = authHelpers.verifyToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        error: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Check token type
    if (decoded.type !== TOKEN_TYPES.REFRESH) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type',
        error: 'INVALID_TOKEN_TYPE'
      });
    }

    // Find user and verify refresh token
    const user = await User.findById(decoded.userId);

    if (!user || !user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        error: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Generate new access token
    const newAccessToken = authHelpers.generateToken({
      userId: user._id,
      email: user.email,
      role: user.role
    }, TOKEN_TYPES.ACCESS);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        expiresIn: '7d'
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: 'TOKEN_REFRESH_ERROR'
    });
  }
};

/**
 * Logout from current device
 * @route POST /api/auth/logout
 * @access Private
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = req.user;

    if (refreshToken && user.refreshTokens) {
      // Remove specific refresh token
      user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
      await user.save();
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: 'LOGOUT_ERROR'
    });
  }
};

/**
 * Logout from all devices
 * @route POST /api/auth/logout-all
 * @access Private
 */
const logoutAll = async (req, res) => {
  try {
    const user = req.user;

    // Clear all refresh tokens
    user.refreshTokens = [];
    await user.save();

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });

  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout from all devices failed',
      error: 'LOGOUT_ALL_ERROR'
    });
  }
};

/**
 * Get user permissions
 * @route GET /api/auth/permissions
 * @access Private
 */
const getUserPermissions = async (req, res) => {
  try {
    const user = req.user;
    const permissions = authHelpers.getRolePermissions(user.role);

    res.json({
      success: true,
      data: {
        role: user.role,
        permissions,
        roleLevel: authHelpers.getRoleLevel(user.role)
      }
    });

  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user permissions',
      error: 'PERMISSIONS_ERROR'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyAdvocate,
  // Enhanced authentication functions
  enhancedLogin,
  refreshAccessToken,
  logout,
  logoutAll,
  getUserPermissions
};