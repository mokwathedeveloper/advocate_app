// Document Management Controller - LegalPro v1.0.1
// Secure file upload, storage, and retrieval for case documents

const CaseDocument = require('../models/CaseDocument');
const Case = require('../models/Case');
const CaseActivity = require('../models/CaseActivity');
const { DOCUMENT_TYPE, ACCESS_LEVEL, DOCUMENT_STATUS } = require('../models/CaseDocument');
const { ACTIVITY_TYPE } = require('../models/CaseActivity');
const { USER_ROLES } = require('../config/auth');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/documents');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

/**
 * @desc    Upload document to case
 * @route   POST /api/cases/:caseId/documents
 * @access  Private
 */
const uploadDocument = async (req, res) => {
  try {
    const caseId = req.params.caseId;
    
    // Check if case exists and user can access
    const caseItem = await Case.findById(caseId);
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    if (!caseItem.canUserAccess(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this case'
      });
    }
    
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Generate file hash for integrity
    const fileBuffer = await fs.readFile(req.file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    // Create document record
    const documentData = {
      caseId: caseId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      filePath: req.file.path,
      fileUrl: `/uploads/documents/${req.file.filename}`,
      documentType: req.body.documentType || DOCUMENT_TYPE.OTHER,
      category: req.body.category,
      description: req.body.description,
      accessLevel: req.body.accessLevel || ACCESS_LEVEL.RESTRICTED,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      uploadedBy: req.user._id,
      fileHash: fileHash,
      virusScanStatus: 'pending' // Would integrate with virus scanning service
    };
    
    const document = await CaseDocument.create(documentData);
    
    // Populate the created document
    await document.populate('uploadedBy', 'firstName lastName email');
    
    // Log document upload activity
    await CaseActivity.createActivity({
      caseId: caseId,
      activityType: ACTIVITY_TYPE.DOCUMENT_UPLOADED,
      action: 'Document Uploaded',
      description: `Document "${req.file.originalname}" was uploaded`,
      performedBy: req.user._id,
      relatedDocument: document._id,
      details: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        documentType: documentData.documentType,
        accessLevel: documentData.accessLevel
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document
    });
    
  } catch (error) {
    console.error('Upload document error:', error);
    
    // Clean up uploaded file if database operation failed
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 50MB.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error uploading document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get case documents
 * @route   GET /api/cases/:caseId/documents
 * @access  Private
 */
const getCaseDocuments = async (req, res) => {
  try {
    const caseId = req.params.caseId;
    
    // Check if case exists and user can access
    const caseItem = await Case.findById(caseId);
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    if (!caseItem.canUserAccess(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this case'
      });
    }
    
    // Get documents and filter by user permissions
    const documents = await CaseDocument.findByCaseId(caseId, req.user);
    const accessibleDocuments = [];
    
    for (const doc of documents) {
      if (await doc.canUserAccess(req.user)) {
        accessibleDocuments.push(doc);
      }
    }
    
    // Apply filters
    let filteredDocuments = accessibleDocuments;
    
    if (req.query.documentType) {
      filteredDocuments = filteredDocuments.filter(doc => doc.documentType === req.query.documentType);
    }
    
    if (req.query.accessLevel) {
      filteredDocuments = filteredDocuments.filter(doc => doc.accessLevel === req.query.accessLevel);
    }
    
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      filteredDocuments = filteredDocuments.filter(doc => 
        doc.originalName.toLowerCase().includes(searchTerm) ||
        (doc.description && doc.description.toLowerCase().includes(searchTerm))
      );
    }
    
    // Sort documents
    const sortBy = req.query.sortBy || 'uploadedAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    filteredDocuments.sort((a, b) => {
      if (sortOrder === 1) {
        return a[sortBy] > b[sortBy] ? 1 : -1;
      } else {
        return a[sortBy] < b[sortBy] ? 1 : -1;
      }
    });
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);
    
    res.status(200).json({
      success: true,
      count: paginatedDocuments.length,
      total: filteredDocuments.length,
      pagination: {
        page,
        limit,
        pages: Math.ceil(filteredDocuments.length / limit),
        hasNext: endIndex < filteredDocuments.length,
        hasPrev: page > 1
      },
      data: paginatedDocuments
    });
    
  } catch (error) {
    console.error('Get case documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving documents',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get single document
 * @route   GET /api/documents/:id
 * @access  Private
 */
const getDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    
    const document = await CaseDocument.findById(documentId)
      .populate('uploadedBy', 'firstName lastName email')
      .populate('caseId', 'title caseNumber');
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Check if user can access this document
    if (!(await document.canUserAccess(req.user))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this document'
      });
    }
    
    res.status(200).json({
      success: true,
      data: document
    });
    
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Download document
 * @route   GET /api/documents/:id/download
 * @access  Private
 */
