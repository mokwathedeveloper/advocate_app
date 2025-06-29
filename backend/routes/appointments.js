// Appointment routes for LegalPro v1.0.1
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// GET /api/appointments
router.get('/', appointmentController.getAppointments);

module.exports = router;