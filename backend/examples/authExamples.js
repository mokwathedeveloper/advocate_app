// Authentication System Usage Examples - LegalPro v1.0.1
// Demonstrates how to use the enhanced authentication system

const express = require('express');
const { 
  authenticate, 
  authorize, 
  requireRole, 
  requireMinimumRole,
  requireOwnershipOrAdmin 
} = require('../middleware/auth');
const { RESOURCE_PERMISSIONS, USER_ROLES } = require('../config/auth');

const router = express.Router();

// Example 1: Basic Authentication
// Protect a route that requires any authenticated user
router.get('/profile', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Access granted to authenticated user',
    user: req.user,
    permissions: req.user.permissions
  });
});

// Example 2: Permission-Based Authorization
// Require specific permission to access resource
router.get('/cases', 
  authenticate,
  authorize([RESOURCE_PERMISSIONS.CASES.READ]),
  (req, res) => {
    res.json({
      success: true,
      message: 'User has permission to read cases',
      cases: [] // Would fetch actual cases
    });
  }
);

// Example 3: Multiple Permissions (Any)
// User needs ANY of the specified permissions
router.post('/cases', 
  authenticate,
  authorize([
    RESOURCE_PERMISSIONS.CASES.CREATE,
    RESOURCE_PERMISSIONS.CASES.UPDATE
  ]),
  (req, res) => {
    res.json({
      success: true,
      message: 'User can create or update cases'
    });
  }
);

// Example 4: Multiple Permissions (All Required)
// User needs ALL specified permissions
router.delete('/cases/:id', 
  authenticate,
  authorize([
    RESOURCE_PERMISSIONS.CASES.DELETE,
    RESOURCE_PERMISSIONS.SYSTEM.ADMIN
  ], { requireAll: true }),
  (req, res) => {
    res.json({
      success: true,
      message: 'User has both delete and admin permissions'
    });
  }
);

// Example 5: Role-Based Authorization
// Require specific role(s)
router.get('/admin/users', 
  authenticate,
  requireRole([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]),
  (req, res) => {
    res.json({
      success: true,
      message: 'Admin or Super Admin access granted'
    });
  }
);

// Example 6: Minimum Role Level
// Require minimum role level (advocate or higher)
router.put('/cases/:id/assign', 
  authenticate,
  requireMinimumRole(USER_ROLES.ADVOCATE),
  (req, res) => {
    res.json({
      success: true,
      message: 'Advocate level or higher access granted'
    });
  }
);

// Example 7: Resource Ownership
// Allow access to own resources or admin override
router.get('/users/:id/profile', 
  authenticate,
  requireOwnershipOrAdmin('id', 'userId'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Access granted to own profile or admin'
    });
  }
);

// Example 8: Complex Authorization Logic
// Custom authorization with multiple conditions
router.put('/cases/:id/sensitive-data', 
  authenticate,
  (req, res, next) => {
    const userRole = req.user.role;
    const userId = req.user._id.toString();
    const caseOwnerId = req.params.userId; // Would come from case data
    
    // Super admin can access anything
    if (userRole === USER_ROLES.SUPER_ADMIN) {
      return next();
    }
    
    // Admin can access if they have the permission
    if (userRole === USER_ROLES.ADMIN && 
        authHelpers.hasPermission(userRole, RESOURCE_PERMISSIONS.CASES.UPDATE)) {
      return next();
    }
    
    // Advocate can access their own cases
    if (userRole === USER_ROLES.ADVOCATE && 
        userId === caseOwnerId &&
        authHelpers.hasPermission(userRole, RESOURCE_PERMISSIONS.CASES.UPDATE)) {
      return next();
    }
    
    // Client cannot access sensitive data
    return res.status(403).json({
      success: false,
      message: 'Access denied to sensitive case data'
    });
  },
  (req, res) => {
    res.json({
      success: true,
      message: 'Access granted to sensitive case data'
    });
  }
);

// Example 9: Conditional Authorization
// Different permissions based on request context
router.post('/appointments', 
  authenticate,
  (req, res, next) => {
    const userRole = req.user.role;
    const { clientId, advocateId } = req.body;
    
    // Clients can only create appointments for themselves
    if (userRole === USER_ROLES.CLIENT) {
      if (clientId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Clients can only create appointments for themselves'
        });
      }
    }
    
    // Advocates can create appointments for any client
    if (userRole === USER_ROLES.ADVOCATE) {
      if (advocateId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Advocates can only create appointments for themselves'
        });
      }
    }
    
    next();
  },
  authorize([RESOURCE_PERMISSIONS.APPOINTMENTS.CREATE]),
  (req, res) => {
    res.json({
      success: true,
      message: 'Appointment created successfully'
    });
  }
);