const downloadDocument = async (req, res) => {
  try {
    const documentId = req.params.id;

    const document = await CaseDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user can access this document
    if (!(await document.canUserAccess(req.user))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this document'
      });
    }

    // Check if file exists
    try {
      await fs.access(document.filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Increment download count
    await document.incrementDownloadCount(req.user._id);

    // Log download activity
    await CaseActivity.createActivity({
      caseId: document.caseId,
      activityType: ACTIVITY_TYPE.DOCUMENT_DOWNLOADED,
      action: 'Document Downloaded',
      description: `Document "${document.originalName}" was downloaded`,
      performedBy: req.user._id,
      relatedDocument: document._id,
      details: {
        fileName: document.originalName,
        downloadCount: document.downloadCount + 1
      }
    });

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('Content-Type', document.mimeType);

    // Send file
    res.sendFile(path.resolve(document.filePath));

  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update document details
 * @route   PUT /api/documents/:id
 * @access  Private
 */
const updateDocument = async (req, res) => {
  try {
    const documentId = req.params.id;

    const document = await CaseDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user can edit this document
    if (!document.canUserEdit(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to edit this document'
      });
    }

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Update allowed fields
    const allowedFields = ['description', 'documentType', 'category', 'accessLevel', 'tags'];
    const updateData = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (req.body.tags && typeof req.body.tags === 'string') {
      updateData.tags = req.body.tags.split(',').map(tag => tag.trim());
    }

    const updatedDocument = await CaseDocument.findByIdAndUpdate(
      documentId,
      updateData,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'firstName lastName email');

    // Log update activity
    await CaseActivity.createActivity({
      caseId: document.caseId,
      activityType: ACTIVITY_TYPE.CASE_UPDATED,
      action: 'Document Updated',
      description: `Document "${document.originalName}" details were updated`,
      performedBy: req.user._id,
      relatedDocument: document._id,
      details: {
        fileName: document.originalName,
        updatedFields: Object.keys(updateData)
      }
    });

    res.status(200).json({
      success: true,
      message: 'Document updated successfully',
      data: updatedDocument
    });

  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete document
 * @route   DELETE /api/documents/:id
 * @access  Private
 */
const deleteDocument = async (req, res) => {
  try {
    const documentId = req.params.id;

    const document = await CaseDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user can delete this document
    if (!document.canUserDelete(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to delete this document'
      });
    }

    // Soft delete - mark as deleted
    document.isDeleted = true;
    document.status = DOCUMENT_STATUS.DELETED;
    await document.save();

    // Log deletion activity
    await CaseActivity.createActivity({
      caseId: document.caseId,
      activityType: ACTIVITY_TYPE.DOCUMENT_DELETED,
      action: 'Document Deleted',
      description: `Document "${document.originalName}" was deleted`,
      performedBy: req.user._id,
      relatedDocument: document._id,
      details: {
        fileName: document.originalName,
        reason: req.body.reason || 'No reason provided'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get document statistics
 * @route   GET /api/cases/:caseId/documents/stats
 * @access  Private
 */
const getDocumentStats = async (req, res) => {
  try {
    const caseId = req.params.caseId;

    // Check if case exists and user can access
    const caseItem = await Case.findById(caseId);
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    if (!caseItem.canUserAccess(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this case'
      });
    }

    const stats = await CaseDocument.getDocumentStats(caseId);

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get document stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving document statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export upload middleware and controller functions
module.exports = {
  upload: upload.single('document'),
  uploadDocument,
  getCaseDocuments,
  getDocument,
  downloadDocument,
  updateDocument,
  deleteDocument,
  getDocumentStats
};
