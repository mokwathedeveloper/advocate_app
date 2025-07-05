// Validation middleware for LegalPro v1.0.1

const { body, param, query, validationResult } = require('express-validator');
const { USER_ROLES, PASSWORD_CONFIG } = require('../config/auth');

const { body, validationResult } = require('express-validator');
const { validateRegistrationData } = require('../utils/validationUtils');
const User = require('../models/User');

/**
 * Middleware to handle JSON parsing errors
 */
const handleJSONError = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'PARSE_ERROR',
      message: 'Invalid JSON format in request body',
      details: {
        code: 'INVALID_JSON',
        position: err.body ? err.body.indexOf(err.message.split(' ').pop()) : null
      },
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    });
  }
  next(err);
};

/**
 * Middleware to validate Content-Type header
 */
const validateContentType = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.get('Content-Type');

    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        success: false,
        error: 'HEADER_ERROR',
        message: 'Missing or invalid Content-Type header',
        details: {
          expected: 'application/json',
          received: contentType || 'none',
          code: 'INVALID_CONTENT_TYPE'
        },
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }
  }
  next();
};

/**
 * Comprehensive registration validation middleware
 */
const validateRegistration = async (req, res, next) => {
  try {
    // First, validate the data structure and types
    const validation = validateRegistrationData(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Registration validation failed',
        details: {
          errors: validation.errors,
          fieldErrors: validation.fieldErrors,
          code: 'REGISTRATION_VALIDATION_FAILED'
        },
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    }

    // Check if email already exists
    if (req.body.email) {
      const existingUser = await User.findOne({
        email: req.body.email.trim().toLowerCase()
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'CONFLICT_ERROR',
          message: 'Email address already registered',
          details: {
            field: 'email',
            code: 'EMAIL_ALREADY_EXISTS'
          },
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
      }
    }

    // Check if license number already exists for advocates
    if (req.body.role === 'advocate' && req.body.licenseNumber) {
      const existingAdvocate = await User.findOne({
        licenseNumber: req.body.licenseNumber.trim(),
        role: 'advocate'
      });

      if (existingAdvocate) {
        return res.status(409).json({
          success: false,
          error: 'CONFLICT_ERROR',
          message: 'License number already registered',
          details: {
            field: 'licenseNumber',
            code: 'LICENSE_NUMBER_ALREADY_EXISTS'
          },
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Registration validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Internal server error during validation',
      details: {
        code: 'VALIDATION_SERVER_ERROR'
      },
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    });
  }
};


// Middleware to validate case creation
const validateCase = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title must be at most 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be at most 1000 characters'),
  body('status')
    .optional()
    .isIn(['open', 'closed', 'pending'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority'),
  body('category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

// Middleware to validate case update
const validateCaseUpdate = [
  body('title')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Title must be at most 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be at most 1000 characters'),
  body('status')
    .optional()
    .isIn(['open', 'closed', 'pending'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority'),
  body('category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];


// Authentication validation rules

/**
 * Validation rules for user registration
 */
const validateRegistration = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email must not exceed 100 characters'),

  body('password')
    .isLength({ min: PASSWORD_CONFIG.minLength })
    .withMessage(`Password must be at least ${PASSWORD_CONFIG.minLength} characters long`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),

  body('phone')
    .isMobilePhone('any', { strictMode: false })
    .withMessage('Please provide a valid phone number')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 characters'),

  body('role')
    .optional()
    .isIn(Object.values(USER_ROLES))
    .withMessage('Invalid role specified'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Validation rules for user login
 */
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean'),


/**
 * Login validation middleware
 */
const validateLogin = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,

        message: 'Validation failed',
        errors: errors.array()

        error: 'VALIDATION_ERROR',
        message: 'Login validation failed',
        details: {
          errors: errors.array().map(err => ({
            field: err.param,
            message: err.msg,
            code: `${err.param.toUpperCase()}_VALIDATION_FAILED`
          })),
          code: 'LOGIN_VALIDATION_FAILED'
        },
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'

      });
    }
    next();
  }
];

/**

 * Validation rules for password update

 * Password update validation middleware

 */
const validatePasswordUpdate = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),


  body('newPassword')
    .isLength({ min: PASSWORD_CONFIG.minLength })
    .withMessage(`New password must be at least ${PASSWORD_CONFIG.minLength} characters long`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  body('confirmNewPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('New password confirmation does not match new password');
      }
      return true;
    }),


  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,

        message: 'Validation failed',
        errors: errors.array()

        error: 'VALIDATION_ERROR',
        message: 'Password update validation failed',
        details: {
          errors: errors.array().map(err => ({
            field: err.param,
            message: err.msg,
            code: `${err.param.toUpperCase()}_VALIDATION_FAILED`
          })),
          code: 'PASSWORD_UPDATE_VALIDATION_FAILED'
        },
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'

      });
    }
    next();
  }
];

/**

 * Validation rules for refresh token
 */
const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),


 * Forgot password validation middleware
 */
const validateForgotPassword = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,

        message: 'Validation failed',
        errors: errors.array()

        error: 'VALIDATION_ERROR',
        message: 'Forgot password validation failed',
        details: {
          errors: errors.array().map(err => ({
            field: err.param,
            message: err.msg,
            code: `${err.param.toUpperCase()}_VALIDATION_FAILED`
          })),
          code: 'FORGOT_PASSWORD_VALIDATION_FAILED'
        },
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'

      });
    }
    next();
  }
];

/**

 * Validation rules for user ID parameter
 */
const validateUserId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID format'),


 * Reset password validation middleware
 */
const validateResetPassword = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,

        message: 'Validation failed',
        errors: errors.array()

        error: 'VALIDATION_ERROR',
        message: 'Reset password validation failed',
        details: {
          errors: errors.array().map(err => ({
            field: err.param,
            message: err.msg,
            code: `${err.param.toUpperCase()}_VALIDATION_FAILED`
          })),
          code: 'RESET_PASSWORD_VALIDATION_FAILED'
        },
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'

      });
    }
    next();
  }
];


/**
 * Custom validation for strong password
 */
const validateStrongPassword = (password) => {
  const errors = [];

  if (password.length < PASSWORD_CONFIG.minLength) {
    errors.push(`Password must be at least ${PASSWORD_CONFIG.minLength} characters long`);
  }

  if (PASSWORD_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_CONFIG.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_CONFIG.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (PASSWORD_CONFIG.requireSpecialChars && !/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};


module.exports = {
  handleJSONError,
  validateContentType,
  validateRegistration,
  validateLogin,
  validatePasswordUpdate,
  validateForgotPassword,
  validateResetPassword,
  validateCase,
  validateCaseUpdate,
  // Authentication validations
  validateRegistration,
  validateLogin,
  validatePasswordUpdate,
  validateRefreshToken,
  validateUserId,
  validateStrongPassword
};
