// User model for LegalPro v1.0.1
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { USER_ROLES } = require('../config/auth');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.CLIENT
  },
  // Admin permissions (for admin role only)
  permissions: {
    canOpenFiles: {
      type: Boolean,
      default: false
    },
    canUploadFiles: {
      type: Boolean,
      default: false
    },
    canAdmitClients: {
      type: Boolean,
      default: false
    },
    canManageCases: {
      type: Boolean,
      default: false
    },
    canScheduleAppointments: {
      type: Boolean,
      default: false
    },
    canAccessReports: {
      type: Boolean,
      default: false
    }
  },
  // Created by (for tracking who created admin/client accounts)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Temporary password flag (for newly created accounts)
  isTemporaryPassword: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String
  },
  // Advocate-specific fields
  licenseNumber: {
    type: String,
    required: function() {
      return this.role === USER_ROLES.ADVOCATE;
    }
  },
  specialization: [{
    type: String
  }],
  experience: {
    type: Number,
    min: 0
  },
  education: {
    type: String
  },
  barAdmission: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: function() {
      return this.role !== USER_ROLES.ADVOCATE; // Advocates need manual verification
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  // Enhanced authentication fields
  refreshTokens: [{
    type: String
  }],
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  passwordHistory: [{
    password: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  twoFactorSecret: {
    type: String,
    select: false
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  // Session management
  activeSessions: [{
    sessionId: String,
    deviceInfo: String,
    ipAddress: String,
    userAgent: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }],
  // Security settings
  securitySettings: {
    requirePasswordChange: {
      type: Boolean,
      default: false
    },
    passwordChangeRequired: {
      type: Boolean,
      default: false
    },
    lastPasswordChange: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Generate email verification token
userSchema.methods.getEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(20).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        lockUntil: 1
      },
      $set: {
        loginAttempts: 1
      }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 attempts for 15 minutes
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 15 * 60 * 1000 };
  }

  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    }
  });
};

// Add password to history
userSchema.methods.addPasswordToHistory = function(password) {
  this.passwordHistory = this.passwordHistory || [];
  this.passwordHistory.push({
    password: password,
    createdAt: new Date()
  });

  // Keep only last 5 passwords
  if (this.passwordHistory.length > 5) {
    this.passwordHistory = this.passwordHistory.slice(-5);
  }
};

// Check if password was used recently
userSchema.methods.isPasswordRecentlyUsed = async function(password) {
  if (!this.passwordHistory || this.passwordHistory.length === 0) {
    return false;
  }

  for (const historyEntry of this.passwordHistory) {
    const isMatch = await bcrypt.compare(password, historyEntry.password);
    if (isMatch) {
      return true;
    }
  }

  return false;
};

// Add refresh token
userSchema.methods.addRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens || [];
  this.refreshTokens.push(token);

  // Keep only last 3 tokens (max concurrent sessions)
  if (this.refreshTokens.length > 3) {
    this.refreshTokens = this.refreshTokens.slice(-3);
  }
};

// Remove refresh token
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(t => t !== token);
};

// Clear all refresh tokens
userSchema.methods.clearAllRefreshTokens = function() {
  this.refreshTokens = [];
};

// Add session
userSchema.methods.addSession = function(sessionData) {
  this.activeSessions = this.activeSessions || [];
  this.activeSessions.push({
    sessionId: sessionData.sessionId,
    deviceInfo: sessionData.deviceInfo,
    ipAddress: sessionData.ipAddress,
    userAgent: sessionData.userAgent,
    createdAt: new Date(),
    lastActivity: new Date()
  });

  // Keep only last 5 sessions
  if (this.activeSessions.length > 5) {
    this.activeSessions = this.activeSessions.slice(-5);
  }
};

// Update session activity
userSchema.methods.updateSessionActivity = function(sessionId) {
  const session = this.activeSessions.find(s => s.sessionId === sessionId);
  if (session) {
    session.lastActivity = new Date();
  }
};

// Remove session
userSchema.methods.removeSession = function(sessionId) {
  this.activeSessions = this.activeSessions.filter(s => s.sessionId !== sessionId);
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.refreshTokens;
    delete ret.passwordHistory;
    delete ret.twoFactorSecret;
    delete ret.resetPasswordToken;
    delete ret.emailVerificationToken;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);