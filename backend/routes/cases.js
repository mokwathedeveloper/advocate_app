// Case management routes for LegalPro v1.0.1
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateCase, validateCaseUpdate } = require('../middleware/validation');
const caseController = require('../controllers/caseController');
const { upload, validateFileSize, handleUploadError } = require('../middleware/upload');

// @route   GET /api/cases/stats
// @desc    Get case statistics
// @access  Private
router.get('/stats', protect, caseController.getCaseStats);

// @route   GET /api/cases/search
// @desc    Advanced case search
// @access  Private
router.get('/search', protect, caseController.searchCases);

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
// @access  Private (Admin/Advocate)
router.post('/', protect, authorize('admin', 'advocate'), validateCase, caseController.createCase);

// @route   PUT /api/cases/:id
// @desc    Update case
// @access  Private (Admin/Advocate)
router.put('/:id', protect, authorize('admin', 'advocate'), validateCaseUpdate, caseController.updateCase);

// @route   DELETE /api/cases/:id
// @desc    Delete case (soft delete)
// @access  Private (Advocate only)
router.delete('/:id', protect, authorize('advocate'), caseController.deleteCase);

// @route   PUT /api/cases/:id/restore
// @desc    Restore archived case
// @access  Private (Advocate only)
router.put('/:id/restore', protect, authorize('advocate'), caseController.restoreCase);

// @route   PUT /api/cases/:id/assign
// @desc    Assign case to user
// @access  Private (Advocate only)
router.put('/:id/assign', protect, authorize('advocate'), caseController.assignCase);

// @route   GET /api/cases/:id/documents
// @desc    Get case documents
// @access  Private
router.get('/:id/documents', protect, caseController.getCaseDocuments);

// @route   POST /api/cases/:id/documents
// @desc    Upload case document
// @access  Private
router.post('/:id/documents', protect, upload.single('document'), validateFileSize, handleUploadError, caseController.uploadDocument);

// @route   GET /api/cases/:id/documents/:docId/download
// @desc    Download case document
// @access  Private
router.get('/:id/documents/:docId/download', protect, caseController.downloadDocument);

// @route   DELETE /api/cases/:id/documents/:docId
// @desc    Delete case document
// @access  Private
router.delete('/:id/documents/:docId', protect, caseController.deleteDocument);

// @route   POST /api/cases/:id/notes
// @desc    Add case note
// @access  Private
router.post('/:id/notes', protect, caseController.addCaseNote);

// @route   PUT /api/cases/:id/status
// @desc    Update case status
// @access  Private (Admin/Advocate)
router.put('/:id/status', protect, authorize('admin', 'advocate'), caseController.updateCaseStatus);

// @route   GET /api/cases/:id/timeline
// @desc    Get case timeline
// @access  Private
router.get('/:id/timeline', protect, caseController.getCaseTimeline);

module.exports = router;