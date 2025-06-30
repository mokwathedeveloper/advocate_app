// User Management routes for LegalPro v1.0.1 - Advocate (Superuser) Functions
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const userManagementController = require('../controllers/userManagementController');

// @route   POST /api/user-management/create-admin
// @desc    Create admin user (Advocate only)
// @access  Private (Advocate only)
router.post('/create-admin', 
  protect, 
  authorize('advocate'), 
  userManagementController.createAdmin
);

// @route   POST /api/user-management/create-client
// @desc    Create client user (Advocate/Admin with permission)
// @access  Private (Advocate/Admin with canAdmitClients permission)
router.post('/create-client', 
  protect, 
  authorize('advocate', 'admin'), 
  userManagementController.createClient
);

// @route   GET /api/user-management/users
// @desc    Get all users (Advocate only)
// @access  Private (Advocate only)
router.get('/users', 
  protect, 
  authorize('advocate'), 
  userManagementController.getAllUsers
);

// @route   PUT /api/user-management/admin/:id/permissions
// @desc    Update admin permissions (Advocate only)
// @access  Private (Advocate only)
router.put('/admin/:id/permissions', 
  protect, 
  authorize('advocate'), 
  userManagementController.updateAdminPermissions
);

// @route   PUT /api/user-management/user/:id/deactivate
// @desc    Deactivate user (Advocate only)
// @access  Private (Advocate only)
router.put('/user/:id/deactivate', 
  protect, 
  authorize('advocate'), 
  userManagementController.deactivateUser
);

// @route   PUT /api/user-management/user/:id/activate
// @desc    Activate user (Advocate only)
// @access  Private (Advocate only)
router.put('/user/:id/activate', 
  protect, 
  authorize('advocate'), 
  async (req, res) => {
    try {
      const User = require('../models/User');
      const userId = req.params.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.isActive = true;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'User activated successfully'
      });

    } catch (error) {
      console.error('Activate user error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while activating user'
      });
    }
  }
);

// @route   PUT /api/user-management/user/:id/reset-password
// @desc    Reset user password (Advocate only)
// @access  Private (Advocate only)
router.put('/user/:id/reset-password', 
  protect, 
  authorize('advocate'), 
  userManagementController.resetUserPassword
);

// @route   DELETE /api/user-management/user/:id
// @desc    Delete user (Advocate only)
// @access  Private (Advocate only)
router.delete('/user/:id', 
  protect, 
  authorize('advocate'), 
  async (req, res) => {
    try {
      const User = require('../models/User');
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
          message: 'Cannot delete advocate account'
        });
      }

      await User.findByIdAndDelete(userId);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting user'
      });
    }
  }
);

module.exports = router;
