// Case Workflow Service - LegalPro v1.0.1
// Comprehensive case status management and workflow automation

const Case = require('../models/Case');
const CaseActivity = require('../models/CaseActivity');
const { CASE_STATUS } = require('../models/Case');
const { ACTIVITY_TYPE } = require('../models/CaseActivity');
const { USER_ROLES } = require('../config/auth');

// Define valid status transitions
const STATUS_TRANSITIONS = {
  [CASE_STATUS.DRAFT]: [CASE_STATUS.OPEN, CASE_STATUS.DISMISSED],
  [CASE_STATUS.OPEN]: [CASE_STATUS.IN_REVIEW, CASE_STATUS.ON_HOLD, CASE_STATUS.PENDING, CASE_STATUS.CLOSED, CASE_STATUS.DISMISSED],
  [CASE_STATUS.IN_REVIEW]: [CASE_STATUS.OPEN, CASE_STATUS.ON_HOLD, CASE_STATUS.PENDING, CASE_STATUS.CLOSED, CASE_STATUS.DISMISSED],
  [CASE_STATUS.ON_HOLD]: [CASE_STATUS.OPEN, CASE_STATUS.IN_REVIEW, CASE_STATUS.PENDING, CASE_STATUS.DISMISSED],
  [CASE_STATUS.PENDING]: [CASE_STATUS.OPEN, CASE_STATUS.IN_REVIEW, CASE_STATUS.ON_HOLD, CASE_STATUS.CLOSED, CASE_STATUS.DISMISSED],
  [CASE_STATUS.CLOSED]: [CASE_STATUS.ARCHIVED],
  [CASE_STATUS.DISMISSED]: [CASE_STATUS.ARCHIVED],
  [CASE_STATUS.ARCHIVED]: [] // No transitions from archived
};

