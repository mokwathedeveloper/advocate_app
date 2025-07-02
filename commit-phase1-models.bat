@echo off
echo.
echo 🚀 Phase 1: Core Data Models - Professional Git Commits
echo ======================================================
echo.

REM Change to project directory
cd /d "C:\Users\mokwa\Desktop\advocate-case-management"

echo [INFO] Current directory: %CD%
echo [INFO] Starting Phase 1: Core Data Models
echo.

REM 1. Case Model
echo [INFO] Committing Case Model...
git add backend\models\Case.js
if %errorlevel% neq 0 (
    echo [ERROR] Failed to add Case.js
    pause
    exit /b 1
)

git commit -m "feat: Add comprehensive Case model with validation and relationships

- Implemented complete Case schema with Mongoose
- Added comprehensive validation for all fields
- Integrated status workflow management (draft → open → closed → archived)
- Client-advocate relationship management with primary/secondary support
- Court details integration with case number tracking
- Billing system integration (hourly, fixed, contingency)
- Progress tracking with automated calculations
- Tags and metadata support for categorization
- Audit trail with created/updated timestamps
- Performance optimized with proper indexing

Technical Details:
- File: backend/models/Case.js
- Schema: Comprehensive case management data model
- Validation: Input sanitization and business rule enforcement
- Relationships: User references with population support
- Indexing: Optimized for search and filtering operations

Part of LegalPro Case Management System v1.0.1
Professional implementation following enterprise standards"

if %errorlevel% neq 0 (
    echo [ERROR] Failed to commit Case.js
    pause
    exit /b 1
)
echo [SUCCESS] ✅ Case Model committed
echo.

REM 2. CaseDocument Model
echo [INFO] Committing CaseDocument Model...
git add backend\models\CaseDocument.js
if %errorlevel% neq 0 (
    echo [ERROR] Failed to add CaseDocument.js
    pause
    exit /b 1
)

git commit -m "feat: Add CaseDocument model for secure file management

- Implemented secure document metadata storage
- Added access control levels (public, restricted, confidential)
- File type validation and size restrictions
- Virus scanning status tracking
- Document versioning support
- Upload tracking with user attribution
- Download analytics and access logging
- Category and tag-based organization
- Secure file path and URL management
- Audit trail for document lifecycle

Technical Details:
- File: backend/models/CaseDocument.js
- Security: Multi-level access control implementation
- Storage: Flexible backend support (Cloudinary, local, S3)
- Validation: File type, size, and security validations
- Tracking: Complete audit trail for compliance

Part of LegalPro Case Management System v1.0.1
Enterprise-grade document management with security focus"

if %errorlevel% neq 0 (
    echo [ERROR] Failed to commit CaseDocument.js
    pause
    exit /b 1
)
echo [SUCCESS] ✅ CaseDocument Model committed
echo.

REM 3. CaseNote Model
echo [INFO] Committing CaseNote Model...
git add backend\models\CaseNote.js
if %errorlevel% neq 0 (
    echo [ERROR] Failed to add CaseNote.js
    pause
    exit /b 1
)

git commit -m "feat: Add CaseNote model with advanced collaboration features

- Implemented rich note management system
- Multiple note types (meeting, research, consultation, summary)
- Follow-up system with automated reminders
- Meeting details tracking (attendees, duration, location)
- Collaboration features with sharing and permissions
- Confidentiality controls (private, confidential, shared)
- Word count and reading time estimation
- Pin/unpin functionality for important notes
- Tag-based organization and categorization
- Search optimization with text indexing

Technical Details:
- File: backend/models/CaseNote.js
- Features: Rich content management with collaboration
- Follow-ups: Automated reminder and task management
- Security: Granular access control and confidentiality
- Performance: Optimized for search and filtering

Part of LegalPro Case Management System v1.0.1
Professional note management with team collaboration"

if %errorlevel% neq 0 (
    echo [ERROR] Failed to commit CaseNote.js
    pause
    exit /b 1
)
echo [SUCCESS] ✅ CaseNote Model committed
echo.

REM 4. CaseActivity Model
echo [INFO] Committing CaseActivity Model...
git add backend\models\CaseActivity.js
if %errorlevel% neq 0 (
    echo [ERROR] Failed to add CaseActivity.js
    pause
    exit /b 1
)

git commit -m "feat: Add CaseActivity model for comprehensive audit trail

- Implemented complete activity logging system
- Comprehensive activity type definitions (20+ types)
- User attribution with IP address and user agent tracking
- Detailed activity descriptions with context
- Priority levels for activity importance
- Category-based organization for filtering
- Related entity references (documents, notes, users)
- System vs user-generated activity distinction
- Visibility controls for sensitive activities
- Performance optimized for timeline queries

Technical Details:
- File: backend/models/CaseActivity.js
- Logging: Complete audit trail for compliance requirements
- Performance: Indexed for efficient timeline queries
- Security: IP tracking and user agent logging
- Compliance: Meets legal industry audit requirements

Part of LegalPro Case Management System v1.0.1
Enterprise audit trail for legal compliance and tracking"

if %errorlevel% neq 0 (
    echo [ERROR] Failed to commit CaseActivity.js
    pause
    exit /b 1
)
echo [SUCCESS] ✅ CaseActivity Model committed
echo.

echo [SUCCESS] 🎉 Phase 1 Complete! All Core Data Models committed successfully.
echo.
echo [INFO] Next: Run commit-phase2-services.bat to continue with Core Services
echo.

pause
