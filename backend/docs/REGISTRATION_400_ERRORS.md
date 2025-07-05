# HTTP 400 Error Analysis - Registration System

## Overview
This document analyzes common causes of HTTP 400 (Bad Request) errors in the registration flow and provides solutions for each scenario.

## Common Causes of HTTP 400 Errors

### 1. Missing Required Fields
**Cause**: Client fails to provide mandatory fields
**Examples**:
- Missing `firstName`, `lastName`, `email`, or `password`
- Missing `licenseNumber` for advocate registration
- Empty string values for required fields

**Error Response**:
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Missing required fields",
  "details": {
    "missingFields": ["firstName", "email"],
    "code": "MISSING_REQUIRED_FIELDS"
  }
}
```

### 2. Invalid Email Format
**Cause**: Email doesn't match valid email pattern
**Examples**:
- `invalid-email` (missing @ and domain)
- `user@` (incomplete domain)
- `@domain.com` (missing username)
- `user@domain` (missing TLD)

**Error Response**:
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid email format",
  "details": {
    "field": "email",
    "value": "invalid-email",
    "code": "INVALID_EMAIL_FORMAT"
  }
}
```

### 3. Weak Password
**Cause**: Password doesn't meet security requirements
**Examples**:
- Too short (< 8 characters)
- Missing uppercase letters
- Missing lowercase letters
- Missing numbers
- Missing special characters
- Common passwords (123456, password, etc.)

**Error Response**:
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Password does not meet security requirements",
  "details": {
    "field": "password",
    "requirements": {
      "minLength": 8,
      "requireUppercase": true,
      "requireLowercase": true,
      "requireNumbers": true,
      "requireSpecialChars": true
    },
    "violations": ["TOO_SHORT", "MISSING_UPPERCASE"],
    "code": "WEAK_PASSWORD"
  }
}
```

### 4. Invalid JSON Format
**Cause**: Malformed JSON in request body
**Examples**:
- Missing quotes around keys
- Trailing commas
- Unclosed brackets/braces
- Invalid escape sequences

**Error Response**:
```json
{
  "success": false,
  "error": "PARSE_ERROR",
  "message": "Invalid JSON format in request body",
  "details": {
    "position": 45,
    "code": "INVALID_JSON"
  }
}
```

### 5. Field Length Violations
**Cause**: Field values exceed maximum allowed length
**Examples**:
- `firstName` > 50 characters
- `lastName` > 50 characters
- `phone` > 20 characters

**Error Response**:
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Field length validation failed",
  "details": {
    "field": "firstName",
    "maxLength": 50,
    "actualLength": 75,
    "code": "FIELD_TOO_LONG"
  }
}
```

### 6. Invalid Role
**Cause**: Role field contains invalid value
**Examples**:
- Role not in ['client', 'advocate', 'admin']
- Null or undefined role

**Error Response**:
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid role specified",
  "details": {
    "field": "role",
    "value": "invalid_role",
    "allowedValues": ["client", "advocate", "admin"],
    "code": "INVALID_ROLE"
  }
}
```

### 7. Duplicate Email
**Cause**: Email already exists in database
**Error Response**:
```json
{
  "success": false,
  "error": "CONFLICT_ERROR",
  "message": "Email address already registered",
  "details": {
    "field": "email",
    "code": "EMAIL_ALREADY_EXISTS"
  }
}
```

### 8. Invalid Phone Number
**Cause**: Phone number format is invalid
**Examples**:
- Contains non-numeric characters (except +, -, spaces)
- Too short or too long
- Invalid country code

**Error Response**:
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid phone number format",
  "details": {
    "field": "phone",
    "value": "invalid-phone",
    "expectedFormat": "+[country_code][number]",
    "code": "INVALID_PHONE_FORMAT"
  }
}
```

### 9. Missing Content-Type Header
**Cause**: Request missing or incorrect Content-Type header
**Error Response**:
```json
{
  "success": false,
  "error": "HEADER_ERROR",
  "message": "Missing or invalid Content-Type header",
  "details": {
    "expected": "application/json",
    "received": "text/plain",
    "code": "INVALID_CONTENT_TYPE"
  }
}
```

### 10. Advocate-Specific Validation Errors
**Cause**: Missing or invalid advocate-specific fields
**Examples**:
- Missing `licenseNumber`
- Invalid `experience` (negative number)
- Empty `specialization` array

**Error Response**:
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Advocate registration validation failed",
  "details": {
    "missingFields": ["licenseNumber"],
    "invalidFields": {
      "experience": "Must be a positive number"
    },
    "code": "ADVOCATE_VALIDATION_FAILED"
  }
}
```

## Error Response Standards

### Standard Error Format
All 400 errors should follow this format:
```json
{
  "success": false,
  "error": "ERROR_TYPE",
  "message": "Human-readable error message",
  "details": {
    "field": "fieldName",
    "code": "SPECIFIC_ERROR_CODE",
    "additionalInfo": "..."
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestId": "uuid-v4"
}
```

### Error Types
- `VALIDATION_ERROR`: Field validation failures
- `PARSE_ERROR`: JSON parsing issues
- `CONFLICT_ERROR`: Resource conflicts (duplicate email)
- `HEADER_ERROR`: Missing or invalid headers

### HTTP Status Codes
- `400`: Bad Request (validation errors, malformed requests)
- `409`: Conflict (duplicate resources)
- `422`: Unprocessable Entity (valid JSON but invalid data)

## Prevention Strategies

### Client-Side
1. Implement real-time validation
2. Use proper form validation libraries
3. Validate before sending requests
4. Handle network errors gracefully

### Server-Side
1. Comprehensive input validation
2. Sanitize all inputs
3. Use validation middleware
4. Implement rate limiting
5. Log all validation errors for monitoring

## Testing Scenarios

### Unit Tests
- Test each validation rule individually
- Test edge cases and boundary conditions
- Test error message formatting

### Integration Tests
- Test complete registration flow
- Test various invalid input combinations
- Test error response consistency

### Load Tests
- Test validation performance under load
- Test error handling with concurrent requests
