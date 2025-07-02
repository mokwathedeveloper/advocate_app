// Assignment Controller - LegalPro v1.0.1
// API endpoints for case assignment and collaboration management

const CaseAssignmentService = require('../services/caseAssignmentService');
const { validationResult } = require('express-validator');
const { USER_ROLES } = require('../config/auth');

/**
 * @desc    Assign primary advocate to case
 * @route   PUT /api/cases/:caseId/assign/primary
 * @access  Private (Admin/Super Admin)
 */
const assignPrimaryAdvocate = async (req, res) => {
  try {
    // Check permissions
    if (![USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required for case assignment'
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

    const { caseId } = req.params;
    const { advocateId, reason, maxCases } = req.body;

    if (!advocateId) {
      return res.status(400).json({
        success: false,
        message: 'Advocate ID is required'
      });
    }

    const result = await CaseAssignmentService.assignPrimaryAdvocate(
      caseId,
      advocateId,
      req.user,
      { reason, maxCases }
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        case: result.case,
        advocate: result.advocate,
        previousAdvocate: result.previousAdvocate
      }
    });

  } catch (error) {
    console.error('Assign primary advocate error:', error);
    
    if (error.message.includes('not found') || 
        error.message.includes('Invalid advocate') ||
        error.message.includes('maximum case limit')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error assigning primary advocate',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Add secondary advocate to case
 * @route   PUT /api/cases/:caseId/assign/secondary
 * @access  Private (Admin/Super Admin/Primary Advocate)
 */
const addSecondaryAdvocate = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { advocateId, reason, role } = req.body;

    if (!advocateId) {
      return res.status(400).json({
        success: false,
        message: 'Advocate ID is required'
      });
    }

    // Check permissions - admin or primary advocate of the case
    if (![USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(req.user.role)) {
      const Case = require('../models/Case');
      const caseItem = await Case.findById(caseId);
      
      if (!caseItem || caseItem.advocate.primary.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only admins or primary advocate can add secondary advocates'
        });
      }
    }

    const result = await CaseAssignmentService.addSecondaryAdvocate(
      caseId,
      advocateId,
      req.user,
      { reason, role }
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        case: result.case,
        advocate: result.advocate
      }
    });

  } catch (error) {
    console.error('Add secondary advocate error:', error);
    
    if (error.message.includes('not found') || 
        error.message.includes('Invalid advocate') ||
        error.message.includes('already assigned')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error adding secondary advocate',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Remove advocate from case
 * @route   DELETE /api/cases/:caseId/assign/:advocateId
 * @access  Private (Admin/Super Admin)
 */
const removeAdvocate = async (req, res) => {
  try {
    // Check permissions
    if (![USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required for advocate removal'
      });
    }

    const { caseId, advocateId } = req.params;
    const { reason, replacementAdvocateId } = req.body;

    const result = await CaseAssignmentService.removeAdvocate(
      caseId,
      advocateId,
      req.user,
      { reason, replacementAdvocateId }
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        case: result.case,
        advocate: result.advocate,
        removalType: result.removalType
      }
    });

  } catch (error) {
    console.error('Remove advocate error:', error);
    
    if (error.message.includes('not found') || 
        error.message.includes('not assigned') ||
        error.message.includes('without replacement')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error removing advocate',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get advocate workload
 * @route   GET /api/advocates/:advocateId/workload
 * @access  Private (Admin/Super Admin/Self)
 */
const getAdvocateWorkload = async (req, res) => {
  try {
    const { advocateId } = req.params;

    // Check permissions - admin or self
    if (advocateId !== req.user._id.toString() && 
        ![USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to workload information'
      });
    }

    const workload = await CaseAssignmentService.getAdvocateWorkload(advocateId);

    res.status(200).json({
      success: true,
      data: workload
    });

  } catch (error) {
    console.error('Get advocate workload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving advocate workload',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get available advocates for assignment
 * @route   GET /api/advocates/available
 * @access  Private (Admin/Super Admin)
 */
const getAvailableAdvocates = async (req, res) => {
  try {
    // Check permissions
    if (![USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const filters = {
      specialization: req.query.specialization,
      maxWorkload: req.query.maxWorkload || 'heavy',
      excludeAdvocates: req.query.exclude ? req.query.exclude.split(',') : [],
      includeWorkload: req.query.includeWorkload !== 'false'
    };

    const advocates = await CaseAssignmentService.getAvailableAdvocates(filters);

    res.status(200).json({
      success: true,
      count: advocates.length,
      data: advocates
    });

  } catch (error) {
    console.error('Get available advocates error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving available advocates',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Auto-assign case to best available advocate
 * @route   POST /api/cases/:caseId/auto-assign
 * @access  Private (Admin/Super Admin)
 */
const autoAssignCase = async (req, res) => {
  try {
    // Check permissions
    if (![USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required for auto-assignment'
      });
    }

    const { caseId } = req.params;
    const {
      preferredSpecialization,
      maxWorkload = 'moderate',
      prioritizeExperience = true
    } = req.body;

    const result = await CaseAssignmentService.autoAssignCase(
      caseId,
      req.user,
      { preferredSpecialization, maxWorkload, prioritizeExperience }
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        case: result.case,
        advocate: result.advocate,
        autoAssignment: result.autoAssignment,
        selectedFrom: result.selectedFrom,
        advocateScore: result.advocateScore
      }
    });

  } catch (error) {
    console.error('Auto-assign case error:', error);
    
    if (error.message.includes('not found') || 
        error.message.includes('already has') ||
        error.message.includes('No available advocates')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error auto-assigning case',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Transfer case between advocates
 * @route   PUT /api/cases/:caseId/transfer
 * @access  Private (Admin/Super Admin)
 */
const transferCase = async (req, res) => {
  try {
    // Check permissions
    if (![USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required for case transfer'
      });
    }

    const { caseId } = req.params;
    const { fromAdvocateId, toAdvocateId, reason, notes } = req.body;

    if (!fromAdvocateId || !toAdvocateId) {
      return res.status(400).json({
        success: false,
        message: 'Both from and to advocate IDs are required'
      });
    }

    const result = await CaseAssignmentService.transferCase(
      caseId,
      fromAdvocateId,
      toAdvocateId,
      req.user,
      { reason, notes }
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        case: result.case,
        fromAdvocate: result.fromAdvocate,
        toAdvocate: result.toAdvocate,
        transfer: result.transfer
      }
    });

  } catch (error) {
    console.error('Transfer case error:', error);
    
    if (error.message.includes('not found') || 
        error.message.includes('not assigned')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error transferring case',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get case assignment history
 * @route   GET /api/cases/:caseId/assignment-history
 * @access  Private
 */
const getCaseAssignmentHistory = async (req, res) => {
  try {
    const { caseId } = req.params;

    // Check if user can access this case
    const Case = require('../models/Case');
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

    const history = await CaseAssignmentService.getCaseAssignmentHistory(caseId);

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });

  } catch (error) {
    console.error('Get assignment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving assignment history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get assignment statistics
 * @route   GET /api/assignments/statistics
 * @access  Private (Admin/Super Admin)
 */
const getAssignmentStatistics = async (req, res) => {
  try {
    // Check permissions
    if (![USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const User = require('../models/User');
    const Case = require('../models/Case');

    // Get all advocates
    const advocates = await User.find({
      role: { $in: [USER_ROLES.ADVOCATE, USER_ROLES.ADMIN] },
      isActive: true
    }).select('firstName lastName email');

    // Get workload for each advocate
    const advocateStats = await Promise.all(
      advocates.map(async (advocate) => {
        const workload = await CaseAssignmentService.getAdvocateWorkload(advocate._id);
        return {
          advocate: {
            id: advocate._id,
            name: `${advocate.firstName} ${advocate.lastName}`,
            email: advocate.email
          },
          workload
        };
      })
    );

    // Calculate overall statistics
    const totalActiveCases = advocateStats.reduce((sum, stat) => sum + stat.workload.activeCases, 0);
    const totalAdvocates = advocateStats.length;
    const averageCasesPerAdvocate = totalAdvocates > 0 ? (totalActiveCases / totalAdvocates).toFixed(2) : 0;

    // Workload distribution
    const workloadDistribution = advocateStats.reduce((dist, stat) => {
      const level = stat.workload.workloadLevel;
      dist[level] = (dist[level] || 0) + 1;
      return dist;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        advocateStats,
        summary: {
          totalAdvocates,
          totalActiveCases,
          averageCasesPerAdvocate,
          workloadDistribution
        }
      }
    });

  } catch (error) {
    console.error('Get assignment statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving assignment statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  assignPrimaryAdvocate,
  addSecondaryAdvocate,
  removeAdvocate,
  getAdvocateWorkload,
  getAvailableAdvocates,
  autoAssignCase,
  transferCase,
  getCaseAssignmentHistory,
  getAssignmentStatistics
};