// Example 10: Time-Based Authorization
// Different permissions based on time/business hours
router.post('/emergency-contact', 
  authenticate,
  (req, res, next) => {
    const currentHour = new Date().getHours();
    const isBusinessHours = currentHour >= 8 && currentHour <= 18;
    
    // During business hours, any authenticated user can contact
    if (isBusinessHours) {
      return next();
    }
    
    // After hours, only clients with active cases can contact
    if (req.user.role === USER_ROLES.CLIENT) {
      // Would check if user has active cases
      const hasActiveCases = true; // Placeholder
      if (!hasActiveCases) {
        return res.status(403).json({
          success: false,
          message: 'Emergency contact only available for clients with active cases after hours'
        });
      }
    }
    
    next();
  },
  (req, res) => {
    res.json({
      success: true,
      message: 'Emergency contact request processed'
    });
  }
);

// Example 11: Rate Limiting with Role-Based Limits
// Different rate limits based on user role
const rateLimit = require('express-rate-limit');

const createRateLimitByRole = (req) => {
  const userRole = req.user?.role;
  
  switch (userRole) {
    case USER_ROLES.SUPER_ADMIN:
      return { windowMs: 15 * 60 * 1000, max: 1000 }; // 1000 requests per 15 minutes
    case USER_ROLES.ADMIN:
      return { windowMs: 15 * 60 * 1000, max: 500 };  // 500 requests per 15 minutes
    case USER_ROLES.ADVOCATE:
      return { windowMs: 15 * 60 * 1000, max: 200 };  // 200 requests per 15 minutes
    case USER_ROLES.CLIENT:
      return { windowMs: 15 * 60 * 1000, max: 100 };  // 100 requests per 15 minutes
    default:
      return { windowMs: 15 * 60 * 1000, max: 50 };   // 50 requests per 15 minutes
  }
};

router.post('/api-intensive-operation', 
  authenticate,
  (req, res, next) => {
    const limits = createRateLimitByRole(req);
    const limiter = rateLimit({
      ...limits,
      message: {
        success: false,
        message: 'Too many requests, please try again later'
      }
    });
    limiter(req, res, next);
  },
  authorize([RESOURCE_PERMISSIONS.SYSTEM.ADMIN]),
  (req, res) => {
    res.json({
      success: true,
      message: 'Intensive operation completed'
    });
  }
);

// Example 12: Audit Logging with Authorization
// Log access attempts for sensitive operations
router.delete('/users/:id', 
  authenticate,
  requireMinimumRole(USER_ROLES.ADMIN),
  (req, res, next) => {
    // Log the access attempt
    console.log(`User deletion attempt: ${req.user.email} trying to delete user ${req.params.id}`);
    
    // Prevent deletion of super admin accounts
    if (req.params.id === req.user._id.toString() && req.user.role === USER_ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete your own super admin account'
      });
    }
    
    next();
  },
  (req, res) => {
    // Log successful deletion
    console.log(`User deleted successfully: ${req.params.id} by ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  }
);

// Example 13: Feature Flag Authorization
// Enable/disable features based on user role and feature flags
const featureFlags = {
  advancedReporting: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
  bulkOperations: [USER_ROLES.ADVOCATE, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
  systemSettings: [USER_ROLES.SUPER_ADMIN]
};

const requireFeature = (featureName) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const allowedRoles = featureFlags[featureName];
    
    if (!allowedRoles || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Feature '${featureName}' not available for your role`
      });
    }
    
    next();
  };
};

router.get('/reports/advanced', 
  authenticate,
  requireFeature('advancedReporting'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Advanced reporting feature accessed'
    });
  }
);

// Example 14: Dynamic Permission Checking
// Check permissions dynamically based on request data
router.put('/cases/:id/status', 
  authenticate,
  async (req, res, next) => {
    const { status } = req.body;
    const userRole = req.user.role;
    
    // Different status changes require different permissions
    const statusPermissions = {
      'closed': [RESOURCE_PERMISSIONS.CASES.DELETE],
      'archived': [RESOURCE_PERMISSIONS.CASES.DELETE, RESOURCE_PERMISSIONS.SYSTEM.ADMIN],
      'in_progress': [RESOURCE_PERMISSIONS.CASES.UPDATE],
      'pending': [RESOURCE_PERMISSIONS.CASES.UPDATE]
    };
    
    const requiredPermissions = statusPermissions[status];
    if (!requiredPermissions) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const hasPermission = requiredPermissions.some(permission => 
      authHelpers.hasPermission(userRole, permission)
    );
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions to change status to '${status}'`
      });
    }
    
    next();
  },
  (req, res) => {
    res.json({
      success: true,
      message: 'Case status updated successfully'
    });
  }
);

module.exports = router;
