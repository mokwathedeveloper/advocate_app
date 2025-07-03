// Conversation Model for Real-time Chat System - LegalPro v1.0.1
const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['member', 'admin', 'moderator'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: {
    type: Date,
    default: null
  },
  permissions: [{
    type: String,
    enum: ['send_message', 'delete_message', 'add_participant', 'remove_participant', 'edit_conversation']
  }],
  lastReadAt: {
    type: Date,
    default: Date.now
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  }
});

const conversationSettingsSchema = new mongoose.Schema({
  encryption: {
    type: Boolean,
    default: false
  },
  retentionDays: {
    type: Number,
    default: 365
  },
  notifications: {
    type: Boolean,
    default: true
  },
  allowFileSharing: {
    type: Boolean,
    default: true
  },
  maxParticipants: {
    type: Number,
    default: 50
  },
  autoArchiveAfterDays: {
    type: Number,
    default: null
  }
});

const lastMessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'image', 'document', 'system'],
    default: 'text'
  }
});

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['private', 'group', 'case', 'support'],
    required: true
  },
  participants: [participantSchema],
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    default: null
  },
  title: {
    type: String,
    required: function() {
      return this.type === 'group' || this.type === 'case';
    },
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  avatar: {
    type: String,
    default: null
  },
  settings: conversationSettingsSchema,
  lastMessage: lastMessageSchema,
  messageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  archivedAt: {
    type: Date,
    default: null
  },
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for performance optimization
conversationSchema.index({ 'participants.userId': 1 });
conversationSchema.index({ type: 1, isActive: 1 });
conversationSchema.index({ caseId: 1 });
conversationSchema.index({ createdAt: -1 });
conversationSchema.index({ 'lastMessage.timestamp': -1 });

// Virtual for participant count
conversationSchema.virtual('participantCount').get(function() {
  return this.participants.filter(p => !p.leftAt).length;
});

// Virtual for active participants
conversationSchema.virtual('activeParticipants').get(function() {
  return this.participants.filter(p => !p.leftAt);
});

// Instance methods
conversationSchema.methods.addParticipant = function(userId, role = 'member', permissions = ['send_message']) {
  const existingParticipant = this.participants.find(p => 
    p.userId.toString() === userId.toString() && !p.leftAt
  );
  
  if (existingParticipant) {
    throw new Error('User is already a participant in this conversation');
  }

  this.participants.push({
    userId,
    role,
    permissions,
    joinedAt: new Date()
  });

  return this.save();
};

conversationSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => 
    p.userId.toString() === userId.toString() && !p.leftAt
  );
  
  if (!participant) {
    throw new Error('User is not a participant in this conversation');
  }

  participant.leftAt = new Date();
  return this.save();
};

conversationSchema.methods.updateLastMessage = function(messageData) {
  this.lastMessage = {
    content: messageData.content.text || 'File attachment',
    timestamp: messageData.timestamp,
    senderId: messageData.senderId,
    messageType: messageData.content.type
  };
  this.messageCount += 1;
  this.updatedAt = new Date();
  return this.save();
};

conversationSchema.methods.markAsRead = function(userId) {
  const participant = this.participants.find(p => 
    p.userId.toString() === userId.toString() && !p.leftAt
  );
  
  if (participant) {
    participant.lastReadAt = new Date();
    return this.save();
  }
  
  throw new Error('User is not a participant in this conversation');
};

conversationSchema.methods.hasPermission = function(userId, permission) {
  const participant = this.participants.find(p => 
    p.userId.toString() === userId.toString() && !p.leftAt
  );
  
  if (!participant) return false;
  
  return participant.permissions.includes(permission) || 
         participant.role === 'admin' || 
         participant.role === 'moderator';
};

// Static methods
conversationSchema.statics.findByParticipant = function(userId, options = {}) {
  const query = {
    'participants.userId': userId,
    'participants.leftAt': null,
    isActive: true
  };

  if (options.type) {
    query.type = options.type;
  }

  if (options.caseId) {
    query.caseId = options.caseId;
  }

  return this.find(query)
    .populate('participants.userId', 'firstName lastName email avatar role')
    .populate('caseId', 'title caseNumber')
    .populate('createdBy', 'firstName lastName')
    .sort({ 'lastMessage.timestamp': -1 })
    .limit(options.limit || 50);
};

conversationSchema.statics.findPrivateConversation = function(userId1, userId2) {
  return this.findOne({
    type: 'private',
    'participants.userId': { $all: [userId1, userId2] },
    'participants.leftAt': null,
    isActive: true
  }).populate('participants.userId', 'firstName lastName email avatar role');
};

conversationSchema.statics.createPrivateConversation = function(userId1, userId2, createdBy) {
  return this.create({
    type: 'private',
    participants: [
      { userId: userId1, permissions: ['send_message'] },
      { userId: userId2, permissions: ['send_message'] }
    ],
    createdBy,
    settings: {
      encryption: false,
      notifications: true,
      allowFileSharing: true
    }
  });
};

// Pre-save middleware
conversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-remove middleware
conversationSchema.pre('remove', function(next) {
  // Archive conversation instead of deleting
  this.archivedAt = new Date();
  this.isActive = false;
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);
