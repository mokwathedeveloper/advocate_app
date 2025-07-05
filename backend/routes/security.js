// Security Monitoring Routes for LegalPro v1.0.1
const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect, authorize } = require('../middleware/auth');
const auditLogger = require('../utils/auditLogger');

const router = express.Router();

// Rate limiting for security endpoints
const securityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    success: false,
    message: 'Too many security requests, please try again later.'
  }
});

// Apply rate limiting and authentication to all routes
router.use(securityLimiter);
router.use(protect);
router.use(authorize('advocate')); // Only advocates can access security monitoring

// @desc    Get security dashboard overview
// @route   GET /api/security/dashboard
// @access  Private (Advocate only)
router.get('/dashboard', async (req, res) => {
  try {
    const timeRange = parseInt(req.query.timeRange) || 24 * 60 * 60 * 1000; // Default 24 hours
    
    // Get security events
    const securityEvents = await auditLogger.getSecurityEvents(timeRange);
    
    // Get recent failed attempts
    const recentFailures = await auditLogger.AuditLog.aggregate([
      {
        $match: {
          status: 'FAILURE',
          timestamp: { $gte: new Date(Date.now() - timeRange) }
        }
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          lastOccurrence: { $max: '$timestamp' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get top suspicious IPs
    const suspiciousIPs = await auditLogger.AuditLog.aggregate([
      {
        $match: {
          riskLevel: { $in: ['HIGH', 'CRITICAL'] },
          timestamp: { $gte: new Date(Date.now() - timeRange) }
        }
      },
      {
        $group: {
          _id: '$ipAddress',
          riskEvents: { $sum: 1 },
          lastActivity: { $max: '$timestamp' },
          eventTypes: { $addToSet: '$eventType' }
        }
      },
      {
        $sort: { riskEvents: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get registration statistics
    const registrationStats = await auditLogger.AuditLog.aggregate([
      {
        $match: {
          eventType: 'USER_REGISTRATION',
          timestamp: { $gte: new Date(Date.now() - timeRange) }
        }
      },
      {
        $group: {
          _id: {
            status: '$status',
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$timestamp'
              }
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalSecurityEvents: securityEvents.length,
          criticalEvents: securityEvents.filter(e => e.riskLevel === 'CRITICAL').length,
          highRiskEvents: securityEvents.filter(e => e.riskLevel === 'HIGH').length,
          timeRange: timeRange / (60 * 60 * 1000) + ' hours'
        },
        securityEvents: securityEvents.slice(0, 20), // Latest 20 events
        failureAnalysis: recentFailures,
        suspiciousIPs,
        registrationStats
      }
    });

  } catch (error) {
    console.error('Security dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load security dashboard'
    });
  }
});

// @desc    Get audit logs with filtering
// @route   GET /api/security/audit-logs
// @access  Private (Advocate only)
router.get('/audit-logs', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      eventType,
      status,
      riskLevel,
      userId,
      ipAddress,
      startDate,
      endDate
    } = req.query;

    // Build filter query
    const filter = {};
    
    if (eventType) filter.eventType = eventType;
    if (status) filter.status = status;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (userId) filter.userId = userId;
    if (ipAddress) filter.ipAddress = ipAddress;
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const auditLogs = await auditLogger.AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName email role');

    const total = await auditLogger.AuditLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: auditLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit logs'
    });
  }
});

// @desc    Get user activity history
// @route   GET /api/security/user-activity/:userId
// @access  Private (Advocate only)
router.get('/user-activity/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    const userActivity = await auditLogger.getUserActivity(userId, parseInt(limit));

    res.status(200).json({
      success: true,
      data: userActivity
    });

  } catch (error) {
    console.error('User activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user activity'
    });
  }
});

// @desc    Get IP address analysis
// @route   GET /api/security/ip-analysis/:ipAddress
// @access  Private (Advocate only)
router.get('/ip-analysis/:ipAddress', async (req, res) => {
  try {
    const { ipAddress } = req.params;
    const { timeRange = 24 * 60 * 60 * 1000 } = req.query;

    const ipActivity = await auditLogger.getFailedAttempts(ipAddress, parseInt(timeRange));
    
    // Get summary statistics
    const summary = await auditLogger.AuditLog.aggregate([
      {
        $match: {
          ipAddress,
          timestamp: { $gte: new Date(Date.now() - parseInt(timeRange)) }
        }
      },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          failedEvents: {
            $sum: { $cond: [{ $eq: ['$status', 'FAILURE'] }, 1, 0] }
          },
          highRiskEvents: {
            $sum: { $cond: [{ $in: ['$riskLevel', ['HIGH', 'CRITICAL']] }, 1, 0] }
          },
          eventTypes: { $addToSet: '$eventType' },
          firstActivity: { $min: '$timestamp' },
          lastActivity: { $max: '$timestamp' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        ipAddress,
        summary: summary[0] || {
          totalEvents: 0,
          failedEvents: 0,
          highRiskEvents: 0,
          eventTypes: [],
          firstActivity: null,
          lastActivity: null
        },
        recentActivity: ipActivity.slice(0, 20)
      }
    });

  } catch (error) {
    console.error('IP analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze IP address'
    });
  }
});

// @desc    Get security alerts
// @route   GET /api/security/alerts
// @access  Private (Advocate only)
router.get('/alerts', async (req, res) => {
  try {
    const { severity = 'HIGH', limit = 20 } = req.query;
    
    const alerts = await auditLogger.AuditLog.find({
      eventType: 'SECURITY_VIOLATION',
      riskLevel: { $in: severity === 'ALL' ? ['MEDIUM', 'HIGH', 'CRITICAL'] : [severity] }
    })
    .sort({ timestamp: -1 })
    .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: alerts
    });

  } catch (error) {
    console.error('Security alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve security alerts'
    });
  }
});

// @desc    Export audit logs
// @route   GET /api/security/export
// @access  Private (Advocate only)
router.get('/export', async (req, res) => {
  try {
    const {
      format = 'json',
      startDate,
      endDate,
      eventType,
      riskLevel
    } = req.query;

    // Build filter
    const filter = {};
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    if (eventType) filter.eventType = eventType;
    if (riskLevel) filter.riskLevel = riskLevel;

    const auditLogs = await auditLogger.AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(10000) // Limit export size
      .lean();

    if (format === 'csv') {
      // Convert to CSV format
      const csv = auditLogs.map(log => 
        `"${log.timestamp}","${log.eventType}","${log.action}","${log.status}","${log.riskLevel}","${log.ipAddress || ''}","${log.userEmail || ''}","${log.errorMessage || ''}"`
      ).join('\n');
      
      const header = '"Timestamp","Event Type","Action","Status","Risk Level","IP Address","User Email","Error Message"\n';
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
      res.send(header + csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.json"');
      res.json({
        exportDate: new Date(),
        totalRecords: auditLogs.length,
        data: auditLogs
      });
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export audit logs'
    });
  }
});

module.exports = router;
