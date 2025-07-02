// Activity Service - LegalPro v1.0.1
// Comprehensive activity logging and audit trail management

const CaseActivity = require('../models/CaseActivity');
const Case = require('../models/Case');
const { ACTIVITY_TYPE, ACTIVITY_PRIORITY } = require('../models/CaseActivity');
const { USER_ROLES } = require('../config/auth');

class ActivityService {
  /**
   * Log a case activity with comprehensive details
   * @param {Object} activityData - Activity data
   * @returns {Object} - Created activity
   */
  static async logActivity(activityData) {
    try {
      const {
        caseId,
        activityType,
        action,
        description,
        performedBy,
        details = {},
        priority = ACTIVITY_PRIORITY.MEDIUM,
        category = 'case_management',
        relatedDocument,
        relatedUser,
        relatedNote,
        isSystemGenerated = false,
        ipAddress,
        userAgent
      } = activityData;

      // Validate required fields
      if (!caseId || !activityType || !action || !description || !performedBy) {
        throw new Error('Missing required activity fields');
      }

      // Enhance details with system information
      const enhancedDetails = {
        ...details,
        timestamp: new Date(),
        source: isSystemGenerated ? 'system' : 'user',
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.1'
      };

      if (ipAddress) enhancedDetails.ipAddress = ipAddress;
      if (userAgent) enhancedDetails.userAgent = userAgent;

      // Create activity record
      const activity = await CaseActivity.create({
        caseId,
        activityType,
        action,
        description,
        performedBy,
        details: enhancedDetails,
        priority,
        category,
        relatedDocument,
        relatedUser,
        relatedNote,
        isSystemGenerated,
        auditTrail: {
          source: isSystemGenerated ? 'system' : 'web',
          version: '1.0.1',
          environment: process.env.NODE_ENV || 'development'
        }
      });

      // Update case last activity
      await Case.findByIdAndUpdate(caseId, {
        lastActivity: new Date()
      });

      return activity;
    } catch (error) {
      console.error('Activity logging error:', error);
      throw error;
    }
  }

