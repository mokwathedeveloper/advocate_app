// User Management Controller for LegalPro v1.0.1 - Advocate (Superuser) Functions
const User = require('../models/User');
const crypto = require('crypto');
const { sendNotification } = require('../utils/notificationService');

// Generate secure random password
const generateSecurePassword = () => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// @desc    Create admin user (Advocate only)
// @route   POST /api/user-management/create-admin
// @access  Private (Advocate only)
const createAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, permissions } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide firstName, lastName, and email'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Generate secure password
    const temporaryPassword = generateSecurePassword();

    // Create admin user
    const adminUser = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password: temporaryPassword,
      role: 'admin',
      permissions: permissions || {
        canOpenFiles: false,
        canUploadFiles: false,
        canAdmitClients: false,
        canManageCases: false,
        canScheduleAppointments: false,
        canAccessReports: false
      },
      createdBy: req.user._id,
      isTemporaryPassword: true,
      isVerified: true,
      isActive: true
    });

    // Remove password from response
    adminUser.password = undefined;

    // Send notification (in real app, send email with credentials)
    await sendNotification({
      userId: adminUser._id,
      type: 'account_created',
      title: 'Admin Account Created',
      message: `Your admin account has been created. Temporary password: ${temporaryPassword}`,
      data: { temporaryPassword }
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      user: adminUser,
      temporaryPassword // In production, send via secure email
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating admin user'
    });
  }
};

// @desc    Create client user (Advocate/Admin only)
// @route   POST /api/user-management/create-client
// @access  Private (Advocate/Admin with permission)
const createClient = async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;

    // Check permissions for admin users
    if (req.user.role === 'admin' && !req.user.permissions.canAdmitClients) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to admit clients'
      });
    }

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide firstName, lastName, and email'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Generate secure password
    const temporaryPassword = generateSecurePassword();

    // Create client user
    const clientUser = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password: temporaryPassword,
      role: 'client',
      createdBy: req.user._id,
      isTemporaryPassword: true,
      isVerified: true,
      isActive: true
    });

    // Remove password from response
    clientUser.password = undefined;

    // Send notification
    await sendNotification({
      userId: clientUser._id,
      type: 'account_created',
      title: 'Client Account Created',
      message: `Your client account has been created. Temporary password: ${temporaryPassword}`,
      data: { temporaryPassword }
    });

    res.status(201).json({
      success: true,
      message: 'Client user created successfully',
      user: clientUser,
      temporaryPassword // In production, send via secure email
    });

  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating client user'
    });
  }
};

// @desc    Get all users (Advocate only)
// @route   GET /api/user-management/users
// @access  Private (Advocate only)
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (role && ['admin', 'client'].includes(role)) {
      query.role = role;
    }

    const users = await User.find(query)
      .populate('createdBy', 'firstName lastName email')
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      users
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
};

// @desc    Update admin permissions (Advocate only)
// @route   PUT /api/user-management/admin/:id/permissions
// @access  Private (Advocate only)
const updateAdminPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    const adminId = req.params.id;

    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    if (admin.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'User is not an admin'
      });
    }

    // Update permissions
    admin.permissions = { ...admin.permissions, ...permissions };
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Admin permissions updated successfully',
      user: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        permissions: admin.permissions
      }
    });

  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating permissions'
    });
  }
};

// @desc    Deactivate user (Advocate only)
// @route   PUT /api/user-management/user/:id/deactivate
// @access  Private (Advocate only)
const deactivateUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'advocate') {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate advocate account'
      });
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deactivating user'
    });
  }
};

// @desc    Reset user password (Advocate only)
// @route   PUT /api/user-management/user/:id/reset-password
// @access  Private (Advocate only)
const resetUserPassword = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'advocate') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reset advocate password'
      });
    }

    // Generate new password
    const newPassword = generateSecurePassword();
    user.password = newPassword;
    user.isTemporaryPassword = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      temporaryPassword: newPassword // In production, send via secure email
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resetting password'
    });
  }
};

module.exports = {
  createAdmin,
  createClient,
  getAllUsers,
  updateAdminPermissions,
  deactivateUser,
  resetUserPassword
};
