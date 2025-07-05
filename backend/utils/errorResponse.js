// Standardized error response utility for LegalPro v1.0.1
const { v4: uuidv4 } = require('uuid');

/**
 * Standard error response class
 */
class ErrorResponse extends Error {
  constructor(message, statusCode, errorType = 'GENERAL_ERROR', details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.requestId = details.requestId || uuidv4();
  }
}

/**
 * Create standardized error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} errorType - Type of error
 * @param {object} details - Additional error details
 * @param {string} requestId - Request ID for tracking
 * @returns {object} - Standardized error response
 */
const createErrorResponse = (message, statusCode, errorType = 'GENERAL_ERROR', details = {}, requestId = null) => {
  return {
    success: false,
    error: errorType,
    message,
    details: {
      ...details,
      code: details.code || errorType
    },
    timestamp: new Date().toISOString(),
    requestId: requestId || uuidv4()
  };
};

/**
 * Create validation error response
 * @param {string} message - Error message
 * @param {array} errors - Array of validation errors
 * @param {object} fieldErrors - Field-specific errors
 * @param {string} requestId - Request ID
 * @returns {object} - Validation error response
 */
const createValidationErrorResponse = (message, errors = [], fieldErrors = {}, requestId = null) => {
  return createErrorResponse(
    message,
    400,
    'VALIDATION_ERROR',
    {
      errors,
      fieldErrors,
      code: 'VALIDATION_FAILED'
    },
    requestId
  );
};

/**
 * Create conflict error response (409)
 * @param {string} message - Error message
 * @param {string} field - Field that caused conflict
 * @param {string} code - Specific error code
 * @param {string} requestId - Request ID
 * @returns {object} - Conflict error response
 */
const createConflictErrorResponse = (message, field, code, requestId = null) => {
  return createErrorResponse(
    message,
    409,
    'CONFLICT_ERROR',
    {
      field,
      code
    },
    requestId
  );
};

/**
 * Create authentication error response (401)
 * @param {string} message - Error message
 * @param {string} code - Specific error code
 * @param {string} requestId - Request ID
 * @returns {object} - Authentication error response
 */
const createAuthErrorResponse = (message, code = 'AUTHENTICATION_FAILED', requestId = null) => {
  return createErrorResponse(
    message,
    401,
    'AUTHENTICATION_ERROR',
    { code },
    requestId
  );
};

/**
 * Create authorization error response (403)
 * @param {string} message - Error message
 * @param {string} code - Specific error code
 * @param {string} requestId - Request ID
 * @returns {object} - Authorization error response
 */
const createAuthorizationErrorResponse = (message, code = 'AUTHORIZATION_FAILED', requestId = null) => {
  return createErrorResponse(
    message,
    403,
    'AUTHORIZATION_ERROR',
    { code },
    requestId
  );
};

/**
 * Create not found error response (404)
 * @param {string} message - Error message
 * @param {string} resource - Resource that was not found
 * @param {string} requestId - Request ID
 * @returns {object} - Not found error response
 */
const createNotFoundErrorResponse = (message, resource = 'resource', requestId = null) => {
  return createErrorResponse(
    message,
    404,
    'NOT_FOUND_ERROR',
    {
      resource,
      code: 'RESOURCE_NOT_FOUND'
    },
    requestId
  );
};

/**
 * Create server error response (500)
 * @param {string} message - Error message
 * @param {string} code - Specific error code
 * @param {object} debugInfo - Debug information (only in development)
 * @param {string} requestId - Request ID
 * @returns {object} - Server error response
 */
const createServerErrorResponse = (message, code = 'INTERNAL_SERVER_ERROR', debugInfo = {}, requestId = null) => {
  const details = { code };
  
  // Only include debug info in development
  if (process.env.NODE_ENV === 'development' && Object.keys(debugInfo).length > 0) {
    details.debug = debugInfo;
  }

  return createErrorResponse(
    message,
    500,
    'SERVER_ERROR',
    details,
    requestId
  );
};

