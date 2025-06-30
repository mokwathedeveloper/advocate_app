// Validation middleware for LegalPro v1.0.1
const { check, validationResult } = require('express-validator');

const validateRegistration = [
  // Validate first name: must not be empty
  check('firstName', 'First name is required').not().isEmpty(),
  // Validate last name: must not be empty
  check('lastName', 'Last name is required').not().isEmpty(),
  // Validate email: must be a valid email format
  check('email', 'Please include a valid email').isEmail(),
  // Validate password: must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number
  check('password', 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),

  // Custom validation for advocate-specific fields based on role
  check('role').custom((value, { req }) => {
    if (value === 'advocate') {
      // Check if license number is provided for advocates
      if (!req.body.licenseNumber) {
        throw new Error('License number is required for advocates');
      }
      // Check if at least one specialization is provided for advocates
      if (!req.body.specialization || req.body.specialization.length === 0) {
        throw new Error('At least one specialization is required for advocates');
      }
      // Check if experience is provided and is a non-negative number for advocates
      if (req.body.experience === undefined || req.body.experience === null) {
        throw new Error('Experience is required for advocates');
      }
      if (isNaN(req.body.experience) || parseInt(req.body.experience) < 0) {
        throw new Error('Experience must be a non-negative number');
      }
      // Check if education is provided for advocates
      if (!req.body.education) {
        throw new Error('Education is required for advocates');
      }
      // Check if bar admission details are provided for advocates
      if (!req.body.barAdmission) {
        throw new Error('Bar admission is required for advocates');
      }
    }
    return true;
  }),

  // Handle validation results: if errors exist, send a 400 response
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

const validateCase = [
  // Validate title: must not be empty
  check('title', 'Title is required').not().isEmpty(),
  // Validate client ID: must be a valid MongoDB ObjectId
  check('clientId', 'Client ID is required').isMongoId(),
  // Validate case number: must not be empty
  check('caseNumber', 'Case number is required').not().isEmpty(),
  // Validate status: must be one of the allowed values
  check('status', 'Status is required').isIn(['open', 'closed', 'pending']),
  // Handle validation results: if errors exist, send a 400 response
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

const validateCaseUpdate = [
    // Validate title: optional, but if present, must not be empty
    check('title', 'Title is required').optional().not().isEmpty(),
    // Validate client ID: optional, but if present, must be a valid MongoDB ObjectId
    check('clientId', 'Client ID is required').optional().isMongoId(),
    // Validate case number: optional, but if present, must not be empty
    check('caseNumber', 'Case number is required').optional().not().isEmpty(),
    // Validate status: optional, but if present, must be one of the allowed values
    check('status', 'Status is required').optional().isIn(['open', 'closed', 'pending']),
    // Handle validation results: if errors exist, send a 400 response
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    },
];

module.exports = {
  validateRegistration,
  validateCase,
  validateCaseUpdate,
};