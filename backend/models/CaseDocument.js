// Case Document Model - LegalPro v1.0.1
// Secure document management for legal cases

const mongoose = require('mongoose');
const path = require('path');
const { USER_ROLES } = require('../config/auth');

// Document type enumeration
const DOCUMENT_TYPE = {
  PLEADING: 'pleading',
  EVIDENCE: 'evidence',
  CORRESPONDENCE: 'correspondence',
  CONTRACT: 'contract',
  RESEARCH: 'research',
  ADMINISTRATIVE: 'administrative',
  COURT_ORDER: 'court_order',
  AFFIDAVIT: 'affidavit',
  MOTION: 'motion',
  BRIEF: 'brief',
  EXHIBIT: 'exhibit',
  OTHER: 'other'
};

// Access level enumeration
const ACCESS_LEVEL = {
  PUBLIC: 'public',           // All case participants can access
  RESTRICTED: 'restricted',   // Only advocates and admins
  CONFIDENTIAL: 'confidential', // Only primary advocate and admins
  PRIVATE: 'private'          // Only uploader and admins
};

// Document status enumeration
const DOCUMENT_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

const caseDocumentSchema = new mongoose.Schema({
  // Case Reference
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: [true, 'Case ID is required'],
    index: true
  },
  
  // File Information
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
    maxlength: [255, 'File name cannot exceed 255 characters']
  },
  
  originalName: {
    type: String,
    required: [true, 'Original file name is required'],
    trim: true,
    maxlength: [255, 'Original file name cannot exceed 255 characters']
  },
  
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [1, 'File size must be greater than 0'],
    max: [52428800, 'File size cannot exceed 50MB'] // 50MB limit
  },
  
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    validate: {
      validator: function(mimeType) {
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'text/rtf',
          'text/csv',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/bmp',
          'image/tiff'
        ];
        return allowedTypes.includes(mimeType);
      },
      message: 'File type not supported'
    }
  },
  
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  
  fileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },
  
  // Document Details
  documentType: {
    type: String,
    enum: Object.values(DOCUMENT_TYPE),
    required: [true, 'Document type is required'],
    index: true
  },
  
  category: {
    type: String,
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  version: {
    type: Number,
    default: 1,
    min: [1, 'Version must be at least 1']
  },
  
  // Access Control
  accessLevel: {
    type: String,
    enum: Object.values(ACCESS_LEVEL),
    default: ACCESS_LEVEL.RESTRICTED,
    index: true
  },
  
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  allowedRoles: [{
    type: String,
    enum: Object.values(USER_ROLES)
  }],
  
  // Document Status
  status: {
    type: String,
    enum: Object.values(DOCUMENT_STATUS),
    default: DOCUMENT_STATUS.ACTIVE,
    index: true
  },
  
  // Metadata
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  // File Hash for integrity checking
  fileHash: {
    type: String,
    required: true
  },
  
  // Virus scan results
  virusScanStatus: {
    type: String,
    enum: ['pending', 'clean', 'infected', 'error'],
    default: 'pending'
  },
  
  virusScanDate: {
    type: Date
  },
  
  // OCR and search
  extractedText: {
    type: String,
    index: 'text'
  },
  
  ocrProcessed: {
    type: Boolean,
    default: false
  },
  
  // User Information
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required'],
    index: true
  },
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Dates
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  lastModified: {
    type: Date,
    default: Date.now
  },
  
  reviewedAt: {
    type: Date
  },
  
  approvedAt: {
    type: Date
  },
  
  expiresAt: {
    type: Date,
    index: true
  },
  
  // System Fields
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  
  isEncrypted: {
    type: Boolean,
    default: false
  },
  
  // Download tracking
  downloadCount: {
    type: Number,
    default: 0
  },
  
  lastDownloaded: {
    type: Date
  },
  
  lastDownloadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret.filePath; // Don't expose file system path
      delete ret.fileHash; // Don't expose hash
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance
caseDocumentSchema.index({ caseId: 1, documentType: 1 });
caseDocumentSchema.index({ uploadedBy: 1, uploadedAt: -1 });
caseDocumentSchema.index({ status: 1, accessLevel: 1 });
caseDocumentSchema.index({ isActive: 1, isDeleted: 1 });
caseDocumentSchema.index({ virusScanStatus: 1 });
caseDocumentSchema.index({ expiresAt: 1 });

