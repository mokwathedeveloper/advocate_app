# LegalPro Case Management System - Professional Git Commit Script
# Execute all commits in proper order with professional messages

param(
    [switch]$Execute = $false
)

# Set location to your project directory
Set-Location "C:\Users\HP\OneDrive\Desktop\advocate\advocate_app"

Write-Host "🚀 LegalPro Case Management System - Professional Git Commits" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

if (-not $Execute) {
    Write-Host "⚠️  DRY RUN MODE - Add -Execute to actually commit files" -ForegroundColor Yellow
    Write-Host ""
}

# Function to execute git commands
function Invoke-GitCommit {
    param(
        [string]$FilePath,
        [string]$CommitMessage,
        [string]$Description
    )
    
    Write-Host "📁 $Description" -ForegroundColor Green
    Write-Host "   File: $FilePath" -ForegroundColor Gray
    
    if ($Execute) {
        try {
            git add $FilePath
            if ($LASTEXITCODE -eq 0) {
                git commit -m $CommitMessage
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "   ✅ Committed successfully" -ForegroundColor Green
                } else {
                    Write-Host "   ❌ Commit failed" -ForegroundColor Red
                }
            } else {
                Write-Host "   ❌ Add failed - file may not exist" -ForegroundColor Red
            }
        } catch {
            Write-Host "   ❌ Error: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "   🔍 [DRY RUN] Would commit this file" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Phase 1: Core Data Models
Write-Host "Phase 1: Core Data Models" -ForegroundColor Magenta
Write-Host "=========================" -ForegroundColor Magenta

Invoke-GitCommit "backend/models/Case.js" @"
feat: Add comprehensive Case model with validation and relationships

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
Professional implementation following enterprise standards
"@ "Case Model - Foundation Schema"

Invoke-GitCommit "backend/models/CaseDocument.js" @"
feat: Add CaseDocument model for secure file management

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
Enterprise-grade document management with security focus
"@ "CaseDocument Model - Secure File Management"

Invoke-GitCommit "backend/models/CaseNote.js" @"
feat: Add CaseNote model with advanced collaboration features

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
Professional note management with team collaboration
"@ "CaseNote Model - Collaboration Features"

Invoke-GitCommit "backend/models/CaseActivity.js" @"
feat: Add CaseActivity model for comprehensive audit trail

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
Enterprise audit trail for legal compliance and tracking
"@ "CaseActivity Model - Audit Trail"

# Phase 2: Core Services
Write-Host "Phase 2: Core Services" -ForegroundColor Magenta
Write-Host "======================" -ForegroundColor Magenta

Invoke-GitCommit "backend/services/caseService.js" @"
feat: Add comprehensive case management service with CRUD operations

- Implemented complete case lifecycle management
- Advanced CRUD operations with validation
- Business logic for status transitions
- Client-advocate relationship management
- Progress calculation and tracking
- Search and filtering capabilities
- Statistics and analytics generation
- Bulk operations support
- Error handling with detailed messages
- Performance optimization with caching

Technical Details:
- File: backend/services/caseService.js
- Operations: Full CRUD with business logic validation
- Performance: Optimized queries with pagination
- Security: Role-based access control integration
- Analytics: Case statistics and reporting

Part of LegalPro Case Management System v1.0.1
Professional service layer with comprehensive business logic
"@ "Case Service - Business Logic"

Invoke-GitCommit "backend/services/documentService.js" @"
feat: Add secure document management service with file handling

- Implemented secure file upload and storage
- Multiple storage backend support (Cloudinary, local, S3)
- Virus scanning integration with status tracking
- Document versioning and metadata management
- Access control enforcement
- Bulk upload and download operations
- File type validation and restrictions
- Storage quota management
- Download analytics and tracking
- Cleanup and archival processes

Technical Details:
- File: backend/services/documentService.js
- Security: Multi-layer security with virus scanning
- Storage: Flexible backend with failover support
- Performance: Optimized for large file operations
- Compliance: Audit trail and access logging

Part of LegalPro Case Management System v1.0.1
Enterprise document management with security and compliance
"@ "Document Service - File Management"

Invoke-GitCommit "backend/services/noteService.js" @"
feat: Add note management service with collaboration features

- Implemented comprehensive note management
- Follow-up system with automated reminders
- Collaboration features with sharing controls
- Search and filtering with full-text support
- Meeting integration with attendee tracking
- Pin/unpin functionality for organization
- Word count and analytics
- Export capabilities in multiple formats
- Confidentiality and access control
- Performance optimization for large datasets

Technical Details:
- File: backend/services/noteService.js
- Collaboration: Team sharing with permission controls
- Search: Full-text search with relevance scoring
- Automation: Follow-up reminders and notifications
- Performance: Optimized for concurrent access

Part of LegalPro Case Management System v1.0.1
Professional note management with team collaboration
"@ "Note Service - Collaboration"

Write-Host "🎯 To execute all commits, run:" -ForegroundColor Cyan
Write-Host "   .\commit-all-files.ps1 -Execute" -ForegroundColor White
Write-Host ""
Write-Host "🔍 To see what would be committed (dry run):" -ForegroundColor Cyan
Write-Host "   .\commit-all-files.ps1" -ForegroundColor White