/**
 * Create rate limit error response (429)
 * @param {string} message - Error message
 * @param {number} retryAfter - Seconds to wait before retry
 * @param {string} requestId - Request ID
 * @returns {object} - Rate limit error response
 */
const createRateLimitErrorResponse = (message, retryAfter = 60, requestId = null) => {
  return createErrorResponse(
    message,
    429,
    'RATE_LIMIT_ERROR',
    {
      retryAfter,
      code: 'RATE_LIMIT_EXCEEDED'
    },
    requestId
  );
};

/**
 * Create parse error response (400)
 * @param {string} message - Error message
 * @param {number} position - Position where parsing failed
 * @param {string} requestId - Request ID
 * @returns {object} - Parse error response
 */
const createParseErrorResponse = (message, position = null, requestId = null) => {
  return createErrorResponse(
    message,
    400,
    'PARSE_ERROR',
    {
      position,
      code: 'INVALID_JSON'
    },
    requestId
  );
};

/**
 * Create success response
 * @param {object} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default 200)
 * @param {string} requestId - Request ID
 * @returns {object} - Success response
 */
const createSuccessResponse = (data = null, message = 'Success', statusCode = 200, requestId = null) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    requestId: requestId || uuidv4()
  };

  if (data !== null) {
    response.data = data;
  }

  return response;
};

/**
 * Create paginated success response
 * @param {array} data - Array of data items
 * @param {object} pagination - Pagination info
 * @param {string} message - Success message
 * @param {string} requestId - Request ID
 * @returns {object} - Paginated success response
 */
const createPaginatedSuccessResponse = (data, pagination, message = 'Success', requestId = null) => {
  return {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      total: pagination.total || 0,
      pages: pagination.pages || 0,
      hasNext: pagination.hasNext || false,
      hasPrev: pagination.hasPrev || false
    },
    timestamp: new Date().toISOString(),
    requestId: requestId || uuidv4()
  };
};

/**
 * Handle Mongoose validation errors
 * @param {object} error - Mongoose validation error
 * @param {string} requestId - Request ID
 * @returns {object} - Formatted validation error response
 */
const handleMongooseValidationError = (error, requestId = null) => {
  const errors = [];
  const fieldErrors = {};

  Object.values(error.errors).forEach(err => {
    const fieldError = {
      field: err.path,
      message: err.message,
      code: `${err.path.toUpperCase()}_VALIDATION_FAILED`,
      value: err.value
    };

    errors.push(fieldError);
    
    if (!fieldErrors[err.path]) {
      fieldErrors[err.path] = [];
    }
    fieldErrors[err.path].push(fieldError);
  });

  return createValidationErrorResponse(
    'Validation failed',
    errors,
    fieldErrors,
    requestId
  );
};

/**
 * Handle MongoDB duplicate key errors
 * @param {object} error - MongoDB duplicate key error
 * @param {string} requestId - Request ID
 * @returns {object} - Formatted conflict error response
 */
const handleMongoDuplicateKeyError = (error, requestId = null) => {
  const field = Object.keys(error.keyValue)[0];
  const value = error.keyValue[field];

  let message = 'Duplicate value detected';
  let code = 'DUPLICATE_VALUE';

  if (field === 'email') {
    message = 'Email address already registered';
    code = 'EMAIL_ALREADY_EXISTS';
  } else if (field === 'licenseNumber') {
    message = 'License number already registered';
    code = 'LICENSE_NUMBER_ALREADY_EXISTS';
  }

  return createConflictErrorResponse(message, field, code, requestId);
};

module.exports = {
  ErrorResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createConflictErrorResponse,
  createAuthErrorResponse,
  createAuthorizationErrorResponse,
  createNotFoundErrorResponse,
  createServerErrorResponse,
  createRateLimitErrorResponse,
  createParseErrorResponse,
  createSuccessResponse,
  createPaginatedSuccessResponse,
  handleMongooseValidationError,
  handleMongoDuplicateKeyError
};
