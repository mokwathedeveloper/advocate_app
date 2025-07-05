// Enhanced Payment routes for LegalPro v1.0.1 with comprehensive M-Pesa integration
const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  initiateSTKPush,
  validatePaymentInitiation,
  getPayments,
  queryPaymentStatus,
  initiateRefund,
  handleSTKCallback,
  handleB2CCallback,
  getTransactionAnalytics,
  // Legacy support
  initiatePayment,
  paymentCallback
} = require('../controllers/paymentController');

// Payment initiation routes
router.post('/stk-push', protect, validatePaymentInitiation, initiateSTKPush);
router.post('/initiate', protect, validatePaymentInitiation, initiateSTKPush); // Legacy support

// Payment management routes
router.get('/', protect, getPayments);
router.get('/:paymentId/status', protect, queryPaymentStatus);

// Refund routes (admin only)
router.post('/:paymentId/refund', protect, adminOnly, initiateRefund);

// M-Pesa callback routes (public routes - no authentication required)
router.post('/mpesa/stk-callback', handleSTKCallback);
router.post('/mpesa/b2c-callback', handleB2CCallback);
router.post('/mpesa/timeout', (req, res) => {
  console.log('M-Pesa timeout callback:', req.body);
  res.status(200).json({ success: true });
});
router.post('/mpesa/result', (req, res) => {
  console.log('M-Pesa result callback:', req.body);
  res.status(200).json({ success: true });
});

// Legacy callback support
router.post('/callback', handleSTKCallback);

// Analytics routes (admin only)
router.get('/analytics', protect, adminOnly, getTransactionAnalytics);

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Payment service is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.MPESA_ENVIRONMENT || 'sandbox'
  });
});

module.exports = router;
