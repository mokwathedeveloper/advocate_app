// Authentication Configuration - LegalPro v1.0.1
// JWT and RBAC configuration for the authentication system

const jwt = require('jsonwebtoken');

// JWT Configuration
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  issuer: process.env.JWT_ISSUER || 'legalpro-api',
  audience: process.env.JWT_AUDIENCE || 'legalpro-client'
};

// User Roles and Permissions (RBAC)
const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  ADVOCATE: 'advocate',
  CLIENT: 'client',
  STAFF: 'staff'
};

// Permissions for each role
const ROLE_PERMISSIONS = {
  [USER_ROLES.SUPER_ADMIN]: [
    'user:create', 'user:read', 'user:update', 'user:delete',
    'case:create', 'case:read', 'case:update', 'case:delete',
    'appointment:create', 'appointment:read', 'appointment:update', 'appointment:delete',
    'payment:create', 'payment:read', 'payment:update', 'payment:delete',
    'document:create', 'document:read', 'document:update', 'document:delete',
    'system:admin', 'system:config', 'system:backup', 'system:logs',
    'notification:send', 'notification:manage',
    'report:generate', 'report:export'
  ],
  
  [USER_ROLES.ADMIN]: [
    'user:create', 'user:read', 'user:update',
    'case:create', 'case:read', 'case:update', 'case:delete',
    'appointment:create', 'appointment:read', 'appointment:update', 'appointment:delete',
    'payment:create', 'payment:read', 'payment:update',
    'document:create', 'document:read', 'document:update', 'document:delete',
    'notification:send', 'notification:manage',
    'report:generate', 'report:export'
  ],
  
  [USER_ROLES.ADVOCATE]: [
    'case:create', 'case:read', 'case:update',
    'appointment:create', 'appointment:read', 'appointment:update',
    'payment:read', 'payment:update',
    'document:create', 'document:read', 'document:update',
    'client:read', 'client:update',
    'notification:send',
    'report:generate'
  ],
  
  [USER_ROLES.CLIENT]: [
    'case:read',
    'appointment:create', 'appointment:read',
    'payment:create', 'payment:read',
    'document:read', 'document:upload',
    'profile:read', 'profile:update'
  ],
  
  [USER_ROLES.STAFF]: [
    'appointment:create', 'appointment:read', 'appointment:update',
    'payment:read',
    'document:read',
    'client:read'
  ]
};

// Resource-based permissions
const RESOURCE_PERMISSIONS = {
  CASES: {
    CREATE: 'case:create',
    READ: 'case:read',
    UPDATE: 'case:update',
    DELETE: 'case:delete'
  },
  USERS: {
    CREATE: 'user:create',
    READ: 'user:read',
    UPDATE: 'user:update',
    DELETE: 'user:delete'
  },
  APPOINTMENTS: {
    CREATE: 'appointment:create',
    READ: 'appointment:read',
    UPDATE: 'appointment:update',
    DELETE: 'appointment:delete'
  },
  PAYMENTS: {
    CREATE: 'payment:create',
    READ: 'payment:read',
    UPDATE: 'payment:update',
    DELETE: 'payment:delete'
  },
  DOCUMENTS: {
    CREATE: 'document:create',
    READ: 'document:read',
    UPDATE: 'document:update',
    DELETE: 'document:delete',
    UPLOAD: 'document:upload'
  },
  SYSTEM: {
    ADMIN: 'system:admin',
    CONFIG: 'system:config',
    BACKUP: 'system:backup',
    LOGS: 'system:logs'
  },
  NOTIFICATIONS: {
    SEND: 'notification:send',
    MANAGE: 'notification:manage'
  },
  REPORTS: {
    GENERATE: 'report:generate',
    EXPORT: 'report:export'
  }
};

// JWT Token Types
const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  RESET_PASSWORD: 'reset_password',
  EMAIL_VERIFICATION: 'email_verification'
};

