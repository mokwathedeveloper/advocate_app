const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { initiatePayment, paymentCallback } = require('../controllers/paymentController');

// Initiate payment (protected route)
router.post('/initiate', protect, initiatePayment);

// M-Pesa payment callback (public route)
router.post('/callback', paymentCallback);

module.exports = router;
