// Case Assignment Service - LegalPro v1.0.1
// Comprehensive case assignment and collaboration management

const Case = require('../models/Case');
const User = require('../models/User');
const CaseActivity = require('../models/CaseActivity');
const { ACTIVITY_TYPE } = require('../models/CaseActivity');
const { USER_ROLES } = require('../config/auth');

class CaseAssignmentService {
  /**
   * Assign primary advocate to case
   * @param {String} caseId - Case ID
   * @param {String} advocateId - Advocate ID
   * @param {Object} assignedBy - User making the assignment
   * @param {Object} options - Assignment options
   * @returns {Object} - Assignment result
   */
  static async assignPrimaryAdvocate(caseId, advocateId, assignedBy, options = {}) {
    try {
      // Validate case exists
      const caseItem = await Case.findById(caseId);
      if (!caseItem) {
        throw new Error('Case not found');
      }

      // Validate advocate exists and has correct role
      const advocate = await User.findById(advocateId);
      if (!advocate || ![USER_ROLES.ADVOCATE, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(advocate.role)) {
        throw new Error('Invalid advocate ID or insufficient role');
      }

      // Check if advocate is available (not overloaded)
      const advocateWorkload = await this.getAdvocateWorkload(advocateId);
      if (advocateWorkload.activeCases >= (options.maxCases || 50)) {
        throw new Error('Advocate has reached maximum case limit');
      }

      // Store previous advocate for activity log
      const previousAdvocate = caseItem.advocate.primary;

      // Update case assignment
      caseItem.advocate.primary = advocateId;
      if (!caseItem.dateAssigned) {
        caseItem.dateAssigned = new Date();
      }
      caseItem.updatedBy = assignedBy._id;
      await caseItem.save();

      // Log assignment activity
      await CaseActivity.createActivity({
        caseId: caseId,
        activityType: ACTIVITY_TYPE.ADVOCATE_ASSIGNED,
        action: 'Primary Advocate Assigned',
        description: `${advocate.firstName} ${advocate.lastName} was assigned as primary advocate`,
        performedBy: assignedBy._id,
        relatedUser: advocateId,
        details: {
          advocateName: `${advocate.firstName} ${advocate.lastName}`,
          advocateEmail: advocate.email,
          previousAdvocate: previousAdvocate,
          assignmentType: 'primary',
          reason: options.reason || 'Case assignment',
          workloadBefore: advocateWorkload.activeCases,
          workloadAfter: advocateWorkload.activeCases + 1
        },
        priority: 'high'
      });

      // If there was a previous advocate, log the removal
      if (previousAdvocate && previousAdvocate.toString() !== advocateId) {
        const prevAdvocate = await User.findById(previousAdvocate);
        if (prevAdvocate) {
          await CaseActivity.createActivity({
            caseId: caseId,
            activityType: ACTIVITY_TYPE.ADVOCATE_REMOVED,
            action: 'Previous Advocate Removed',
            description: `${prevAdvocate.firstName} ${prevAdvocate.lastName} was removed as primary advocate`,
            performedBy: assignedBy._id,
            relatedUser: previousAdvocate,
            details: {
              advocateName: `${prevAdvocate.firstName} ${prevAdvocate.lastName}`,
              reason: 'Reassignment to new advocate'
            }
          });
        }
      }

      return {
        success: true,
        case: caseItem,
        advocate: advocate,
        previousAdvocate: previousAdvocate,
        message: 'Primary advocate assigned successfully'
      };

    } catch (error) {
      console.error('Assign primary advocate error:', error);
      throw error;
    }
  }

  /**
   * Add secondary advocate to case
   * @param {String} caseId - Case ID
   * @param {String} advocateId - Advocate ID
   * @param {Object} assignedBy - User making the assignment
   * @param {Object} options - Assignment options
   * @returns {Object} - Assignment result
   */
  static async addSecondaryAdvocate(caseId, advocateId, assignedBy, options = {}) {
    try {
      const caseItem = await Case.findById(caseId);
      if (!caseItem) {
        throw new Error('Case not found');
      }

      const advocate = await User.findById(advocateId);
      if (!advocate || ![USER_ROLES.ADVOCATE, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(advocate.role)) {
        throw new Error('Invalid advocate ID or insufficient role');
      }

      // Check if advocate is already assigned
      if (caseItem.advocate.primary.toString() === advocateId) {
        throw new Error('Advocate is already assigned as primary advocate');
      }

      if (caseItem.advocate.secondary && caseItem.advocate.secondary.includes(advocateId)) {
        throw new Error('Advocate is already assigned as secondary advocate');
      }

      // Add to secondary advocates
      if (!caseItem.advocate.secondary) {
        caseItem.advocate.secondary = [];
      }
      caseItem.advocate.secondary.push(advocateId);
      caseItem.updatedBy = assignedBy._id;
      await caseItem.save();

      // Log assignment activity
      await CaseActivity.createActivity({
        caseId: caseId,
        activityType: ACTIVITY_TYPE.ADVOCATE_ASSIGNED,
        action: 'Secondary Advocate Added',
        description: `${advocate.firstName} ${advocate.lastName} was added as secondary advocate`,
        performedBy: assignedBy._id,
        relatedUser: advocateId,
        details: {
          advocateName: `${advocate.firstName} ${advocate.lastName}`,
          advocateEmail: advocate.email,
          assignmentType: 'secondary',
          reason: options.reason || 'Additional support',
          role: options.role || 'Support advocate'
        },
        priority: 'medium'
      });

      return {
        success: true,
        case: caseItem,
        advocate: advocate,
        message: 'Secondary advocate added successfully'
      };

    } catch (error) {
      console.error('Add secondary advocate error:', error);
      throw error;
    }
  }

  /**
   * Remove advocate from case
   * @param {String} caseId - Case ID
   * @param {String} advocateId - Advocate ID
   * @param {Object} removedBy - User making the removal
   * @param {Object} options - Removal options
   * @returns {Object} - Removal result
   */
  static async removeAdvocate(caseId, advocateId, removedBy, options = {}) {
    try {
      const caseItem = await Case.findById(caseId);
      if (!caseItem) {
        throw new Error('Case not found');
      }

      const advocate = await User.findById(advocateId);
      if (!advocate) {
        throw new Error('Advocate not found');
      }

      let removalType = '';
      let removed = false;

      // Check if primary advocate
      if (caseItem.advocate.primary.toString() === advocateId) {
        if (!options.replacementAdvocateId) {
          throw new Error('Cannot remove primary advocate without replacement');
        }

        // Assign replacement advocate
        await this.assignPrimaryAdvocate(caseId, options.replacementAdvocateId, removedBy, {
          reason: 'Replacement for removed advocate'
        });

        removalType = 'primary';
        removed = true;
      }

      // Check if secondary advocate
      if (caseItem.advocate.secondary && caseItem.advocate.secondary.includes(advocateId)) {
        caseItem.advocate.secondary = caseItem.advocate.secondary.filter(
          id => id.toString() !== advocateId
        );
        await caseItem.save();
        removalType = 'secondary';
        removed = true;
      }

      if (!removed) {
        throw new Error('Advocate is not assigned to this case');
      }

      // Log removal activity
      await CaseActivity.createActivity({
        caseId: caseId,
        activityType: ACTIVITY_TYPE.ADVOCATE_REMOVED,
        action: 'Advocate Removed',
        description: `${advocate.firstName} ${advocate.lastName} was removed as ${removalType} advocate`,
        performedBy: removedBy._id,
        relatedUser: advocateId,
        details: {
          advocateName: `${advocate.firstName} ${advocate.lastName}`,
          removalType: removalType,
          reason: options.reason || 'No reason provided',
          replacementAdvocate: options.replacementAdvocateId
        },
        priority: 'high'
      });

      return {
        success: true,
        case: caseItem,
        advocate: advocate,
        removalType: removalType,
        message: `${removalType} advocate removed successfully`
      };

    } catch (error) {
      console.error('Remove advocate error:', error);
      throw error;
    }
  }

  /**
   * Get advocate workload statistics
   * @param {String} advocateId - Advocate ID
   * @returns {Object} - Workload statistics
   */
  static async getAdvocateWorkload(advocateId) {
    try {
      const [activeCases, totalCases, urgentCases] = await Promise.all([
        Case.countDocuments({
          $or: [
            { 'advocate.primary': advocateId },
            { 'advocate.secondary': advocateId }
          ],
          status: { $in: ['open', 'in_review', 'pending'] },
          isActive: true
        }),
        Case.countDocuments({
          $or: [
            { 'advocate.primary': advocateId },
            { 'advocate.secondary': advocateId }
          ],
          isActive: true
        }),
        Case.countDocuments({
          $or: [
            { 'advocate.primary': advocateId },
            { 'advocate.secondary': advocateId }
          ],
          priority: 'urgent',
          status: { $in: ['open', 'in_review', 'pending'] },
          isActive: true
        })
      ]);

      // Get case distribution by status
      const statusDistribution = await Case.aggregate([
        {
          $match: {
            $or: [
              { 'advocate.primary': advocateId },
              { 'advocate.secondary': advocateId }
            ],
            isActive: true
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        advocateId,
        activeCases,
        totalCases,
        urgentCases,
        statusDistribution,
        workloadLevel: this.calculateWorkloadLevel(activeCases, urgentCases)
      };

    } catch (error) {
      console.error('Get advocate workload error:', error);
      throw error;
    }
  }

  /**
   * Calculate workload level
   * @param {Number} activeCases - Number of active cases
   * @param {Number} urgentCases - Number of urgent cases
   * @returns {String} - Workload level
   */
  static calculateWorkloadLevel(activeCases, urgentCases) {
    if (activeCases === 0) return 'none';
    if (activeCases <= 10 && urgentCases <= 2) return 'light';
    if (activeCases <= 25 && urgentCases <= 5) return 'moderate';
    if (activeCases <= 40 && urgentCases <= 10) return 'heavy';
    return 'overloaded';
  }

  /**
   * Get available advocates for assignment
   * @param {Object} filters - Filter options
   * @returns {Array} - Available advocates
   */
  static async getAvailableAdvocates(filters = {}) {
    try {
      const {
        specialization,
        maxWorkload = 'heavy',
        excludeAdvocates = [],
        includeWorkload = true
      } = filters;

      // Build query for advocates
      const query = {
        role: { $in: [USER_ROLES.ADVOCATE, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN] },
        isActive: true,
        isVerified: true
      };

      if (specialization) {
        query.specialization = { $regex: specialization, $options: 'i' };
      }

      if (excludeAdvocates.length > 0) {
        query._id = { $nin: excludeAdvocates };
      }

      const advocates = await User.find(query)
        .select('firstName lastName email specialization experience')
        .sort({ firstName: 1 });

      // Add workload information if requested
      if (includeWorkload) {
        const advocatesWithWorkload = await Promise.all(
          advocates.map(async (advocate) => {
            const workload = await this.getAdvocateWorkload(advocate._id);
            return {
              ...advocate.toObject(),
              workload
            };
          })
        );

        // Filter by workload level
        const workloadLevels = ['none', 'light', 'moderate', 'heavy', 'overloaded'];
        const maxWorkloadIndex = workloadLevels.indexOf(maxWorkload);

        return advocatesWithWorkload.filter(advocate => {
          const advocateWorkloadIndex = workloadLevels.indexOf(advocate.workload.workloadLevel);
          return advocateWorkloadIndex <= maxWorkloadIndex;
        });
      }

      return advocates;

    } catch (error) {
      console.error('Get available advocates error:', error);
      throw error;
    }
  }

  /**
   * Auto-assign case to best available advocate
   * @param {String} caseId - Case ID
   * @param {Object} assignedBy - User making the assignment
   * @param {Object} criteria - Assignment criteria
   * @returns {Object} - Assignment result
   */
  static async autoAssignCase(caseId, assignedBy, criteria = {}) {
    try {
      const caseItem = await Case.findById(caseId);
      if (!caseItem) {
        throw new Error('Case not found');
      }

      if (caseItem.advocate.primary) {
        throw new Error('Case already has a primary advocate assigned');
      }

      const {
        preferredSpecialization,
        maxWorkload = 'moderate',
        prioritizeExperience = true
      } = criteria;

      // Get available advocates
      const availableAdvocates = await this.getAvailableAdvocates({
        specialization: preferredSpecialization,
        maxWorkload: maxWorkload,
        includeWorkload: true
      });

      if (availableAdvocates.length === 0) {
        throw new Error('No available advocates found matching criteria');
      }

      // Score advocates based on criteria
      const scoredAdvocates = availableAdvocates.map(advocate => {
        let score = 0;

        // Workload score (lower workload = higher score)
        const workloadScores = { none: 10, light: 8, moderate: 6, heavy: 4, overloaded: 0 };
        score += workloadScores[advocate.workload.workloadLevel] || 0;

        // Experience score
        if (prioritizeExperience && advocate.experience) {
          score += Math.min(advocate.experience, 10); // Max 10 points for experience
        }

        // Specialization match score
        if (preferredSpecialization && advocate.specialization) {
          if (advocate.specialization.toLowerCase().includes(preferredSpecialization.toLowerCase())) {
            score += 15; // High bonus for specialization match
          }
        }

        return {
          ...advocate,
          score
        };
      });

      // Sort by score (highest first)
      scoredAdvocates.sort((a, b) => b.score - a.score);

      // Assign to best advocate
      const bestAdvocate = scoredAdvocates[0];
      const result = await this.assignPrimaryAdvocate(caseId, bestAdvocate._id, assignedBy, {
        reason: 'Auto-assignment based on workload and criteria'
      });

      return {
        ...result,
        autoAssignment: true,
        selectedFrom: availableAdvocates.length,
        selectionCriteria: criteria,
        advocateScore: bestAdvocate.score
      };

    } catch (error) {
      console.error('Auto-assign case error:', error);
      throw error;
    }
  }

  /**
   * Transfer case between advocates
   * @param {String} caseId - Case ID
   * @param {String} fromAdvocateId - Current advocate ID
   * @param {String} toAdvocateId - New advocate ID
   * @param {Object} transferredBy - User making the transfer
   * @param {Object} options - Transfer options
   * @returns {Object} - Transfer result
   */
  static async transferCase(caseId, fromAdvocateId, toAdvocateId, transferredBy, options = {}) {
    try {
      const caseItem = await Case.findById(caseId);
      if (!caseItem) {
        throw new Error('Case not found');
      }

      // Verify current assignment
      if (caseItem.advocate.primary.toString() !== fromAdvocateId) {
        throw new Error('Case is not assigned to the specified advocate');
      }

      // Assign to new advocate
      const result = await this.assignPrimaryAdvocate(caseId, toAdvocateId, transferredBy, {
        reason: options.reason || 'Case transfer'
      });

      // Log transfer activity
      const [fromAdvocate, toAdvocate] = await Promise.all([
        User.findById(fromAdvocateId),
        User.findById(toAdvocateId)
      ]);

      await CaseActivity.createActivity({
        caseId: caseId,
        activityType: ACTIVITY_TYPE.CASE_UPDATED,
        action: 'Case Transferred',
        description: `Case transferred from ${fromAdvocate.firstName} ${fromAdvocate.lastName} to ${toAdvocate.firstName} ${toAdvocate.lastName}`,
        performedBy: transferredBy._id,
        details: {
          fromAdvocate: {
            id: fromAdvocateId,
            name: `${fromAdvocate.firstName} ${fromAdvocate.lastName}`
          },
          toAdvocate: {
            id: toAdvocateId,
            name: `${toAdvocate.firstName} ${toAdvocate.lastName}`
          },
          reason: options.reason || 'Case transfer',
          transferNotes: options.notes
        },
        priority: 'high'
      });

      return {
        ...result,
        transfer: true,
        fromAdvocate: fromAdvocate,
        toAdvocate: toAdvocate
      };

    } catch (error) {
      console.error('Transfer case error:', error);
      throw error;
    }
  }

  /**
   * Get case assignment history
   * @param {String} caseId - Case ID
   * @returns {Array} - Assignment history
   */
  static async getCaseAssignmentHistory(caseId) {
    try {
      const assignmentActivities = await CaseActivity.find({
        caseId: caseId,
        activityType: { $in: [ACTIVITY_TYPE.ADVOCATE_ASSIGNED, ACTIVITY_TYPE.ADVOCATE_REMOVED] }
      })
      .populate('performedBy', 'firstName lastName email')
      .populate('relatedUser', 'firstName lastName email')
      .sort({ performedAt: -1 });

      return assignmentActivities.map(activity => ({
        id: activity._id,
        type: activity.activityType,
        action: activity.action,
        description: activity.description,
        advocate: activity.relatedUser,
        performedBy: activity.performedBy,
        performedAt: activity.performedAt,
        details: activity.details
      }));

    } catch (error) {
      console.error('Get assignment history error:', error);
      throw error;
    }
  }
}

module.exports = CaseAssignmentService;
