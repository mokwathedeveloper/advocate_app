// User model for LegalPro v1.0.1
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    enum: ['advocate', 'admin', 'client'],
    default: 'client'
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
      return this.role === 'advocate';
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
      return this.role !== 'advocate'; // Advocates need manual verification
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  // Email verification fields
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationCode: String,
  emailVerificationExpires: Date,
  emailVerificationSentAt: Date,
  emailVerifiedAt: Date,
  // Registration tracking
  registrationDate: {
    type: Date,
    default: Date.now
  },
  registrationIP: String,
  verificationDate: Date,
  verificationMethod: {
    type: String,
    enum: ['super_key', 'admin_approval', 'email_verification']
  },
  // Password reset fields
  resetPasswordToken: String,
  resetPasswordExpire: Date
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

module.exports = mongoose.model('User', userSchema);