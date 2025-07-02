// Activity Controller - LegalPro v1.0.1
// API endpoints for case activity logging and audit trail

const ActivityService = require('../services/activityService');
const { validationResult } = require('express-validator');
const { USER_ROLES } = require('../config/auth');

/**
 * @desc    Get case activity timeline
 * @route   GET /api/cases/:caseId/activities
 * @access  Private
 */
const getCaseActivities = async (req, res) => {
  try {
    const { caseId } = req.params;
    
    // Extract filter options from query
    const options = {
      activityTypes: req.query.types ? req.query.types.split(',') : undefined,
      category: req.query.category,
      priority: req.query.priority,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      performedBy: req.query.performedBy,
      includeSystem: req.query.includeSystem !== 'false',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await ActivityService.getCaseTimeline(caseId, options, req.user);

    res.status(200).json({
      success: true,
      message: `Retrieved ${result.activities.length} activities`,
      data: result.activities,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Get case activities error:', error);
    
    if (error.message === 'Access denied to case') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error retrieving case activities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get user activity across all cases
 * @route   GET /api/users/:userId/activities
 * @access  Private
 */
const getUserActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user can access this user's activities
    if (userId !== req.user._id.toString() && 
        ![USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to user activities'
      });
    }

    const options = {
      caseId: req.query.caseId,
      activityTypes: req.query.types ? req.query.types.split(',') : undefined,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await ActivityService.getUserActivity(userId, options);

    res.status(200).json({
      success: true,
      message: `Retrieved ${result.activities.length} user activities`,
      data: result.activities,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user activities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get activity statistics
 * @route   GET /api/activities/statistics
 * @access  Private (Admin/Super Admin)
 */
const getActivityStatistics = async (req, res) => {
  try {
    // Check admin permissions
    if (![USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const filters = {
      caseId: req.query.caseId,
      userId: req.query.userId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };

    const statistics = await ActivityService.getActivityStatistics(filters);

    res.status(200).json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error('Get activity statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving activity statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Export activity data
 * @route   POST /api/activities/export
 * @access  Private (Admin/Super Admin)
 */
const exportActivities = async (req, res) => {
  try {
    // Check admin permissions
    if (![USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { filters = {}, format = 'csv' } = req.body;

    const exportData = await ActivityService.exportActivityData(filters, format);

    res.status(200).json({
      success: true,
      message: `Export prepared with ${exportData.totalRecords} records`,
      data: exportData
    });

  } catch (error) {
    console.error('Export activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting activities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get activity summary for dashboard
 * @route   GET /api/activities/summary
 * @access  Private
 */
const getActivitySummary = async (req, res) => {
  try {
    const summary = await ActivityService.getActivitySummary(req.user);

    res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Get activity summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving activity summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Log custom activity (for system integrations)
 * @route   POST /api/activities/log
 * @access  Private (Admin/Super Admin)
 */
const logActivity = async (req, res) => {
  try {
    // Check admin permissions
    if (![USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
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
      caseId,
      activityType,
      action,
      description,
      details,
      priority,
      category,
      relatedDocument,
      relatedUser,
      relatedNote
    } = req.body;

    const activityData = {
      caseId,
      activityType,
      action,
      description,
      performedBy: req.user._id,
      details,
      priority,
      category,
      relatedDocument,
      relatedUser,
      relatedNote,
      isSystemGenerated: false,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    const activity = await ActivityService.logActivity(activityData);

    res.status(201).json({
      success: true,
      message: 'Activity logged successfully',
      data: activity
    });

  } catch (error) {
    console.error('Log activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get activity types and categories
 * @route   GET /api/activities/config
 * @access  Private
 */
const getActivityConfig = async (req, res) => {
  try {
    const { ACTIVITY_TYPE, ACTIVITY_PRIORITY } = require('../models/CaseActivity');

    const config = {
      activityTypes: Object.values(ACTIVITY_TYPE).map(type => ({
        value: type,
        label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      })),
      priorities: Object.values(ACTIVITY_PRIORITY).map(priority => ({
        value: priority,
        label: priority.charAt(0).toUpperCase() + priority.slice(1)
      })),
      categories: [
        { value: 'case_management', label: 'Case Management' },
        { value: 'document_management', label: 'Document Management' },
        { value: 'user_management', label: 'User Management' },
        { value: 'billing', label: 'Billing' },
        { value: 'communication', label: 'Communication' },
        { value: 'system', label: 'System' },
        { value: 'security', label: 'Security' }
      ]
    };

    res.status(200).json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Get activity config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving activity configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Clean up old activities (maintenance endpoint)
 * @route   POST /api/activities/cleanup
 * @access  Private (Super Admin only)
 */
const cleanupActivities = async (req, res) => {
  try {
    // Check super admin permissions
    if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Super Admin access required'
      });
    }

    const { daysToKeep = 365 } = req.body;

    const result = await ActivityService.cleanupOldActivities(daysToKeep);

    res.status(200).json({
      success: true,
      message: `Cleanup completed. ${result.hiddenActivities} activities hidden.`,
      data: result
    });

  } catch (error) {
    console.error('Cleanup activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up activities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Search activities
 * @route   GET /api/activities/search
 * @access  Private
 */
const searchActivities = async (req, res) => {
  try {
    const { q: query, caseId, userId, type, category } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Build search query
    const CaseActivity = require('../models/CaseActivity');
    const searchRegex = { $regex: query.trim(), $options: 'i' };
    
    let searchQuery = {
      isVisible: true,
      $or: [
        { action: searchRegex },
        { description: searchRegex },
        { 'details.reason': searchRegex },
        { 'details.notes': searchRegex }
      ]
    };

    // Add filters
    if (caseId) searchQuery.caseId = caseId;
    if (userId) searchQuery.performedBy = userId;
    if (type) searchQuery.activityType = type;
    if (category) searchQuery.category = category;

    // Apply user access control
    if (req.user.role === USER_ROLES.CLIENT) {
      const Case = require('../models/Case');
      const userCases = await Case.find({
        $or: [
          { 'client.primary': req.user._id },
          { 'client.additional': req.user._id }
        ]
      }).select('_id');
      searchQuery.caseId = { $in: userCases.map(c => c._id) };
    } else if (req.user.role === USER_ROLES.ADVOCATE) {
      const Case = require('../models/Case');
      const userCases = await Case.find({
        $or: [
          { 'advocate.primary': req.user._id },
          { 'advocate.secondary': req.user._id }
        ]
      }).select('_id');
      searchQuery.caseId = { $in: userCases.map(c => c._id) };
    }

    const activities = await CaseActivity.find(searchQuery)
      .populate('performedBy', 'firstName lastName email')
      .populate('caseId', 'title caseNumber')
      .sort({ performedAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      message: `Found ${activities.length} activities`,
      data: activities
    });

  } catch (error) {
    console.error('Search activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching activities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getCaseActivities,
  getUserActivities,
  getActivityStatistics,
  exportActivities,
  getActivitySummary,
  logActivity,
  getActivityConfig,
  cleanupActivities,
  searchActivities
};
