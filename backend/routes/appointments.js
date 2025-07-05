// Comprehensive Appointment routes for LegalPro v1.0.1
const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect, authorize } = require('../middleware/auth');
const {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  cancelAppointment,
  getAvailability
} = require('../controllers/appointmentController');

const router = express.Router();

// Rate limiting for appointment operations
const appointmentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many appointment requests, please try again later.'
  }
});

// Rate limiting for appointment creation (more restrictive)
const createAppointmentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 appointment creations per hour
  message: {
    success: false,
    message: 'Too many appointment creation requests, please try again later.'
  }
});

// Apply rate limiting to all routes
router.use(appointmentLimiter);

// Apply authentication to all routes
router.use(protect);

// @desc    Get all appointments with filtering and pagination
// @route   GET /api/appointments
// @access  Private (All authenticated users)
router.get('/', getAppointments);

// @desc    Get available time slots for an advocate
// @route   GET /api/appointments/availability/:advocateId
// @access  Private (All authenticated users)
router.get('/availability/:advocateId', getAvailability);

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private (Client, Advocate involved, or Admin)
router.get('/:id', getAppointment);

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private (All authenticated users with rate limiting)
router.post('/', createAppointmentLimiter, createAppointment);

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private (Client, Advocate involved, or Admin)
router.put('/:id', updateAppointment);

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private (Client, Advocate involved, or Admin)
router.put('/:id/cancel', cancelAppointment);

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private (Admin or appointment creator only)
router.delete('/:id', deleteAppointment);

module.exports = router;