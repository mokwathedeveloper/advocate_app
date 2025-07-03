// Enhanced Payment model for LegalPro v1.0.1 with comprehensive M-Pesa integration
const mongoose = require('mongoose');

// M-Pesa specific schema for detailed transaction tracking
const mpesaDetailsSchema = new mongoose.Schema({
  // STK Push specific fields
  merchantRequestID: {
    type: String,
    index: true
  },
  checkoutRequestID: {
    type: String,
    unique: true,
    sparse: true
  },

  // M-Pesa transaction details
  mpesaReceiptNumber: {
    type: String,
    sparse: true
  },
  transactionDate: {
    type: Date
  },
  phoneNumber: {
    type: String,
    required: function() {
      return this.parent().method === 'mpesa';
    }
  },

  // Transaction metadata
  accountReference: {
    type: String,
    default: 'LegalPro'
  },
  transactionDesc: {
    type: String,
    default: 'Legal Services Payment'
  },

  // Status tracking
  stkPushStatus: {
    type: String,
    enum: ['initiated', 'pending', 'success', 'failed', 'cancelled', 'timeout'],
    default: 'initiated'
  },
  resultCode: {
    type: Number
  },
  resultDesc: {
    type: String
  },

  // Callback tracking
  callbackReceived: {
    type: Boolean,
    default: false
  },
  callbackReceivedAt: {
    type: Date
  },

  // B2C specific fields (for refunds)
  conversationID: {
    type: String
  },
  originatorConversationID: {
    type: String
  },

  // Retry mechanism
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  lastRetryAt: {
    type: Date
  },
  nextRetryAt: {
    type: Date
  },

  // Audit trail
  requestPayload: {
    type: mongoose.Schema.Types.Mixed
  },
  responsePayload: {
    type: mongoose.Schema.Types.Mixed
  },
  callbackPayload: {
    type: mongoose.Schema.Types.Mixed
  },
  errorLogs: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    error: String,
    context: mongoose.Schema.Types.Mixed
  }]
}, {
  _id: false
});

const paymentSchema = new mongoose.Schema({
  // Basic payment information
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    index: true
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    index: true
  },

  // Payment details
  amount: {
    type: Number,
    required: true,
    min: [1, 'Amount must be at least 1']
  },
  currency: {
    type: String,
    default: 'KES',
    enum: ['KES', 'USD', 'EUR']
  },

  // Payment status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
    default: 'pending',
    index: true
  },

  // Payment method
  method: {
    type: String,
    enum: ['mpesa', 'card', 'bank_transfer', 'cash'],
    required: true,
    index: true
  },

  // Payment type
  paymentType: {
    type: String,
    enum: ['consultation_fee', 'case_fee', 'document_fee', 'court_fee', 'other'],
    default: 'consultation_fee'
  },

  // Legacy transaction ID (for backward compatibility)
  transactionId: {
    type: String,
    index: true
  },

  // M-Pesa specific details
  mpesaDetails: mpesaDetailsSchema,

  // Payment metadata
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },

  // Refund information
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String
  },
  refundedAt: {
    type: Date
  },
  refundedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  failedAt: {
    type: Date
  },

  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance optimization
paymentSchema.index({ clientId: 1, status: 1 });
paymentSchema.index({ appointmentId: 1, status: 1 });
paymentSchema.index({ method: 1, status: 1 });
paymentSchema.index({ 'mpesaDetails.checkoutRequestID': 1 });
paymentSchema.index({ 'mpesaDetails.mpesaReceiptNumber': 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

// Virtual for payment age in hours
paymentSchema.virtual('ageInHours').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60));
});

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return `${this.currency} ${this.amount.toLocaleString()}`;
});

// Virtual for M-Pesa phone number (formatted)
paymentSchema.virtual('formattedPhoneNumber').get(function() {
  if (this.mpesaDetails && this.mpesaDetails.phoneNumber) {
    const phone = this.mpesaDetails.phoneNumber;
    if (phone.startsWith('254')) {
      return `+${phone}`;
    }
    return phone;
  }
  return null;
});

