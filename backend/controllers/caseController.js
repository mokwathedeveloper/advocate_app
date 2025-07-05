// Case management controller for LegalPro v1.0.1
const Case = require('../models/Case');
const User = require('../models/User');
const mongoose = require('mongoose');
const { uploadFile, deleteFile, getFileCategory } = require('../config/cloudinary');
const { cleanupTempFile } = require('../middleware/upload');
const fs = require('fs');

// @desc    Get all cases
// @route   GET /api/cases
// @access  Private
const getCases = async (req, res) => {
  try {
    let query = { isArchived: false };

    // Role-based filtering
    switch (req.user.role) {
      case 'client':
        query.clientId = req.user._id;
        break;
      case 'admin':
        // Admin can see assigned cases or all cases if they have permission
        if (!req.user.permissions?.canViewAllCases) {
          query.assignedTo = req.user._id;
        }
        break;
      case 'advocate':
        // Advocates can see all cases (no additional filtering)
        break;
      default:
        return res.status(403).json({
          success: false,
          message: 'Invalid user role'
        });
    }

    // Apply filters from query params
    if (req.query.status && ['pending', 'in_progress', 'completed', 'closed'].includes(req.query.status)) {
      query.status = req.query.status;
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.priority && ['low', 'medium', 'high', 'urgent'].includes(req.query.priority)) {
      query.priority = req.query.priority;
    }

    if (req.query.assignedTo && mongoose.Types.ObjectId.isValid(req.query.assignedTo)) {
      query.assignedTo = req.query.assignedTo;
    }

    // Date range filtering
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    // Search functionality
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { caseNumber: searchRegex }
      ];
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const startIndex = (page - 1) * limit;

    // Sorting
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sortObj = { [sortBy]: sortOrder };
    
    // Execute query with population and sorting
    const [cases, total] = await Promise.all([
      Case.find(query)
        .populate('clientId', 'firstName lastName email phone')
        .populate('assignedTo', 'firstName lastName email')
        .populate('documents.uploadedBy', 'firstName lastName')
        .sort(sortObj)
        .skip(startIndex)
        .limit(limit)
        .lean(), // Use lean for better performance
      Case.countDocuments(query)
    ]);

    // Add document statistics to each case
    const casesWithStats = cases.map(caseItem => ({
      ...caseItem,
      documentStats: {
        totalDocuments: caseItem.documents?.length || 0,
        totalSize: caseItem.documents?.reduce((sum, doc) => sum + doc.size, 0) || 0
      }
    }));

    res.status(200).json({
      success: true,
      count: cases.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      filters: {
        status: req.query.status,
        category: req.query.category,
        priority: req.query.priority,
        assignedTo: req.query.assignedTo,
        search: req.query.search
      },
      data: casesWithStats
    });
  } catch (error) {
    console.error('Get cases error:', error);

    // Handle specific error types
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cases',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single case
// @route   GET /api/cases/:id
// @access  Private
const getCase = async (req, res) => {
  try {
    // Validate case ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid case ID format'
      });
    }

    let query = { _id: req.params.id, isArchived: false };

    // Role-based access control
    switch (req.user.role) {
      case 'client':
        query.clientId = req.user._id;
        break;
      case 'admin':
        // Admin can see assigned cases or all cases if they have permission
        if (!req.user.permissions?.canViewAllCases) {
          query.assignedTo = req.user._id;
        }
        break;
      case 'advocate':
        // Advocates can see all cases (no additional filtering)
        break;
      default:
        return res.status(403).json({
          success: false,
          message: 'Invalid user role'
        });
    }

    const case_item = await Case.findOne(query)
      .populate('clientId', 'firstName lastName email phone avatar')
      .populate('assignedTo', 'firstName lastName email avatar')
      .populate('notes.author', 'firstName lastName avatar')
      .populate('timeline.user', 'firstName lastName avatar')
      .populate('documents.uploadedBy', 'firstName lastName');

    if (!case_item) {
      return res.status(404).json({
        success: false,
        message: 'Case not found or access denied'
      });
    }

    // Filter private notes for non-authors
    if (req.user.role === 'client') {
      case_item.notes = case_item.notes.filter(note =>
        !note.isPrivate || note.author._id.toString() === req.user._id.toString()
      );
    }

    // Add document statistics
    const documentStats = case_item.getDocumentStats();

    res.status(200).json({
      success: true,
      data: {
        ...case_item.toObject(),
        documentStats
      }
    });
  } catch (error) {
    console.error('Get case error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid case ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve case',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new case
// @route   POST /api/cases
// @access  Private (Admin/Super Admin)
const createCase = async (req, res) => {
  try {
    const { title, description, category, priority, clientId, assignedTo, courtDate } = req.body;

    // Validate required fields
    if (!title || !description || !category || !clientId) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, and client are required'
      });
    }

    // Validate client exists and is a client role
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID format'
      });
    }

    const client = await User.findById(clientId);
    if (!client || client.role !== 'client') {
      return res.status(400).json({
        success: false,
        message: 'Invalid client specified'
      });
    }

    // Validate assigned user if provided
    let assignedUser = null;
    if (assignedTo) {
      if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid assigned user ID format'
        });
      }

      assignedUser = await User.findById(assignedTo);
      if (!assignedUser || !['admin', 'advocate'].includes(assignedUser.role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid assigned user specified'
        });
      }
    }

    // Validate court date if provided
    if (courtDate && new Date(courtDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Court date cannot be in the past'
      });
    }

    // Create case
    const caseData = {
      title: title.trim(),
      description: description.trim(),
      category,
      priority: priority || 'medium',
      clientId,
      assignedTo: assignedTo || req.user._id,
      courtDate: courtDate ? new Date(courtDate) : undefined
    };

    const case_item = await Case.create(caseData);

    // Populate the created case
    await case_item.populate('clientId', 'firstName lastName email phone avatar');
    await case_item.populate('assignedTo', 'firstName lastName email avatar');

    res.status(201).json({
      success: true,
      message: 'Case created successfully',
      data: case_item
    });
  } catch (error) {
    console.error('Create case error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Handle duplicate case number (shouldn't happen with auto-generation)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Case number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create case',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update case
// @route   PUT /api/cases/:id
// @access  Private (Admin/Super Admin)
const updateCase = async (req, res) => {
  try {
    // Validate case ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid case ID format'
      });
    }

    // Get the existing case first
    const existingCase = await Case.findById(req.params.id);
    if (!existingCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    const { title, description, category, priority, clientId, assignedTo, courtDate } = req.body;
    const updateData = {};

    // Validate and prepare update data
    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot be empty'
        });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      if (!description.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Description cannot be empty'
        });
      }
      updateData.description = description.trim();
    }

    if (category !== undefined) {
      updateData.category = category;
    }

    if (priority !== undefined) {
      if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid priority value'
        });
      }
      updateData.priority = priority;
    }

    // Validate client if being updated
    if (clientId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(clientId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid client ID format'
        });
      }

      const client = await User.findById(clientId);
      if (!client || client.role !== 'client') {
        return res.status(400).json({
          success: false,
          message: 'Invalid client specified'
        });
      }
      updateData.clientId = clientId;
    }

    // Validate assigned user if being updated
    if (assignedTo !== undefined) {
      if (assignedTo === null) {
        updateData.assignedTo = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid assigned user ID format'
          });
        }

        const assignedUser = await User.findById(assignedTo);
        if (!assignedUser || !['admin', 'advocate'].includes(assignedUser.role)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid assigned user specified'
          });
        }
        updateData.assignedTo = assignedTo;
      }
    }

    // Validate court date if being updated
    if (courtDate !== undefined) {
      if (courtDate === null) {
        updateData.courtDate = null;
      } else {
        const courtDateTime = new Date(courtDate);
        if (courtDateTime < new Date()) {
          return res.status(400).json({
            success: false,
            message: 'Court date cannot be in the past'
          });
        }
        updateData.courtDate = courtDateTime;
      }
    }

    // Update the case
    const case_item = await Case.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    )
      .populate('clientId', 'firstName lastName email phone avatar')
      .populate('assignedTo', 'firstName lastName email avatar');

    // Add timeline event for the update
    await case_item.addTimelineEvent(
      'case_updated',
      'Case information updated',
      req.user._id,
      { updatedFields: Object.keys(updateData) }
    );

    res.status(200).json({
      success: true,
      message: 'Case updated successfully',
      data: case_item
    });
  } catch (error) {
    console.error('Update case error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update case',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete case (soft delete)
// @route   DELETE /api/cases/:id
// @access  Private (Advocate only)
const deleteCase = async (req, res) => {
  try {
    // Validate case ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid case ID format'
      });
    }

    const case_item = await Case.findById(req.params.id);

    if (!case_item) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    if (case_item.isArchived) {
      return res.status(400).json({
        success: false,
        message: 'Case is already archived'
      });
    }

    // Soft delete by setting isArchived to true
    case_item.isArchived = true;
    await case_item.save();

    // Add timeline event
    await case_item.addTimelineEvent(
      'case_archived',
      'Case archived (soft deleted)',
      req.user._id,
      { reason: req.body.reason || 'No reason provided' }
    );

    res.status(200).json({
      success: true,
      message: 'Case archived successfully'
    });
  } catch (error) {
    console.error('Delete case error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid case ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to archive case',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Add case note
// @route   POST /api/cases/:id/notes
// @access  Private
const addCaseNote = async (req, res) => {
  try {
    const { content, isPrivate } = req.body;
    
    const case_item = await Case.findById(req.params.id);
    
    if (!case_item) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    case_item.notes.push({
      content,
      author: req.user._id,
      isPrivate: isPrivate || false
    });
    
    await case_item.addTimelineEvent(
      'note_added',
      'Case note added',
      req.user._id,
      { noteContent: content.substring(0, 100) }
    );
    
    await case_item.populate('notes.author', 'firstName lastName');
    
    res.status(201).json({
      success: true,
      data: case_item.notes[case_item.notes.length - 1]
    });
  } catch (error) {
    console.error('Add case note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update case status
// @route   PUT /api/cases/:id/status
// @access  Private (Admin/Super Admin)
const updateCaseStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    const case_item = await Case.findById(req.params.id);
    
    if (!case_item) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    await case_item.updateStatus(status, req.user._id, reason);
    
    res.status(200).json({
      success: true,
      data: case_item
    });
  } catch (error) {
    console.error('Update case status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get case timeline
// @route   GET /api/cases/:id/timeline
// @access  Private
const getCaseTimeline = async (req, res) => {
  try {
    const case_item = await Case.findById(req.params.id)
      .populate('timeline.user', 'firstName lastName')
      .select('timeline');
    
    if (!case_item) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: case_item.timeline.sort((a, b) => b.createdAt - a.createdAt)
    });
  } catch (error) {
    console.error('Get case timeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload case document
// @route   POST /api/cases/:id/documents
// @access  Private
const uploadDocument = async (req, res) => {
  let tempFilePath = null;

  try {
    // Validate case ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid case ID format'
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    tempFilePath = req.file.path;

    // Find the case and check access permissions
    let query = { _id: req.params.id, isArchived: false };

    // Role-based access control
    switch (req.user.role) {
      case 'client':
        query.clientId = req.user._id;
        break;
      case 'admin':
        // Admin needs upload permission and case access
        if (!req.user.permissions?.canUploadFiles) {
          cleanupTempFile(tempFilePath);
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions to upload files'
          });
        }
        if (!req.user.permissions?.canViewAllCases) {
          query.assignedTo = req.user._id;
        }
        break;
      case 'advocate':
        // Advocates can upload to any case
        break;
      default:
        cleanupTempFile(tempFilePath);
        return res.status(403).json({
          success: false,
          message: 'Invalid user role'
        });
    }

    const case_item = await Case.findOne(query);

    if (!case_item) {
      cleanupTempFile(tempFilePath);
      return res.status(404).json({
        success: false,
        message: 'Case not found or access denied'
      });
    }

    // Check document limits
    if (case_item.documents.length >= 50) {
      cleanupTempFile(tempFilePath);
      return res.status(400).json({
        success: false,
        message: 'Maximum 50 documents allowed per case'
      });
    }

    // Check total size limit
    const currentTotalSize = case_item.documents.reduce((sum, doc) => sum + doc.size, 0);
    if (currentTotalSize + req.file.size > 524288000) { // 500MB
      cleanupTempFile(tempFilePath);
      return res.status(400).json({
        success: false,
        message: 'Total document size would exceed 500MB limit'
      });
    }

    // Upload to Cloudinary
    const uploadOptions = {
      folder: `legalpro/cases/${case_item._id}`,
      resource_type: 'auto',
      public_id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
      use_filename: false,
      unique_filename: true
    };

    const cloudinaryResult = await uploadFile(tempFilePath, uploadOptions);

    // Prepare document data
    const documentData = {
      name: req.body.name || req.file.originalname,
      originalName: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      url: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
      uploadedBy: req.user._id,
      description: req.body.description || '',
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      metadata: {
        format: cloudinaryResult.format,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        pages: cloudinaryResult.pages
      }
    };

    // Add document to case
    await case_item.addDocument(documentData, req.user._id);

    // Clean up temporary file
    cleanupTempFile(tempFilePath);

    // Get the newly added document
    const newDocument = case_item.documents[case_item.documents.length - 1];

    // Populate uploader information
    await case_item.populate('documents.uploadedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: newDocument
    });

  } catch (error) {
    console.error('Upload document error:', error);

    // Clean up temporary file on error
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }

    // Handle specific errors
    if (error.message.includes('Maximum 50 documents') || error.message.includes('exceed 500MB')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('cloud storage')) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload file to cloud storage'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Restore archived case
// @route   PUT /api/cases/:id/restore
// @access  Private (Advocate only)
const restoreCase = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid case ID format'
      });
    }

    const case_item = await Case.findById(req.params.id);

    if (!case_item) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    if (!case_item.isArchived) {
      return res.status(400).json({
        success: false,
        message: 'Case is not archived'
      });
    }

    case_item.isArchived = false;
    await case_item.save();

    await case_item.addTimelineEvent(
      'case_restored',
      'Case restored from archive',
      req.user._id,
      { reason: req.body.reason || 'No reason provided' }
    );

    res.status(200).json({
      success: true,
      message: 'Case restored successfully',
      data: case_item
    });
  } catch (error) {
    console.error('Restore case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore case',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Assign case to user
// @route   PUT /api/cases/:id/assign
// @access  Private (Advocate only)
const assignCase = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid case ID format'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const [case_item, assignedUser] = await Promise.all([
      Case.findById(req.params.id),
      User.findById(assignedTo)
    ]);

    if (!case_item) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    if (!assignedUser || !['admin', 'advocate'].includes(assignedUser.role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user for assignment'
      });
    }

    const previousAssignee = case_item.assignedTo;
    case_item.assignedTo = assignedTo;
    await case_item.save();

    await case_item.addTimelineEvent(
      'case_assigned',
      `Case assigned to ${assignedUser.firstName} ${assignedUser.lastName}`,
      req.user._id,
      {
        previousAssignee,
        newAssignee: assignedTo,
        assigneeName: `${assignedUser.firstName} ${assignedUser.lastName}`
      }
    );

    await case_item.populate('assignedTo', 'firstName lastName email avatar');

    res.status(200).json({
      success: true,
      message: 'Case assigned successfully',
      data: case_item
    });
  } catch (error) {
    console.error('Assign case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign case',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get case statistics
// @route   GET /api/cases/stats
// @access  Private
const getCaseStats = async (req, res) => {
  try {
    let matchQuery = { isArchived: false };

    // Role-based filtering
    if (req.user.role === 'client') {
      matchQuery.clientId = req.user._id;
    } else if (req.user.role === 'admin' && !req.user.permissions?.canViewAllCases) {
      matchQuery.assignedTo = req.user._id;
    }

    const stats = await Case.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalCases: { $sum: 1 },
          pendingCases: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgressCases: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          completedCases: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          closedCases: {
            $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
          },
          urgentCases: {
            $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
          },
          highPriorityCases: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          }
        }
      }
    ]);

    const categoryStats = await Case.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalCases: 0,
          pendingCases: 0,
          inProgressCases: 0,
          completedCases: 0,
          closedCases: 0,
          urgentCases: 0,
          highPriorityCases: 0
        },
        categoryBreakdown: categoryStats
      }
    });
  } catch (error) {
    console.error('Get case stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve case statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get case documents
// @route   GET /api/cases/:id/documents
// @access  Private
const getCaseDocuments = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid case ID format'
      });
    }

    let query = { _id: req.params.id, isArchived: false };

    // Role-based access control
    switch (req.user.role) {
      case 'client':
        query.clientId = req.user._id;
        break;
      case 'admin':
        if (!req.user.permissions?.canOpenFiles) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions to view files'
          });
        }
        if (!req.user.permissions?.canViewAllCases) {
          query.assignedTo = req.user._id;
        }
        break;
      case 'advocate':
        // Advocates can view all documents
        break;
      default:
        return res.status(403).json({
          success: false,
          message: 'Invalid user role'
        });
    }

    const case_item = await Case.findOne(query)
      .populate('documents.uploadedBy', 'firstName lastName')
      .select('documents');

    if (!case_item) {
      return res.status(404).json({
        success: false,
        message: 'Case not found or access denied'
      });
    }

    res.status(200).json({
      success: true,
      count: case_item.documents.length,
      data: case_item.documents.sort((a, b) => b.createdAt - a.createdAt)
    });
  } catch (error) {
    console.error('Get case documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete case document
// @route   DELETE /api/cases/:id/documents/:docId
// @access  Private
const deleteDocument = async (req, res) => {
  try {
    const { id: caseId, docId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(caseId) || !mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    let query = { _id: caseId, isArchived: false };

    // Role-based access control
    switch (req.user.role) {
      case 'client':
        query.clientId = req.user._id;
        break;
      case 'admin':
        if (!req.user.permissions?.canDeleteFiles) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions to delete files'
          });
        }
        if (!req.user.permissions?.canViewAllCases) {
          query.assignedTo = req.user._id;
        }
        break;
      case 'advocate':
        // Advocates can delete any document
        break;
      default:
        return res.status(403).json({
          success: false,
          message: 'Invalid user role'
        });
    }

    const case_item = await Case.findOne(query);

    if (!case_item) {
      return res.status(404).json({
        success: false,
        message: 'Case not found or access denied'
      });
    }

    const document = case_item.documents.id(docId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user can delete this document (clients can only delete their own uploads)
    if (req.user.role === 'client' && document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete documents you uploaded'
      });
    }

    // Delete from Cloudinary
    try {
      await deleteFile(document.publicId);
    } catch (cloudinaryError) {
      console.error('Cloudinary delete error:', cloudinaryError);
      // Continue with database deletion even if Cloudinary deletion fails
    }

    // Remove from case
    await case_item.removeDocument(docId, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Download case document
// @route   GET /api/cases/:id/documents/:docId/download
// @access  Private
const downloadDocument = async (req, res) => {
  try {
    const { id: caseId, docId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(caseId) || !mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    let query = { _id: caseId, isArchived: false };

    // Role-based access control
    switch (req.user.role) {
      case 'client':
        query.clientId = req.user._id;
        break;
      case 'admin':
        if (!req.user.permissions?.canOpenFiles) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions to download files'
          });
        }
        if (!req.user.permissions?.canViewAllCases) {
          query.assignedTo = req.user._id;
        }
        break;
      case 'advocate':
        // Advocates can download any document
        break;
      default:
        return res.status(403).json({
          success: false,
          message: 'Invalid user role'
        });
    }

    const case_item = await Case.findOne(query);

    if (!case_item) {
      return res.status(404).json({
        success: false,
        message: 'Case not found or access denied'
      });
    }

    const document = case_item.documents.id(docId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Update download count and last accessed
    document.downloadCount = (document.downloadCount || 0) + 1;
    document.lastAccessed = new Date();
    await case_item.save();

    // Return the secure URL for download
    res.status(200).json({
      success: true,
      data: {
        downloadUrl: document.url,
        filename: document.originalName,
        size: document.size,
        type: document.type
      }
    });
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate download link',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Advanced case search
// @route   GET /api/cases/search
// @access  Private
const searchCases = async (req, res) => {
  try {
    const {
      q,           // General search query
      title,       // Search in title
      client,      // Search by client name
      status,      // Filter by status
      category,    // Filter by category
      priority,    // Filter by priority
      assignedTo,  // Filter by assigned user
      startDate,   // Date range start
      endDate,     // Date range end
      courtDateStart, // Court date range start
      courtDateEnd,   // Court date range end
      hasDocuments,   // Filter cases with/without documents
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = { isArchived: false };
    let pipeline = [];

    // Role-based filtering
    switch (req.user.role) {
      case 'client':
        query.clientId = req.user._id;
        break;
      case 'admin':
        if (!req.user.permissions?.canViewAllCases) {
          query.assignedTo = req.user._id;
        }
        break;
      case 'advocate':
        // Advocates can see all cases
        break;
      default:
        return res.status(403).json({
          success: false,
          message: 'Invalid user role'
        });
    }

    // Build aggregation pipeline for advanced search
    pipeline.push({ $match: query });

    // Lookup client information for client name search
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'clientId',
        foreignField: '_id',
        as: 'client'
      }
    });

    // Lookup assigned user information
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'assignedTo',
        foreignField: '_id',
        as: 'assignedUser'
      }
    });

    // Build match conditions for advanced search
    let advancedMatch = {};

    // General search across multiple fields
    if (q) {
      const searchRegex = { $regex: q, $options: 'i' };
      advancedMatch.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { caseNumber: searchRegex },
        { 'client.firstName': searchRegex },
        { 'client.lastName': searchRegex },
        { 'client.email': searchRegex }
      ];
    }

    // Specific field searches
    if (title) {
      advancedMatch.title = { $regex: title, $options: 'i' };
    }

    if (client) {
      const clientRegex = { $regex: client, $options: 'i' };
      advancedMatch.$or = advancedMatch.$or || [];
      advancedMatch.$or.push(
        { 'client.firstName': clientRegex },
        { 'client.lastName': clientRegex },
        { 'client.email': clientRegex }
      );
    }

    // Filter conditions
    if (status) {
      advancedMatch.status = status;
    }

    if (category) {
      advancedMatch.category = category;
    }

    if (priority) {
      advancedMatch.priority = priority;
    }

    if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
      advancedMatch.assignedTo = new mongoose.Types.ObjectId(assignedTo);
    }

    // Date range filters
    if (startDate || endDate) {
      advancedMatch.createdAt = {};
      if (startDate) {
        advancedMatch.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        advancedMatch.createdAt.$lte = new Date(endDate);
      }
    }

    // Court date range filters
    if (courtDateStart || courtDateEnd) {
      advancedMatch.courtDate = {};
      if (courtDateStart) {
        advancedMatch.courtDate.$gte = new Date(courtDateStart);
      }
      if (courtDateEnd) {
        advancedMatch.courtDate.$lte = new Date(courtDateEnd);
      }
    }

    // Filter by document presence
    if (hasDocuments !== undefined) {
      if (hasDocuments === 'true') {
        advancedMatch['documents.0'] = { $exists: true };
      } else if (hasDocuments === 'false') {
        advancedMatch.documents = { $size: 0 };
      }
    }

    // Add advanced match to pipeline
    if (Object.keys(advancedMatch).length > 0) {
      pipeline.push({ $match: advancedMatch });
    }

    // Add document statistics
    pipeline.push({
      $addFields: {
        documentCount: { $size: '$documents' },
        totalDocumentSize: {
          $sum: '$documents.size'
        },
        lastDocumentUpload: {
          $max: '$documents.createdAt'
        }
      }
    });

    // Sorting
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortStage = {};
    sortStage[sortBy] = sortDirection;
    pipeline.push({ $sort: sortStage });

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Case.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Add pagination to main pipeline
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNum });

    // Project final fields
    pipeline.push({
      $project: {
        caseNumber: 1,
        title: 1,
        description: 1,
        category: 1,
        status: 1,
        priority: 1,
        courtDate: 1,
        createdAt: 1,
        updatedAt: 1,
        documentCount: 1,
        totalDocumentSize: 1,
        lastDocumentUpload: 1,
        client: { $arrayElemAt: ['$client', 0] },
        assignedUser: { $arrayElemAt: ['$assignedUser', 0] }
      }
    });

    // Execute search
    const cases = await Case.aggregate(pipeline);

    res.status(200).json({
      success: true,
      count: cases.length,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      },
      searchCriteria: {
        q, title, client, status, category, priority, assignedTo,
        startDate, endDate, courtDateStart, courtDateEnd, hasDocuments
      },
      data: cases
    });
  } catch (error) {
    console.error('Search cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search cases',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getCases,
  getCase,
  createCase,
  updateCase,
  deleteCase,
  restoreCase,
  assignCase,
  getCaseStats,
  searchCases,
  addCaseNote,
  updateCaseStatus,
  getCaseTimeline,
  uploadDocument,
  getCaseDocuments,
  deleteDocument,
  downloadDocument
};