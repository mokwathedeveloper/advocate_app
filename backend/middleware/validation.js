// Validation middleware for LegalPro v1.0.1
const { check, validationResult } = require('express-validator');

const validateRegistration = [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),

  // Advocate-specific validation
  check('role').custom((value, { req }) => {
    if (value === 'advocate') {
      if (!req.body.licenseNumber) {
        throw new Error('License number is required for advocates');
      }
      if (!req.body.specialization || req.body.specialization.length === 0) {
        throw new Error('At least one specialization is required for advocates');
      }
      if (req.body.experience === undefined || req.body.experience === null) {
        throw new Error('Experience is required for advocates');
      }
      if (isNaN(req.body.experience) || parseInt(req.body.experience) < 0) {
        throw new Error('Experience must be a non-negative number');
      }
      if (!req.body.education) {
        throw new Error('Education is required for advocates');
      }
      if (!req.body.barAdmission) {
        throw new Error('Bar admission is required for advocates');
      }
    }
    return true;
  }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

const validateCase = [
  check('title', 'Title is required').not().isEmpty(),
  check('clientId', 'Client ID is required').isMongoId(),
  check('caseNumber', 'Case number is required').not().isEmpty(),
  check('status', 'Status is required').isIn(['open', 'closed', 'pending']),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

const validateCaseUpdate = [
    check('title', 'Title is required').optional().not().isEmpty(),
    check('clientId', 'Client ID is required').optional().isMongoId(),
    check('caseNumber', 'Case number is required').optional().not().isEmpty(),
    check('status', 'Status is required').optional().isIn(['open', 'closed', 'pending']),
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