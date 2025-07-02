// Enhanced Case Management Controller - LegalPro v1.0.1
// Comprehensive case management with RBAC, activity logging, and advanced features

const Case = require('../models/Case');
const CaseDocument = require('../models/CaseDocument');
const CaseActivity = require('../models/CaseActivity');
const CaseNote = require('../models/CaseNote');
const User = require('../models/User');
const { CASE_STATUS, CASE_TYPE, CASE_PRIORITY } = require('../models/Case');
const { ACTIVITY_TYPE } = require('../models/CaseActivity');
const { USER_ROLES } = require('../config/auth');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all cases with advanced filtering and RBAC
 * @route   GET /api/cases
 * @access  Private
 */
const getCases = async (req, res) => {
  try {
    // Build query based on user role and permissions
    const cases = await Case.findByUser(req.user._id, req.user.role);

    let query = cases.getQuery();

    // Apply additional filters from query params
    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.caseType) {
      query.caseType = req.query.caseType;
    }

    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    if (req.query.advocateId) {
      query.$or = [
        { 'advocate.primary': req.query.advocateId },
        { 'advocate.secondary': req.query.advocateId }
      ];
    }

    if (req.query.clientId) {
      query.$or = [
        { 'client.primary': req.query.clientId },
        { 'client.additional': req.query.clientId }
      ];
    }

    // Date range filters
    if (req.query.dateFrom || req.query.dateTo) {
      query.dateCreated = {};
      if (req.query.dateFrom) {
        query.dateCreated.$gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        query.dateCreated.$lte = new Date(req.query.dateTo);
      }
    }

    // Search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    // Sort options
    let sortBy = { lastActivity: -1 }; // Default sort by last activity
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      sortBy = { [sortField]: sortOrder };
    }

    // Execute query
    const casesData = await Case.find(query)
      .populate('client.primary', 'firstName lastName email phone')
      .populate('client.additional', 'firstName lastName email')
      .populate('advocate.primary', 'firstName lastName email specialization')
      .populate('advocate.secondary', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort(sortBy)
      .skip(startIndex)
      .limit(limit);

    const total = await Case.countDocuments(query);

    // Get status counts for dashboard
    const statusCounts = await Case.getStatusCounts(req.user._id, req.user.role);

    res.status(200).json({
      success: true,
      count: casesData.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      statusCounts,
      data: casesData
    });

  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving cases',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get single case with full details
 * @route   GET /api/cases/:id
 * @access  Private
 */
const getCase = async (req, res) => {
  try {
    const caseId = req.params.id;

    // Find case
    const caseItem = await Case.findById(caseId)
      .populate('client.primary', 'firstName lastName email phone')
      .populate('client.additional', 'firstName lastName email phone')
      .populate('advocate.primary', 'firstName lastName email specialization')
      .populate('advocate.secondary', 'firstName lastName email specialization')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check if user can access this case
    if (!caseItem.canUserAccess(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this case'
      });
    }

    // Get case documents (filtered by user permissions)
    const documents = await CaseDocument.findByCaseId(caseId, req.user);
    const accessibleDocuments = [];

    for (const doc of documents) {
      if (await doc.canUserAccess(req.user)) {
        accessibleDocuments.push(doc);
      }
    }

    // Get case notes (filtered by user permissions)
    const notes = await CaseNote.findByCaseId(caseId, req.user);
    const accessibleNotes = [];

    for (const note of notes) {
      if (await note.canUserView(req.user)) {
        accessibleNotes.push(note);
      }
    }

    // Get recent activity
    const recentActivity = await CaseActivity.getCaseTimeline(caseId, {
      limit: 20
    });

    // Filter activities user can view
    const accessibleActivity = [];
    for (const activity of recentActivity) {
      if (await activity.canUserView(req.user)) {
        accessibleActivity.push(activity);
      }
    }

    // Log access activity
    await CaseActivity.createActivity({
      caseId: caseId,
      activityType: ACTIVITY_TYPE.LOGIN_ACCESS,
      action: 'Case Viewed',
      description: `Case ${caseItem.caseNumber} was viewed`,
      performedBy: req.user._id,
      details: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.status(200).json({
      success: true,
      data: {
        case: caseItem,
        documents: accessibleDocuments,
        notes: accessibleNotes,
        recentActivity: accessibleActivity,
        permissions: {
          canEdit: caseItem.canUserEdit(req.user),
          canDelete: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN].includes(req.user.role),
          canAddDocuments: caseItem.canUserAccess(req.user),
          canAddNotes: caseItem.canUserAccess(req.user)
        }
      }
    });

  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving case',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Create new case
 * @route   POST /api/cases
 * @access  Private (Advocate/Admin/Super Admin)
 */
const createCase = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      caseType,
      priority,
      clientId,
      advocateId,
      courtDetails,
      billing,
      expectedCompletion,
      tags,
      notes
    } = req.body;

    // Validate client exists and is a client
    const client = await User.findById(clientId);
    if (!client || client.role !== USER_ROLES.CLIENT) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }

    // Validate advocate if provided
    let advocate = req.user;
    if (advocateId && advocateId !== req.user._id.toString()) {
      advocate = await User.findById(advocateId);
      if (!advocate || ![USER_ROLES.ADVOCATE, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(advocate.role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid advocate ID'
        });
      }
    }

    // Create case
    const caseData = {
      title,
      description,
      caseType,
      priority: priority || CASE_PRIORITY.MEDIUM,
      client: {
        primary: clientId
      },
      advocate: {
        primary: advocate._id
      },
      courtDetails: courtDetails || {},
      billing: billing || {},
      expectedCompletion,
      tags: tags || [],
      notes,
      createdBy: req.user._id,
      status: CASE_STATUS.DRAFT
    };

    const newCase = await Case.create(caseData);

    // Populate the created case
    await newCase.populate('client.primary', 'firstName lastName email phone');
    await newCase.populate('advocate.primary', 'firstName lastName email specialization');
    await newCase.populate('createdBy', 'firstName lastName email');

    // Log case creation activity
    await CaseActivity.createActivity({
      caseId: newCase._id,
      activityType: ACTIVITY_TYPE.CASE_CREATED,
      action: 'Case Created',
      description: `Case ${newCase.caseNumber} was created`,
      performedBy: req.user._id,
      details: {
        caseType,
        priority,
        clientName: client.firstName + ' ' + client.lastName,
        advocateName: advocate.firstName + ' ' + advocate.lastName
      }
    });

    res.status(201).json({
      success: true,
      message: 'Case created successfully',
      data: newCase
    });

  } catch (error) {
    console.error('Create case error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating case',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update case
 * @route   PUT /api/cases/:id
 * @access  Private (Case advocates/Admin/Super Admin)
 */
const updateCase = async (req, res) => {
  try {
    const caseId = req.params.id;

    // Find existing case
    const existingCase = await Case.findById(caseId);
    if (!existingCase) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check if user can edit this case
    if (!existingCase.canUserEdit(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to edit this case'
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

    // Track changes for activity log
    const changes = {};
    const allowedFields = [
      'title', 'description', 'caseType', 'priority', 'status',
      'courtDetails', 'billing', 'expectedCompletion', 'notes', 'tags'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== existingCase[field]) {
        changes[field] = {
          from: existingCase[field],
          to: req.body[field]
        };
      }
    });

    // Update case
    const updatedCase = await Case.findByIdAndUpdate(
      caseId,
      {
        ...req.body,
        updatedBy: req.user._id
      },
      {
        new: true,
        runValidators: true
      }
    )
    .populate('client.primary', 'firstName lastName email phone')
    .populate('client.additional', 'firstName lastName email')
    .populate('advocate.primary', 'firstName lastName email specialization')
    .populate('advocate.secondary', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');

    // Log update activity
    if (Object.keys(changes).length > 0) {
      await CaseActivity.createActivity({
        caseId: caseId,
        activityType: ACTIVITY_TYPE.CASE_UPDATED,
        action: 'Case Updated',
        description: `Case ${updatedCase.caseNumber} was updated`,
        performedBy: req.user._id,
        details: {
          changes,
          fieldsChanged: Object.keys(changes)
        }
      });
    }

    // Log status change if status was updated
    if (changes.status) {
      await CaseActivity.createActivity({
        caseId: caseId,
        activityType: ACTIVITY_TYPE.STATUS_CHANGED,
        action: 'Status Changed',
        description: `Case status changed from ${changes.status.from} to ${changes.status.to}`,
        performedBy: req.user._id,
        details: {
          previousStatus: changes.status.from,
          newStatus: changes.status.to,
          reason: req.body.statusChangeReason || 'No reason provided'
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Case updated successfully',
      data: updatedCase
    });

  } catch (error) {
    console.error('Update case error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating case',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete case (soft delete - archive)
 * @route   DELETE /api/cases/:id
 * @access  Private (Super Admin only)
 */
const deleteCase = async (req, res) => {
  try {
    const caseId = req.params.id;

    const caseItem = await Case.findById(caseId);
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check if user can delete (only super admin)
    if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can delete cases'
      });
    }

    // Soft delete - archive the case
    caseItem.isActive = false;
    caseItem.isArchived = true;
    caseItem.updatedBy = req.user._id;
    await caseItem.save();

    // Log deletion activity
    await CaseActivity.createActivity({
      caseId: caseId,
      activityType: ACTIVITY_TYPE.CASE_ARCHIVED,
      action: 'Case Archived',
      description: `Case ${caseItem.caseNumber} was archived/deleted`,
      performedBy: req.user._id,
      details: {
        reason: req.body.reason || 'No reason provided'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Case archived successfully'
    });

  } catch (error) {
    console.error('Delete case error:', error);
    res.status(500).json({
      success: false,
      message: 'Error archiving case',
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
  try {
    // This would integrate with file upload service (Cloudinary, AWS S3, etc.)
    // For now, return a placeholder response
    res.status(200).json({
      success: true,
      message: 'Document upload functionality will be implemented with file storage service'
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get case statistics
 * @route   GET /api/cases/stats
 * @access  Private
 */
const getCaseStats = async (req, res) => {
  try {
    const statusCounts = await Case.getStatusCounts(req.user._id, req.user.role);

    // Get additional stats
    const totalCases = await Case.countDocuments(
      req.user.role === USER_ROLES.CLIENT
        ? { $or: [{ 'client.primary': req.user._id }, { 'client.additional': req.user._id }] }
        : req.user.role === USER_ROLES.ADVOCATE
        ? { $or: [{ 'advocate.primary': req.user._id }, { 'advocate.secondary': req.user._id }] }
        : {}
    );

    const urgentCases = await Case.countDocuments({
      priority: CASE_PRIORITY.URGENT,
      status: { $in: [CASE_STATUS.OPEN, CASE_STATUS.IN_REVIEW] },
      isActive: true
    });

    res.status(200).json({
      success: true,
      data: {
        statusCounts,
        totalCases,
        urgentCases
      }
    });

  } catch (error) {
    console.error('Get case stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving case statistics'
    });
  }
};

/**
 * @desc    Assign advocate to case
 * @route   PUT /api/cases/:id/assign
 * @access  Private (Admin/Super Admin)
 */
const assignAdvocate = async (req, res) => {
  try {
    const { advocateId, type = 'primary' } = req.body;
    const caseId = req.params.id;

    // Validate advocate
    const advocate = await User.findById(advocateId);
    if (!advocate || ![USER_ROLES.ADVOCATE, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(advocate.role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid advocate ID'
      });
    }

    const caseItem = await Case.findById(caseId);
    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Update advocate assignment
    if (type === 'primary') {
      caseItem.advocate.primary = advocateId;
      if (!caseItem.dateAssigned) {
        caseItem.dateAssigned = new Date();
      }
    } else {
      if (!caseItem.advocate.secondary.includes(advocateId)) {
        caseItem.advocate.secondary.push(advocateId);
      }
    }

    caseItem.updatedBy = req.user._id;
    await caseItem.save();

    // Log assignment
    await CaseActivity.createActivity({
      caseId: caseId,
      activityType: ACTIVITY_TYPE.ADVOCATE_ASSIGNED,
      action: 'Advocate Assigned',
      description: `${advocate.firstName} ${advocate.lastName} was assigned as ${type} advocate`,
      performedBy: req.user._id,
      relatedUser: advocateId,
      details: {
        advocateName: `${advocate.firstName} ${advocate.lastName}`,
        assignmentType: type
      }
    });

    res.status(200).json({
      success: true,
      message: 'Advocate assigned successfully'
    });

  } catch (error) {
    console.error('Assign advocate error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning advocate'
    });
  }
};

module.exports = {
  getCases,
  getCase,
  createCase,
  updateCase,
  deleteCase,
  addCaseNote,
  updateCaseStatus,
  getCaseTimeline,
  uploadDocument,
  getCaseStats,
  assignAdvocate
};