// Authentication Helper Functions
const authHelpers = {
  /**
   * Generate JWT token
   * @param {Object} payload - Token payload
   * @param {String} type - Token type (access, refresh, etc.)
   * @param {String} expiresIn - Token expiration
   * @returns {String} JWT token
   */
  generateToken(payload, type = TOKEN_TYPES.ACCESS, expiresIn = null) {
    const tokenPayload = {
      ...payload,
      type,
      iat: Math.floor(Date.now() / 1000),
      iss: JWT_CONFIG.issuer,
      aud: JWT_CONFIG.audience
    };

    const options = {
      expiresIn: expiresIn || (type === TOKEN_TYPES.REFRESH ? JWT_CONFIG.refreshExpiresIn : JWT_CONFIG.expiresIn)
    };

    return jwt.sign(tokenPayload, JWT_CONFIG.secret, options);
  },

  /**
   * Verify JWT token
   * @param {String} token - JWT token to verify
   * @returns {Object} Decoded token payload
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_CONFIG.secret, {
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience
      });
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  },

  /**
   * Check if user has specific permission
   * @param {String} userRole - User's role
   * @param {String} permission - Required permission
   * @returns {Boolean} Has permission
   */
  hasPermission(userRole, permission) {
    if (!userRole || !permission) return false;
    const rolePermissions = ROLE_PERMISSIONS[userRole];
    return rolePermissions && rolePermissions.includes(permission);
  },

  /**
   * Check if user has any of the specified permissions
   * @param {String} userRole - User's role
   * @param {Array} permissions - Array of permissions to check
   * @returns {Boolean} Has any permission
   */
  hasAnyPermission(userRole, permissions) {
    if (!userRole || !Array.isArray(permissions) || permissions.length === 0) return false;
    return permissions.some(permission => this.hasPermission(userRole, permission));
  },

  /**
   * Check if user has all specified permissions
   * @param {String} userRole - User's role
   * @param {Array} permissions - Array of permissions to check
   * @returns {Boolean} Has all permissions
   */
  hasAllPermissions(userRole, permissions) {
    if (!userRole || !Array.isArray(permissions)) return false;
    if (permissions.length === 0) return true; // Vacuous truth
    return permissions.every(permission => this.hasPermission(userRole, permission));
  },

  /**
   * Get all permissions for a role
   * @param {String} userRole - User's role
   * @returns {Array} Array of permissions
   */
  getRolePermissions(userRole) {
    return ROLE_PERMISSIONS[userRole] || [];
  },

  /**
   * Check if role exists
   * @param {String} role - Role to check
   * @returns {Boolean} Role exists
   */
  isValidRole(role) {
    return Object.values(USER_ROLES).includes(role);
  },

  /**
   * Get role hierarchy level (higher number = more permissions)
   * @param {String} role - User role
   * @returns {Number} Role level
   */
  getRoleLevel(role) {
    const roleLevels = {
      [USER_ROLES.CLIENT]: 1,
      [USER_ROLES.STAFF]: 2,
      [USER_ROLES.ADVOCATE]: 3,
      [USER_ROLES.ADMIN]: 4,
      [USER_ROLES.SUPER_ADMIN]: 5
    };
    return roleLevels[role] || 0;
  },

  /**
   * Check if user can access resource based on ownership
   * @param {String} userRole - User's role
   * @param {String} userId - User's ID
   * @param {String} resourceOwnerId - Resource owner's ID
   * @param {String} permission - Required permission
   * @returns {Boolean} Can access resource
   */
  canAccessResource(userRole, userId, resourceOwnerId, permission) {
    // Check if user has global permission
    if (this.hasPermission(userRole, permission)) {
      return true;
    }

    // Check if user owns the resource
    if (userId === resourceOwnerId) {
      // Clients can access their own resources with specific permissions
      if (userRole === USER_ROLES.CLIENT) {
        return ['case:read', 'appointment:read', 'payment:read', 'document:read', 'profile:read', 'profile:update'].includes(permission);
      }
      // Other roles can access their own resources if they have the permission
      return this.hasPermission(userRole, permission);
    }

    return false;
  }
};

// Password Security Configuration
const PASSWORD_CONFIG = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  saltRounds: 12,
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  passwordHistoryLimit: 5 // Remember last 5 passwords
};

// Session Configuration
const SESSION_CONFIG = {
  maxConcurrentSessions: 3,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  refreshTokenRotation: true,
  rememberMeDuration: 30 * 24 * 60 * 60 * 1000 // 30 days
};

module.exports = {
  JWT_CONFIG,
  USER_ROLES,
  ROLE_PERMISSIONS,
  RESOURCE_PERMISSIONS,
  TOKEN_TYPES,
  PASSWORD_CONFIG,
  SESSION_CONFIG,
  authHelpers
};
