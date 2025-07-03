// Authentication controller for LegalPro v1.0.1
const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendNotification } = require('../utils/notificationService');
const { sendEmailVerification } = require('../utils/emailVerification');
const auditLogger = require('../utils/auditLogger');
const validator = require('validator');

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

// Comprehensive input validation for registration
const validateRegistrationInput = (data) => {
  const errors = [];
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
    barAdmission,
    superKey
  } = data;

  // Basic field validation
  if (!firstName || firstName.trim().length < 2) {
    errors.push({ field: 'firstName', message: 'First name must be at least 2 characters long' });
  }

  if (!lastName || lastName.trim().length < 2) {
    errors.push({ field: 'lastName', message: 'Last name must be at least 2 characters long' });
  }

  if (!email || !validator.isEmail(email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  if (!password || password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
  }

  // Password strength validation
  if (password && !isStrongPassword(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    });
  }

  // Phone validation (optional but if provided, must be valid)
  if (phone && !validator.isMobilePhone(phone, 'any', { strictMode: false })) {
    errors.push({ field: 'phone', message: 'Please provide a valid phone number' });
  }

  // Role-specific validation
  if (role === 'advocate') {
    if (!superKey) {
      errors.push({ field: 'superKey', message: 'Super key is required for advocate registration' });
    }

    if (!licenseNumber || licenseNumber.trim().length < 3) {
      errors.push({ field: 'licenseNumber', message: 'License number must be at least 3 characters long' });
    }

    if (!specialization || specialization.trim().length < 3) {
      errors.push({ field: 'specialization', message: 'Specialization must be at least 3 characters long' });
    }

    if (!experience || experience.trim().length < 3) {
      errors.push({ field: 'experience', message: 'Experience description must be at least 3 characters long' });
    }

    if (!education || education.trim().length < 3) {
      errors.push({ field: 'education', message: 'Education information must be at least 3 characters long' });
    }

    if (!barAdmission || barAdmission.trim().length < 3) {
      errors.push({ field: 'barAdmission', message: 'Bar admission information must be at least 3 characters long' });
    }
  }

  return errors;
};

// Password strength validation
const isStrongPassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
};

// Verify super key for advocate registration
const verifySuperKey = async (providedKey) => {
  const validSuperKey = process.env.ADVOCATE_SUPER_KEY || 'ADVOCATE-SUPER-2024-DEV-KEY';

  // Use crypto.timingSafeEqual to prevent timing attacks
  if (!providedKey || providedKey.length !== validSuperKey.length) {
    return false;
  }

  const providedBuffer = Buffer.from(providedKey, 'utf8');
  const validBuffer = Buffer.from(validSuperKey, 'utf8');

  try {
    return crypto.timingSafeEqual(providedBuffer, validBuffer);
  } catch (error) {
    console.error('Super key verification error:', error);
    return false;
  }
};

// Enhanced welcome notification
const sendWelcomeNotification = async (user) => {
  try {
    const notificationData = {
      userName: `${user.firstName} ${user.lastName}`,
      userRole: user.role,
      registrationDate: user.registrationDate,
      loginUrl: process.env.CLIENT_URL || 'http://localhost:5173'
    };

    return await sendNotification(user, 'welcome', notificationData);
  } catch (error) {
    console.error('Welcome notification error:', error);
    throw error;
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    console.log('Registration request received:', {
      email: req.body.email,
      role: req.body.role,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress
    });

    // Extract and validate input data
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
      barAdmission,
      superKey
    } = req.body;

    // Comprehensive input validation
    const validationErrors = validateRegistrationInput({
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
      barAdmission,
      superKey
    });

    if (validationErrors.length > 0) {
      console.log('Registration validation failed:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Verify super key for advocate registration
    if (role === 'advocate') {
      const superKeyValid = await verifySuperKey(superKey);

      // Log super key attempt
      await auditLogger.logSuperKeyAttempt(req, superKeyValid ? 'SUCCESS' : 'FAILURE', {
        email,
        attemptedKey: superKey ? 'PROVIDED' : 'MISSING'
      });

      if (!superKeyValid) {
        console.log('Invalid super key attempt:', {
          email,
          ip: req.ip || req.connection.remoteAddress,
          timestamp: new Date().toISOString()
        });
        return res.status(401).json({
          success: false,
          message: 'Invalid super key. Contact system administrator for advocate registration.'
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        ...(licenseNumber ? [{ licenseNumber }] : [])
      ]
    });

    if (existingUser) {
      const conflictField = existingUser.email === email.toLowerCase() ? 'email' : 'license number';
      console.log('Registration conflict:', {
        email,
        conflictField,
        existingUserId: existingUser._id
      });
      return res.status(409).json({
        success: false,
        message: `User already exists with this ${conflictField}`
      });
    }

    // Prepare user data
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone?.trim(),
      role: role || 'client',
      registrationDate: new Date(),
      registrationIP: req.ip || req.connection.remoteAddress
    };

    // Add advocate-specific fields with enhanced validation
    if (role === 'advocate') {
      userData.licenseNumber = licenseNumber.trim();
      userData.specialization = specialization.trim();
      userData.experience = experience.trim();
      userData.education = education.trim();
      userData.barAdmission = barAdmission.trim();
      userData.isVerified = true; // Auto-verify with valid super key
      userData.isActive = true;
      userData.verificationDate = new Date();
      userData.verificationMethod = 'super_key';
    }

    console.log('Creating user account:', {
      email: userData.email,
      role: userData.role,
      licenseNumber: userData.licenseNumber || 'N/A'
    });

    // Create user account
    const user = await User.create(userData);

    console.log('User account created successfully:', {
      userId: user._id,
      email: user.email,
      role: user.role,
      timestamp: new Date().toISOString()
    });

    // Send email verification for enhanced security
    sendEmailVerification(user, 'registration')
      .then(result => console.log('Email verification sent:', result))
      .catch(error => console.error('Email verification failed:', error));

    // Send welcome notification asynchronously
    sendWelcomeNotification(user)
      .then(result => console.log('Welcome notification sent:', result))
      .catch(error => console.error('Welcome notification failed:', error));

    // Log successful registration
    await auditLogger.logRegistration(user, req, 'SUCCESS', {
      verificationMethod: 'super_key',
      emailVerificationSent: true
    });

    console.log('Registration completed successfully:', {
      userId: user._id,
      email: user.email,
      role: user.role,
      timestamp: new Date().toISOString()
    });

    // Enhanced response with verification info
    const token = signToken(user._id);
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for verification.',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isVerified: user.isVerified,
        isActive: user.isActive,
        licenseNumber: user.licenseNumber,
        specialization: user.specialization
      },
      nextSteps: {
        emailVerificationRequired: !user.isEmailVerified,
        message: 'Please verify your email address to complete the registration process.'
      }
    });
  } catch (error) {
    console.error('Register error:', error);

    // Log failed registration attempt
    await auditLogger.log({
      eventType: 'USER_REGISTRATION',
      action: 'ADVOCATE_REGISTRATION',
      status: 'FAILURE',
      userEmail: req.body.email,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      riskLevel: 'MEDIUM',
      errorMessage: error.message,
      details: {
        errorType: error.name,
        errorCode: error.code
      }
    });

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