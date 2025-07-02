// Case Workflow Controller - LegalPro v1.0.1
// API endpoints for case status management and workflow operations

const Case = require('../models/Case');
const CaseWorkflowService = require('../services/caseWorkflowService');
const { validationResult } = require('express-validator');
const { USER_ROLES } = require('../config/auth');

/**
 * @desc    Change case status
 * @route   PUT /api/cases/:id/status
 * @access  Private (Advocates/Admin/Super Admin)
 */
const changeStatus = async (req, res) => {
  try {
    const caseId = req.params.id;
    const { status, reason, outcome, notes, approved } = req.body;

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Check if case exists
    const caseItem = await Case.findById(caseId);
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

    // Change status using workflow service
    const result = await CaseWorkflowService.changeStatus(caseId, status, req.user, {
      reason,
      outcome,
      notes,
      approved,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        case: result.case,
        previousStatus: result.previousStatus,
        newStatus: result.newStatus
      }
    });

  } catch (error) {
    console.error('Change status error:', error);
    
    // Handle specific workflow errors
    if (error.message.includes('Invalid status transition') ||
        error.message.includes('Insufficient permissions') ||
        error.message.includes('required')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error changing case status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get available status transitions for a case
 * @route   GET /api/cases/:id/transitions
 * @access  Private
 */
const getAvailableTransitions = async (req, res) => {
  try {
    const caseId = req.params.id;

    // Find the case
    const caseItem = await Case.findById(caseId);
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

    // Get available transitions
    const transitions = CaseWorkflowService.getAvailableTransitions(caseItem, req.user);

    res.status(200).json({
      success: true,
      data: {
        currentStatus: caseItem.status,
        currentStatusLabel: CaseWorkflowService.getStatusLabel(caseItem.status),
        availableTransitions: transitions
      }
    });

  } catch (error) {
    console.error('Get transitions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving available transitions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get case status history
 * @route   GET /api/cases/:id/status-history
 * @access  Private
 */
const getStatusHistory = async (req, res) => {
  try {
    const caseId = req.params.id;

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

    // Get status change history from case activities
    const CaseActivity = require('../models/CaseActivity');
    const { ACTIVITY_TYPE } = require('../models/CaseActivity');

    const statusHistory = await CaseActivity.find({
      caseId: caseId,
      activityType: ACTIVITY_TYPE.STATUS_CHANGED
    })
    .populate('performedBy', 'firstName lastName email role')
    .sort({ performedAt: -1 })
    .limit(50);

    // Format the history
    const formattedHistory = statusHistory.map(activity => ({
      id: activity._id,
      previousStatus: activity.details.previousStatus,
      newStatus: activity.details.newStatus,
      reason: activity.details.reason,
      outcome: activity.details.outcome,
      changedBy: activity.performedBy,
      changedAt: activity.performedAt,
      description: activity.description
    }));

    res.status(200).json({
      success: true,
      count: formattedHistory.length,
      data: formattedHistory
    });

  } catch (error) {
    console.error('Get status history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving status history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get workflow statistics
 * @route   GET /api/workflow/statistics
 * @access  Private (Admin/Super Admin)
 */
const getWorkflowStatistics = async (req, res) => {
  try {
    // Check admin permissions
    if (![USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Build filters based on query parameters
    const filters = {};
    
    if (req.query.advocateId) {
      filters.$or = [
        { 'advocate.primary': req.query.advocateId },
        { 'advocate.secondary': req.query.advocateId }
      ];
    }

    if (req.query.dateFrom || req.query.dateTo) {
      filters.dateCreated = {};
      if (req.query.dateFrom) {
        filters.dateCreated.$gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        filters.dateCreated.$lte = new Date(req.query.dateTo);
      }
    }

    if (req.query.caseType) {
      filters.caseType = req.query.caseType;
    }

    // Get statistics
    const statistics = await CaseWorkflowService.getStatusStatistics(filters);

    // Get additional metrics
    const totalCases = await Case.countDocuments({ isActive: true, ...filters });
    const overdueCases = await Case.countDocuments({
      expectedCompletion: { $lt: new Date() },
      status: { $nin: ['closed', 'dismissed', 'archived'] },
      isActive: true,
      ...filters
    });

    const urgentCases = await Case.countDocuments({
      priority: 'urgent',
      status: { $nin: ['closed', 'dismissed', 'archived'] },
      isActive: true,
      ...filters
    });

    res.status(200).json({
      success: true,
      data: {
        ...statistics,
        metrics: {
          totalCases,
          overdueCases,
          urgentCases,
          overduePercentage: totalCases > 0 ? (overdueCases / totalCases * 100).toFixed(2) : 0,
          urgentPercentage: totalCases > 0 ? (urgentCases / totalCases * 100).toFixed(2) : 0
        }
      }
    });

  } catch (error) {
    console.error('Get workflow statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving workflow statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Bulk status change
 * @route   PUT /api/workflow/bulk-status-change
 * @access  Private (Admin/Super Admin)
 */
const bulkStatusChange = async (req, res) => {
  try {
    // Check admin permissions
    if (![USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { caseIds, newStatus, reason } = req.body;

    if (!caseIds || !Array.isArray(caseIds) || caseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Case IDs array is required'
      });
    }

    if (!newStatus) {
      return res.status(400).json({
        success: false,
        message: 'New status is required'
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    // Process each case
    for (const caseId of caseIds) {
      try {
        const result = await CaseWorkflowService.changeStatus(caseId, newStatus, req.user, {
          reason: reason || 'Bulk status change',
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        });

        results.successful.push({
          caseId,
          caseNumber: result.case.caseNumber,
          previousStatus: result.previousStatus,
          newStatus: result.newStatus
        });

      } catch (error) {
        results.failed.push({
          caseId,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk status change completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
      data: results
    });

  } catch (error) {
    console.error('Bulk status change error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing bulk status change',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get workflow configuration
 * @route   GET /api/workflow/config
 * @access  Private
 */
const getWorkflowConfig = async (req, res) => {
  try {
    const { CASE_STATUS } = require('../models/Case');
    
    const config = {
      statuses: Object.values(CASE_STATUS).map(status => ({
        value: status,
        label: CaseWorkflowService.getStatusLabel(status),
        description: CaseWorkflowService.getStatusDescription(status)
      })),
      transitions: Object.keys(CaseWorkflowService.STATUS_TRANSITIONS || {}).reduce((acc, status) => {
        acc[status] = CaseWorkflowService.STATUS_TRANSITIONS[status];
        return acc;
      }, {}),
      permissions: CaseWorkflowService.STATUS_PERMISSIONS || {},
      actions: CaseWorkflowService.STATUS_ACTIONS || {}
    };

    res.status(200).json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Get workflow config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving workflow configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  changeStatus,
  getAvailableTransitions,
  getStatusHistory,
  getWorkflowStatistics,
  bulkStatusChange,
  getWorkflowConfig
};
