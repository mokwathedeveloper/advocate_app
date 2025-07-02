// Validation middleware for LegalPro v1.0.1
const { body, validationResult } = require('express-validator');

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

module.exports = {
  validateCase,
  validateCaseUpdate,
  validateCaseNote,
  validateStatusUpdate,
  VALID_CATEGORIES
};
