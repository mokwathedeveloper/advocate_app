// File model for LegalPro v1.0.1 with Cloudinary integration
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  // Cloudinary identifiers
  cloudinaryId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  publicId: {
    type: String,
    required: true,
    index: true
  },
  
  // File metadata
  originalName: {
    type: String,
    required: true,
    maxlength: 255
  },
  filename: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true,
    min: 0
  },
  format: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  resourceType: {
    type: String,
    enum: ['image', 'video', 'audio', 'raw'],
    required: true
  },
  
  // URLs
  url: {
    type: String,
    required: true
  },
  secureUrl: {
    type: String,
    required: true
  },
  
  // File organization
  folder: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'documents',
      'images', 
      'media',
      'profile',
      'evidence',
      'contracts',
      'correspondence',
      'court-filings',
      'templates',
      'forms',
      'resources'
    ],
    default: 'documents',
    index: true
  },
  
  // Associations
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    index: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    index: true
  },
  
  // File properties
  description: {
    type: String,
    maxlength: 500
  },
  tags: [{
    type: String,
    maxlength: 50
  }],
  isPublic: {
    type: Boolean,
    default: false,
    index: true
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Image/Video specific properties
  dimensions: {
    width: {
      type: Number,
      min: 0
    },
    height: {
      type: Number,
      min: 0
    }
  },
  
  // Access control
  accessLevel: {
    type: String,
    enum: ['public', 'authenticated', 'case_members', 'owner_only'],
    default: 'case_members',
    index: true
  },
  allowedRoles: [{
    type: String,
    enum: ['advocate', 'admin', 'client']
  }],
  
  // File status
  status: {
    type: String,
    enum: ['uploading', 'active', 'processing', 'failed', 'deleted'],
    default: 'active',
    index: true
  },
  
  // Cloudinary metadata
  cloudinaryMetadata: {
    etag: String,
    version: Number,
    signature: String,
    createdAt: Date,
    context: mongoose.Schema.Types.Mixed
  },
  
  // Download tracking
  downloadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastDownloaded: {
    type: Date
  },
  
  // Virus scan results (if applicable)
  virusScanResult: {
    status: {
      type: String,
      enum: ['pending', 'clean', 'infected', 'error'],
      default: 'pending'
    },
    scannedAt: Date,
    details: String
  },
  
  // Backup information
  backupStatus: {
    type: String,
    enum: ['pending', 'backed_up', 'failed'],
    default: 'pending'
  },
  lastBackupAt: Date,
  
  // Expiration (for temporary files)
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ caseId: 1, type: 1, createdAt: -1 });
fileSchema.index({ folder: 1, createdAt: -1 });
fileSchema.index({ tags: 1 });
fileSchema.index({ status: 1, isArchived: 1 });
fileSchema.index({ 'virusScanResult.status': 1 });

// Virtual for file URL with transformations
fileSchema.virtual('thumbnailUrl').get(function() {
  if (this.resourceType === 'image') {
    return this.secureUrl.replace('/upload/', '/upload/w_200,h_200,c_fill/');
  }
  return null;
});

// Virtual for human readable file size
fileSchema.virtual('humanReadableSize').get(function() {
  const bytes = this.size;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for file extension
fileSchema.virtual('extension').get(function() {
  return this.format ? `.${this.format}` : '';
});

// Pre-save middleware
fileSchema.pre('save', function(next) {
  // Set default folder if not provided
  if (!this.folder && this.caseId) {
    this.folder = `legalpro/cases/${this.caseId}/${this.type}`;
  } else if (!this.folder && this.uploadedBy) {
    this.folder = `legalpro/users/${this.uploadedBy}/${this.type}`;
  }
  
  // Set allowed roles based on access level
  if (!this.allowedRoles || this.allowedRoles.length === 0) {
    switch (this.accessLevel) {
      case 'public':
        this.allowedRoles = ['advocate', 'admin', 'client'];
        break;
      case 'authenticated':
        this.allowedRoles = ['advocate', 'admin', 'client'];
        break;
      case 'case_members':
        this.allowedRoles = ['advocate', 'admin'];
        break;
      case 'owner_only':
        this.allowedRoles = [];
        break;
    }
  }
  
  next();
});

// Static methods
fileSchema.statics.findByCase = function(caseId, options = {}) {
  const { type, isArchived = false, limit = 20, page = 1 } = options;
  
  const query = { caseId, isArchived };
  if (type) query.type = type;
  
  return this.find(query)
    .populate('uploadedBy', 'firstName lastName role')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);
};

fileSchema.statics.findByUser = function(userId, options = {}) {
  const { type, isArchived = false, limit = 20, page = 1 } = options;
  
  const query = { uploadedBy: userId, isArchived };
  if (type) query.type = type;
  
  return this.find(query)
    .populate('caseId', 'title caseNumber')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);
};

fileSchema.statics.getStorageStats = function(userId = null) {
  const matchStage = userId ? { uploadedBy: mongoose.Types.ObjectId(userId) } : {};
  
  return this.aggregate([
    { $match: { ...matchStage, isArchived: false } },
    {
      $group: {
        _id: '$type',
        totalSize: { $sum: '$size' },
        count: { $sum: 1 },
        avgSize: { $avg: '$size' }
      }
    },
    {
      $group: {
        _id: null,
        totalFiles: { $sum: '$count' },
        totalSize: { $sum: '$totalSize' },
        byType: {
          $push: {
            type: '$_id',
            size: '$totalSize',
            count: '$count',
            avgSize: '$avgSize'
          }
        }
      }
    }
  ]);
};

// Instance methods
fileSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  this.lastDownloaded = new Date();
  return this.save();
};

fileSchema.methods.markAsArchived = function() {
  this.isArchived = true;
  return this.save();
};

fileSchema.methods.updateVirusScanResult = function(result) {
  this.virusScanResult = {
    status: result.status,
    scannedAt: new Date(),
    details: result.details
  };
  return this.save();
};

module.exports = mongoose.model('File', fileSchema);
