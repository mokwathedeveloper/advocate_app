const mongoose = require('mongoose');

const caseNoteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
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
  uploadedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const timelineEventSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

const caseSchema = new mongoose.Schema({
  caseNumber: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: [true, 'Case title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Case description is required']
  },
  category: {
    type: String,
    required: [true, 'Case category is required'],
    enum: [
      'Family Law',
      'Corporate Law',
      'Criminal Defense',
      'Property Law',
      'Employment Law',
      'Constitutional Law',
      'Tax Law',
      'Immigration Law',
      'Intellectual Property',
      'Environmental Law'
    ]
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'closed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  clientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  courtDate: {
    type: Date
  },
  documents: [documentSchema],
  notes: [caseNoteSchema],
  timeline: [timelineEventSchema],
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate case number before saving
caseSchema.pre('save', async function(next) {
  if (!this.caseNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.caseNumber = `CASE-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// Add timeline event method
caseSchema.methods.addTimelineEvent = async function(event, description, userId, metadata = {}) {
  this.timeline.push({
    event,
    description,
    user: userId,
    metadata
  });
  return this.save();
};

// Update status method
caseSchema.methods.updateStatus = async function(newStatus, userId, reason = '') {
  const oldStatus = this.status;
  this.status = newStatus;
  
  await this.addTimelineEvent(
    'status_changed',
    `Status changed from ${oldStatus} to ${newStatus}`,
    userId,
    { oldStatus, newStatus, reason }
  );
  
  return this.save();
};

module.exports = mongoose.model('Case', caseSchema);