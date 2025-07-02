// Case Note Management Controller - LegalPro v1.0.1
// Comprehensive note management for legal cases

const CaseNote = require('../models/CaseNote');
const Case = require('../models/Case');
const CaseActivity = require('../models/CaseActivity');
const { NOTE_TYPE, NOTE_PRIORITY, NOTE_STATUS } = require('../models/CaseNote');
const { ACTIVITY_TYPE } = require('../models/CaseActivity');
const { USER_ROLES } = require('../config/auth');
const { validationResult } = require('express-validator');

/**
 * @desc    Create new case note
 * @route   POST /api/cases/:caseId/notes
 * @access  Private
 */
const createNote = async (req, res) => {
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
    
    const {
      title,
      content,
      noteType,
      priority,
      isPrivate,
      isConfidential,
      visibleTo,
      tags,
      category,
      meetingDetails,
      followUp,
      reminder
    } = req.body;
    
    // Create note
    const noteData = {
      caseId: caseId,
      title,
      content,
      noteType: noteType || NOTE_TYPE.GENERAL,
      priority: priority || NOTE_PRIORITY.MEDIUM,
      isPrivate: isPrivate || false,
      isConfidential: isConfidential || false,
      visibleTo: visibleTo || [],
      tags: tags || [],
      category,
      meetingDetails,
      followUp,
      reminder,
      createdBy: req.user._id
    };
    
    const note = await CaseNote.create(noteData);
    
    // Populate the created note
    await note.populate('createdBy', 'firstName lastName email');
    
    // Log note creation activity
    await CaseActivity.createActivity({
      caseId: caseId,
      activityType: ACTIVITY_TYPE.NOTE_ADDED,
      action: 'Note Added',
      description: `Note "${title}" was added to the case`,
      performedBy: req.user._id,
      relatedNote: note._id,
      details: {
        noteTitle: title,
        noteType: noteType,
        isPrivate: isPrivate,
        isConfidential: isConfidential
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: note
    });
    
  } catch (error) {
    console.error('Create note error:', error);
    
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
      message: 'Error creating note',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get case notes
 * @route   GET /api/cases/:caseId/notes
 * @access  Private
 */
const getCaseNotes = async (req, res) => {
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
    
    // Get notes and filter by user permissions
    const notes = await CaseNote.findByCaseId(caseId, req.user, {
      noteType: req.query.noteType,
      priority: req.query.priority,
      isPinned: req.query.isPinned
    });
    
    const accessibleNotes = [];
    for (const note of notes) {
      if (await note.canUserView(req.user)) {
        accessibleNotes.push(note);
      }
    }
    
    // Apply search filter
    let filteredNotes = accessibleNotes;
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      filteredNotes = filteredNotes.filter(note => 
        note.title.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm) ||
        (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedNotes = filteredNotes.slice(startIndex, endIndex);
    
    res.status(200).json({
      success: true,
      count: paginatedNotes.length,
      total: filteredNotes.length,
      pagination: {
        page,
        limit,
        pages: Math.ceil(filteredNotes.length / limit),
        hasNext: endIndex < filteredNotes.length,
        hasPrev: page > 1
      },
      data: paginatedNotes
    });
    
  } catch (error) {
    console.error('Get case notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving notes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get single note
 * @route   GET /api/notes/:id
 * @access  Private
 */
const getNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    
    const note = await CaseNote.findById(noteId)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('caseId', 'title caseNumber')
      .populate('relatedUsers', 'firstName lastName email')
      .populate('followUp.assignedTo', 'firstName lastName email')
      .populate('followUp.completedBy', 'firstName lastName email');
    
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    
    // Check if user can view this note
    if (!(await note.canUserView(req.user))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this note'
      });
    }
    
    // Mark as read
    await note.markAsRead(req.user._id);
    
    res.status(200).json({
      success: true,
      data: note
    });
    
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving note',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update note
 * @route   PUT /api/notes/:id
 * @access  Private
 */
const updateNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    
    const note = await CaseNote.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    
    // Check if user can edit this note
    if (!note.canUserEdit(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to edit this note'
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
    
    // Store previous content for edit history
    const previousContent = note.content;
    
    // Update allowed fields
    const allowedFields = [
      'title', 'content', 'noteType', 'priority', 'isPrivate', 'isConfidential',
      'visibleTo', 'tags', 'category', 'meetingDetails', 'followUp', 'reminder'
    ];
    
    const updateData = { updatedBy: req.user._id };
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    const updatedNote = await CaseNote.findByIdAndUpdate(
      noteId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email');
    
    // Add to edit history if content changed
    if (req.body.content && req.body.content !== previousContent) {
      await updatedNote.addToEditHistory(
        req.user._id,
        'Content updated',
        previousContent
      );
    }
    
    // Log update activity
    await CaseActivity.createActivity({
      caseId: note.caseId,
      activityType: ACTIVITY_TYPE.NOTE_UPDATED,
      action: 'Note Updated',
      description: `Note "${note.title}" was updated`,
      performedBy: req.user._id,
      relatedNote: note._id,
      details: {
        noteTitle: note.title,
        updatedFields: Object.keys(updateData).filter(field => field !== 'updatedBy')
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: updatedNote
    });
    
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating note',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete note
 * @route   DELETE /api/notes/:id
 * @access  Private
 */
const deleteNote = async (req, res) => {
  try {
    const noteId = req.params.id;

    const note = await CaseNote.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if user can delete this note
    if (!note.canUserDelete(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to delete this note'
      });
    }

    // Soft delete - mark as deleted
    note.status = NOTE_STATUS.DELETED;
    await note.save();

    // Log deletion activity
    await CaseActivity.createActivity({
      caseId: note.caseId,
      activityType: ACTIVITY_TYPE.NOTE_DELETED,
      action: 'Note Deleted',
      description: `Note "${note.title}" was deleted`,
      performedBy: req.user._id,
      relatedNote: note._id,
      details: {
        noteTitle: note.title,
        reason: req.body.reason || 'No reason provided'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });

  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting note',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Pin/Unpin note
 * @route   PUT /api/notes/:id/pin
 * @access  Private
 */
const togglePinNote = async (req, res) => {
  try {
    const noteId = req.params.id;

    const note = await CaseNote.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if user can edit this note
    if (!note.canUserEdit(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to edit this note'
      });
    }

    // Toggle pin status
    if (note.isPinned) {
      await note.unpin();
    } else {
      await note.pin();
    }

    res.status(200).json({
      success: true,
      message: `Note ${note.isPinned ? 'pinned' : 'unpinned'} successfully`,
      data: { isPinned: note.isPinned }
    });

  } catch (error) {
    console.error('Toggle pin note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating note pin status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Complete follow-up task
 * @route   PUT /api/notes/:id/complete-followup
 * @access  Private
 */
const completeFollowUp = async (req, res) => {
  try {
    const noteId = req.params.id;

    const note = await CaseNote.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if user can complete follow-up
    if (!note.followUp.required || note.followUp.completed) {
      return res.status(400).json({
        success: false,
        message: 'No pending follow-up task for this note'
      });
    }

    // Check if user is assigned to follow-up or can edit note
    if (note.followUp.assignedTo.toString() !== req.user._id.toString() && !note.canUserEdit(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to complete this follow-up'
      });
    }

    // Complete follow-up
    await note.completeFollowUp(req.user._id);

    // Log completion activity
    await CaseActivity.createActivity({
      caseId: note.caseId,
      activityType: ACTIVITY_TYPE.CASE_UPDATED,
      action: 'Follow-up Completed',
      description: `Follow-up task for note "${note.title}" was completed`,
      performedBy: req.user._id,
      relatedNote: note._id,
      details: {
        noteTitle: note.title,
        completionNotes: req.body.notes || ''
      }
    });

    res.status(200).json({
      success: true,
      message: 'Follow-up task completed successfully'
    });

  } catch (error) {
    console.error('Complete follow-up error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing follow-up task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get user's pending follow-ups
 * @route   GET /api/notes/followups/pending
 * @access  Private
 */
const getPendingFollowUps = async (req, res) => {
  try {
    const followUps = await CaseNote.findPendingFollowUps(req.user._id);

    res.status(200).json({
      success: true,
      count: followUps.length,
      data: followUps
    });

  } catch (error) {
    console.error('Get pending follow-ups error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving pending follow-ups',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createNote,
  getCaseNotes,
  getNote,
  updateNote,
  deleteNote,
  togglePinNote,
  completeFollowUp,
  getPendingFollowUps
};
