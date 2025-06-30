# LegalPro Backend API v1.0.1

This is the backend API server for the LegalPro advocate case management system.

## Features

- User authentication and authorization
- User Registration and Validation
  - Comprehensive validation for all registration fields (first name, last name, email, password, phone).
  - Strong password policy: minimum 8 characters, at least one uppercase letter, one lowercase letter, and one number.
  - Advocate-specific validation: requires license number, specialization, experience, education, and bar admission.
  - Clear and user-friendly error messages for all validation failures.
- Case management
- Appointment scheduling
- Payment processing with M-Pesa
- Real-time chat functionality
- File upload and management