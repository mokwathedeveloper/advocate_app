// Professional Audit Logging System for LegalPro v1.0.1
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
  // Event Information
  eventType: {
    type: String,
    required: true,
    enum: [
      'USER_REGISTRATION',
      'USER_LOGIN',
      'USER_LOGOUT',
      'PASSWORD_CHANGE',
      'EMAIL_VERIFICATION',
      'SUPER_KEY_ATTEMPT',
      'FAILED_LOGIN',
      'ACCOUNT_LOCKOUT',
      'PERMISSION_CHANGE',
      'DATA_ACCESS',
      'DATA_MODIFICATION',
      'SECURITY_VIOLATION',
      'SYSTEM_ERROR'
    ]
  },
  
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userEmail: String,
  userRole: String,
  
  // Request Information
  ipAddress: String,
  userAgent: String,
  requestId: String,
  sessionId: String,
  
  // Event Details
  action: {
    type: String,
    required: true
  },
  resource: String,
  resourceId: String,
  
  // Status and Results
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'WARNING', 'ERROR'],
    required: true
  },
  statusCode: Number,
  
  // Additional Data
  details: mongoose.Schema.Types.Mixed,
  errorMessage: String,
  
  // Security Context
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  
  // Metadata
  timestamp: {
    type: Date,
    default: Date.now
  },
  environment: {
    type: String,
    default: process.env.NODE_ENV || 'development'
  }
}, {
  timestamps: true,
  collection: 'audit_logs'
});

