// Enhanced Payment controller for LegalPro v1.0.1 with comprehensive M-Pesa integration
const Payment = require('../models/Payment');
const TransactionLog = require('../models/TransactionLog');
const mpesaService = require('../utils/mpesaService');
const { validationResult, body } = require('express-validator');

// Utility function to log transactions
async function logTransaction(type, data, paymentId = null, userId = null) {
  try {
    await TransactionLog.logTransaction({
      transactionId: data.transactionId || data.checkoutRequestID || Date.now().toString(),
      transactionType: type,
      paymentId,
      userId,
      requestData: data.request || {},
      responseData: data.response || {},
      statusCode: data.statusCode || 200,
      duration: data.duration || 0,
      success: data.success || false,
      errorMessage: data.error?.message,
      errorCode: data.error?.code,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      mpesaRequestId: data.mpesaRequestId,
      mpesaResponseCode: data.mpesaResponseCode,
      mpesaResponseDescription: data.mpesaResponseDescription
    });
  } catch (error) {
    console.error('Failed to log transaction:', error);
  }
}

// Validation rules for payment initiation
const validatePaymentInitiation = [
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^(\+?254|0)?[17]\d{8}$/)
    .withMessage('Invalid Kenyan phone number format'),
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be at least 1 KES'),
  body('paymentType')
    .optional()
    .isIn(['consultation_fee', 'case_fee', 'document_fee', 'court_fee', 'other'])
    .withMessage('Invalid payment type'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

// Enhanced M-Pesa payment initiation
const initiateSTKPush = async (req, res) => {
  const startTime = Date.now();

  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      phoneNumber,
      amount,
      appointmentId,
      caseId,
      paymentType = 'consultation_fee',
      description,
      accountReference
    } = req.body;

    // Format phone number
    const formattedPhone = mpesaService.formatPhoneNumber(phoneNumber);

    // Create payment record with comprehensive M-Pesa details
    const payment = new Payment({
      clientId: req.user._id,
      appointmentId,
      caseId,
      amount: Math.round(amount),
      currency: 'KES',
      method: 'mpesa',
      paymentType,
      description: description || `${paymentType.replace('_', ' ')} payment`,
      status: 'pending',
      createdBy: req.user._id,
      mpesaDetails: {
        phoneNumber: formattedPhone,
        accountReference: accountReference || `LP-${Date.now()}`,
        transactionDesc: description || 'Legal Services Payment',
        stkPushStatus: 'initiated'
      }
    });

    await payment.save();

    // Initiate STK Push
    const mpesaResponse = await mpesaService.initiateSTKPush(
      formattedPhone,
      amount,
      payment.mpesaDetails.accountReference,
      payment.mpesaDetails.transactionDesc
    );

    // Update payment with M-Pesa response
    payment.mpesaDetails.merchantRequestID = mpesaResponse.merchantRequestID;
    payment.mpesaDetails.checkoutRequestID = mpesaResponse.checkoutRequestID;
    payment.mpesaDetails.requestPayload = {
      phoneNumber: formattedPhone,
      amount,
      accountReference: payment.mpesaDetails.accountReference,
      transactionDesc: payment.mpesaDetails.transactionDesc
    };
    payment.mpesaDetails.responsePayload = mpesaResponse;
    payment.status = 'processing';
    payment.mpesaDetails.stkPushStatus = 'pending';
    payment.transactionId = mpesaResponse.checkoutRequestID; // For backward compatibility

    await payment.save();

    // Log transaction
    await logTransaction('STK_PUSH', {
      transactionId: mpesaResponse.checkoutRequestID,
      request: payment.mpesaDetails.requestPayload,
      response: mpesaResponse,
      statusCode: 200,
      duration: Date.now() - startTime,
      success: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      mpesaRequestId: mpesaResponse.merchantRequestID,
      mpesaResponseCode: mpesaResponse.responseCode,
      mpesaResponseDescription: mpesaResponse.responseDescription
    }, payment._id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'STK Push initiated successfully',
      data: {
        paymentId: payment._id,
        checkoutRequestID: mpesaResponse.checkoutRequestID,
        merchantRequestID: mpesaResponse.merchantRequestID,
        customerMessage: mpesaResponse.customerMessage,
        amount: payment.formattedAmount,
        phoneNumber: payment.formattedPhoneNumber
      }
    });

  } catch (error) {
    console.error('STK Push initiation error:', error);

    // Log failed transaction
    await logTransaction('STK_PUSH', {
      transactionId: `failed-${Date.now()}`,
      request: req.body,
      response: null,
      statusCode: 500,
      duration: Date.now() - startTime,
      success: false,
      error: { message: error.message, code: error.code },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }, null, req.user._id);

    res.status(500).json({
      success: false,
      message: 'Failed to initiate payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Enhanced STK Push callback handler
const handleSTKCallback = async (req, res) => {
  const startTime = Date.now();

  try {
    const callbackData = req.body;
    console.log('STK Push callback received:', JSON.stringify(callbackData, null, 2));

    // Validate callback data
    const validatedCallback = mpesaService.validateCallbackData(callbackData);

    if (validatedCallback.type !== 'STK_PUSH') {
      throw new Error('Invalid callback type for STK Push');
    }

    const {
      checkoutRequestID,
      merchantRequestID,
      resultCode,
      resultDesc,
      callbackMetadata
    } = validatedCallback;

    // Find payment by checkoutRequestID
    const payment = await Payment.findOne({
      'mpesaDetails.checkoutRequestID': checkoutRequestID
    });

    if (!payment) {
      console.error('Payment not found for checkoutRequestID:', checkoutRequestID);
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Update payment with callback data
    payment.mpesaDetails.callbackPayload = callbackData;
    payment.mpesaDetails.callbackReceived = true;
    payment.mpesaDetails.callbackReceivedAt = new Date();
    payment.mpesaDetails.resultCode = resultCode;
    payment.mpesaDetails.resultDesc = resultDesc;

    if (resultCode === 0) {
      // Payment successful
      if (callbackMetadata && callbackMetadata.Item) {
        // Extract payment details from callback metadata
        const metadata = {};
        callbackMetadata.Item.forEach(item => {
          metadata[item.Name] = item.Value;
        });

        payment.mpesaDetails.mpesaReceiptNumber = metadata.MpesaReceiptNumber;
        payment.mpesaDetails.transactionDate = new Date(metadata.TransactionDate);
        payment.mpesaDetails.phoneNumber = metadata.PhoneNumber;
      }

      await payment.markAsCompleted({
        mpesaReceiptNumber: payment.mpesaDetails.mpesaReceiptNumber,
        transactionDate: payment.mpesaDetails.transactionDate
      });

      console.log(`Payment ${payment._id} completed successfully. Receipt: ${payment.mpesaDetails.mpesaReceiptNumber}`);
    } else {
      // Payment failed or cancelled
      await payment.markAsFailed(resultDesc, resultCode);
      console.log(`Payment ${payment._id} failed. Code: ${resultCode}, Desc: ${resultDesc}`);
    }

    // Log callback transaction
    await logTransaction('CALLBACK_RECEIVED', {
      transactionId: checkoutRequestID,
      request: callbackData,
      response: { success: true },
      statusCode: 200,
      duration: Date.now() - startTime,
      success: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      mpesaRequestId: merchantRequestID,
      mpesaResponseCode: resultCode.toString(),
      mpesaResponseDescription: resultDesc
    }, payment._id);

    res.status(200).json({
      success: true,
      message: 'Callback processed successfully'
    });

  } catch (error) {
    console.error('STK Push callback error:', error);

    // Log failed callback
    await logTransaction('CALLBACK_RECEIVED', {
      transactionId: `callback-failed-${Date.now()}`,
      request: req.body,
      response: null,
      statusCode: 500,
      duration: Date.now() - startTime,
      success: false,
      error: { message: error.message, code: error.code },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(500).json({
      success: false,
      message: 'Error processing payment callback',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Query STK Push status
const queryPaymentStatus = async (req, res) => {
  const startTime = Date.now();

  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if user has permission to view this payment
    if (payment.clientId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // If payment is already completed or failed, return current status
    if (['completed', 'failed', 'cancelled'].includes(payment.status)) {
      return res.json({
        success: true,
        payment: payment.summary,
        message: `Payment is ${payment.status}`
      });
    }

    // Query M-Pesa for current status if payment is pending
    if (payment.method === 'mpesa' && payment.mpesaDetails.checkoutRequestID) {
      try {
        const statusResponse = await mpesaService.querySTKPushStatus(
          payment.mpesaDetails.checkoutRequestID
        );

        // Update payment status based on query result
        if (statusResponse.resultCode === 0) {
          await payment.markAsCompleted();
        } else if (statusResponse.resultCode !== 1032) { // 1032 = Request cancelled by user
          await payment.markAsFailed(statusResponse.resultDesc, statusResponse.resultCode);
        }

        // Log status query
        await logTransaction('STK_PUSH_QUERY', {
          transactionId: payment.mpesaDetails.checkoutRequestID,
          request: { checkoutRequestID: payment.mpesaDetails.checkoutRequestID },
          response: statusResponse,
          statusCode: 200,
          duration: Date.now() - startTime,
          success: true,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          mpesaRequestId: payment.mpesaDetails.merchantRequestID,
          mpesaResponseCode: statusResponse.resultCode.toString(),
          mpesaResponseDescription: statusResponse.resultDesc
        }, payment._id, req.user._id);

      } catch (error) {
        console.error('Status query error:', error);
        // Don't fail the request if status query fails
      }
    }

    res.json({
      success: true,
      payment: payment.summary,
      mpesaDetails: payment.method === 'mpesa' ? {
        checkoutRequestID: payment.mpesaDetails.checkoutRequestID,
        stkPushStatus: payment.mpesaDetails.stkPushStatus,
        resultCode: payment.mpesaDetails.resultCode,
        resultDesc: payment.mpesaDetails.resultDesc,
        mpesaReceiptNumber: payment.mpesaDetails.mpesaReceiptNumber
      } : null
    });

  } catch (error) {
    console.error('Payment status query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to query payment status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all payments for a user with enhanced filtering
const getPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      method,
      paymentType,
      startDate,
      endDate,
      search
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query based on user role
    let query = {};
    if (req.user.role === 'admin') {
      // Admin can see all payments
      if (req.query.clientId) {
        query.clientId = req.query.clientId;
      }
    } else {
      // Regular users can only see their own payments
      query.clientId = req.user._id;
    }

    if (status) query.status = status;
    if (method) query.method = method;
    if (paymentType) query.paymentType = paymentType;

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { 'mpesaDetails.mpesaReceiptNumber': { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } }
      ];
    }

    const payments = await Payment.find(query)
      .populate('clientId', 'firstName lastName email')
      .populate('appointmentId', 'date time status')
      .populate('caseId', 'caseNumber title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    // Get payment statistics
    const stats = await Payment.getPaymentStats(
      req.user.role === 'admin' ? req.query.clientId : req.user._id,
      startDate,
      endDate
    );

    res.json({
      success: true,
      payments: payments.map(payment => payment.summary),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      stats
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Initiate B2C payment (refunds)
const initiateRefund = async (req, res) => {
  const startTime = Date.now();

  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    // Only admins can initiate refunds
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can initiate refunds.'
      });
    }

    const originalPayment = await Payment.findById(paymentId)
      .populate('clientId', 'firstName lastName phoneNumber');

    if (!originalPayment) {
      return res.status(404).json({
        success: false,
        message: 'Original payment not found'
      });
    }

    if (originalPayment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only refund completed payments'
      });
    }

    const refundAmount = amount || originalPayment.amount;
    if (refundAmount > originalPayment.amount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed original payment amount'
      });
    }

    // Create refund payment record
    const refundPayment = new Payment({
      clientId: originalPayment.clientId._id,
      appointmentId: originalPayment.appointmentId,
      caseId: originalPayment.caseId,
      amount: refundAmount,
      currency: originalPayment.currency,
      method: 'mpesa',
      paymentType: 'refund',
      description: `Refund for payment ${originalPayment._id}`,
      status: 'processing',
      createdBy: req.user._id,
      mpesaDetails: {
        phoneNumber: originalPayment.mpesaDetails.phoneNumber,
        accountReference: `REFUND-${originalPayment._id}`,
        transactionDesc: reason || 'Payment refund'
      }
    });

    await refundPayment.save();

    // Initiate B2C payment
    const b2cResponse = await mpesaService.initiateB2CPayment(
      originalPayment.mpesaDetails.phoneNumber,
      refundAmount,
      reason || 'Payment refund',
      'Refund'
    );

    // Update refund payment with B2C response
    refundPayment.mpesaDetails.conversationID = b2cResponse.conversationID;
    refundPayment.mpesaDetails.originatorConversationID = b2cResponse.originatorConversationID;
    refundPayment.mpesaDetails.requestPayload = {
      phoneNumber: originalPayment.mpesaDetails.phoneNumber,
      amount: refundAmount,
      remarks: reason || 'Payment refund'
    };
    refundPayment.mpesaDetails.responsePayload = b2cResponse;

    await refundPayment.save();

    // Update original payment refund information
    originalPayment.refundAmount = (originalPayment.refundAmount || 0) + refundAmount;
    originalPayment.refundReason = reason;
    originalPayment.refundedBy = req.user._id;

    if (originalPayment.refundAmount >= originalPayment.amount) {
      originalPayment.status = 'refunded';
      originalPayment.refundedAt = new Date();
    } else {
      originalPayment.status = 'partially_refunded';
    }

    await originalPayment.save();

    // Log B2C transaction
    await logTransaction('B2C_PAYMENT', {
      transactionId: b2cResponse.conversationID,
      request: refundPayment.mpesaDetails.requestPayload,
      response: b2cResponse,
      statusCode: 200,
      duration: Date.now() - startTime,
      success: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      mpesaRequestId: b2cResponse.originatorConversationID,
      mpesaResponseCode: b2cResponse.responseCode,
      mpesaResponseDescription: b2cResponse.responseDescription
    }, refundPayment._id, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Refund initiated successfully',
      data: {
        refundPaymentId: refundPayment._id,
        conversationID: b2cResponse.conversationID,
        originatorConversationID: b2cResponse.originatorConversationID,
        amount: refundPayment.formattedAmount,
        phoneNumber: refundPayment.formattedPhoneNumber
      }
    });

  } catch (error) {
    console.error('Refund initiation error:', error);

    // Log failed refund
    await logTransaction('B2C_PAYMENT', {
      transactionId: `refund-failed-${Date.now()}`,
      request: req.body,
      response: null,
      statusCode: 500,
      duration: Date.now() - startTime,
      success: false,
      error: { message: error.message, code: error.code },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }, null, req.user._id);

    res.status(500).json({
      success: false,
      message: 'Failed to initiate refund',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Handle B2C callback
const handleB2CCallback = async (req, res) => {
  const startTime = Date.now();

  try {
    const callbackData = req.body;
    console.log('B2C callback received:', JSON.stringify(callbackData, null, 2));

    // Validate callback data
    const validatedCallback = mpesaService.validateCallbackData(callbackData);

    if (validatedCallback.type !== 'B2C') {
      throw new Error('Invalid callback type for B2C');
    }

    const {
      conversationID,
      originatorConversationID,
      resultCode,
      resultDesc,
      resultParameters
    } = validatedCallback;

    // Find refund payment by conversationID
    const refundPayment = await Payment.findOne({
      'mpesaDetails.conversationID': conversationID
    });

    if (!refundPayment) {
      console.error('Refund payment not found for conversationID:', conversationID);
      return res.status(404).json({
        success: false,
        message: 'Refund payment record not found'
      });
    }

    // Update refund payment with callback data
    refundPayment.mpesaDetails.callbackPayload = callbackData;
    refundPayment.mpesaDetails.callbackReceived = true;
    refundPayment.mpesaDetails.callbackReceivedAt = new Date();
    refundPayment.mpesaDetails.resultCode = resultCode;
    refundPayment.mpesaDetails.resultDesc = resultDesc;

    if (resultCode === 0) {
      // Refund successful
      if (resultParameters && resultParameters.ResultParameter) {
        // Extract refund details from result parameters
        const parameters = {};
        resultParameters.ResultParameter.forEach(param => {
          parameters[param.Key] = param.Value;
        });

        refundPayment.mpesaDetails.mpesaReceiptNumber = parameters.TransactionReceipt;
        refundPayment.mpesaDetails.transactionDate = new Date();
      }

      await refundPayment.markAsCompleted({
        mpesaReceiptNumber: refundPayment.mpesaDetails.mpesaReceiptNumber,
        transactionDate: refundPayment.mpesaDetails.transactionDate
      });

      console.log(`Refund ${refundPayment._id} completed successfully. Receipt: ${refundPayment.mpesaDetails.mpesaReceiptNumber}`);
    } else {
      // Refund failed
      await refundPayment.markAsFailed(resultDesc, resultCode);
      console.log(`Refund ${refundPayment._id} failed. Code: ${resultCode}, Desc: ${resultDesc}`);
    }

    // Log callback transaction
    await logTransaction('CALLBACK_RECEIVED', {
      transactionId: conversationID,
      request: callbackData,
      response: { success: true },
      statusCode: 200,
      duration: Date.now() - startTime,
      success: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      mpesaRequestId: originatorConversationID,
      mpesaResponseCode: resultCode.toString(),
      mpesaResponseDescription: resultDesc
    }, refundPayment._id);

    res.status(200).json({
      success: true,
      message: 'B2C callback processed successfully'
    });

  } catch (error) {
    console.error('B2C callback error:', error);

    // Log failed callback
    await logTransaction('CALLBACK_RECEIVED', {
      transactionId: `b2c-callback-failed-${Date.now()}`,
      request: req.body,
      response: null,
      statusCode: 500,
      duration: Date.now() - startTime,
      success: false,
      error: { message: error.message, code: error.code },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(500).json({
      success: false,
      message: 'Error processing B2C callback',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get transaction analytics (admin only)
const getTransactionAnalytics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { startDate, endDate } = req.query;

    // Get transaction statistics from TransactionLog
    const transactionStats = await TransactionLog.getTransactionStats(startDate, endDate);
    const errorAnalysis = await TransactionLog.getErrorAnalysis(startDate, endDate);

    // Get payment statistics
    const paymentStats = await Payment.aggregate([
      {
        $match: startDate && endDate ? {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        } : {}
      },
      {
        $group: {
          _id: {
            status: '$status',
            method: '$method'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      analytics: {
        transactionStats,
        errorAnalysis,
        paymentStats
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  // Payment initiation
  initiateSTKPush,
  validatePaymentInitiation,

  // Payment management
  getPayments,
  queryPaymentStatus,

  // Refunds
  initiateRefund,

  // Callbacks
  handleSTKCallback,
  handleB2CCallback,

  // Analytics
  getTransactionAnalytics,

  // Legacy support (deprecated)
  initiatePayment: initiateSTKPush,
  paymentCallback: handleSTKCallback
};
