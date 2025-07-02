// RBAC System Tests - LegalPro v1.0.1
// Tests for Role-Based Access Control functionality

const { authHelpers, USER_ROLES, RESOURCE_PERMISSIONS, TOKEN_TYPES } = require('../config/auth');

describe('RBAC System Tests', () => {
  describe('Role Validation', () => {
    test('should validate user roles correctly', () => {
      expect(authHelpers.isValidRole(USER_ROLES.CLIENT)).toBe(true);
      expect(authHelpers.isValidRole(USER_ROLES.ADVOCATE)).toBe(true);
      expect(authHelpers.isValidRole(USER_ROLES.ADMIN)).toBe(true);
      expect(authHelpers.isValidRole(USER_ROLES.SUPER_ADMIN)).toBe(true);
      expect(authHelpers.isValidRole(USER_ROLES.STAFF)).toBe(true);
      expect(authHelpers.isValidRole('invalid_role')).toBe(false);
      expect(authHelpers.isValidRole('')).toBe(false);
      expect(authHelpers.isValidRole(null)).toBe(false);
      expect(authHelpers.isValidRole(undefined)).toBe(false);
    });

    test('should get correct role levels', () => {
      expect(authHelpers.getRoleLevel(USER_ROLES.CLIENT)).toBe(1);
      expect(authHelpers.getRoleLevel(USER_ROLES.STAFF)).toBe(2);
      expect(authHelpers.getRoleLevel(USER_ROLES.ADVOCATE)).toBe(3);
      expect(authHelpers.getRoleLevel(USER_ROLES.ADMIN)).toBe(4);
      expect(authHelpers.getRoleLevel(USER_ROLES.SUPER_ADMIN)).toBe(5);
      expect(authHelpers.getRoleLevel('invalid_role')).toBe(0);
    });
  });

  describe('Permission Checking', () => {
    test('should check client permissions correctly', () => {
      const clientRole = USER_ROLES.CLIENT;
      
      // Client should have these permissions
      expect(authHelpers.hasPermission(clientRole, 'case:read')).toBe(true);
      expect(authHelpers.hasPermission(clientRole, 'appointment:create')).toBe(true);
      expect(authHelpers.hasPermission(clientRole, 'appointment:read')).toBe(true);
      expect(authHelpers.hasPermission(clientRole, 'payment:create')).toBe(true);
      expect(authHelpers.hasPermission(clientRole, 'payment:read')).toBe(true);
      expect(authHelpers.hasPermission(clientRole, 'document:read')).toBe(true);
      expect(authHelpers.hasPermission(clientRole, 'document:upload')).toBe(true);
      expect(authHelpers.hasPermission(clientRole, 'profile:read')).toBe(true);
      expect(authHelpers.hasPermission(clientRole, 'profile:update')).toBe(true);
      
      // Client should NOT have these permissions
      expect(authHelpers.hasPermission(clientRole, 'case:create')).toBe(false);
      expect(authHelpers.hasPermission(clientRole, 'case:update')).toBe(false);
      expect(authHelpers.hasPermission(clientRole, 'case:delete')).toBe(false);
      expect(authHelpers.hasPermission(clientRole, 'user:create')).toBe(false);
      expect(authHelpers.hasPermission(clientRole, 'system:admin')).toBe(false);
    });

    test('should check advocate permissions correctly', () => {
      const advocateRole = USER_ROLES.ADVOCATE;
      
      // Advocate should have these permissions
      expect(authHelpers.hasPermission(advocateRole, 'case:create')).toBe(true);
      expect(authHelpers.hasPermission(advocateRole, 'case:read')).toBe(true);
      expect(authHelpers.hasPermission(advocateRole, 'case:update')).toBe(true);
      expect(authHelpers.hasPermission(advocateRole, 'appointment:create')).toBe(true);
      expect(authHelpers.hasPermission(advocateRole, 'appointment:read')).toBe(true);
      expect(authHelpers.hasPermission(advocateRole, 'appointment:update')).toBe(true);
      expect(authHelpers.hasPermission(advocateRole, 'payment:read')).toBe(true);
      expect(authHelpers.hasPermission(advocateRole, 'payment:update')).toBe(true);
      expect(authHelpers.hasPermission(advocateRole, 'document:create')).toBe(true);
      expect(authHelpers.hasPermission(advocateRole, 'document:read')).toBe(true);
      expect(authHelpers.hasPermission(advocateRole, 'document:update')).toBe(true);
      expect(authHelpers.hasPermission(advocateRole, 'client:read')).toBe(true);
      expect(authHelpers.hasPermission(advocateRole, 'client:update')).toBe(true);
      expect(authHelpers.hasPermission(advocateRole, 'notification:send')).toBe(true);
      expect(authHelpers.hasPermission(advocateRole, 'report:generate')).toBe(true);
      
      // Advocate should NOT have these permissions
      expect(authHelpers.hasPermission(advocateRole, 'case:delete')).toBe(false);
      expect(authHelpers.hasPermission(advocateRole, 'user:create')).toBe(false);
      expect(authHelpers.hasPermission(advocateRole, 'user:delete')).toBe(false);
      expect(authHelpers.hasPermission(advocateRole, 'system:admin')).toBe(false);
    });

    test('should check admin permissions correctly', () => {
      const adminRole = USER_ROLES.ADMIN;
      
      // Admin should have these permissions
      expect(authHelpers.hasPermission(adminRole, 'user:create')).toBe(true);
      expect(authHelpers.hasPermission(adminRole, 'user:read')).toBe(true);
      expect(authHelpers.hasPermission(adminRole, 'user:update')).toBe(true);
      expect(authHelpers.hasPermission(adminRole, 'case:create')).toBe(true);
      expect(authHelpers.hasPermission(adminRole, 'case:read')).toBe(true);
      expect(authHelpers.hasPermission(adminRole, 'case:update')).toBe(true);
      expect(authHelpers.hasPermission(adminRole, 'case:delete')).toBe(true);
      expect(authHelpers.hasPermission(adminRole, 'notification:send')).toBe(true);
      expect(authHelpers.hasPermission(adminRole, 'notification:manage')).toBe(true);
      expect(authHelpers.hasPermission(adminRole, 'report:generate')).toBe(true);
      expect(authHelpers.hasPermission(adminRole, 'report:export')).toBe(true);
      
      // Admin should NOT have these permissions (Super Admin only)
      expect(authHelpers.hasPermission(adminRole, 'user:delete')).toBe(false);
      expect(authHelpers.hasPermission(adminRole, 'system:admin')).toBe(false);
      expect(authHelpers.hasPermission(adminRole, 'system:config')).toBe(false);
      expect(authHelpers.hasPermission(adminRole, 'system:backup')).toBe(false);
    });

    test('should check super admin permissions correctly', () => {
      const superAdminRole = USER_ROLES.SUPER_ADMIN;
      
      // Super Admin should have ALL permissions
      expect(authHelpers.hasPermission(superAdminRole, 'user:create')).toBe(true);
      expect(authHelpers.hasPermission(superAdminRole, 'user:read')).toBe(true);
      expect(authHelpers.hasPermission(superAdminRole, 'user:update')).toBe(true);
      expect(authHelpers.hasPermission(superAdminRole, 'user:delete')).toBe(true);
      expect(authHelpers.hasPermission(superAdminRole, 'case:create')).toBe(true);
      expect(authHelpers.hasPermission(superAdminRole, 'case:read')).toBe(true);
      expect(authHelpers.hasPermission(superAdminRole, 'case:update')).toBe(true);
      expect(authHelpers.hasPermission(superAdminRole, 'case:delete')).toBe(true);
      expect(authHelpers.hasPermission(superAdminRole, 'system:admin')).toBe(true);
      expect(authHelpers.hasPermission(superAdminRole, 'system:config')).toBe(true);
      expect(authHelpers.hasPermission(superAdminRole, 'system:backup')).toBe(true);
      expect(authHelpers.hasPermission(superAdminRole, 'system:logs')).toBe(true);
      expect(authHelpers.hasPermission(superAdminRole, 'notification:send')).toBe(true);
      expect(authHelpers.hasPermission(superAdminRole, 'notification:manage')).toBe(true);
      expect(authHelpers.hasPermission(superAdminRole, 'report:generate')).toBe(true);
      expect(authHelpers.hasPermission(superAdminRole, 'report:export')).toBe(true);
    });
  });

  describe('Multiple Permission Checking', () => {
    test('should check if user has any of multiple permissions', () => {
      const advocateRole = USER_ROLES.ADVOCATE;
      const clientRole = USER_ROLES.CLIENT;
      
      // Advocate should have any of these permissions
      expect(authHelpers.hasAnyPermission(advocateRole, ['case:create', 'case:update'])).toBe(true);
      expect(authHelpers.hasAnyPermission(advocateRole, ['case:create', 'user:delete'])).toBe(true);
      expect(authHelpers.hasAnyPermission(advocateRole, ['user:delete', 'system:admin'])).toBe(false);
      
      // Client should have any of these permissions
      expect(authHelpers.hasAnyPermission(clientRole, ['case:read', 'appointment:read'])).toBe(true);
      expect(authHelpers.hasAnyPermission(clientRole, ['case:create', 'case:update'])).toBe(false);
    });

    test('should check if user has all of multiple permissions', () => {
      const adminRole = USER_ROLES.ADMIN;
      const clientRole = USER_ROLES.CLIENT;
      
      // Admin should have all of these permissions
      expect(authHelpers.hasAllPermissions(adminRole, ['case:create', 'case:read', 'case:update'])).toBe(true);
      expect(authHelpers.hasAllPermissions(adminRole, ['user:create', 'user:read', 'user:update'])).toBe(true);
      expect(authHelpers.hasAllPermissions(adminRole, ['case:create', 'user:delete'])).toBe(false);
      
      // Client should not have all of these permissions
      expect(authHelpers.hasAllPermissions(clientRole, ['case:read', 'case:create'])).toBe(false);
      expect(authHelpers.hasAllPermissions(clientRole, ['case:read', 'appointment:read'])).toBe(true);
    });
  });

  describe('Role Permissions Retrieval', () => {
    test('should get all permissions for each role', () => {
      const clientPermissions = authHelpers.getRolePermissions(USER_ROLES.CLIENT);
      const advocatePermissions = authHelpers.getRolePermissions(USER_ROLES.ADVOCATE);
      const adminPermissions = authHelpers.getRolePermissions(USER_ROLES.ADMIN);
      const superAdminPermissions = authHelpers.getRolePermissions(USER_ROLES.SUPER_ADMIN);
      
      expect(Array.isArray(clientPermissions)).toBe(true);
      expect(Array.isArray(advocatePermissions)).toBe(true);
      expect(Array.isArray(adminPermissions)).toBe(true);
      expect(Array.isArray(superAdminPermissions)).toBe(true);
      
      expect(clientPermissions.length).toBeGreaterThan(0);
      expect(advocatePermissions.length).toBeGreaterThan(clientPermissions.length);
      expect(adminPermissions.length).toBeGreaterThan(advocatePermissions.length);
      expect(superAdminPermissions.length).toBeGreaterThan(adminPermissions.length);
      
      // Check specific permissions exist
      expect(clientPermissions).toContain('case:read');
      expect(advocatePermissions).toContain('case:create');
      expect(adminPermissions).toContain('user:create');
      expect(superAdminPermissions).toContain('system:admin');
    });

    test('should return empty array for invalid role', () => {
      const invalidPermissions = authHelpers.getRolePermissions('invalid_role');
      expect(Array.isArray(invalidPermissions)).toBe(true);
      expect(invalidPermissions.length).toBe(0);
    });
  });

  describe('Resource Access Control', () => {
    test('should allow resource access based on ownership', () => {
      const clientRole = USER_ROLES.CLIENT;
      const userId = 'user123';
      const resourceOwnerId = 'user123';
      
      // Client should access their own profile
      expect(authHelpers.canAccessResource(clientRole, userId, resourceOwnerId, 'profile:read')).toBe(true);
      expect(authHelpers.canAccessResource(clientRole, userId, resourceOwnerId, 'profile:update')).toBe(true);
      
      // Client should access their own case data
      expect(authHelpers.canAccessResource(clientRole, userId, resourceOwnerId, 'case:read')).toBe(true);
      
      // Client should NOT access other user's resources without permission
      expect(authHelpers.canAccessResource(clientRole, userId, 'otherUser456', 'case:create')).toBe(false);
    });

    test('should allow admin access to any resource', () => {
      const adminRole = USER_ROLES.ADMIN;
      const userId = 'admin123';
      const resourceOwnerId = 'user456';
      
      // Admin should access any user's resources if they have the permission
      expect(authHelpers.canAccessResource(adminRole, userId, resourceOwnerId, 'user:read')).toBe(true);
      expect(authHelpers.canAccessResource(adminRole, userId, resourceOwnerId, 'case:read')).toBe(true);
      
      // Admin should NOT access resources they don't have permission for
      expect(authHelpers.canAccessResource(adminRole, userId, resourceOwnerId, 'system:admin')).toBe(false);
    });
  });

  describe('JWT Token Management', () => {
    test('should generate valid JWT tokens', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        role: USER_ROLES.CLIENT
      };
      
      const accessToken = authHelpers.generateToken(payload, TOKEN_TYPES.ACCESS);
      const refreshToken = authHelpers.generateToken(payload, TOKEN_TYPES.REFRESH);
      
      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');
      expect(accessToken.length).toBeGreaterThan(0);
      expect(refreshToken.length).toBeGreaterThan(0);
      expect(accessToken).not.toBe(refreshToken);
    });

    test('should verify JWT tokens correctly', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        role: USER_ROLES.ADVOCATE
      };
      
      const token = authHelpers.generateToken(payload, TOKEN_TYPES.ACCESS);
      const decoded = authHelpers.verifyToken(token);
      
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.type).toBe(TOKEN_TYPES.ACCESS);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(decoded.iss).toBeDefined();
      expect(decoded.aud).toBeDefined();
    });

    test('should handle invalid tokens', () => {
      expect(() => {
        authHelpers.verifyToken('invalid-token');
      }).toThrow();
      
      expect(() => {
        authHelpers.verifyToken('');
      }).toThrow();
      
      expect(() => {
        authHelpers.verifyToken(null);
      }).toThrow();
    });

    test('should generate different token types', () => {
      const payload = { userId: 'user123', email: 'test@example.com', role: USER_ROLES.CLIENT };
      
      const accessToken = authHelpers.generateToken(payload, TOKEN_TYPES.ACCESS);
      const refreshToken = authHelpers.generateToken(payload, TOKEN_TYPES.REFRESH);
      const resetToken = authHelpers.generateToken(payload, TOKEN_TYPES.RESET_PASSWORD);
      const verificationToken = authHelpers.generateToken(payload, TOKEN_TYPES.EMAIL_VERIFICATION);
      
      const decodedAccess = authHelpers.verifyToken(accessToken);
      const decodedRefresh = authHelpers.verifyToken(refreshToken);
      const decodedReset = authHelpers.verifyToken(resetToken);
      const decodedVerification = authHelpers.verifyToken(verificationToken);
      
      expect(decodedAccess.type).toBe(TOKEN_TYPES.ACCESS);
      expect(decodedRefresh.type).toBe(TOKEN_TYPES.REFRESH);
      expect(decodedReset.type).toBe(TOKEN_TYPES.RESET_PASSWORD);
      expect(decodedVerification.type).toBe(TOKEN_TYPES.EMAIL_VERIFICATION);
    });
  });

  describe('Resource Permissions Constants', () => {
    test('should have all required resource permission constants', () => {
      expect(RESOURCE_PERMISSIONS.CASES).toBeDefined();
      expect(RESOURCE_PERMISSIONS.USERS).toBeDefined();
      expect(RESOURCE_PERMISSIONS.APPOINTMENTS).toBeDefined();
      expect(RESOURCE_PERMISSIONS.PAYMENTS).toBeDefined();
      expect(RESOURCE_PERMISSIONS.DOCUMENTS).toBeDefined();
      expect(RESOURCE_PERMISSIONS.SYSTEM).toBeDefined();
      expect(RESOURCE_PERMISSIONS.NOTIFICATIONS).toBeDefined();
      expect(RESOURCE_PERMISSIONS.REPORTS).toBeDefined();
      
      // Check CRUD operations for cases
      expect(RESOURCE_PERMISSIONS.CASES.CREATE).toBe('case:create');
      expect(RESOURCE_PERMISSIONS.CASES.READ).toBe('case:read');
      expect(RESOURCE_PERMISSIONS.CASES.UPDATE).toBe('case:update');
      expect(RESOURCE_PERMISSIONS.CASES.DELETE).toBe('case:delete');
      
      // Check system permissions
      expect(RESOURCE_PERMISSIONS.SYSTEM.ADMIN).toBe('system:admin');
      expect(RESOURCE_PERMISSIONS.SYSTEM.CONFIG).toBe('system:config');
      expect(RESOURCE_PERMISSIONS.SYSTEM.BACKUP).toBe('system:backup');
      expect(RESOURCE_PERMISSIONS.SYSTEM.LOGS).toBe('system:logs');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle null and undefined inputs gracefully', () => {
      expect(authHelpers.hasPermission(null, 'case:read')).toBe(false);
      expect(authHelpers.hasPermission(undefined, 'case:read')).toBe(false);
      expect(authHelpers.hasPermission(USER_ROLES.CLIENT, null)).toBe(false);
      expect(authHelpers.hasPermission(USER_ROLES.CLIENT, undefined)).toBe(false);
      
      expect(authHelpers.hasAnyPermission(null, ['case:read'])).toBe(false);
      expect(authHelpers.hasAllPermissions(null, ['case:read'])).toBe(false);
      
      expect(authHelpers.getRoleLevel(null)).toBe(0);
      expect(authHelpers.getRoleLevel(undefined)).toBe(0);
    });

    test('should handle empty arrays in permission checking', () => {
      expect(authHelpers.hasAnyPermission(USER_ROLES.CLIENT, [])).toBe(false);
      expect(authHelpers.hasAllPermissions(USER_ROLES.CLIENT, [])).toBe(true); // Vacuous truth
    });

    test('should handle role level validation', () => {
      // Test role level for invalid roles
      expect(authHelpers.getRoleLevel('INVALID_ROLE')).toBe(0);
      expect(authHelpers.getRoleLevel('client')).toBe(1);
      expect(authHelpers.getRoleLevel('admin')).toBe(4);
    });
  });
});
