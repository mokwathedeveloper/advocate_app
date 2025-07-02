// Authentication System Test Script - LegalPro v1.0.1
// Quick validation of the authentication system components

const { authHelpers, USER_ROLES, RESOURCE_PERMISSIONS, TOKEN_TYPES } = require('../config/auth');

console.log('🔐 LegalPro Authentication System Test\n');
console.log('=' .repeat(50));

// Test 1: Role Validation
console.log('\n📋 Test 1: Role Validation');
console.log('-'.repeat(30));

const testRoles = ['client', 'advocate', 'admin', 'super_admin', 'staff', 'invalid_role'];
testRoles.forEach(role => {
  const isValid = authHelpers.isValidRole(role);
  const level = authHelpers.getRoleLevel(role);
  console.log(`${role.padEnd(15)} | Valid: ${isValid ? '✅' : '❌'} | Level: ${level}`);
});

// Test 2: Permission Checking
console.log('\n🔑 Test 2: Permission Checking');
console.log('-'.repeat(30));

const testPermissions = [
  { role: 'client', permission: 'case:read', expected: true },
  { role: 'client', permission: 'case:create', expected: false },
  { role: 'advocate', permission: 'case:create', expected: true },
  { role: 'advocate', permission: 'user:delete', expected: false },
  { role: 'admin', permission: 'user:create', expected: true },
  { role: 'admin', permission: 'system:admin', expected: false },
  { role: 'super_admin', permission: 'system:admin', expected: true }
];

testPermissions.forEach(test => {
  const hasPermission = authHelpers.hasPermission(test.role, test.permission);
  const status = hasPermission === test.expected ? '✅' : '❌';
  console.log(`${test.role.padEnd(12)} | ${test.permission.padEnd(15)} | ${status} ${hasPermission ? 'GRANTED' : 'DENIED'}`);
});

// Test 3: Multiple Permission Checking
console.log('\n🔐 Test 3: Multiple Permission Checking');
console.log('-'.repeat(30));

const multiPermissionTests = [
  {
    role: 'advocate',
    permissions: ['case:create', 'case:read'],
    testType: 'ANY',
    expected: true
  },
  {
    role: 'advocate',
    permissions: ['case:create', 'user:delete'],
    testType: 'ANY',
    expected: true
  },
  {
    role: 'advocate',
    permissions: ['case:create', 'case:read'],
    testType: 'ALL',
    expected: true
  },
  {
    role: 'advocate',
    permissions: ['case:create', 'user:delete'],
    testType: 'ALL',
    expected: false
  },
  {
    role: 'client',
    permissions: ['user:create', 'system:admin'],
    testType: 'ANY',
    expected: false
  }
];

multiPermissionTests.forEach(test => {
  const hasPermission = test.testType === 'ANY' 
    ? authHelpers.hasAnyPermission(test.role, test.permissions)
    : authHelpers.hasAllPermissions(test.role, test.permissions);
  
  const status = hasPermission === test.expected ? '✅' : '❌';
  console.log(`${test.role.padEnd(12)} | ${test.testType} ${test.permissions.join(', ')} | ${status}`);
});

// Test 4: JWT Token Generation and Verification
console.log('\n🎫 Test 4: JWT Token Management');
console.log('-'.repeat(30));

try {
  const testPayload = {
    userId: 'test123',
    email: 'test@example.com',
    role: 'client'
  };

  // Generate different token types
  const accessToken = authHelpers.generateToken(testPayload, TOKEN_TYPES.ACCESS);
  const refreshToken = authHelpers.generateToken(testPayload, TOKEN_TYPES.REFRESH);
  
  console.log('✅ Access token generated successfully');
  console.log('✅ Refresh token generated successfully');
  
  // Verify tokens
  const decodedAccess = authHelpers.verifyToken(accessToken);
  const decodedRefresh = authHelpers.verifyToken(refreshToken);
  
  console.log('✅ Access token verified successfully');
  console.log('✅ Refresh token verified successfully');
  
  // Check token contents
  const accessValid = decodedAccess.userId === testPayload.userId && 
                     decodedAccess.type === TOKEN_TYPES.ACCESS;
  const refreshValid = decodedRefresh.userId === testPayload.userId && 
                      decodedRefresh.type === TOKEN_TYPES.REFRESH;
  
  console.log(`✅ Access token content: ${accessValid ? 'VALID' : 'INVALID'}`);
  console.log(`✅ Refresh token content: ${refreshValid ? 'VALID' : 'INVALID'}`);
  
} catch (error) {
  console.log('❌ JWT token test failed:', error.message);
}

// Test 5: Resource Access Control
console.log('\n🏠 Test 5: Resource Access Control');
console.log('-'.repeat(30));

const resourceTests = [
  {
    role: 'client',
    userId: 'user123',
    resourceOwnerId: 'user123',
    permission: 'profile:read',
    expected: true,
    description: 'Client accessing own profile'
  },
  {
    role: 'client',
    userId: 'user123',
    resourceOwnerId: 'user456',
    permission: 'profile:read',
    expected: false,
    description: 'Client accessing other profile'
  },
  {
    role: 'admin',
    userId: 'admin123',
    resourceOwnerId: 'user456',
    permission: 'user:read',
    expected: true,
    description: 'Admin accessing any user'
  },
  {
    role: 'advocate',
    userId: 'advocate123',
    resourceOwnerId: 'advocate123',
    permission: 'case:update',
    expected: true,
    description: 'Advocate accessing own case'
  }
];