// Indexes for performance
auditLogSchema.index({ eventType: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ ipAddress: 1, timestamp: -1 });
auditLogSchema.index({ status: 1, riskLevel: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// Audit Logger Class
class AuditLogger {
  constructor() {
    this.logDirectory = path.join(__dirname, '..', 'logs');
    this.ensureLogDirectory();
  }

  // Ensure log directory exists
  async ensureLogDirectory() {
    try {
      await fs.access(this.logDirectory);
    } catch (error) {
      await fs.mkdir(this.logDirectory, { recursive: true });
    }
  }

  // Main logging method
  async log(eventData) {
    try {
      // Validate required fields
      if (!eventData.eventType || !eventData.action || !eventData.status) {
        throw new Error('Missing required audit log fields');
      }

      // Enrich event data
      const enrichedData = {
        ...eventData,
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        requestId: eventData.requestId || this.generateRequestId()
      };

      // Save to database
      const auditLog = new AuditLog(enrichedData);
      await auditLog.save();

      // Write to file for backup
      await this.writeToFile(enrichedData);

      // Check for security alerts
      await this.checkSecurityAlerts(enrichedData);

      return auditLog;

    } catch (error) {
      console.error('Audit logging failed:', error);
      // Fallback to file logging
      await this.writeToFile({
        ...eventData,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  // Write audit log to file
  async writeToFile(eventData) {
    try {
      const logFile = path.join(
        this.logDirectory,
        `audit-${new Date().toISOString().split('T')[0]}.log`
      );

      const logEntry = JSON.stringify({
        ...eventData,
        timestamp: eventData.timestamp || new Date()
      }) + '\n';

      await fs.appendFile(logFile, logEntry);
    } catch (error) {
      console.error('File logging failed:', error);
    }
  }

  // Check for security alerts
  async checkSecurityAlerts(eventData) {
    try {
      // Multiple failed login attempts
      if (eventData.eventType === 'FAILED_LOGIN') {
        await this.checkFailedLoginAttempts(eventData);
      }

      // Invalid super key attempts
      if (eventData.eventType === 'SUPER_KEY_ATTEMPT' && eventData.status === 'FAILURE') {
        await this.checkSuperKeyAttempts(eventData);
      }

      // Suspicious registration patterns
      if (eventData.eventType === 'USER_REGISTRATION') {
        await this.checkRegistrationPatterns(eventData);
      }

    } catch (error) {
      console.error('Security alert check failed:', error);
    }
  }

  // Check for failed login attempts
  async checkFailedLoginAttempts(eventData) {
    const timeWindow = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;

    const recentFailures = await AuditLog.countDocuments({
      eventType: 'FAILED_LOGIN',
      ipAddress: eventData.ipAddress,
      timestamp: { $gte: new Date(Date.now() - timeWindow) }
    });

    if (recentFailures >= maxAttempts) {
      await this.log({
        eventType: 'SECURITY_VIOLATION',
        action: 'MULTIPLE_FAILED_LOGINS',
        status: 'WARNING',
        riskLevel: 'HIGH',
        ipAddress: eventData.ipAddress,
        details: {
          failedAttempts: recentFailures,
          timeWindow: '15 minutes'
        }
      });
    }
  }

  // Check for super key attempts
  async checkSuperKeyAttempts(eventData) {
    const timeWindow = 60 * 60 * 1000; // 1 hour
    const maxAttempts = 3;

    const recentAttempts = await AuditLog.countDocuments({
      eventType: 'SUPER_KEY_ATTEMPT',
      status: 'FAILURE',
      ipAddress: eventData.ipAddress,
      timestamp: { $gte: new Date(Date.now() - timeWindow) }
    });

    if (recentAttempts >= maxAttempts) {
      await this.log({
        eventType: 'SECURITY_VIOLATION',
        action: 'MULTIPLE_SUPER_KEY_ATTEMPTS',
        status: 'CRITICAL',
        riskLevel: 'CRITICAL',
        ipAddress: eventData.ipAddress,
        details: {
          attempts: recentAttempts,
          timeWindow: '1 hour'
        }
      });
    }
  }

  // Check registration patterns
  async checkRegistrationPatterns(eventData) {
    const timeWindow = 24 * 60 * 60 * 1000; // 24 hours
    const maxRegistrations = 3;

    const recentRegistrations = await AuditLog.countDocuments({
      eventType: 'USER_REGISTRATION',
      ipAddress: eventData.ipAddress,
      timestamp: { $gte: new Date(Date.now() - timeWindow) }
    });

    if (recentRegistrations >= maxRegistrations) {
      await this.log({
        eventType: 'SECURITY_VIOLATION',
        action: 'MULTIPLE_REGISTRATIONS',
        status: 'WARNING',
        riskLevel: 'MEDIUM',
        ipAddress: eventData.ipAddress,
        details: {
          registrations: recentRegistrations,
          timeWindow: '24 hours'
        }
      });
    }
  }

  // Generate unique request ID
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Convenience methods for common events
  async logRegistration(userData, request, status, details = {}) {
    return await this.log({
      eventType: 'USER_REGISTRATION',
      action: 'ADVOCATE_REGISTRATION',
      status,
      userId: userData.id,
      userEmail: userData.email,
      userRole: userData.role,
      ipAddress: request.ip || request.connection?.remoteAddress,
      userAgent: request.get('User-Agent'),
      riskLevel: status === 'SUCCESS' ? 'LOW' : 'MEDIUM',
      details: {
        licenseNumber: userData.licenseNumber,
        specialization: userData.specialization,
        ...details
      }
    });
  }

  async logSuperKeyAttempt(request, status, details = {}) {
    return await this.log({
      eventType: 'SUPER_KEY_ATTEMPT',
      action: 'SUPER_KEY_VERIFICATION',
      status,
      ipAddress: request.ip || request.connection?.remoteAddress,
      userAgent: request.get('User-Agent'),
      riskLevel: status === 'FAILURE' ? 'HIGH' : 'LOW',
      details
    });
  }

  async logEmailVerification(userId, email, status, details = {}) {
    return await this.log({
      eventType: 'EMAIL_VERIFICATION',
      action: 'EMAIL_VERIFICATION_ATTEMPT',
      status,
      userId,
      userEmail: email,
      riskLevel: 'LOW',
      details
    });
  }

  // Query methods for security monitoring
  async getSecurityEvents(timeRange = 24 * 60 * 60 * 1000) {
    return await AuditLog.find({
      riskLevel: { $in: ['HIGH', 'CRITICAL'] },
      timestamp: { $gte: new Date(Date.now() - timeRange) }
    }).sort({ timestamp: -1 });
  }

  async getFailedAttempts(ipAddress, timeRange = 60 * 60 * 1000) {
    return await AuditLog.find({
      ipAddress,
      status: 'FAILURE',
      timestamp: { $gte: new Date(Date.now() - timeRange) }
    }).sort({ timestamp: -1 });
  }

  async getUserActivity(userId, limit = 50) {
    return await AuditLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit);
  }
}

// Export singleton instance
module.exports = new AuditLogger();
