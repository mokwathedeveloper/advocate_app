// Case model for LegalPro v1.0.1
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
    required: [true, 'Document name is required'],
    trim: true,
    maxlength: [255, 'Document name cannot exceed 255 characters']
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Document type is required'],
    enum: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/rtf',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-rar-compressed'
    ]
  },
  size: {
    type: Number,
    required: [true, 'Document size is required'],
    min: [1, 'Document size must be at least 1 byte'],
    max: [10485760, 'Document size cannot exceed 10MB'] // 10MB in bytes
  },
  url: {
    type: String,
    required: [true, 'Document URL is required']
  },
  publicId: {
    type: String,
    required: [true, 'Cloudinary public ID is required']
  },
  uploadedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Uploader information is required']
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  downloadCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date
  },
  metadata: {
    width: Number,      // For images
    height: Number,     // For images
    pages: Number,      // For PDFs
    duration: Number,   // For videos
    format: String      // File format details
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
    this.caseNumber = `CASE-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Validate document limits before saving
caseSchema.pre('save', function(next) {
  // Check maximum number of documents (50)
  if (this.documents && this.documents.length > 50) {
    return next(new Error('Maximum 50 documents allowed per case'));
  }

  // Check total document size (500MB = 524288000 bytes)
  if (this.documents && this.documents.length > 0) {
    const totalSize = this.documents.reduce((sum, doc) => sum + doc.size, 0);
    if (totalSize > 524288000) {
      return next(new Error('Total document size cannot exceed 500MB'));
    }
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

// Add document method
caseSchema.methods.addDocument = async function(documentData, userId) {
  // Check document limits
  if (this.documents.length >= 50) {
    throw new Error('Maximum 50 documents allowed per case');
  }

  const totalSize = this.documents.reduce((sum, doc) => sum + doc.size, 0);
  if (totalSize + documentData.size > 524288000) {
    throw new Error('Total document size would exceed 500MB limit');
  }

  this.documents.push(documentData);

  await this.addTimelineEvent(
    'document_uploaded',
    `Document "${documentData.name}" uploaded`,
    userId,
    { documentId: this.documents[this.documents.length - 1]._id, fileName: documentData.name }
  );

  return this.save();
};

// Remove document method
caseSchema.methods.removeDocument = async function(documentId, userId) {
  const document = this.documents.id(documentId);
  if (!document) {
    throw new Error('Document not found');
  }

  const documentName = document.name;
  this.documents.pull(documentId);

  await this.addTimelineEvent(
    'document_removed',
    `Document "${documentName}" removed`,
    userId,
    { documentId, fileName: documentName }
  );

  return this.save();
};

// Get document statistics
caseSchema.methods.getDocumentStats = function() {
  const totalSize = this.documents.reduce((sum, doc) => sum + doc.size, 0);
  const typeCount = this.documents.reduce((acc, doc) => {
    const type = doc.type.split('/')[1] || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return {
    totalDocuments: this.documents.length,
    totalSize,
    remainingSlots: 50 - this.documents.length,
    remainingSize: 524288000 - totalSize,
    typeBreakdown: typeCount
  };
};

// Index for better query performance
caseSchema.index({ caseNumber: 1 });
caseSchema.index({ clientId: 1, status: 1 });
caseSchema.index({ assignedTo: 1, status: 1 });
caseSchema.index({ category: 1, status: 1 });
caseSchema.index({ createdAt: -1 });
caseSchema.index({ courtDate: 1 });
caseSchema.index({ 'documents.uploadedBy': 1 });

module.exports = mongoose.model('Case', caseSchema);