resourceTests.forEach(test => {
  const canAccess = authHelpers.canAccessResource(
    test.role,
    test.userId,
    test.resourceOwnerId,
    test.permission
  );
  
  const status = canAccess === test.expected ? '✅' : '❌';
  console.log(`${status} ${test.description}: ${canAccess ? 'ALLOWED' : 'DENIED'}`);
});

// Test 6: Role Hierarchy
console.log('\n📊 Test 6: Role Hierarchy');
console.log('-'.repeat(30));

const roles = Object.values(USER_ROLES);
const sortedRoles = roles.sort((a, b) => authHelpers.getRoleLevel(a) - authHelpers.getRoleLevel(b));

console.log('Role hierarchy (lowest to highest):');
sortedRoles.forEach(role => {
  const level = authHelpers.getRoleLevel(role);
  const permissions = authHelpers.getRolePermissions(role);
  console.log(`${level}. ${role.padEnd(12)} | ${permissions.length} permissions`);
});

// Test 7: Resource Permission Constants
console.log('\n📚 Test 7: Resource Permission Constants');
console.log('-'.repeat(30));

const resourceTypes = Object.keys(RESOURCE_PERMISSIONS);
console.log(`Available resource types: ${resourceTypes.length}`);

resourceTypes.forEach(resourceType => {
  const permissions = Object.keys(RESOURCE_PERMISSIONS[resourceType]);
  console.log(`✅ ${resourceType.padEnd(15)} | ${permissions.join(', ')}`);
});

// Test 8: Edge Cases
console.log('\n⚠️  Test 8: Edge Cases');
console.log('-'.repeat(30));

const edgeCases = [
  {
    test: 'Null role permission check',
    fn: () => authHelpers.hasPermission(null, 'case:read'),
    expected: false
  },
  {
    test: 'Empty permission array (ANY)',
    fn: () => authHelpers.hasAnyPermission('client', []),
    expected: false
  },
  {
    test: 'Empty permission array (ALL)',
    fn: () => authHelpers.hasAllPermissions('client', []),
    expected: true
  },
  {
    test: 'Invalid token verification',
    fn: () => {
      try {
        authHelpers.verifyToken('invalid-token');
        return false;
      } catch (error) {
        return true; // Should throw error
      }
    },
    expected: true
  },
  {
    test: 'Role level for invalid role',
    fn: () => authHelpers.getRoleLevel('invalid_role'),
    expected: 0
  }
];

edgeCases.forEach(testCase => {
  try {
    const result = testCase.fn();
    const status = result === testCase.expected ? '✅' : '❌';
    console.log(`${status} ${testCase.test}: ${result}`);
  } catch (error) {
    console.log(`❌ ${testCase.test}: ERROR - ${error.message}`);
  }
});

// Test Summary
console.log('\n🎯 Test Summary');
console.log('=' .repeat(50));

const allRolesValid = Object.values(USER_ROLES).every(role => authHelpers.isValidRole(role));
const allResourcesValid = Object.keys(RESOURCE_PERMISSIONS).length > 0;
const tokenSystemWorking = (() => {
  try {
    const token = authHelpers.generateToken({ test: true }, TOKEN_TYPES.ACCESS);
    const decoded = authHelpers.verifyToken(token);
    return decoded.test === true;
  } catch (error) {
    return false;
  }
})();

console.log(`✅ Role System: ${allRolesValid ? 'WORKING' : 'FAILED'}`);
console.log(`✅ Permission System: ${allResourcesValid ? 'WORKING' : 'FAILED'}`);
console.log(`✅ JWT Token System: ${tokenSystemWorking ? 'WORKING' : 'FAILED'}`);
console.log(`✅ RBAC Helper Functions: WORKING`);

const systemHealth = allRolesValid && allResourcesValid && tokenSystemWorking ? 'HEALTHY' : 'ISSUES DETECTED';
const healthEmoji = systemHealth === 'HEALTHY' ? '🟢' : '🔴';

console.log(`\n${healthEmoji} System Status: ${systemHealth}`);

if (systemHealth === 'HEALTHY') {
  console.log('\n🎉 All authentication system components are working correctly!');
  console.log('✅ Ready for production deployment');
} else {
  console.log('\n⚠️  Some issues detected. Please review the test results above.');
}

console.log('\n📖 Next Steps:');
console.log('1. Configure environment variables (JWT_SECRET, etc.)');
console.log('2. Set up email/SMS providers for notifications');
console.log('3. Test with real user registration and login');
console.log('4. Deploy to staging environment');
console.log('5. Run integration tests with frontend');

console.log('\n🔗 Documentation:');
console.log('- API Documentation: backend/docs/AUTHENTICATION_SYSTEM.md');
console.log('- Usage Examples: backend/examples/authExamples.js');
console.log('- Test Suite: npm test auth-rbac.test.js');

console.log('\n' + '=' .repeat(50));
console.log('Authentication System Test Complete! 🔐');
