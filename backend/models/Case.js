// Enhanced Case Model - LegalPro v1.0.1
// Comprehensive case management model with advanced legal case tracking

const mongoose = require('mongoose');
const { USER_ROLES } = require('../config/auth');

// Case status enumeration
const CASE_STATUS = {
  DRAFT: 'draft',
  OPEN: 'open',
  IN_REVIEW: 'in_review',
  ON_HOLD: 'on_hold',
  PENDING: 'pending',
  CLOSED: 'closed',
  DISMISSED: 'dismissed',
  ARCHIVED: 'archived'
};

// Case type enumeration
const CASE_TYPE = {
  CIVIL: 'civil',
  CRIMINAL: 'criminal',
  FAMILY: 'family',
  CORPORATE: 'corporate',
  PROPERTY: 'property',
  EMPLOYMENT: 'employment',
  IMMIGRATION: 'immigration',
  INTELLECTUAL_PROPERTY: 'intellectual_property',
  TAX: 'tax',
  CONSTITUTIONAL: 'constitutional',
  ADMINISTRATIVE: 'administrative',
  OTHER: 'other'
};

// Case priority enumeration
const CASE_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
  CRITICAL: 'critical'
};

// Payment status enumeration
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
  WAIVED: 'waived'
};

// Billing type enumeration
const BILLING_TYPE = {
  HOURLY: 'hourly',
  FIXED: 'fixed',
  CONTINGENCY: 'contingency',
  RETAINER: 'retainer',
  PRO_BONO: 'pro_bono'
};

const caseSchema = new mongoose.Schema({
  // Case Identification
  caseNumber: {
    type: String,
    unique: true,
    required: true,
    index: true
  },

  title: {
    type: String,
    required: [true, 'Case title is required'],
    trim: true,
    maxlength: [200, 'Case title cannot exceed 200 characters']
  },

  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Case description cannot exceed 2000 characters']
  },

  caseType: {
    type: String,
    enum: Object.values(CASE_TYPE),
    required: [true, 'Case type is required'],
    index: true
  },

  status: {
    type: String,
    enum: Object.values(CASE_STATUS),
    default: CASE_STATUS.DRAFT,
    index: true
  },

  priority: {
    type: String,
    enum: Object.values(CASE_PRIORITY),
    default: CASE_PRIORITY.MEDIUM,
    index: true
  },

  // Client Information
  client: {
    primary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Primary client is required']
    },
    additional: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },

  // Advocate Assignment
  advocate: {
    primary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Primary advocate is required']
    },
    secondary: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },

  // Court Details
  courtDetails: {
    courtName: {
      type: String,
      trim: true,
      maxlength: [200, 'Court name cannot exceed 200 characters']
    },
    courtCaseNumber: {
      type: String,
      trim: true,
      maxlength: [100, 'Court case number cannot exceed 100 characters']
    },
    judge: {
      type: String,
      trim: true,
      maxlength: [100, 'Judge name cannot exceed 100 characters']
    },
    nextHearing: {
      type: Date,
      index: true
    },
    courtLocation: {
      type: String,
      trim: true,
      maxlength: [200, 'Court location cannot exceed 200 characters']
    }
  },

  // Financial Information
  billing: {
    estimatedCost: {
      type: Number,
      min: [0, 'Estimated cost cannot be negative'],
      default: 0
    },
    actualCost: {
      type: Number,
      min: [0, 'Actual cost cannot be negative'],
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING
    },
    billingType: {
      type: String,
      enum: Object.values(BILLING_TYPE),
      default: BILLING_TYPE.HOURLY
    },
    hourlyRate: {
      type: Number,
      min: [0, 'Hourly rate cannot be negative']
    },
    retainerAmount: {
      type: Number,
      min: [0, 'Retainer amount cannot be negative']
    }
  },

  // Important Dates
  dateCreated: {
    type: Date,
    default: Date.now,
    index: true
  },

  dateAssigned: {
    type: Date,
    index: true
  },

  expectedCompletion: {
    type: Date,
    index: true
  },

  actualCompletion: {
    type: Date,
    index: true
  },

  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Progress and Status
  progress: {
    type: Number,
    min: [0, 'Progress cannot be less than 0'],
    max: [100, 'Progress cannot be more than 100'],
    default: 0
  },

  outcome: {
    type: String,
    trim: true,
    maxlength: [1000, 'Outcome cannot exceed 1000 characters']
  },

  notes: {
    type: String,
    trim: true,
    maxlength: [5000, 'Notes cannot exceed 5000 characters']
  },

  // Tags and Categories
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],

  // System Fields
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },

  isUrgent: {
    type: Boolean,
    default: false,
    index: true
  },

  isConfidential: {
    type: Boolean,
    default: true
  },

  // User Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance
caseSchema.index({ caseNumber: 1 });
caseSchema.index({ status: 1, priority: 1 });
caseSchema.index({ 'client.primary': 1 });
caseSchema.index({ 'advocate.primary': 1 });
caseSchema.index({ caseType: 1, status: 1 });
caseSchema.index({ dateCreated: -1 });
caseSchema.index({ lastActivity: -1 });
caseSchema.index({ 'courtDetails.nextHearing': 1 });
caseSchema.index({ isActive: 1, isArchived: 1 });

// Text search index
caseSchema.index({
  title: 'text',
  description: 'text',
  notes: 'text',
  'courtDetails.courtName': 'text',
  'courtDetails.judge': 'text'
});

// Virtual for case age in days
caseSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.dateCreated) / (1000 * 60 * 60 * 24));
});

// Virtual for days until expected completion
caseSchema.virtual('daysUntilCompletion').get(function() {
  if (!this.expectedCompletion) return null;
  return Math.floor((this.expectedCompletion - Date.now()) / (1000 * 60 * 60 * 24));
});

// Virtual for case duration (if completed)
caseSchema.virtual('durationInDays').get(function() {
  if (!this.actualCompletion) return null;
  return Math.floor((this.actualCompletion - this.dateCreated) / (1000 * 60 * 60 * 24));
});

// Virtual for all involved users
caseSchema.virtual('allInvolvedUsers').get(function() {
  const users = [this.client.primary, this.advocate.primary];
  if (this.client.additional) users.push(...this.client.additional);
  if (this.advocate.secondary) users.push(...this.advocate.secondary);
  return [...new Set(users.map(id => id.toString()))];
});

// Pre-save middleware
caseSchema.pre('save', async function(next) {
  // Generate case number if not provided
  if (!this.caseNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      dateCreated: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.caseNumber = `CASE-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // Set dateAssigned when advocate is first assigned
  if (this.advocate.primary && !this.dateAssigned) {
    this.dateAssigned = new Date();
  }

  // Update lastActivity
  this.lastActivity = new Date();

  // Auto-complete case if status is closed or dismissed
  if ((this.status === CASE_STATUS.CLOSED || this.status === CASE_STATUS.DISMISSED) && !this.actualCompletion) {
    this.actualCompletion = new Date();
    this.progress = 100;
  }

  next();
});

// Instance methods
caseSchema.methods.canUserAccess = function(user) {
  // Super admin and admin can access all cases
  if ([USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN].includes(user.role)) {
    return true;
  }

  // Primary advocate can access
  if (this.advocate.primary.toString() === user._id.toString()) {
    return true;
  }

  // Secondary advocates can access
  if (this.advocate.secondary && this.advocate.secondary.some(id => id.toString() === user._id.toString())) {
    return true;
  }

  // Primary client can access
  if (this.client.primary.toString() === user._id.toString()) {
    return true;
  }

  // Additional clients can access
  if (this.client.additional && this.client.additional.some(id => id.toString() === user._id.toString())) {
    return true;
  }

  return false;
};

caseSchema.methods.canUserEdit = function(user) {
  // Clients cannot edit cases
  if (user.role === USER_ROLES.CLIENT) {
    return false;
  }

  // Check if user can access the case
  return this.canUserAccess(user);
};

// Static methods
caseSchema.statics.findByUser = function(userId, userRole) {
  let query = {};

  if ([USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN].includes(userRole)) {
    // Admin can see all active cases
    query = { isActive: true };
  } else if (userRole === USER_ROLES.ADVOCATE) {
    // Advocates can see their assigned cases
    query = {
      $or: [
        { 'advocate.primary': userId },
        { 'advocate.secondary': userId }
      ],
      isActive: true
    };
  } else if (userRole === USER_ROLES.CLIENT) {
    // Clients can see their own cases
    query = {
      $or: [
        { 'client.primary': userId },
        { 'client.additional': userId }
      ],
      isActive: true
    };
  }

  return this.find(query);
};

caseSchema.statics.getStatusCounts = function(userId, userRole) {
  const matchStage = {};

  if (![USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN].includes(userRole)) {
    if (userRole === USER_ROLES.ADVOCATE) {
      matchStage.$or = [
        { 'advocate.primary': userId },
        { 'advocate.secondary': userId }
      ];
    } else if (userRole === USER_ROLES.CLIENT) {
      matchStage.$or = [
        { 'client.primary': userId },
        { 'client.additional': userId }
      ];
    }
  }

  return this.aggregate([
    { $match: { ...matchStage, isActive: true } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
};

// Export constants and model
module.exports = mongoose.model('Case', caseSchema);
module.exports.CASE_STATUS = CASE_STATUS;
module.exports.CASE_TYPE = CASE_TYPE;
module.exports.CASE_PRIORITY = CASE_PRIORITY;
module.exports.PAYMENT_STATUS = PAYMENT_STATUS;
module.exports.BILLING_TYPE = BILLING_TYPE;