// Text search index
caseDocumentSchema.index({
  originalName: 'text',
  description: 'text',
  extractedText: 'text',
  tags: 'text'
});

// Virtual for file extension
caseDocumentSchema.virtual('fileExtension').get(function() {
  return path.extname(this.originalName).toLowerCase();
});

// Virtual for human readable file size
caseDocumentSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for document age
caseDocumentSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.uploadedAt) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
caseDocumentSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Instance methods
caseDocumentSchema.methods.canUserAccess = async function(user) {
  // Super admin and admin can access all documents
  if ([USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN].includes(user.role)) {
    return true;
  }
  
  // Check if user can access the case
  const Case = mongoose.model('Case');
  const caseDoc = await Case.findById(this.caseId);
  if (!caseDoc || !caseDoc.canUserAccess(user)) {
    return false;
  }
  
  // Check access level
  switch (this.accessLevel) {
    case ACCESS_LEVEL.PUBLIC:
      return true;
      
    case ACCESS_LEVEL.RESTRICTED:
      return [USER_ROLES.ADVOCATE, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(user.role);
      
    case ACCESS_LEVEL.CONFIDENTIAL:
      return [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(user.role) ||
             (user.role === USER_ROLES.ADVOCATE && caseDoc.advocate.primary.toString() === user._id.toString());
      
    case ACCESS_LEVEL.PRIVATE:
      return [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(user.role) ||
             this.uploadedBy.toString() === user._id.toString();
      
    default:
      return false;
  }
};

caseDocumentSchema.methods.canUserEdit = function(user) {
  // Only uploader, case advocates, and admins can edit
  if ([USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN].includes(user.role)) {
    return true;
  }
  
  if (this.uploadedBy.toString() === user._id.toString()) {
    return true;
  }
  
  // Check if user is assigned to the case
  return user.role === USER_ROLES.ADVOCATE; // Will be validated against case assignment
};

caseDocumentSchema.methods.canUserDelete = function(user) {
  // Only uploader and admins can delete
  if ([USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN].includes(user.role)) {
    return true;
  }
  
  return this.uploadedBy.toString() === user._id.toString();
};

caseDocumentSchema.methods.incrementDownloadCount = function(userId) {
  this.downloadCount += 1;
  this.lastDownloaded = new Date();
  this.lastDownloadedBy = userId;
  return this.save();
};

// Static methods
caseDocumentSchema.statics.findByCaseId = function(caseId, user) {
  // This will be filtered by access permissions in the controller
  return this.find({
    caseId: caseId,
    isActive: true,
    isDeleted: false,
    virusScanStatus: { $ne: 'infected' }
  }).populate('uploadedBy', 'firstName lastName email');
};

caseDocumentSchema.statics.findByUser = function(userId) {
  return this.find({
    uploadedBy: userId,
    isActive: true,
    isDeleted: false
  }).populate('caseId', 'title caseNumber');
};

caseDocumentSchema.statics.getDocumentStats = function(caseId) {
  return this.aggregate([
    { $match: { caseId: mongoose.Types.ObjectId(caseId), isActive: true, isDeleted: false } },
    {
      $group: {
        _id: '$documentType',
        count: { $sum: 1 },
        totalSize: { $sum: '$fileSize' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Export constants and model
module.exports = mongoose.model('CaseDocument', caseDocumentSchema);
module.exports.DOCUMENT_TYPE = DOCUMENT_TYPE;
module.exports.ACCESS_LEVEL = ACCESS_LEVEL;
module.exports.DOCUMENT_STATUS = DOCUMENT_STATUS;
