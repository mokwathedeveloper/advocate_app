# 🔐 LegalPro Authentication System Documentation

## Overview

The LegalPro Authentication System is a comprehensive JWT-based authentication solution with Role-Based Access Control (RBAC). It provides secure user authentication, authorization, and session management for the legal case management platform.

## 🏗️ Architecture

### Core Components

1. **JWT Authentication** - Stateless token-based authentication
2. **RBAC (Role-Based Access Control)** - Fine-grained permission system
3. **Account Security** - Password policies, account lockout, session management
4. **Token Management** - Access tokens, refresh tokens, token rotation

### User Roles Hierarchy

```
Super Admin (Level 5) - Full system access
    ↓
Admin (Level 4) - User and system management
    ↓
Advocate (Level 3) - Case and client management
    ↓
Staff (Level 2) - Limited operational access
    ↓
Client (Level 1) - Personal data access only
```

## 🔑 Authentication Flow

### 1. User Registration

```javascript
POST /api/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "phone": "+254712345678",
  "role": "client"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "client",
      "isActive": true,
      "isVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": "7d"
    }
  }
}
```

### 2. User Login

```javascript
POST /api/auth/enhanced-login
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "rememberMe": false
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": "7d"
    },
    "permissions": [
      "case:read",
      "appointment:create",
      "payment:read",
      // ... user permissions
    ]
  }
}
```

### 3. Token Refresh

```javascript
POST /api/auth/refresh-token
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## 🛡️ Authorization & Permissions

### Permission-Based Authorization

```javascript
// Middleware usage examples
const { authenticate, authorize } = require('../middleware/auth');
const { RESOURCE_PERMISSIONS } = require('../config/auth');

// Require specific permission
router.get('/cases', 
  authenticate, 
  authorize([RESOURCE_PERMISSIONS.CASES.READ]),
  getCases
);

// Require multiple permissions (any)
router.post('/cases', 
  authenticate, 
  authorize([
    RESOURCE_PERMISSIONS.CASES.CREATE,
    RESOURCE_PERMISSIONS.CASES.UPDATE
  ]),
  createCase
);

// Require all permissions
router.delete('/cases/:id', 
  authenticate, 
  authorize([
    RESOURCE_PERMISSIONS.CASES.DELETE,
    RESOURCE_PERMISSIONS.SYSTEM.ADMIN
  ], { requireAll: true }),
  deleteCase
);
```

### Role-Based Authorization

```javascript
const { requireRole, requireMinimumRole } = require('../middleware/auth');
const { USER_ROLES } = require('../config/auth');

// Require specific role(s)
router.get('/admin/users', 
  authenticate, 
  requireRole([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]),
  getUsers
);

// Require minimum role level
router.put('/users/:id/verify', 
  authenticate, 
  requireMinimumRole(USER_ROLES.ADMIN),
  verifyUser
);
```

### Resource Ownership

```javascript
const { requireOwnershipOrAdmin } = require('../middleware/auth');

// Allow access to own resources or admin override
router.get('/users/:id', 
  authenticate, 
  requireOwnershipOrAdmin('id', 'userId'),
  getUserProfile
);
```

## 🔒 Security Features

### Password Security

- **Minimum Length**: 8 characters
- **Complexity Requirements**: 
  - Uppercase letters
  - Lowercase letters
  - Numbers
  - Special characters (@$!%*?&)
- **Password Hashing**: bcrypt with 12 salt rounds
- **Password History**: Prevents reuse of last 5 passwords

### Account Lockout

- **Max Login Attempts**: 5 failed attempts
- **Lockout Duration**: 15 minutes
- **Progressive Lockout**: Increases with repeated violations

### Session Management

- **Max Concurrent Sessions**: 3 per user
- **Session Timeout**: 24 hours
- **Token Rotation**: Optional refresh token rotation
- **Remember Me**: 30-day extended sessions

## 📋 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login (legacy) |
| POST | `/api/auth/enhanced-login` | Enhanced login with security features |
| POST | `/api/auth/refresh-token` | Refresh access token |
| POST | `/api/auth/forgot-password` | Request password reset |
| PUT | `/api/auth/reset-password/:token` | Reset password |

### Protected Endpoints

| Method | Endpoint | Description | Required Permission |
|--------|----------|-------------|-------------------|
| GET | `/api/auth/me` | Get current user profile | Authenticated |
| PUT | `/api/auth/update-details` | Update profile | Authenticated |
| PUT | `/api/auth/update-password` | Change password | Authenticated |
| POST | `/api/auth/logout` | Logout current session | Authenticated |
| POST | `/api/auth/logout-all` | Logout all sessions | Authenticated |
| GET | `/api/auth/permissions` | Get user permissions | Authenticated |

### Admin Endpoints

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET | `/api/auth/users` | List all users | Admin+ |
| GET | `/api/auth/users/:id` | Get user by ID | Admin+ or Owner |
| PUT | `/api/auth/users/:id/role` | Update user role | Super Admin |
| PUT | `/api/auth/users/:id/status` | Update account status | Admin+ |
| POST | `/api/auth/verify-advocate/:id` | Verify advocate | Admin+ |

## 🧪 Testing

### Running Tests

```bash
# Run all authentication tests
npm test auth.test.js

