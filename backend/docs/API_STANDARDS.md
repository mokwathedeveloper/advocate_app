# API Standards Compliance - LegalPro v1.0.1

## Overview
This document outlines the API standards implemented in the LegalPro registration system and ensures compliance with common REST API conventions.

## HTTP Status Codes

### Success Responses
- **200 OK**: Successful GET, PUT, PATCH requests
- **201 Created**: Successful POST requests that create new resources
- **204 No Content**: Successful DELETE requests

### Client Error Responses (4xx)
- **400 Bad Request**: Validation errors, malformed requests, invalid JSON
- **401 Unauthorized**: Authentication failures, invalid credentials
- **403 Forbidden**: Authorization failures, insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflicts (duplicate email, license number)
- **422 Unprocessable Entity**: Valid JSON but invalid business logic
- **429 Too Many Requests**: Rate limiting exceeded

### Server Error Responses (5xx)
- **500 Internal Server Error**: Unexpected server errors
- **502 Bad Gateway**: Upstream service failures
- **503 Service Unavailable**: Temporary service unavailability

## Response Format Standards

### Success Response Format
```json
{
  "success": true,
  "message": "Human-readable success message",
  "data": {
    // Response data object or array
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestId": "uuid-v4-string"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "ERROR_TYPE",
  "message": "Human-readable error message",
  "details": {
    "code": "SPECIFIC_ERROR_CODE",
    "field": "fieldName", // For field-specific errors
    "errors": [], // Array of detailed errors
    "fieldErrors": {} // Object with field-specific error arrays
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestId": "uuid-v4-string"
}
```

### Paginated Response Format
```json
{
  "success": true,
  "message": "Success message",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestId": "uuid-v4-string"
}
```

## Registration Endpoint Standards

### POST /api/auth/register

#### Success Response (201 Created)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "jwt-token-string",
    "user": {
      "id": "user-id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "client",
      "isActive": true,
      "isVerified": true,
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestId": "uuid-v4-string"
}
```

#### Validation Error Response (400 Bad Request)
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Registration validation failed",
  "details": {
    "errors": [
      {
        "field": "email",
        "message": "Please provide a valid email address",
        "code": "EMAIL_INVALID_FORMAT"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters long",
        "code": "PASSWORD_TOO_SHORT"
      }
    ],
    "fieldErrors": {
      "email": [
        {
          "field": "email",
          "message": "Please provide a valid email address",
          "code": "EMAIL_INVALID_FORMAT"
        }
      ],
      "password": [
        {
          "field": "password",
          "message": "Password must be at least 8 characters long",
          "code": "PASSWORD_TOO_SHORT"
        }
      ]
    },
    "code": "REGISTRATION_VALIDATION_FAILED"
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestId": "uuid-v4-string"
}
```

#### Conflict Error Response (409 Conflict)
```json
{
  "success": false,
  "error": "CONFLICT_ERROR",
  "message": "Email address already registered",
  "details": {
    "field": "email",
    "code": "EMAIL_ALREADY_EXISTS"
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestId": "uuid-v4-string"
}
```

