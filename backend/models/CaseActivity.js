// Case Activity Model - LegalPro v1.0.1
// Comprehensive audit trail and activity logging for legal cases

const mongoose = require('mongoose');

// Activity type enumeration
const ACTIVITY_TYPE = {
  CASE_CREATED: 'case_created',
  CASE_UPDATED: 'case_updated',
  STATUS_CHANGED: 'status_changed',
  ADVOCATE_ASSIGNED: 'advocate_assigned',
  ADVOCATE_REMOVED: 'advocate_removed',
  CLIENT_ADDED: 'client_added',
  CLIENT_REMOVED: 'client_removed',
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_DOWNLOADED: 'document_downloaded',
  DOCUMENT_DELETED: 'document_deleted',
  NOTE_ADDED: 'note_added',
  NOTE_UPDATED: 'note_updated',
  NOTE_DELETED: 'note_deleted',
  COURT_DATE_SET: 'court_date_set',
  COURT_DATE_UPDATED: 'court_date_updated',
  BILLING_UPDATED: 'billing_updated',
  PAYMENT_RECEIVED: 'payment_received',
  DEADLINE_SET: 'deadline_set',
  DEADLINE_MISSED: 'deadline_missed',
  CASE_ARCHIVED: 'case_archived',
  CASE_RESTORED: 'case_restored',
  PERMISSION_CHANGED: 'permission_changed',
  SYSTEM_ACTION: 'system_action',
  EMAIL_SENT: 'email_sent',
  SMS_SENT: 'sms_sent',
  LOGIN_ACCESS: 'login_access',
  EXPORT_DATA: 'export_data',
  PRINT_DOCUMENT: 'print_document',
  OTHER: 'other'
};

// Activity priority enumeration
const ACTIVITY_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

const caseActivitySchema = new mongoose.Schema({
  // Case Reference
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: [true, 'Case ID is required'],
    index: true
  },
  
  // Activity Details
  activityType: {
    type: String,
    enum: Object.values(ACTIVITY_TYPE),
    required: [true, 'Activity type is required'],
    index: true
  },
  
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true,
    maxlength: [200, 'Action cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Activity Priority
  priority: {
    type: String,
    enum: Object.values(ACTIVITY_PRIORITY),
    default: ACTIVITY_PRIORITY.MEDIUM,
    index: true
  },
  
  // Detailed Information
  details: {
    // Previous values (for updates)
    previousValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    
    // Additional context
    reason: String,
    notes: String,
    
    // System information
    userAgent: String,
    ipAddress: String,
    sessionId: String,
    
    // Related data
    affectedFields: [String],
    metadata: mongoose.Schema.Types.Mixed
  },
  
  // User Information
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Performer is required'],
    index: true
  },
  
  performedAt: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  
  // Related Objects
  relatedDocument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CaseDocument'
  },
  
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  relatedNote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CaseNote'
  },
  
  // System Fields
  isSystemGenerated: {
    type: Boolean,
    default: false,
    index: true
  },
  
  isVisible: {
    type: Boolean,
    default: true,
    index: true
  },
  
  isImportant: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Notification tracking
  notificationSent: {
    type: Boolean,
    default: false
  },
  
  notificationRecipients: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    method: {
      type: String,
      enum: ['email', 'sms', 'push', 'in_app']
    },
    sentAt: Date,
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed']
    }
  }],
  
  // Categorization
  category: {
    type: String,
    enum: ['case_management', 'document_management', 'user_management', 'billing', 'communication', 'system', 'security'],
    default: 'case_management',
    index: true
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  // Audit trail
  auditTrail: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'api', 'system', 'import'],
      default: 'web'
    },
    version: {
      type: String,
      default: '1.0.1'
    },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'production'
    }
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
caseActivitySchema.index({ caseId: 1, performedAt: -1 });
caseActivitySchema.index({ performedBy: 1, performedAt: -1 });
caseActivitySchema.index({ activityType: 1, performedAt: -1 });
caseActivitySchema.index({ category: 1, priority: 1 });
caseActivitySchema.index({ isSystemGenerated: 1, isVisible: 1 });
caseActivitySchema.index({ isImportant: 1, performedAt: -1 });

// Text search index
caseActivitySchema.index({
  action: 'text',
  description: 'text',
  'details.reason': 'text',
  'details.notes': 'text'
});

