const MpesaService = require('../utils/mpesaService');
const Payment = require('../models/Payment');

// Initiate M-Pesa payment
const initiatePayment = async (req, res) => {
  try {
    const { phoneNumber, amount, appointmentId } = req.body;

    if (!phoneNumber || !amount) {
      return res.status(400).json({ success: false, message: 'Phone number and amount are required' });
    }

    // Create payment record with status pending
    const payment = await Payment.create({
      clientId: req.user._id,
      appointmentId,
      amount,
      method: 'mpesa',
      status: 'pending'
    });

    // Initiate M-Pesa STK Push
    const response = await MpesaService.initiatePayment(
      phoneNumber,
      amount,
      `Appointment ${appointmentId}`,
      'Payment for legal consultation'
    );

    res.status(200).json({ success: true, data: response, paymentId: payment._id });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate payment' });
  }
};

// Handle M-Pesa payment confirmation callback
const paymentCallback = async (req, res) => {
  try {
    const callbackData = req.body;

    // Extract relevant data from callback
    const { Body } = callbackData;
    const { stkCallback } = Body;
    const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

    // Find payment by CheckoutRequestID (assuming stored in transactionId)
    const payment = await Payment.findOne({ transactionId: CheckoutRequestID });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    if (ResultCode === 0) {
      // Payment successful
      payment.status = 'completed';
    } else {
      // Payment failed or cancelled
      payment.status = 'failed';
    }

    await payment.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).json({ success: false, message: 'Error processing payment callback' });
  }
};

module.exports = {
  initiatePayment,
  paymentCallback
};