  /**
   * Get case activity timeline with filtering
   * @param {String} caseId - Case ID
   * @param {Object} options - Filter options
   * @param {Object} user - User requesting the timeline
   * @returns {Array} - Activity timeline
   */
  static async getCaseTimeline(caseId, options = {}, user) {
    try {
      // Check case access
      const caseItem = await Case.findById(caseId);
      if (!caseItem || !caseItem.canUserAccess(user)) {
        throw new Error('Access denied to case');
      }

      const {
        activityTypes,
        category,
        priority,
        dateFrom,
        dateTo,
        performedBy,
        includeSystem = true,
        page = 1,
        limit = 50
      } = options;

      // Build query
      const query = {
        caseId: caseId,
        isVisible: true
      };

      if (activityTypes && activityTypes.length > 0) {
        query.activityType = { $in: activityTypes };
      }

      if (category) {
        query.category = category;
      }

      if (priority) {
        query.priority = priority;
      }

      if (dateFrom || dateTo) {
        query.performedAt = {};
        if (dateFrom) query.performedAt.$gte = new Date(dateFrom);
        if (dateTo) query.performedAt.$lte = new Date(dateTo);
      }

      if (performedBy) {
        query.performedBy = performedBy;
      }

      if (!includeSystem) {
        query.isSystemGenerated = false;
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const [activities, totalCount] = await Promise.all([
        CaseActivity.find(query)
          .populate('performedBy', 'firstName lastName email role')
          .populate('relatedUser', 'firstName lastName email')
          .populate('relatedDocument', 'originalName documentType')
          .populate('relatedNote', 'title noteType')
          .sort({ performedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        CaseActivity.countDocuments(query)
      ]);

      return {
        activities,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      console.error('Get case timeline error:', error);
      throw error;
    }
  }

  /**
   * Get user activity across all cases
   * @param {String} userId - User ID
   * @param {Object} options - Filter options
   * @returns {Array} - User activities
   */
  static async getUserActivity(userId, options = {}) {
    try {
      const {
        caseId,
        activityTypes,
        dateFrom,
        dateTo,
        page = 1,
        limit = 50
      } = options;

      const query = {
        performedBy: userId,
        isVisible: true
      };

      if (caseId) {
        query.caseId = caseId;
      }

      if (activityTypes && activityTypes.length > 0) {
        query.activityType = { $in: activityTypes };
      }

      if (dateFrom || dateTo) {
        query.performedAt = {};
        if (dateFrom) query.performedAt.$gte = new Date(dateFrom);
        if (dateTo) query.performedAt.$lte = new Date(dateTo);
      }

      const skip = (page - 1) * limit;
      const [activities, totalCount] = await Promise.all([
        CaseActivity.find(query)
          .populate('caseId', 'title caseNumber status')
          .populate('relatedUser', 'firstName lastName email')
          .populate('relatedDocument', 'originalName documentType')
          .populate('relatedNote', 'title noteType')
          .sort({ performedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        CaseActivity.countDocuments(query)
      ]);

      return {
        activities,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      console.error('Get user activity error:', error);
      throw error;
    }
  }

  /**
   * Get activity statistics
   * @param {Object} filters - Filter options
   * @returns {Object} - Activity statistics
   */
  static async getActivityStatistics(filters = {}) {
    try {
      const matchStage = { isVisible: true };

      if (filters.caseId) {
        matchStage.caseId = filters.caseId;
      }

      if (filters.userId) {
        matchStage.performedBy = filters.userId;
      }

      if (filters.dateFrom || filters.dateTo) {
        matchStage.performedAt = {};
        if (filters.dateFrom) matchStage.performedAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) matchStage.performedAt.$lte = new Date(filters.dateTo);
      }

      const [
        activityByType,
        activityByCategory,
        activityByUser,
        activityByDay
      ] = await Promise.all([
        // Activity by type
        CaseActivity.aggregate([
          { $match: matchStage },
          { $group: { _id: '$activityType', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        // Activity by category
        CaseActivity.aggregate([
          { $match: matchStage },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        // Activity by user
        CaseActivity.aggregate([
          { $match: matchStage },
          { $group: { _id: '$performedBy', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          { $unwind: '$user' },
          {
            $project: {
              count: 1,
              user: {
                firstName: '$user.firstName',
                lastName: '$user.lastName',
                email: '$user.email'
              }
            }
          }
        ]),
        // Activity by day (last 30 days)
        CaseActivity.aggregate([
          {
            $match: {
              ...matchStage,
              performedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$performedAt' }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

      return {
        byType: activityByType,
        byCategory: activityByCategory,
        byUser: activityByUser,
        byDay: activityByDay,
        totalActivities: await CaseActivity.countDocuments(matchStage)
      };
    } catch (error) {
      console.error('Activity statistics error:', error);
      throw error;
    }
  }

  /**
   * Export activity data
   * @param {Object} filters - Export filters
   * @param {String} format - Export format (csv, json)
   * @returns {Object} - Export data
   */
  static async exportActivityData(filters = {}, format = 'csv') {
    try {
      const query = { isVisible: true };

      if (filters.caseId) query.caseId = filters.caseId;
      if (filters.userId) query.performedBy = filters.userId;
      if (filters.activityTypes) query.activityType = { $in: filters.activityTypes };
      if (filters.dateFrom || filters.dateTo) {
        query.performedAt = {};
        if (filters.dateFrom) query.performedAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.performedAt.$lte = new Date(filters.dateTo);
      }

      const activities = await CaseActivity.find(query)
        .populate('performedBy', 'firstName lastName email')
        .populate('caseId', 'title caseNumber')
        .populate('relatedUser', 'firstName lastName email')
        .populate('relatedDocument', 'originalName')
        .populate('relatedNote', 'title')
        .sort({ performedAt: -1 })
        .limit(10000) // Limit for performance
        .lean();

      // Format data for export
      const exportData = activities.map(activity => ({
        id: activity._id,
        caseNumber: activity.caseId?.caseNumber || 'N/A',
        caseTitle: activity.caseId?.title || 'N/A',
        activityType: activity.activityType,
        action: activity.action,
        description: activity.description,
        category: activity.category,
        priority: activity.priority,
        performedBy: activity.performedBy ? 
          `${activity.performedBy.firstName} ${activity.performedBy.lastName}` : 'System',
        performedAt: activity.performedAt,
        isSystemGenerated: activity.isSystemGenerated,
        relatedDocument: activity.relatedDocument?.originalName || '',
        relatedNote: activity.relatedNote?.title || '',
        relatedUser: activity.relatedUser ? 
          `${activity.relatedUser.firstName} ${activity.relatedUser.lastName}` : ''
      }));

      return {
        data: exportData,
        format,
        exportedAt: new Date(),
        totalRecords: exportData.length,
        filters
      };
    } catch (error) {
      console.error('Export activity data error:', error);
      throw error;
    }
  }

  /**
   * Clean up old activities (for maintenance)
   * @param {Number} daysToKeep - Number of days to keep activities
   * @returns {Object} - Cleanup result
   */
  static async cleanupOldActivities(daysToKeep = 365) {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      // Mark old activities as hidden instead of deleting
      const result = await CaseActivity.updateMany(
        {
          performedAt: { $lt: cutoffDate },
          isImportant: false,
          priority: { $ne: ACTIVITY_PRIORITY.CRITICAL }
        },
        {
          isVisible: false
        }
      );

      return {
        hiddenActivities: result.modifiedCount,
        cutoffDate,
        daysToKeep
      };
    } catch (error) {
      console.error('Cleanup activities error:', error);
      throw error;
    }
  }

  /**
   * Get activity summary for dashboard
   * @param {Object} user - User object
   * @returns {Object} - Activity summary
   */
  static async getActivitySummary(user) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Build user-specific query
      let userQuery = {};
      if (user.role === USER_ROLES.CLIENT) {
        // Get activities for cases where user is a client
        const userCases = await Case.find({
          $or: [
            { 'client.primary': user._id },
            { 'client.additional': user._id }
          ]
        }).select('_id');
        userQuery.caseId = { $in: userCases.map(c => c._id) };
      } else if (user.role === USER_ROLES.ADVOCATE) {
        // Get activities for cases where user is an advocate
        const userCases = await Case.find({
          $or: [
            { 'advocate.primary': user._id },
            { 'advocate.secondary': user._id }
          ]
        }).select('_id');
        userQuery.caseId = { $in: userCases.map(c => c._id) };
      }
      // Admin and Super Admin see all activities

      const [todayCount, weekCount, recentActivities] = await Promise.all([
        CaseActivity.countDocuments({
          ...userQuery,
          performedAt: { $gte: startOfDay },
          isVisible: true
        }),
        CaseActivity.countDocuments({
          ...userQuery,
          performedAt: { $gte: startOfWeek },
          isVisible: true
        }),
        CaseActivity.find({
          ...userQuery,
          isVisible: true
        })
        .populate('performedBy', 'firstName lastName')
        .populate('caseId', 'title caseNumber')
        .sort({ performedAt: -1 })
        .limit(5)
        .lean()
      ]);

      return {
        todayCount,
        weekCount,
        recentActivities
      };
    } catch (error) {
      console.error('Activity summary error:', error);
      throw error;
    }
  }
}

module.exports = ActivityService;
