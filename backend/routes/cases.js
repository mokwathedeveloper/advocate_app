// Case management routes for LegalPro v1.0.1
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateCase, validateCaseUpdate } = require('../middleware/validation');
const caseController = require('../controllers/caseController');
const upload = require('../middleware/upload');

// @route   GET /api/cases
// @desc    Get all cases (filtered by user role)
// @access  Private
router.get('/', protect, caseController.getCases);

// @route   GET /api/cases/:id
// @desc    Get single case
// @access  Private
router.get('/:id', protect, caseController.getCase);

// @route   POST /api/cases
// @desc    Create new case
// @access  Private (Admin/Super Admin)
router.post('/', protect, authorize('admin', 'super_admin'), validateCase, caseController.createCase);

// @route   PUT /api/cases/:id
// @desc    Update case
// @access  Private (Admin/Super Admin)
router.put('/:id', protect, authorize('admin', 'super_admin'), validateCaseUpdate, caseController.updateCase);

// @route   DELETE /api/cases/:id
// @desc    Delete case
// @access  Private (Super Admin only)
router.delete('/:id', protect, authorize('super_admin'), caseController.deleteCase);

// @route   POST /api/cases/:id/documents
// @desc    Upload case document
// @access  Private
router.post('/:id/documents', protect, upload.single('document'), caseController.uploadDocument);

// @route   POST /api/cases/:id/notes
// @desc    Add case note
// @access  Private
router.post('/:id/notes', protect, caseController.addCaseNote);

// @route   PUT /api/cases/:id/status
// @desc    Update case status
// @access  Private (Admin/Super Admin)
router.put('/:id/status', protect, authorize('admin', 'super_admin'), caseController.updateCaseStatus);

// @route   GET /api/cases/:id/timeline
// @desc    Get case timeline
// @access  Private
router.get('/:id/timeline', protect, caseController.getCaseTimeline);

module.exports = router;