### POST /api/auth/login

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token-string",
    "user": {
      "id": "user-id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "client",
      "lastLogin": "2024-01-01T12:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestId": "uuid-v4-string"
}
```

#### Authentication Error Response (401 Unauthorized)
```json
{
  "success": false,
  "error": "AUTHENTICATION_ERROR",
  "message": "Invalid email or password",
  "details": {
    "code": "INVALID_CREDENTIALS"
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestId": "uuid-v4-string"
}
```

## Error Code Standards

### Validation Error Codes
- `VALIDATION_FAILED`: General validation failure
- `EMAIL_REQUIRED`: Email field is required
- `EMAIL_INVALID_FORMAT`: Email format is invalid
- `EMAIL_ALREADY_EXISTS`: Email already registered
- `PASSWORD_REQUIRED`: Password field is required
- `PASSWORD_TOO_SHORT`: Password below minimum length
- `PASSWORD_TOO_WEAK`: Password doesn't meet strength requirements
- `FIRSTNAME_REQUIRED`: First name is required
- `LASTNAME_REQUIRED`: Last name is required
- `LICENSE_NUMBER_REQUIRED`: License number required for advocates
- `LICENSE_NUMBER_ALREADY_EXISTS`: License number already registered

### Authentication Error Codes
- `INVALID_CREDENTIALS`: Invalid email or password
- `ACCOUNT_DEACTIVATED`: User account is deactivated
- `ACCOUNT_PENDING_VERIFICATION`: Advocate account pending verification
- `TOKEN_INVALID`: JWT token is invalid or expired
- `TOKEN_MISSING`: Authorization token is missing

### System Error Codes
- `INVALID_JSON`: Malformed JSON in request body
- `INVALID_CONTENT_TYPE`: Missing or incorrect Content-Type header
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SERVER_ERROR`: Internal server error
- `DATABASE_ERROR`: Database operation failed

## Request Standards

### Required Headers
- `Content-Type: application/json` for POST, PUT, PATCH requests
- `Authorization: Bearer <token>` for protected endpoints

### Request Body Validation
- All request bodies must be valid JSON
- Required fields must be present and non-empty
- Field types must match expected types
- Field lengths must be within specified limits
- Email addresses must be valid format
- Passwords must meet security requirements

## Response Standards

### Required Fields
All responses must include:
- `success`: Boolean indicating success/failure
- `timestamp`: ISO 8601 timestamp
- `requestId`: Unique identifier for request tracking

Success responses must include:
- `message`: Human-readable success message
- `data`: Response data (can be null)

Error responses must include:
- `error`: Error type/category
- `message`: Human-readable error message
- `details`: Object with error details and codes

### Data Sanitization
- Passwords are never included in responses
- Sensitive fields are filtered based on user permissions
- Email addresses are normalized to lowercase
- Names are trimmed of whitespace

## Security Standards

### Authentication
- JWT tokens with configurable expiration
- Secure password hashing with bcrypt
- Account verification for advocates
- Account deactivation support

### Validation
- Server-side validation for all inputs
- SQL injection prevention
- XSS protection
- CSRF protection for state-changing operations

### Rate Limiting
- 100 requests per 15 minutes per IP
- Configurable rate limits per endpoint
- Proper 429 responses with retry-after headers

## Monitoring and Logging

### Request Tracking
- Unique request IDs for all requests
- Request/response logging in development
- Error logging with stack traces
- Performance monitoring

### Error Handling
- Graceful error handling for all scenarios
- Consistent error response format
- Proper HTTP status codes
- Detailed error messages for debugging

## Compliance Checklist

### ✅ HTTP Status Codes
- [x] 200 for successful GET/PUT/PATCH
- [x] 201 for successful POST (creation)
- [x] 400 for validation errors
- [x] 401 for authentication failures
- [x] 403 for authorization failures
- [x] 404 for not found
- [x] 409 for conflicts
- [x] 429 for rate limiting
- [x] 500 for server errors

### ✅ Response Format
- [x] Consistent success response format
- [x] Consistent error response format
- [x] Required fields in all responses
- [x] Proper data types
- [x] ISO 8601 timestamps
- [x] UUID request IDs

### ✅ Validation
- [x] Server-side validation
- [x] Field-specific error messages
- [x] Proper error codes
- [x] Input sanitization
- [x] Type checking

### ✅ Security
- [x] Password hashing
- [x] JWT authentication
- [x] Input validation
- [x] Rate limiting
- [x] CORS protection

### ✅ Documentation
- [x] API endpoint documentation
- [x] Error code documentation
- [x] Response format examples
- [x] Request/response schemas

---

*Last Updated: July 1, 2025 - LegalPro v1.0.1*
*API Standards Compliance Documentation*