// Compound indexes for common queries
caseActivitySchema.index({ caseId: 1, activityType: 1, performedAt: -1 });
caseActivitySchema.index({ performedBy: 1, category: 1, performedAt: -1 });

// Virtual for activity age
caseActivitySchema.virtual('ageInMinutes').get(function() {
  return Math.floor((Date.now() - this.performedAt) / (1000 * 60));
});

// Virtual for activity age in hours
caseActivitySchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.performedAt) / (1000 * 60 * 60));
});

// Virtual for activity age in days
caseActivitySchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.performedAt) / (1000 * 60 * 60 * 24));
});

// Virtual for formatted time
caseActivitySchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.performedAt;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  
  return this.performedAt.toLocaleDateString();
});

// Instance methods
caseActivitySchema.methods.canUserView = async function(user) {
  // Check if user can access the case
  const Case = mongoose.model('Case');
  const caseDoc = await Case.findById(this.caseId);
  
  if (!caseDoc) return false;
  
  return caseDoc.canUserAccess(user);
};

caseActivitySchema.methods.markAsImportant = function() {
  this.isImportant = true;
  return this.save();
};

caseActivitySchema.methods.hide = function() {
  this.isVisible = false;
  return this.save();
};

caseActivitySchema.methods.addNotificationRecipient = function(userId, method) {
  this.notificationRecipients.push({
    userId: userId,
    method: method,
    status: 'pending'
  });
  return this.save();
};

caseActivitySchema.methods.updateNotificationStatus = function(userId, method, status) {
  const recipient = this.notificationRecipients.find(r => 
    r.userId.toString() === userId.toString() && r.method === method
  );
  
  if (recipient) {
    recipient.status = status;
    if (status === 'sent') {
      recipient.sentAt = new Date();
    }
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Static methods
caseActivitySchema.statics.createActivity = function(activityData) {
  const activity = new this({
    caseId: activityData.caseId,
    activityType: activityData.activityType,
    action: activityData.action,
    description: activityData.description,
    performedBy: activityData.performedBy,
    details: activityData.details || {},
    priority: activityData.priority || ACTIVITY_PRIORITY.MEDIUM,
    category: activityData.category || 'case_management',
    isSystemGenerated: activityData.isSystemGenerated || false,
    relatedDocument: activityData.relatedDocument,
    relatedUser: activityData.relatedUser,
    relatedNote: activityData.relatedNote
  });
  
  return activity.save();
};

caseActivitySchema.statics.getCaseTimeline = function(caseId, options = {}) {
  const query = { 
    caseId: caseId, 
    isVisible: true 
  };
  
  if (options.activityTypes) {
    query.activityType = { $in: options.activityTypes };
  }
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.priority) {
    query.priority = options.priority;
  }
  
  if (options.dateFrom) {
    query.performedAt = { $gte: options.dateFrom };
  }
  
  if (options.dateTo) {
    query.performedAt = { ...query.performedAt, $lte: options.dateTo };
  }
  
  return this.find(query)
    .populate('performedBy', 'firstName lastName email role')
    .populate('relatedUser', 'firstName lastName email')
    .populate('relatedDocument', 'originalName documentType')
    .sort({ performedAt: -1 })
    .limit(options.limit || 100);
};

caseActivitySchema.statics.getUserActivity = function(userId, options = {}) {
  const query = { 
    performedBy: userId,
    isVisible: true 
  };
  
  if (options.caseId) {
    query.caseId = options.caseId;
  }
  
  return this.find(query)
    .populate('caseId', 'title caseNumber')
    .sort({ performedAt: -1 })
    .limit(options.limit || 50);
};

caseActivitySchema.statics.getActivityStats = function(caseId, dateFrom, dateTo) {
  const matchStage = { 
    caseId: mongoose.Types.ObjectId(caseId),
    isVisible: true
  };
  
  if (dateFrom || dateTo) {
    matchStage.performedAt = {};
    if (dateFrom) matchStage.performedAt.$gte = dateFrom;
    if (dateTo) matchStage.performedAt.$lte = dateTo;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          type: '$activityType',
          category: '$category'
        },
        count: { $sum: 1 },
        lastActivity: { $max: '$performedAt' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Export constants and model
module.exports = mongoose.model('CaseActivity', caseActivitySchema);
module.exports.ACTIVITY_TYPE = ACTIVITY_TYPE;
module.exports.ACTIVITY_PRIORITY = ACTIVITY_PRIORITY;
