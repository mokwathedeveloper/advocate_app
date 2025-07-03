// Unit tests for validation utilities
const {
  validateEmail,
  validatePassword,
  validatePhone,
  validateName,
  validateRole,
  validateLicenseNumber,
  validateExperience,
  validateSpecialization,
  validateRegistrationData
} = require('../../utils/validationUtils');

describe('Validation Utils', () => {
  
  describe('validateEmail', () => {
    test('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'firstname.lastname@company.com'
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        'user@',
        '@domain.com',
        'user@domain',
        'user..name@domain.com',
        ''
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('should handle missing email', () => {
      const result = validateEmail();
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('EMAIL_REQUIRED');
    });

    test('should handle non-string email', () => {
      const result = validateEmail(123);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('EMAIL_INVALID_TYPE');
    });
  });

  describe('validatePassword', () => {
    test('should validate strong passwords', () => {
      const strongPasswords = [
        'StrongPass123!',
        'MySecure@Password1',
        'Complex#Pass2024'
      ];

      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.strengthLevel).toBe('strong');
      });
    });

    test('should reject weak passwords', () => {
      const weakPasswords = [
        'weak',
        '123456',
        'password',
        'PASSWORD',
        'Pass123',
        'password123'
      ];

      weakPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('should reject common passwords', () => {
      const commonPasswords = ['password', '123456', 'qwerty'];
      
      commonPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(err => err.code === 'PASSWORD_TOO_COMMON')).toBe(true);
      });
    });

    test('should handle missing password', () => {
      const result = validatePassword();
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('PASSWORD_REQUIRED');
    });
  });

  describe('validatePhone', () => {
    test('should validate correct phone numbers', () => {
      const validPhones = [
        '+12345678901',
        '+254712345678',
        '+447123456789',
        '+919876543210'
      ];

      validPhones.forEach(phone => {
        const result = validatePhone(phone);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('should handle optional phone number', () => {
      const result = validatePhone();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid phone numbers', () => {
      const invalidPhones = [
        'invalid-phone',
        '123',
        'abcdefghij'
      ];

      invalidPhones.forEach(phone => {
        const result = validatePhone(phone);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateName', () => {
    test('should validate correct names', () => {
      const validNames = [
        'John',
        'Mary-Jane',
        "O'Connor",
        'Jean-Pierre'
      ];

      validNames.forEach(name => {
        const result = validateName(name, 'firstName');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('should reject invalid names', () => {
      const invalidNames = [
        '',
        'A',
        'John123',
        'Name@Domain',
        'A'.repeat(51) // Too long
      ];

      invalidNames.forEach(name => {
        const result = validateName(name, 'firstName');
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('should handle missing name', () => {
      const result = validateName(null, 'firstName');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('FIRSTNAME_REQUIRED');
    });
  });

  describe('validateRole', () => {
    test('should validate correct roles', () => {
      const validRoles = ['client', 'advocate', 'admin'];

      validRoles.forEach(role => {
        const result = validateRole(role);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('should handle optional role', () => {
      const result = validateRole();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid roles', () => {
      const invalidRoles = ['invalid', 'user', 'superuser'];

      invalidRoles.forEach(role => {
        const result = validateRole(role);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].code).toBe('ROLE_INVALID_VALUE');
      });
    });
  });

  describe('validateLicenseNumber', () => {
    test('should validate correct license numbers', () => {
      const validLicenses = [
        'LAW123456',
        'ADV-2024-001',
        'BAR/2023/456'
      ];

      validLicenses.forEach(license => {
        const result = validateLicenseNumber(license);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('should reject invalid license numbers', () => {
      const invalidLicenses = [
        '',
        'ABC',
        'LICENSE@123',
        'A'.repeat(21) // Too long
      ];

      invalidLicenses.forEach(license => {
        const result = validateLicenseNumber(license);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('should handle missing license number', () => {
      const result = validateLicenseNumber();
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('LICENSE_NUMBER_REQUIRED');
    });
  });

  describe('validateExperience', () => {
    test('should validate correct experience values', () => {
      const validExperience = [0, 5, 25, 50];

      validExperience.forEach(exp => {
        const result = validateExperience(exp);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('should handle optional experience', () => {
      const result = validateExperience();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid experience values', () => {
      const invalidExperience = [-1, 71, 5.5, 'five'];

      invalidExperience.forEach(exp => {
        const result = validateExperience(exp);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateSpecialization', () => {
    test('should validate correct specializations', () => {
      const validSpecs = [
        ['Family Law'],
        ['Corporate Law', 'Tax Law'],
        ['Criminal Defense', 'Family Law', 'Property Law']
      ];

      validSpecs.forEach(spec => {
        const result = validateSpecialization(spec);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('should handle optional specialization', () => {
      const result = validateSpecialization();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid specializations', () => {
      const invalidSpecs = [
        ['Invalid Law'],
        ['Family Law', 'Corporate Law', 'Tax Law', 'Criminal Defense', 'Property Law', 'Employment Law'], // Too many
        'Family Law', // Not an array
        [123] // Invalid type
      ];

      invalidSpecs.forEach(spec => {
        const result = validateSpecialization(spec);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateRegistrationData', () => {
    test('should validate complete client registration data', () => {
      const clientData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'StrongPass123!',
        phone: '+1234567890',
        role: 'client'
      };

      const result = validateRegistrationData(clientData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate complete advocate registration data', () => {
      const advocateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@lawfirm.com',
        password: 'SecurePass456!',
        phone: '+1234567890',
        role: 'advocate',
        licenseNumber: 'LAW123456',
        specialization: ['Family Law', 'Corporate Law'],
        experience: 10
      };

      const result = validateRegistrationData(advocateData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject incomplete registration data', () => {
      const incompleteData = {
        firstName: 'John',
        // Missing lastName, email, password
        role: 'client'
      };

      const result = validateRegistrationData(incompleteData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.fieldErrors).toHaveProperty('lastName');
      expect(result.fieldErrors).toHaveProperty('email');
      expect(result.fieldErrors).toHaveProperty('password');
    });

    test('should reject advocate data without license number', () => {
      const advocateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@lawfirm.com',
        password: 'SecurePass456!',
        role: 'advocate'
        // Missing licenseNumber
      };

      const result = validateRegistrationData(advocateData);
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors).toHaveProperty('licenseNumber');
    });
  });
});
