// Message Model for Real-time Chat System - LegalPro v1.0.1
const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const deliveryStatusSchema = new mongoose.Schema({
  sent: {
    type: Date,
    default: Date.now
  },
  delivered: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  read: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
});

const reactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emoji: {
    type: String,
    required: true,
    maxlength: 10
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const contentSchema = new mongoose.Schema({
  text: {
    type: String,
    maxlength: 10000
  },
  type: {
    type: String,
    enum: ['text', 'file', 'image', 'document', 'system'],
    default: 'text'
  },
  attachments: [attachmentSchema],
  formatting: {
    bold: [{ start: Number, end: Number }],
    italic: [{ start: Number, end: Number }],
    code: [{ start: Number, end: Number }],
    links: [{ start: Number, end: Number, url: String }]
  }
});

const metadataSchema = new mongoose.Schema({
  clientInfo: {
    userAgent: String,
    platform: String,
    version: String
  },
  encryption: {
    encrypted: {
      type: Boolean,
      default: false
    },
    algorithm: String,
    keyId: String
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  mentions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    start: Number,
    end: Number
  }]
});

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: contentSchema,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  editedAt: {
    type: Date,
    default: null
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deliveryStatus: deliveryStatusSchema,
  reactions: [reactionSchema],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  forwardedFrom: {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation'
    },
    originalSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  metadata: metadataSchema,
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  isSystemMessage: {
    type: Boolean,
    default: false
  },
  systemMessageType: {
    type: String,
    enum: ['user_joined', 'user_left', 'conversation_created', 'title_changed', 'participant_added', 'participant_removed'],
    default: null
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
messageSchema.index({ conversationId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1, timestamp: -1 });
messageSchema.index({ conversationId: 1, deletedAt: 1 });
messageSchema.index({ 'content.text': 'text' }); // Text search index

// Virtual for reply information
messageSchema.virtual('replyInfo', {
  ref: 'Message',
  localField: 'replyTo',
  foreignField: '_id',
  justOne: true
});

// Instance methods
messageSchema.methods.markAsDelivered = function(userId) {
  const existingDelivery = this.deliveryStatus.delivered.find(d => 
    d.userId.toString() === userId.toString()
  );
  
  if (!existingDelivery) {
    this.deliveryStatus.delivered.push({
      userId,
      timestamp: new Date()
    });
    return this.save();
  }
  
  return Promise.resolve(this);
};

messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.deliveryStatus.read.find(r => 
    r.userId.toString() === userId.toString()
  );
  
  if (!existingRead) {
    this.deliveryStatus.read.push({
      userId,
      timestamp: new Date()
    });
    return this.save();
  }
  
  return Promise.resolve(this);
};

messageSchema.methods.addReaction = function(userId, emoji) {
  const existingReaction = this.reactions.find(r => 
    r.userId.toString() === userId.toString() && r.emoji === emoji
  );
  
  if (existingReaction) {
    throw new Error('User has already reacted with this emoji');
  }

  this.reactions.push({
    userId,
    emoji,
    timestamp: new Date()
  });
  
  return this.save();
};

messageSchema.methods.removeReaction = function(userId, emoji) {
  const reactionIndex = this.reactions.findIndex(r => 
    r.userId.toString() === userId.toString() && r.emoji === emoji
  );
  
  if (reactionIndex === -1) {
    throw new Error('Reaction not found');
  }

  this.reactions.splice(reactionIndex, 1);
  return this.save();
};

messageSchema.methods.editContent = function(newContent) {
  if (this.deletedAt) {
    throw new Error('Cannot edit deleted message');
  }

  this.content.text = newContent;
  this.editedAt = new Date();
  return this.save();
};

messageSchema.methods.softDelete = function(deletedBy) {
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

// Static methods
messageSchema.statics.findByConversation = function(conversationId, options = {}) {
  const query = {
    conversationId,
    deletedAt: null
  };

  if (options.before) {
    query.timestamp = { $lt: new Date(options.before) };
  }

  if (options.after) {
    query.timestamp = { $gt: new Date(options.after) };
  }

  return this.find(query)
    .populate('senderId', 'firstName lastName avatar role')
    .populate('replyTo', 'content.text senderId timestamp')
    .populate('reactions.userId', 'firstName lastName')
    .sort({ timestamp: options.ascending ? 1 : -1 })
    .limit(options.limit || 50);
};

messageSchema.statics.searchMessages = function(conversationId, searchTerm, options = {}) {
  const query = {
    conversationId,
    deletedAt: null,
    $text: { $search: searchTerm }
  };

  return this.find(query, { score: { $meta: 'textScore' } })
    .populate('senderId', 'firstName lastName avatar')
    .sort({ score: { $meta: 'textScore' }, timestamp: -1 })
    .limit(options.limit || 20);
};

messageSchema.statics.getUnreadCount = function(conversationId, userId, lastReadAt) {
  return this.countDocuments({
    conversationId,
    timestamp: { $gt: lastReadAt },
    senderId: { $ne: userId },
    deletedAt: null
  });
};

messageSchema.statics.createSystemMessage = function(conversationId, type, content, metadata = {}) {
  return this.create({
    conversationId,
    senderId: null, // System messages don't have a sender
    content: {
      text: content,
      type: 'system'
    },
    isSystemMessage: true,
    systemMessageType: type,
    metadata
  });
};

// Pre-save middleware
messageSchema.pre('save', function(next) {
  // Validate content based on type
  if (this.content.type === 'text' && !this.content.text) {
    return next(new Error('Text messages must have content'));
  }
  
  if (this.content.type !== 'text' && this.content.attachments.length === 0) {
    return next(new Error('Non-text messages must have attachments'));
  }
  
  next();
});

// Post-save middleware to update conversation
messageSchema.post('save', async function(doc) {
  try {
    const Conversation = mongoose.model('Conversation');
    await Conversation.findByIdAndUpdate(doc.conversationId, {
      $set: {
        'lastMessage.content': doc.content.text || 'File attachment',
        'lastMessage.timestamp': doc.timestamp,
        'lastMessage.senderId': doc.senderId,
        'lastMessage.messageType': doc.content.type,
        updatedAt: new Date()
      },
      $inc: { messageCount: 1 }
    });
  } catch (error) {
    console.error('Error updating conversation after message save:', error);
  }
});

module.exports = mongoose.model('Message', messageSchema);
