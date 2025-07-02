// Case Note Model - LegalPro v1.0.1
// Secure note management for legal cases

const mongoose = require('mongoose');
const { USER_ROLES } = require('../config/auth');

// Note type enumeration
const NOTE_TYPE = {
  GENERAL: 'general',
  MEETING: 'meeting',
  PHONE_CALL: 'phone_call',
  EMAIL: 'email',
  RESEARCH: 'research',
  STRATEGY: 'strategy',
  CLIENT_INSTRUCTION: 'client_instruction',
  COURT_OBSERVATION: 'court_observation',
  WITNESS_STATEMENT: 'witness_statement',
  EVIDENCE_NOTE: 'evidence_note',
  BILLING_NOTE: 'billing_note',
  REMINDER: 'reminder',
  TODO: 'todo',
  FOLLOW_UP: 'follow_up',
  CONFIDENTIAL: 'confidential',
  OTHER: 'other'
};

// Note priority enumeration
const NOTE_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Note status enumeration
const NOTE_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
  DRAFT: 'draft'
};

const caseNoteSchema = new mongoose.Schema({
  // Case Reference
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: [true, 'Case ID is required'],
    index: true
  },
  
  // Note Content
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true,
    maxlength: [200, 'Note title cannot exceed 200 characters']
  },
  
  content: {
    type: String,
    required: [true, 'Note content is required'],
    trim: true,
    maxlength: [10000, 'Note content cannot exceed 10000 characters']
  },
  
  // Note Classification
  noteType: {
    type: String,
    enum: Object.values(NOTE_TYPE),
    default: NOTE_TYPE.GENERAL,
    index: true
  },
  
  priority: {
    type: String,
    enum: Object.values(NOTE_PRIORITY),
    default: NOTE_PRIORITY.MEDIUM,
    index: true
  },
  
  status: {
    type: String,
    enum: Object.values(NOTE_STATUS),
    default: NOTE_STATUS.ACTIVE,
    index: true
  },
  
  // Visibility and Access Control
  isPrivate: {
    type: Boolean,
    default: false,
    index: true
  },
  
  isConfidential: {
    type: Boolean,
    default: false,
    index: true
  },
  
  visibleTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  visibleToRoles: [{
    type: String,
    enum: Object.values(USER_ROLES)
  }],
  
  // Organization
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  category: {
    type: String,
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters']
  },
  
  // Relationships
  parentNote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CaseNote'
  },
  
  relatedDocuments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CaseDocument'
  }],
  
  relatedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Meeting/Call Details (for meeting and phone_call types)
  meetingDetails: {
    attendees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    duration: Number, // in minutes
    location: String,
    meetingDate: Date,
    agenda: String,
    outcomes: String
  },
  
  // Follow-up Information
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    dueDate: Date,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Reminder Settings
  reminder: {
    enabled: {
      type: Boolean,
      default: false
    },
    reminderDate: Date,
    reminderSent: {
      type: Boolean,
      default: false
    },
    reminderMethod: {
      type: String,
      enum: ['email', 'sms', 'push', 'in_app']
    }
  },
  
  // User Information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required'],
    index: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // System Fields
  isPinned: {
    type: Boolean,
    default: false,
    index: true
  },
  
  isImportant: {
    type: Boolean,
    default: false,
    index: true
  },
  
  isTemplate: {
    type: Boolean,
    default: false
  },
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  
  editHistory: [{
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    editedAt: {
      type: Date,
      default: Date.now
    },
    changes: String,
    previousContent: String
  }],
  
  // Metadata
  wordCount: {
    type: Number,
    default: 0
  },
  
  readCount: {
    type: Number,
    default: 0
  },
  
  lastRead: {
    type: Date
  },
  
  lastReadBy: {
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
caseNoteSchema.index({ caseId: 1, createdAt: -1 });
caseNoteSchema.index({ createdBy: 1, createdAt: -1 });
caseNoteSchema.index({ noteType: 1, priority: 1 });
caseNoteSchema.index({ status: 1, isPrivate: 1 });
caseNoteSchema.index({ isPinned: 1, isImportant: 1 });
caseNoteSchema.index({ 'followUp.required': 1, 'followUp.dueDate': 1 });
caseNoteSchema.index({ 'reminder.enabled': 1, 'reminder.reminderDate': 1 });

// Text search index
caseNoteSchema.index({
  title: 'text',
  content: 'text',
  tags: 'text',
  category: 'text'
});

// Virtual for note age
caseNoteSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for content preview
caseNoteSchema.virtual('contentPreview').get(function() {
  return this.content.length > 200 ? this.content.substring(0, 200) + '...' : this.content;
});

// Virtual for estimated reading time
caseNoteSchema.virtual('estimatedReadingTime').get(function() {
  const wordsPerMinute = 200;
  const words = this.wordCount || this.content.split(' ').length;
  return Math.ceil(words / wordsPerMinute);
});

// Pre-save middleware
caseNoteSchema.pre('save', function(next) {
  // Update word count
  this.wordCount = this.content.split(' ').length;
  
  // Update version if content changed
  if (this.isModified('content') && !this.isNew) {
    this.version += 1;
  }
  
  next();
});

// Instance methods
caseNoteSchema.methods.canUserView = async function(user) {
  // Check if user can access the case
  const Case = mongoose.model('Case');
  const caseDoc = await Case.findById(this.caseId);
  
  if (!caseDoc || !caseDoc.canUserAccess(user)) {
    return false;
  }
  
  // Super admin and admin can view all notes
  if ([USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN].includes(user.role)) {
    return true;
  }
  
  // Creator can always view their notes
  if (this.createdBy.toString() === user._id.toString()) {
    return true;
  }
  
  // Check if note is private
  if (this.isPrivate) {
    // Check if user is in visibleTo list
    if (this.visibleTo.some(id => id.toString() === user._id.toString())) {
      return true;
    }
    
    // Check if user role is in visibleToRoles
    if (this.visibleToRoles.includes(user.role)) {
      return true;
    }
    
    return false;
  }
  
  // Check if note is confidential
  if (this.isConfidential) {
    // Only advocates and above can view confidential notes
    return [USER_ROLES.ADVOCATE, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(user.role);
  }
  
  // Public note - all case participants can view
  return true;
};

caseNoteSchema.methods.canUserEdit = function(user) {
  // Super admin and admin can edit all notes
  if ([USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN].includes(user.role)) {
    return true;
  }
  
  // Creator can edit their own notes
  return this.createdBy.toString() === user._id.toString();
};

caseNoteSchema.methods.canUserDelete = function(user) {
  // Super admin and admin can delete all notes
  if ([USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN].includes(user.role)) {
    return true;
  }
  
  // Creator can delete their own notes
  return this.createdBy.toString() === user._id.toString();
};

caseNoteSchema.methods.addToEditHistory = function(userId, changes, previousContent) {
  this.editHistory.push({
    editedBy: userId,
    editedAt: new Date(),
    changes: changes,
    previousContent: previousContent
  });
  
  // Keep only last 10 edits
  if (this.editHistory.length > 10) {
    this.editHistory = this.editHistory.slice(-10);
  }
  
  return this.save();
};

caseNoteSchema.methods.markAsRead = function(userId) {
  this.readCount += 1;
  this.lastRead = new Date();
  this.lastReadBy = userId;
  return this.save();
};

caseNoteSchema.methods.pin = function() {
  this.isPinned = true;
  return this.save();
};

caseNoteSchema.methods.unpin = function() {
  this.isPinned = false;
  return this.save();
};

caseNoteSchema.methods.markAsImportant = function() {
  this.isImportant = true;
  return this.save();
};

caseNoteSchema.methods.completeFollowUp = function(userId) {
  this.followUp.completed = true;
  this.followUp.completedAt = new Date();
  this.followUp.completedBy = userId;
  return this.save();
};

// Static methods
caseNoteSchema.statics.findByCaseId = function(caseId, user, options = {}) {
  const query = { 
    caseId: caseId, 
    status: NOTE_STATUS.ACTIVE 
  };
  
  if (options.noteType) {
    query.noteType = options.noteType;
  }
  
  if (options.priority) {
    query.priority = options.priority;
  }
  
  if (options.isPinned !== undefined) {
    query.isPinned = options.isPinned;
  }
  
  return this.find(query)
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email')
    .sort({ isPinned: -1, createdAt: -1 });
};

caseNoteSchema.statics.findByUser = function(userId, options = {}) {
  const query = { 
    createdBy: userId, 
    status: NOTE_STATUS.ACTIVE 
  };
  
  if (options.caseId) {
    query.caseId = options.caseId;
  }
  
  return this.find(query)
    .populate('caseId', 'title caseNumber')
    .sort({ createdAt: -1 });
};

caseNoteSchema.statics.findPendingFollowUps = function(userId) {
  return this.find({
    'followUp.required': true,
    'followUp.completed': false,
    'followUp.assignedTo': userId,
    status: NOTE_STATUS.ACTIVE
  })
  .populate('caseId', 'title caseNumber')
  .sort({ 'followUp.dueDate': 1 });
};

caseNoteSchema.statics.findPendingReminders = function() {
  return this.find({
    'reminder.enabled': true,
    'reminder.reminderSent': false,
    'reminder.reminderDate': { $lte: new Date() },
    status: NOTE_STATUS.ACTIVE
  })
  .populate('createdBy', 'firstName lastName email')
  .populate('caseId', 'title caseNumber');
};

// Export constants and model
module.exports = mongoose.model('CaseNote', caseNoteSchema);
module.exports.NOTE_TYPE = NOTE_TYPE;
module.exports.NOTE_PRIORITY = NOTE_PRIORITY;
module.exports.NOTE_STATUS = NOTE_STATUS;
