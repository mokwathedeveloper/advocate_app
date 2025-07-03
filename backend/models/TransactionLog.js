// Transaction Log model for M-Pesa audit trail - LegalPro v1.0.1
const mongoose = require('mongoose');

const transactionLogSchema = new mongoose.Schema({
  // Transaction identification
  transactionId: {
    type: String,
    required: true,
    index: true
  },
  
  // Transaction type
  transactionType: {
    type: String,
    required: true,
    enum: [
      'STK_PUSH',
      'STK_PUSH_QUERY',
      'B2C_PAYMENT',
      'ACCOUNT_BALANCE',
      'TRANSACTION_REVERSAL',
      'CALLBACK_RECEIVED'
    ],
    index: true
  },
  
  // Related payment record
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    index: true
  },
  
  // User who initiated the transaction
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Request details
  requestData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Response details
  responseData: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // HTTP status code
  statusCode: {
    type: Number,
    index: true
  },
  
  // Request duration in milliseconds
  duration: {
    type: Number
  },
  
  // Success/failure status
  success: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Error details (if any)
  errorMessage: {
    type: String
  },
  errorCode: {
    type: String
  },
  errorStack: {
    type: String
  },
  
  // Request metadata
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  
  // M-Pesa specific fields
  mpesaRequestId: {
    type: String,
    index: true
  },
  mpesaResponseCode: {
    type: String
  },
  mpesaResponseDescription: {
    type: String
  },
  
  // Environment information
  environment: {
    type: String,
    enum: ['sandbox', 'production'],
    default: 'sandbox'
  },
  
  // Retry information
  isRetry: {
    type: Boolean,
    default: false
  },
  retryAttempt: {
    type: Number,
    default: 0
  },
  originalTransactionId: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
transactionLogSchema.index({ transactionType: 1, createdAt: -1 });
transactionLogSchema.index({ success: 1, createdAt: -1 });
transactionLogSchema.index({ paymentId: 1, transactionType: 1 });
transactionLogSchema.index({ userId: 1, createdAt: -1 });
transactionLogSchema.index({ createdAt: -1 }); // For cleanup operations

// Virtual for formatted duration
transactionLogSchema.virtual('formattedDuration').get(function() {
  if (!this.duration) return 'N/A';
  if (this.duration < 1000) return `${this.duration}ms`;
  return `${(this.duration / 1000).toFixed(2)}s`;
});

// Virtual for transaction summary
transactionLogSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    type: this.transactionType,
    success: this.success,
    duration: this.formattedDuration,
    timestamp: this.createdAt,
    statusCode: this.statusCode
  };
});

// Static methods
transactionLogSchema.statics.logTransaction = async function(data) {
  try {
    const log = new this(data);
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to log transaction:', error);
    // Don't throw error to avoid breaking the main transaction flow
    return null;
  }
};

transactionLogSchema.statics.getTransactionStats = function(startDate, endDate) {
  const matchStage = {};
  
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
        _id: {
          type: '$transactionType',
          success: '$success'
        },
        count: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
        maxDuration: { $max: '$duration' },
        minDuration: { $min: '$duration' }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        total: { $sum: '$count' },
        successful: {
          $sum: {
            $cond: [{ $eq: ['$_id.success', true] }, '$count', 0]
          }
        },
        failed: {
          $sum: {
            $cond: [{ $eq: ['$_id.success', false] }, '$count', 0]
          }
        },
        avgDuration: { $avg: '$avgDuration' },
        maxDuration: { $max: '$maxDuration' },
        minDuration: { $min: '$minDuration' }
      }
    },
    {
      $project: {
        transactionType: '$_id',
        total: 1,
        successful: 1,
        failed: 1,
        successRate: {
          $multiply: [
            { $divide: ['$successful', '$total'] },
            100
          ]
        },
        avgDuration: { $round: ['$avgDuration', 2] },
        maxDuration: 1,
        minDuration: 1
      }
    },
    { $sort: { total: -1 } }
  ]);
};

transactionLogSchema.statics.getErrorAnalysis = function(startDate, endDate) {
  const matchStage = { success: false };
  
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
        _id: {
          type: '$transactionType',
          errorCode: '$errorCode',
          errorMessage: '$errorMessage'
        },
        count: { $sum: 1 },
        lastOccurrence: { $max: '$createdAt' }
      }
    },
    { $sort: { count: -1, lastOccurrence: -1 } },
    { $limit: 50 } // Top 50 errors
  ]);
};

transactionLogSchema.statics.cleanupOldLogs = function(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate }
  });
};

// Pre-save middleware
transactionLogSchema.pre('save', function(next) {
  // Ensure environment is set
  if (!this.environment) {
    this.environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
  }
  
  // Set success flag based on status code
  if (this.statusCode && !this.hasOwnProperty('success')) {
    this.success = this.statusCode >= 200 && this.statusCode < 300;
  }
  
  next();
});

module.exports = mongoose.model('TransactionLog', transactionLogSchema);
