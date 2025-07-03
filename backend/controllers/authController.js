// Authentication controller for LegalPro v1.0.1
const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendNotification } = require('../utils/notificationService');
const {
  createSuccessResponse,
  createValidationErrorResponse,
  createConflictErrorResponse,
  createAuthErrorResponse,
  createNotFoundErrorResponse,
  createServerErrorResponse,
  handleMongooseValidationError,
  handleMongoDuplicateKeyError
} = require('../utils/errorResponse');

// Generate JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Create token response
const createTokenResponse = (user, statusCode, res, message = 'Success', requestId = null) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  const response = createSuccessResponse(
    {
      token,
      user
    },
    message,
    statusCode,
    requestId
  );

  res.status(statusCode).json(response);
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const requestId = req.id || require('uuid').v4();

  try {
    console.log('Registration request received:', {
      ...req.body,
      password: '[REDACTED]'
    });

    // Extract user data from request body
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

    // Prepare user data for creation
    const userData = {
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      email: email?.trim().toLowerCase(),
      password,
      phone: phone?.trim(),
      role: role || 'client'
    };

    // Add advocate-specific fields if role is advocate
    if (role === 'advocate') {
      userData.licenseNumber = licenseNumber?.trim();
      userData.specialization = specialization;
      userData.experience = experience;
      userData.education = education?.trim();
      userData.barAdmission = barAdmission?.trim();
      // Auto-verify advocates who register (can be changed based on business logic)
      userData.isVerified = true;
      userData.isActive = true;
    }

    console.log('Creating user with data:', {
      ...userData,
      password: '[REDACTED]'
    });

    // Create user in database
    const user = await User.create(userData);
    console.log('User created successfully:', user._id);

    // Send welcome notification asynchronously
    sendNotification(user, 'welcome', {})
      .then(result => console.log('Welcome notification sent:', result))
      .catch(error => console.error('Welcome notification failed:', error));

    // Return success response with token
    createTokenResponse(
      user,
      201,
      res,
      'User registered successfully',
      requestId
    );

  } catch (error) {
    console.error('Registration error:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errorResponse = handleMongooseValidationError(error, requestId);
      return res.status(400).json(errorResponse);
    }

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const errorResponse = handleMongoDuplicateKeyError(error, requestId);
      return res.status(409).json(errorResponse);
    }

    // Handle other errors
    const errorResponse = createServerErrorResponse(
      'Server error during registration',
      'REGISTRATION_SERVER_ERROR',
      process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : {},
      requestId
    );

    res.status(500).json(errorResponse);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const requestId = req.id || require('uuid').v4();

  try {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);

    // Find user and include password for verification
    const user = await User.findOne({
      email: email?.trim().toLowerCase()
    }).select('+password');

    if (!user) {
      const errorResponse = createAuthErrorResponse(
        'Invalid email or password',
        'INVALID_CREDENTIALS',
        requestId
      );
      return res.status(401).json(errorResponse);
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      const errorResponse = createAuthErrorResponse(
        'Invalid email or password',
        'INVALID_CREDENTIALS',
        requestId
      );
      return res.status(401).json(errorResponse);
    }

    // Check if user account is active
    if (!user.isActive) {
      const errorResponse = createAuthErrorResponse(
        'Account is deactivated. Please contact administrator.',
        'ACCOUNT_DEACTIVATED',
        requestId
      );
      return res.status(401).json(errorResponse);
    }

    // Check if advocate account is verified
    if (user.role === 'advocate' && !user.isVerified) {
      const errorResponse = createAuthErrorResponse(
        'Account is pending verification. Please contact administrator.',
        'ACCOUNT_PENDING_VERIFICATION',
        requestId
      );
      return res.status(401).json(errorResponse);
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    console.log('Login successful for user:', user._id);

    // Return success response with token
    createTokenResponse(
      user,
      200,
      res,
      'Login successful',
      requestId
    );

  } catch (error) {
    console.error('Login error:', error);

    const errorResponse = createServerErrorResponse(
      'Server error during login',
      'LOGIN_SERVER_ERROR',
      process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : {},
      requestId
    );

    res.status(500).json(errorResponse);
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

module.exports = {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyAdvocate
};