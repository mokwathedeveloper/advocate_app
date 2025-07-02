// Authentication Middleware - LegalPro v1.0.1
// JWT verification and RBAC middleware for protected routes

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authHelpers, USER_ROLES, TOKEN_TYPES } = require('../config/auth');

/**
 * Verify JWT token and authenticate user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format.',
        error: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let decoded;
    try {
      decoded = authHelpers.verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
        error: 'INVALID_TOKEN'
      });
    }

    // Check token type
    if (decoded.type !== TOKEN_TYPES.ACCESS) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type.',
        error: 'INVALID_TOKEN_TYPE'
      });
    }

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.',
        error: 'USER_NOT_FOUND'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.',
        error: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Add user to request object
    req.user = user;
    req.token = token;
    req.tokenPayload = decoded;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed.',
      error: 'AUTHENTICATION_ERROR'
    });
  }
};

// Legacy protect function for backward compatibility
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No user found with this token'
      });
    }

    // Check if user is active
    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

/**
 * Check if user has required permission (Enhanced RBAC)
 * @param {String|Array} requiredPermissions - Required permission(s)
 * @param {Object} options - Additional options
 * @returns {Function} Middleware function
 */
const authorize = (requiredPermissions, options = {}) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
          error: 'NOT_AUTHENTICATED'
        });
      }

      const userRole = req.user.role;
      const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

      // Check permissions based on options
      let hasAccess = false;

      if (options.requireAll) {
        // User must have ALL specified permissions
        hasAccess = authHelpers.hasAllPermissions(userRole, permissions);
      } else {
        // User must have ANY of the specified permissions (default)
        hasAccess = authHelpers.hasAnyPermission(userRole, permissions);
      }

      // Check resource ownership if specified
      if (options.checkOwnership && req.params.id) {
        const resourceOwnerId = req.params.userId || req.user._id.toString();
        hasAccess = hasAccess || authHelpers.canAccessResource(
          userRole,
          req.user._id.toString(),
          resourceOwnerId,
          permissions[0]
        );
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions.',
          error: 'INSUFFICIENT_PERMISSIONS',
          required: permissions,
          userRole: userRole
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization failed.',
        error: 'AUTHORIZATION_ERROR'
      });
    }
  };
};

// Legacy role-based authorization for backward compatibility
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

/**
 * Check if user has specific role(s)
 * @param {String|Array} requiredRoles - Required role(s)
 * @returns {Function} Middleware function
 */
const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
          error: 'NOT_AUTHENTICATED'
        });
      }

      const userRole = req.user.role;
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient role privileges.',
          error: 'INSUFFICIENT_ROLE',
          required: roles,
          userRole: userRole
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Role verification failed.',
        error: 'ROLE_CHECK_ERROR'
      });
    }
  };
};

/**
 * Check if user has minimum role level
 * @param {String} minimumRole - Minimum required role
 * @returns {Function} Middleware function
 */
const requireMinimumRole = (minimumRole) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
          error: 'NOT_AUTHENTICATED'
        });
      }

      const userRoleLevel = authHelpers.getRoleLevel(req.user.role);
      const minimumRoleLevel = authHelpers.getRoleLevel(minimumRole);

      if (userRoleLevel < minimumRoleLevel) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient role level.',
          error: 'INSUFFICIENT_ROLE_LEVEL',
          required: minimumRole,
          userRole: req.user.role
        });
      }

      next();
    } catch (error) {
      console.error('Role level check error:', error);
      res.status(500).json({
        success: false,
        message: 'Role level verification failed.',
        error: 'ROLE_LEVEL_CHECK_ERROR'
      });
    }
  };
};

/**
 * Check if user owns the resource or has admin privileges
 * @param {String} resourceIdParam - Parameter name for resource ID
 * @param {String} ownerField - Field name for resource owner
 * @returns {Function} Middleware function
 */
const requireOwnershipOrAdmin = (resourceIdParam = 'id', ownerField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
          error: 'NOT_AUTHENTICATED'
        });
      }

      const userRole = req.user.role;
      const userId = req.user._id.toString();

      // Admin and super admin can access any resource
      if ([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(userRole)) {
        return next();
      }

      // Check ownership
      const resourceId = req.params[resourceIdParam];
      const resourceOwnerId = req.body[ownerField] || req.params.userId;

      if (userId === resourceOwnerId || userId === resourceId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.',
        error: 'OWNERSHIP_REQUIRED'
      });
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Ownership verification failed.',
        error: 'OWNERSHIP_CHECK_ERROR'
      });
    }
  };
};

module.exports = {
  authenticate,
  protect, // Legacy function for backward compatibility
  authorize, // Enhanced RBAC authorization
  authorizeRoles, // Legacy role-based authorization
  requireRole,
  requireMinimumRole,
  requireOwnershipOrAdmin
};