# Run with coverage
npm test -- --coverage auth.test.js
```

### Test Coverage

- ✅ User Registration (valid/invalid data)
- ✅ User Login (credentials, lockout, remember me)
- ✅ Token Management (refresh, logout, expiration)
- ✅ Protected Routes (authentication, authorization)
- ✅ RBAC Helper Functions
- ✅ Permission Checking
- ✅ Role Validation
- ✅ Account Security Features

## 🔧 Configuration

### Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
JWT_ISSUER=legalpro-api
JWT_AUDIENCE=legalpro-client

# Security Settings
REQUIRE_EMAIL_VERIFICATION=false
REFRESH_TOKEN_ROTATION=true
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=900000
PASSWORD_MIN_LENGTH=8

# Session Management
MAX_CONCURRENT_SESSIONS=3
SESSION_TIMEOUT=86400000
REMEMBER_ME_DURATION=2592000000
```

### Role Permissions Configuration

```javascript
// config/auth.js
const ROLE_PERMISSIONS = {
  [USER_ROLES.CLIENT]: [
    'case:read',
    'appointment:create', 
    'appointment:read',
    'payment:create', 
    'payment:read',
    'document:read', 
    'document:upload',
    'profile:read', 
    'profile:update'
  ],
  [USER_ROLES.ADVOCATE]: [
    'case:create', 
    'case:read', 
    'case:update',
    'appointment:create', 
    'appointment:read', 
    'appointment:update',
    'payment:read', 
    'payment:update',
    'document:create', 
    'document:read', 
    'document:update',
    'client:read', 
    'client:update',
    'notification:send',
    'report:generate'
  ],
  // ... more roles
};
```

## 🚀 Usage Examples

### Protecting Routes

```javascript
const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { RESOURCE_PERMISSIONS } = require('../config/auth');

const router = express.Router();

// Basic authentication
router.get('/profile', authenticate, getProfile);

// Permission-based authorization
router.post('/cases', 
  authenticate,
  authorize([RESOURCE_PERMISSIONS.CASES.CREATE]),
  createCase
);

// Multiple permissions (any)
router.get('/dashboard',
  authenticate,
  authorize([
    RESOURCE_PERMISSIONS.CASES.READ,
    RESOURCE_PERMISSIONS.APPOINTMENTS.READ
  ]),
  getDashboard
);

// Role-based authorization
router.get('/admin/reports',
  authenticate,
  requireMinimumRole(USER_ROLES.ADMIN),
  getAdminReports
);
```

### Client-Side Token Management

```javascript
// Store tokens securely
localStorage.setItem('accessToken', response.data.tokens.accessToken);
localStorage.setItem('refreshToken', response.data.tokens.refreshToken);

// Add token to requests
const token = localStorage.getItem('accessToken');
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Handle token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      try {
        const response = await axios.post('/api/auth/refresh-token', {
          refreshToken
        });
        
        const newToken = response.data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        // Retry original request
        return axios.request(error.config);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

## 🔍 Troubleshooting

### Common Issues

1. **Token Expired**: Use refresh token to get new access token
2. **Account Locked**: Wait for lockout duration or contact admin
3. **Insufficient Permissions**: Check user role and required permissions
4. **Invalid Token Format**: Ensure Bearer prefix in Authorization header

### Debug Mode

```javascript
// Enable debug logging
process.env.DEBUG = 'auth:*';

// Check token payload
const decoded = authHelpers.verifyToken(token);
console.log('Token payload:', decoded);

// Check user permissions
const permissions = authHelpers.getRolePermissions(user.role);
console.log('User permissions:', permissions);
```

## 📈 Performance Considerations

- **Token Caching**: Implement Redis for token blacklisting
- **Database Indexing**: Index email, phone, and role fields
- **Rate Limiting**: Implement rate limiting on auth endpoints
- **Session Storage**: Consider Redis for session management

## 🔄 Migration Guide

### From Basic Auth to RBAC

1. Update middleware imports
2. Replace role checks with permission checks
3. Update route protection
4. Test all protected endpoints
5. Update client-side token handling

The authentication system is now production-ready with comprehensive security features and RBAC support! 🎉
