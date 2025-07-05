// Validation middleware for LegalPro v1.0.1
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

// Valid case categories
const VALID_CATEGORIES = [
  'Family Law',
  'Corporate Law',
  'Criminal Defense',
  'Property Law',
  'Employment Law',
  'Constitutional Law',
  'Tax Law',
  'Immigration Law',
  'Intellectual Property',
  'Environmental Law'
];

// Middleware to validate case creation
const validateCase = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title must be at most 200 characters')
    .trim(),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 5000 })
    .withMessage('Description must be at most 5000 characters')
    .trim(),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  body('clientId')
    .notEmpty()
    .withMessage('Client ID is required')
    .isMongoId()
    .withMessage('Client ID must be a valid MongoDB ObjectId'),
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Assigned user ID must be a valid MongoDB ObjectId'),
  body('courtDate')
    .optional()
    .isISO8601()
    .withMessage('Court date must be a valid date')
    .custom((value) => {
      if (value && new Date(value) < new Date()) {
        throw new Error('Court date cannot be in the past');
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
      });
    }
    next();
  }
];

// Middleware to validate case update
const validateCaseUpdate = [
  body('title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Description must be between 1 and 5000 characters')
    .trim(),
  body('category')
    .optional()
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'closed'])
    .withMessage('Status must be one of: pending, in_progress, completed, closed'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  body('clientId')
    .optional()
    .isMongoId()
    .withMessage('Client ID must be a valid MongoDB ObjectId'),
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Assigned user ID must be a valid MongoDB ObjectId'),
  body('courtDate')
    .optional()
    .isISO8601()
    .withMessage('Court date must be a valid date')
    .custom((value) => {
      if (value && new Date(value) < new Date()) {
        throw new Error('Court date cannot be in the past');
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
      });
    }
    next();
  }
];

// Middleware to validate case note
const validateCaseNote = [
  body('content')
    .notEmpty()
    .withMessage('Note content is required')
    .isLength({ max: 2000 })
    .withMessage('Note content must be at most 2000 characters')
    .trim(),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean value'),
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

// Middleware to validate status update
const validateStatusUpdate = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'in_progress', 'completed', 'closed'])
    .withMessage('Status must be one of: pending, in_progress, completed, closed'),
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Reason must be at most 500 characters')
    .trim(),
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
 * Password update validation middleware
 */
const validatePasswordUpdate = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
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
  validateCaseNote,
  validateStatusUpdate,
  VALID_CATEGORIES
};
