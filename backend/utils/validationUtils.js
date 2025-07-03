// Validation utilities for LegalPro v1.0.1
const validator = require('validator');

/**
 * Email validation utility
 * @param {string} email - Email to validate
 * @returns {object} - Validation result with isValid and errors
 */
const validateEmail = (email) => {
  const result = {
    isValid: true,
    errors: []
  };

  if (!email) {
    result.isValid = false;
    result.errors.push({
      code: 'EMAIL_REQUIRED',
      message: 'Email is required'
    });
    return result;
  }

  if (typeof email !== 'string') {
    result.isValid = false;
    result.errors.push({
      code: 'EMAIL_INVALID_TYPE',
      message: 'Email must be a string'
    });
    return result;
  }

  // Trim and convert to lowercase
  email = email.trim().toLowerCase();

  // Check if email is empty after trimming
  if (!email) {
    result.isValid = false;
    result.errors.push({
      code: 'EMAIL_EMPTY',
      message: 'Email cannot be empty'
    });
    return result;
  }

  // Validate email format using validator library
  if (!validator.isEmail(email)) {
    result.isValid = false;
    result.errors.push({
      code: 'EMAIL_INVALID_FORMAT',
      message: 'Please provide a valid email address'
    });
    return result;
  }

  // Additional custom validations
  const emailParts = email.split('@');
  const localPart = emailParts[0];
  const domain = emailParts[1];

  // Check local part length
  if (localPart.length > 64) {
    result.isValid = false;
    result.errors.push({
      code: 'EMAIL_LOCAL_TOO_LONG',
      message: 'Email local part cannot exceed 64 characters'
    });
  }

  // Check domain length
  if (domain.length > 253) {
    result.isValid = false;
    result.errors.push({
      code: 'EMAIL_DOMAIN_TOO_LONG',
      message: 'Email domain cannot exceed 253 characters'
    });
  }

  // Check for consecutive dots
  if (email.includes('..')) {
    result.isValid = false;
    result.errors.push({
      code: 'EMAIL_CONSECUTIVE_DOTS',
      message: 'Email cannot contain consecutive dots'
    });
  }

  return result;
};

/**
 * Password strength validation utility
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with isValid, errors, and strength score
 */
const validatePassword = (password) => {
  const result = {
    isValid: true,
    errors: [],
    strength: 0,
    strengthLevel: 'weak'
  };

  if (!password) {
    result.isValid = false;
    result.errors.push({
      code: 'PASSWORD_REQUIRED',
      message: 'Password is required'
    });
    return result;
  }

  if (typeof password !== 'string') {
    result.isValid = false;
    result.errors.push({
      code: 'PASSWORD_INVALID_TYPE',
      message: 'Password must be a string'
    });
    return result;
  }

  // Minimum length check
  if (password.length < 8) {
    result.isValid = false;
    result.errors.push({
      code: 'PASSWORD_TOO_SHORT',
      message: 'Password must be at least 8 characters long'
    });
  } else {
    result.strength += 1;
  }

  // Maximum length check
  if (password.length > 128) {
    result.isValid = false;
    result.errors.push({
      code: 'PASSWORD_TOO_LONG',
      message: 'Password cannot exceed 128 characters'
    });
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push({
      code: 'PASSWORD_MISSING_UPPERCASE',
      message: 'Password must contain at least one uppercase letter'
    });
  } else {
    result.strength += 1;
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push({
      code: 'PASSWORD_MISSING_LOWERCASE',
      message: 'Password must contain at least one lowercase letter'
    });
  } else {
    result.strength += 1;
  }

  // Check for numbers
  if (!/\d/.test(password)) {
    result.isValid = false;
    result.errors.push({
      code: 'PASSWORD_MISSING_NUMBER',
      message: 'Password must contain at least one number'
    });
  } else {
    result.strength += 1;
  }

  // Check for special characters
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    result.isValid = false;
    result.errors.push({
      code: 'PASSWORD_MISSING_SPECIAL',
      message: 'Password must contain at least one special character'
    });
  } else {
    result.strength += 1;
  }

  // Check for common passwords
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    result.isValid = false;
    result.errors.push({
      code: 'PASSWORD_TOO_COMMON',
      message: 'Password is too common. Please choose a more secure password'
    });
  }

  // Check for sequential characters
  const hasSequential = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789)/i.test(password);
  if (hasSequential) {
    result.strength -= 1;
  }

  // Check for repeated characters
  const hasRepeated = /(.)\1{2,}/.test(password);
  if (hasRepeated) {
    result.strength -= 1;
  }

  // Determine strength level
  if (result.strength >= 4) {
    result.strengthLevel = 'strong';
  } else if (result.strength >= 3) {
    result.strengthLevel = 'medium';
  } else {
    result.strengthLevel = 'weak';
  }

  return result;
};