// Virtual for payment summary
paymentSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    amount: this.formattedAmount,
    status: this.status,
    method: this.method,
    type: this.paymentType,
    createdAt: this.createdAt,
    mpesaReceipt: this.mpesaDetails?.mpesaReceiptNumber || null
  };
});

// Instance methods
paymentSchema.methods.markAsCompleted = function(mpesaData = {}) {
  this.status = 'completed';
  this.completedAt = new Date();

  if (this.method === 'mpesa' && mpesaData) {
    if (mpesaData.mpesaReceiptNumber) {
      this.mpesaDetails.mpesaReceiptNumber = mpesaData.mpesaReceiptNumber;
    }
    if (mpesaData.transactionDate) {
      this.mpesaDetails.transactionDate = new Date(mpesaData.transactionDate);
    }
    this.mpesaDetails.stkPushStatus = 'success';
    this.mpesaDetails.callbackReceived = true;
    this.mpesaDetails.callbackReceivedAt = new Date();
  }

  return this.save();
};

paymentSchema.methods.markAsFailed = function(reason, errorCode = null) {
  this.status = 'failed';
  this.failedAt = new Date();

  if (this.method === 'mpesa') {
    this.mpesaDetails.stkPushStatus = 'failed';
    this.mpesaDetails.resultCode = errorCode;
    this.mpesaDetails.resultDesc = reason;
    this.mpesaDetails.callbackReceived = true;
    this.mpesaDetails.callbackReceivedAt = new Date();
  }

  return this.save();
};

paymentSchema.methods.addErrorLog = function(error, context = {}) {
  if (!this.mpesaDetails.errorLogs) {
    this.mpesaDetails.errorLogs = [];
  }

  this.mpesaDetails.errorLogs.push({
    timestamp: new Date(),
    error: error.toString(),
    context: context
  });

  return this.save();
};

paymentSchema.methods.canRetry = function() {
  if (this.method !== 'mpesa') return false;
  if (this.status === 'completed') return false;
  if (!this.mpesaDetails) return false;

  return this.mpesaDetails.retryCount < this.mpesaDetails.maxRetries;
};

paymentSchema.methods.incrementRetry = function() {
  if (!this.mpesaDetails) return false;

  this.mpesaDetails.retryCount += 1;
  this.mpesaDetails.lastRetryAt = new Date();

  // Calculate next retry time with exponential backoff
  const backoffMinutes = Math.pow(2, this.mpesaDetails.retryCount) * 5; // 5, 10, 20 minutes
  this.mpesaDetails.nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

  return this.save();
};

// Static methods
paymentSchema.statics.findPendingMpesaPayments = function() {
  return this.find({
    method: 'mpesa',
    status: { $in: ['pending', 'processing'] },
    'mpesaDetails.checkoutRequestID': { $exists: true }
  });
};

paymentSchema.statics.findRetryablePayments = function() {
  return this.find({
    method: 'mpesa',
    status: { $in: ['pending', 'processing'] },
    'mpesaDetails.retryCount': { $lt: 3 },
    'mpesaDetails.nextRetryAt': { $lte: new Date() }
  });
};

paymentSchema.statics.getPaymentStats = function(clientId, startDate, endDate) {
  const matchStage = { clientId: clientId };

  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
};

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  // Update the updatedAt timestamp
  this.updatedAt = new Date();

  // Initialize M-Pesa details if method is mpesa
  if (this.method === 'mpesa' && !this.mpesaDetails) {
    this.mpesaDetails = {};
  }

  // Set transaction ID for backward compatibility
  if (this.method === 'mpesa' && this.mpesaDetails.checkoutRequestID && !this.transactionId) {
    this.transactionId = this.mpesaDetails.checkoutRequestID;
  }

  next();
});

// Post-save middleware for logging
paymentSchema.post('save', function(doc) {
  console.log(`Payment ${doc._id} saved with status: ${doc.status}`);
});

module.exports = mongoose.model('Payment', paymentSchema);
