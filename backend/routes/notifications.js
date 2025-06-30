// Notification routes for LegalPro v1.0.1
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  sendWelcomeNotification,
  sendAppointmentConfirmation,
  sendCaseUpdateNotification,
  sendPaymentConfirmation,
  sendAppointmentReminder,
  sendBulkNotification
} = require('../controllers/notificationController');

// @route   POST /api/notifications/welcome
// @desc    Send welcome notification to new user
// @access  Private (Admin/Super Admin)
router.post('/welcome', protect, authorize('admin', 'advocate'), sendWelcomeNotification);

// @route   POST /api/notifications/appointment-confirmation
// @desc    Send appointment confirmation
// @access  Private
router.post('/appointment-confirmation', protect, sendAppointmentConfirmation);

// @route   POST /api/notifications/case-update
// @desc    Send case update notification
// @access  Private (Admin/Super Admin)
router.post('/case-update', protect, authorize('admin', 'advocate'), sendCaseUpdateNotification);

// @route   POST /api/notifications/payment-confirmation
// @desc    Send payment confirmation
// @access  Private
router.post('/payment-confirmation', protect, sendPaymentConfirmation);

// @route   POST /api/notifications/appointment-reminder
// @desc    Send appointment reminders (for scheduled job)
// @access  Private (System/Admin)
router.post('/appointment-reminder', protect, authorize('admin', 'advocate'), sendAppointmentReminder);

// @route   POST /api/notifications/bulk
// @desc    Send bulk notification
// @access  Private (Admin/Super Admin)
router.post('/bulk', protect, authorize('admin', 'advocate'), sendBulkNotification);

module.exports = router;