/**
 * Phone number validation utility
 * @param {string} phone - Phone number to validate
 * @returns {object} - Validation result
 */
const validatePhone = (phone) => {
  const result = {
    isValid: true,
    errors: []
  };

  if (!phone) {
    // Phone is optional, so return valid if not provided
    return result;
  }

  if (typeof phone !== 'string') {
    result.isValid = false;
    result.errors.push({
      code: 'PHONE_INVALID_TYPE',
      message: 'Phone number must be a string'
    });
    return result;
  }

  // Remove all spaces, dashes, and parentheses for validation
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  // Basic phone number validation - must be 10-15 digits with optional + prefix
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;

  if (!phoneRegex.test(cleanPhone)) {
    result.isValid = false;
    result.errors.push({
      code: 'PHONE_INVALID_FORMAT',
      message: 'Please provide a valid phone number (10-15 digits with optional + prefix)'
    });
  }

  return result;
};

/**
 * Name validation utility (for firstName and lastName)
 * @param {string} name - Name to validate
 * @param {string} fieldName - Field name for error messages
 * @returns {object} - Validation result
 */
const validateName = (name, fieldName = 'name') => {
  const result = {
    isValid: true,
    errors: []
  };

  if (!name) {
    result.isValid = false;
    result.errors.push({
      code: `${fieldName.toUpperCase()}_REQUIRED`,
      message: `${fieldName} is required`
    });
    return result;
  }

  if (typeof name !== 'string') {
    result.isValid = false;
    result.errors.push({
      code: `${fieldName.toUpperCase()}_INVALID_TYPE`,
      message: `${fieldName} must be a string`
    });
    return result;
  }

  const trimmedName = name.trim();

  if (!trimmedName) {
    result.isValid = false;
    result.errors.push({
      code: `${fieldName.toUpperCase()}_EMPTY`,
      message: `${fieldName} cannot be empty`
    });
    return result;
  }

  if (trimmedName.length < 2) {
    result.isValid = false;
    result.errors.push({
      code: `${fieldName.toUpperCase()}_TOO_SHORT`,
      message: `${fieldName} must be at least 2 characters long`
    });
  }

  if (trimmedName.length > 50) {
    result.isValid = false;
    result.errors.push({
      code: `${fieldName.toUpperCase()}_TOO_LONG`,
      message: `${fieldName} cannot exceed 50 characters`
    });
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
    result.isValid = false;
    result.errors.push({
      code: `${fieldName.toUpperCase()}_INVALID_CHARACTERS`,
      message: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`
    });
  }

  return result;
};

/**
 * Role validation utility
 * @param {string} role - Role to validate
 * @returns {object} - Validation result
 */
const validateRole = (role) => {
  const result = {
    isValid: true,
    errors: []
  };

  const validRoles = ['client', 'advocate', 'admin'];

  if (!role) {
    // Role is optional, defaults to 'client'
    return result;
  }

  if (typeof role !== 'string') {
    result.isValid = false;
    result.errors.push({
      code: 'ROLE_INVALID_TYPE',
      message: 'Role must be a string'
    });
    return result;
  }

  if (!validRoles.includes(role)) {
    result.isValid = false;
    result.errors.push({
      code: 'ROLE_INVALID_VALUE',
      message: `Role must be one of: ${validRoles.join(', ')}`
    });
  }

  return result;
};

/**
 * License number validation utility
 * @param {string} licenseNumber - License number to validate
 * @returns {object} - Validation result
 */
const validateLicenseNumber = (licenseNumber) => {
  const result = {
    isValid: true,
    errors: []
  };

  if (!licenseNumber) {
    result.isValid = false;
    result.errors.push({
      code: 'LICENSE_NUMBER_REQUIRED',
      message: 'License number is required for advocates'
    });
    return result;
  }

  if (typeof licenseNumber !== 'string') {
    result.isValid = false;
    result.errors.push({
      code: 'LICENSE_NUMBER_INVALID_TYPE',
      message: 'License number must be a string'
    });
    return result;
  }

  const trimmedLicense = licenseNumber.trim();

  if (!trimmedLicense) {
    result.isValid = false;
    result.errors.push({
      code: 'LICENSE_NUMBER_EMPTY',
      message: 'License number cannot be empty'
    });
    return result;
  }

  if (trimmedLicense.length < 5) {
    result.isValid = false;
    result.errors.push({
      code: 'LICENSE_NUMBER_TOO_SHORT',
      message: 'License number must be at least 5 characters long'
    });
  }

  if (trimmedLicense.length > 20) {
    result.isValid = false;
    result.errors.push({
      code: 'LICENSE_NUMBER_TOO_LONG',
      message: 'License number cannot exceed 20 characters'
    });
  }

  // Check for valid format (alphanumeric with optional hyphens and slashes)
  if (!/^[a-zA-Z0-9\-\/]+$/.test(trimmedLicense)) {
    result.isValid = false;
    result.errors.push({
      code: 'LICENSE_NUMBER_INVALID_FORMAT',
      message: 'License number can only contain letters, numbers, hyphens, and forward slashes'
    });
  }

  return result;
};

/**
 * Experience validation utility
 * @param {number} experience - Years of experience
 * @returns {object} - Validation result
 */
const validateExperience = (experience) => {
  const result = {
    isValid: true,
    errors: []
  };

  if (experience === undefined || experience === null) {
    // Experience is optional
    return result;
  }

  if (typeof experience !== 'number') {
    result.isValid = false;
    result.errors.push({
      code: 'EXPERIENCE_INVALID_TYPE',
      message: 'Experience must be a number'
    });
    return result;
  }

  if (experience < 0) {
    result.isValid = false;
    result.errors.push({
      code: 'EXPERIENCE_NEGATIVE',
      message: 'Experience cannot be negative'
    });
  }

  if (experience > 70) {
    result.isValid = false;
    result.errors.push({
      code: 'EXPERIENCE_TOO_HIGH',
      message: 'Experience cannot exceed 70 years'
    });
  }

  if (!Number.isInteger(experience)) {
    result.isValid = false;
    result.errors.push({
      code: 'EXPERIENCE_NOT_INTEGER',
      message: 'Experience must be a whole number'
    });
  }

  return result;
};

/**
 * Specialization validation utility
 * @param {array} specialization - Array of specializations
 * @returns {object} - Validation result
 */
const validateSpecialization = (specialization) => {
  const result = {
    isValid: true,
    errors: []
  };

  if (!specialization) {
    // Specialization is optional
    return result;
  }

  if (!Array.isArray(specialization)) {
    result.isValid = false;
    result.errors.push({
      code: 'SPECIALIZATION_INVALID_TYPE',
      message: 'Specialization must be an array'
    });
    return result;
  }

  const validSpecializations = [
    'Family Law',
    'Corporate Law',
    'Criminal Defense',
    'Property Law',
    'Employment Law',
    'Constitutional Law',
    'Tax Law',
    'Immigration Law',
    'Intellectual Property',
    'Environmental Law',
    'Personal Injury',
    'Contract Law',
    'Banking Law',
    'Insurance Law',
    'Human Rights'
  ];

  for (let i = 0; i < specialization.length; i++) {
    const spec = specialization[i];

    if (typeof spec !== 'string') {
      result.isValid = false;
      result.errors.push({
        code: 'SPECIALIZATION_ITEM_INVALID_TYPE',
        message: `Specialization item at index ${i} must be a string`
      });
      continue;
    }

    if (!validSpecializations.includes(spec)) {
      result.isValid = false;
      result.errors.push({
        code: 'SPECIALIZATION_INVALID_VALUE',
        message: `Invalid specialization: ${spec}. Must be one of: ${validSpecializations.join(', ')}`
      });
    }
  }

  if (specialization.length > 5) {
    result.isValid = false;
    result.errors.push({
      code: 'SPECIALIZATION_TOO_MANY',
      message: 'Cannot have more than 5 specializations'
    });
  }

  return result;
};

/**
 * Comprehensive registration validation
 * @param {object} userData - User data to validate
 * @returns {object} - Validation result with all errors
 */
const validateRegistrationData = (userData) => {
  const result = {
    isValid: true,
    errors: [],
    fieldErrors: {}
  };

  // Validate required fields
  const firstNameValidation = validateName(userData.firstName, 'firstName');
  if (!firstNameValidation.isValid) {
    result.isValid = false;
    result.fieldErrors.firstName = firstNameValidation.errors;
    result.errors.push(...firstNameValidation.errors);
  }

  const lastNameValidation = validateName(userData.lastName, 'lastName');
  if (!lastNameValidation.isValid) {
    result.isValid = false;
    result.fieldErrors.lastName = lastNameValidation.errors;
    result.errors.push(...lastNameValidation.errors);
  }

  const emailValidation = validateEmail(userData.email);
  if (!emailValidation.isValid) {
    result.isValid = false;
    result.fieldErrors.email = emailValidation.errors;
    result.errors.push(...emailValidation.errors);
  }

  const passwordValidation = validatePassword(userData.password);
  if (!passwordValidation.isValid) {
    result.isValid = false;
    result.fieldErrors.password = passwordValidation.errors;
    result.errors.push(...passwordValidation.errors);
  }

  // Validate optional fields
  if (userData.phone) {
    const phoneValidation = validatePhone(userData.phone);
    if (!phoneValidation.isValid) {
      result.isValid = false;
      result.fieldErrors.phone = phoneValidation.errors;
      result.errors.push(...phoneValidation.errors);
    }
  }

  const roleValidation = validateRole(userData.role);
  if (!roleValidation.isValid) {
    result.isValid = false;
    result.fieldErrors.role = roleValidation.errors;
    result.errors.push(...roleValidation.errors);
  }

  // Validate advocate-specific fields
  if (userData.role === 'advocate') {
    const licenseValidation = validateLicenseNumber(userData.licenseNumber);
    if (!licenseValidation.isValid) {
      result.isValid = false;
      result.fieldErrors.licenseNumber = licenseValidation.errors;
      result.errors.push(...licenseValidation.errors);
    }

    if (userData.experience !== undefined) {
      const experienceValidation = validateExperience(userData.experience);
      if (!experienceValidation.isValid) {
        result.isValid = false;
        result.fieldErrors.experience = experienceValidation.errors;
        result.errors.push(...experienceValidation.errors);
      }
    }

    if (userData.specialization) {
      const specializationValidation = validateSpecialization(userData.specialization);
      if (!specializationValidation.isValid) {
        result.isValid = false;
        result.fieldErrors.specialization = specializationValidation.errors;
        result.errors.push(...specializationValidation.errors);
      }
    }
  }

  return result;
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  validateName,
  validateRole,
  validateLicenseNumber,
  validateExperience,
  validateSpecialization,
  validateRegistrationData
};