// Define status permissions (who can change to what status)
const STATUS_PERMISSIONS = {
  [CASE_STATUS.DRAFT]: [USER_ROLES.ADVOCATE, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
  [CASE_STATUS.OPEN]: [USER_ROLES.ADVOCATE, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
  [CASE_STATUS.IN_REVIEW]: [USER_ROLES.ADVOCATE, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
  [CASE_STATUS.ON_HOLD]: [USER_ROLES.ADVOCATE, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
  [CASE_STATUS.PENDING]: [USER_ROLES.ADVOCATE, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
  [CASE_STATUS.CLOSED]: [USER_ROLES.ADVOCATE, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
  [CASE_STATUS.DISMISSED]: [USER_ROLES.ADVOCATE, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
  [CASE_STATUS.ARCHIVED]: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]
};

// Define automatic actions for status changes
const STATUS_ACTIONS = {
  [CASE_STATUS.OPEN]: {
    updateProgress: 10,
    notifications: ['advocate', 'client'],
    autoSetDate: 'dateAssigned'
  },
  [CASE_STATUS.IN_REVIEW]: {
    updateProgress: 75,
    notifications: ['advocate', 'admin'],
    requiresApproval: false
  },
  [CASE_STATUS.ON_HOLD]: {
    notifications: ['advocate', 'client'],
    requiresReason: true
  },
  [CASE_STATUS.PENDING]: {
    notifications: ['client'],
    requiresReason: true
  },
  [CASE_STATUS.CLOSED]: {
    updateProgress: 100,
    notifications: ['advocate', 'client', 'admin'],
    autoSetDate: 'actualCompletion',
    requiresOutcome: true
  },
  [CASE_STATUS.DISMISSED]: {
    updateProgress: 0,
    notifications: ['advocate', 'client', 'admin'],
    autoSetDate: 'actualCompletion',
    requiresReason: true
  },
  [CASE_STATUS.ARCHIVED]: {
    notifications: ['admin'],
    requiresApproval: true
  }
};

class CaseWorkflowService {
  /**
   * Validate if status transition is allowed
   * @param {String} currentStatus - Current case status
   * @param {String} newStatus - Desired new status
   * @returns {Boolean} - Whether transition is valid
   */
  static isValidTransition(currentStatus, newStatus) {
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Check if user has permission to change status
   * @param {String} newStatus - Desired new status
   * @param {Object} user - User object
   * @param {Object} caseItem - Case object
   * @returns {Boolean} - Whether user can change to this status
   */
  static canUserChangeStatus(newStatus, user, caseItem) {
    const allowedRoles = STATUS_PERMISSIONS[newStatus] || [];
    
    // Check role permission
    if (!allowedRoles.includes(user.role)) {
      return false;
    }
    
    // Additional checks for case ownership
    if (user.role === USER_ROLES.ADVOCATE) {
      // Advocates can only change status of their assigned cases
      return caseItem.advocate.primary.toString() === user._id.toString() ||
             (caseItem.advocate.secondary && caseItem.advocate.secondary.includes(user._id));
    }
    
    return true;
  }

  /**
   * Change case status with workflow validation
   * @param {String} caseId - Case ID
   * @param {String} newStatus - New status
   * @param {Object} user - User making the change
   * @param {Object} options - Additional options (reason, outcome, etc.)
   * @returns {Object} - Result of status change
   */
  static async changeStatus(caseId, newStatus, user, options = {}) {
    try {
      // Find the case
      const caseItem = await Case.findById(caseId);
      if (!caseItem) {
        throw new Error('Case not found');
      }

      const currentStatus = caseItem.status;

      // Validate transition
      if (!this.isValidTransition(currentStatus, newStatus)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
      }

      // Check user permissions
      if (!this.canUserChangeStatus(newStatus, user, caseItem)) {
        throw new Error('Insufficient permissions to change to this status');
      }

      // Get status action configuration
      const statusAction = STATUS_ACTIONS[newStatus] || {};

      // Validate required fields
      if (statusAction.requiresReason && !options.reason) {
        throw new Error('Reason is required for this status change');
      }

      if (statusAction.requiresOutcome && !options.outcome) {
        throw new Error('Outcome is required for this status change');
      }

      // Check approval requirement
      if (statusAction.requiresApproval && !options.approved) {
        throw new Error('Approval is required for this status change');
      }

      // Apply automatic updates
      const updates = {
        status: newStatus,
        updatedBy: user._id,
        lastActivity: new Date()
      };

      if (statusAction.updateProgress !== undefined) {
        updates.progress = statusAction.updateProgress;
      }

      if (statusAction.autoSetDate) {
        updates[statusAction.autoSetDate] = new Date();
      }

      if (options.outcome) {
        updates.outcome = options.outcome;
      }

      if (options.notes) {
        updates.notes = options.notes;
      }

      // Update the case
      const updatedCase = await Case.findByIdAndUpdate(
        caseId,
        updates,
        { new: true, runValidators: true }
      )
      .populate('client.primary', 'firstName lastName email')
      .populate('advocate.primary', 'firstName lastName email');

      // Log status change activity
      await CaseActivity.createActivity({
        caseId: caseId,
        activityType: ACTIVITY_TYPE.STATUS_CHANGED,
        action: 'Status Changed',
        description: `Case status changed from ${currentStatus} to ${newStatus}`,
        performedBy: user._id,
        details: {
          previousStatus: currentStatus,
          newStatus: newStatus,
          reason: options.reason || 'No reason provided',
          outcome: options.outcome,
          autoUpdates: statusAction,
          userAgent: options.userAgent,
          ipAddress: options.ipAddress
        },
        priority: newStatus === CASE_STATUS.CLOSED || newStatus === CASE_STATUS.DISMISSED ? 'high' : 'medium'
      });

      // Trigger notifications if configured
      if (statusAction.notifications && statusAction.notifications.length > 0) {
        await this.triggerStatusChangeNotifications(updatedCase, currentStatus, newStatus, statusAction.notifications, user);
      }

      // Trigger any additional workflow actions
      await this.executeWorkflowActions(updatedCase, newStatus, statusAction, user, options);

      return {
        success: true,
        case: updatedCase,
        previousStatus: currentStatus,
        newStatus: newStatus,
        message: `Case status successfully changed to ${newStatus}`
      };

    } catch (error) {
      console.error('Status change error:', error);
      throw error;
    }
  }

  /**
   * Get available status transitions for a case
   * @param {Object} caseItem - Case object
   * @param {Object} user - User object
   * @returns {Array} - Available status transitions
   */
  static getAvailableTransitions(caseItem, user) {
    const currentStatus = caseItem.status;
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
    
    return allowedTransitions.filter(status => 
      this.canUserChangeStatus(status, user, caseItem)
    ).map(status => ({
      status,
      label: this.getStatusLabel(status),
      description: this.getStatusDescription(status),
      requirements: this.getStatusRequirements(status),
      actions: STATUS_ACTIONS[status] || {}
    }));
  }

  /**
   * Get human-readable status label
   * @param {String} status - Status code
   * @returns {String} - Human-readable label
   */
  static getStatusLabel(status) {
    const labels = {
      [CASE_STATUS.DRAFT]: 'Draft',
      [CASE_STATUS.OPEN]: 'Open',
      [CASE_STATUS.IN_REVIEW]: 'In Review',
      [CASE_STATUS.ON_HOLD]: 'On Hold',
      [CASE_STATUS.PENDING]: 'Pending',
      [CASE_STATUS.CLOSED]: 'Closed',
      [CASE_STATUS.DISMISSED]: 'Dismissed',
      [CASE_STATUS.ARCHIVED]: 'Archived'
    };
    return labels[status] || status;
  }

  /**
   * Get status description
   * @param {String} status - Status code
   * @returns {String} - Status description
   */
  static getStatusDescription(status) {
    const descriptions = {
      [CASE_STATUS.DRAFT]: 'Case is being prepared and not yet active',
      [CASE_STATUS.OPEN]: 'Case is active and work is in progress',
      [CASE_STATUS.IN_REVIEW]: 'Case is under review or awaiting decision',
      [CASE_STATUS.ON_HOLD]: 'Case is temporarily paused',
      [CASE_STATUS.PENDING]: 'Case is awaiting client action or external input',
      [CASE_STATUS.CLOSED]: 'Case has been completed successfully',
      [CASE_STATUS.DISMISSED]: 'Case has been dismissed or withdrawn',
      [CASE_STATUS.ARCHIVED]: 'Case has been archived for long-term storage'
    };
    return descriptions[status] || 'No description available';
  }

  /**
   * Get status change requirements
   * @param {String} status - Status code
   * @returns {Object} - Requirements for changing to this status
   */
  static getStatusRequirements(status) {
    const statusAction = STATUS_ACTIONS[status] || {};
    return {
      requiresReason: statusAction.requiresReason || false,
      requiresOutcome: statusAction.requiresOutcome || false,
      requiresApproval: statusAction.requiresApproval || false,
      notifications: statusAction.notifications || [],
      autoUpdates: {
        progress: statusAction.updateProgress,
        dateField: statusAction.autoSetDate
      }
    };
  }

  /**
   * Trigger notifications for status change
   * @param {Object} caseItem - Updated case object
   * @param {String} oldStatus - Previous status
   * @param {String} newStatus - New status
   * @param {Array} recipients - Notification recipients
   * @param {Object} user - User who made the change
   */
  static async triggerStatusChangeNotifications(caseItem, oldStatus, newStatus, recipients, user) {
    try {
      // This would integrate with the notification service
      console.log(`Triggering notifications for case ${caseItem.caseNumber} status change from ${oldStatus} to ${newStatus}`);
      console.log(`Recipients: ${recipients.join(', ')}`);
      
      // TODO: Implement actual notification sending
      // await notificationService.sendStatusChangeNotification({
      //   case: caseItem,
      //   oldStatus,
      //   newStatus,
      //   recipients,
      //   changedBy: user
      // });
      
    } catch (error) {
      console.error('Notification error:', error);
      // Don't fail the status change if notifications fail
    }
  }

  /**
   * Execute additional workflow actions
   * @param {Object} caseItem - Case object
   * @param {String} newStatus - New status
   * @param {Object} statusAction - Status action configuration
   * @param {Object} user - User object
   * @param {Object} options - Additional options
   */
  static async executeWorkflowActions(caseItem, newStatus, statusAction, user, options) {
    try {
      // Execute custom workflow actions based on status
      switch (newStatus) {
        case CASE_STATUS.CLOSED:
          await this.handleCaseClosure(caseItem, user, options);
          break;
        case CASE_STATUS.ARCHIVED:
          await this.handleCaseArchival(caseItem, user, options);
          break;
        case CASE_STATUS.ON_HOLD:
          await this.handleCaseOnHold(caseItem, user, options);
          break;
        default:
          // No special actions for other statuses
          break;
      }
    } catch (error) {
      console.error('Workflow action error:', error);
      // Log error but don't fail the status change
    }
  }

  /**
   * Handle case closure workflow
   * @param {Object} caseItem - Case object
   * @param {Object} user - User object
   * @param {Object} options - Options
   */
  static async handleCaseClosure(caseItem, user, options) {
    // Generate case closure report
    // Update billing status
    // Archive related documents
    // Send final notifications
    console.log(`Executing case closure workflow for case ${caseItem.caseNumber}`);
  }

  /**
   * Handle case archival workflow
   * @param {Object} caseItem - Case object
   * @param {Object} user - User object
   * @param {Object} options - Options
   */
  static async handleCaseArchival(caseItem, user, options) {
    // Move documents to archive storage
    // Update access permissions
    // Generate archival report
    console.log(`Executing case archival workflow for case ${caseItem.caseNumber}`);
  }

  /**
   * Handle case on hold workflow
   * @param {Object} caseItem - Case object
   * @param {Object} user - User object
   * @param {Object} options - Options
   */
  static async handleCaseOnHold(caseItem, user, options) {
    // Set reminder notifications
    // Update deadlines
    // Notify stakeholders
    console.log(`Executing case on hold workflow for case ${caseItem.caseNumber}`);
  }

  /**
   * Get case status statistics
   * @param {Object} filters - Optional filters
   * @returns {Object} - Status statistics
   */
  static async getStatusStatistics(filters = {}) {
    try {
      const pipeline = [
        { $match: { isActive: true, ...filters } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgProgress: { $avg: '$progress' },
            oldestCase: { $min: '$dateCreated' },
            newestCase: { $max: '$dateCreated' }
          }
        },
        { $sort: { count: -1 } }
      ];

      const stats = await Case.aggregate(pipeline);
      
      return {
        statusBreakdown: stats,
        totalCases: stats.reduce((sum, stat) => sum + stat.count, 0),
        averageProgress: stats.reduce((sum, stat) => sum + (stat.avgProgress * stat.count), 0) / stats.reduce((sum, stat) => sum + stat.count, 0)
      };
    } catch (error) {
      console.error('Status statistics error:', error);
      throw error;
    }
  }
}

module.exports = CaseWorkflowService;
