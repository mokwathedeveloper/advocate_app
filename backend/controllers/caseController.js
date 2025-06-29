const Case = require('../models/Case');
const User = require('../models/User');

// @desc    Get all cases
// @route   GET /api/cases
// @access  Private
const getCases = async (req, res) => {
  try {
    let query = { isArchived: false };
    
    // Filter by user role
    if (req.user.role === 'client') {
      query.clientId = req.user._id;
    }
    
    // Apply filters from query params
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    
    if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }
    
    // Search functionality
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { caseNumber: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const cases = await Case.find(query)
      .populate('clientId', 'firstName lastName email phone')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    const total = await Case.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: cases.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: cases
    });
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single case
// @route   GET /api/cases/:id
// @access  Private
const getCase = async (req, res) => {
  try {
    let query = { _id: req.params.id, isArchived: false };
    
    // Filter by user role
    if (req.user.role === 'client') {
      query.clientId = req.user._id;
    }
    
    const case_item = await Case.findOne(query)
      .populate('clientId', 'firstName lastName email phone')
      .populate('assignedTo', 'firstName lastName email')
      .populate('notes.author', 'firstName lastName')
      .populate('timeline.user', 'firstName lastName');
    
    if (!case_item) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: case_item
    });
  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new case
// @route   POST /api/cases
// @access  Private (Admin/Super Admin)
const createCase = async (req, res) => {
  try {
    const case_item = await Case.create({
      ...req.body,
      assignedTo: req.user._id
    });
    
    await case_item.populate('clientId', 'firstName lastName email phone');
    await case_item.populate('assignedTo', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      data: case_item
    });
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update case
// @route   PUT /api/cases/:id
// @access  Private (Admin/Super Admin)
const updateCase = async (req, res) => {
  try {
    const case_item = await Case.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
      .populate('clientId', 'firstName lastName email phone')
      .populate('assignedTo', 'firstName lastName email');
    
    if (!case_item) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: case_item
    });
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete case
// @route   DELETE /api/cases/:id
// @access  Private (Super Admin only)
const deleteCase = async (req, res) => {
  try {
    const case_item = await Case.findById(req.params.id);
    
    if (!case_item) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    await case_item.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Case deleted successfully'
    });
  } catch (error) {
    console.error('Delete case error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
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

module.exports = {
  getCases,
  getCase,
  createCase,
  updateCase,
  deleteCase,
  addCaseNote,
  updateCaseStatus,
  getCaseTimeline,
  uploadDocument
};