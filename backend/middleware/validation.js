const { body, validationResult } = require('express-validator');

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

module.exports = {
  validateCase,
  validateCaseUpdate
};
