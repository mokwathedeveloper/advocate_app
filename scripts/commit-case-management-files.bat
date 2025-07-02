@echo off
setlocal enabledelayedexpansion

REM Professional Git Commit Script for LegalPro Case Management System
REM This script commits files one by one for better version control and tracking

echo.
echo 🚀 LegalPro Case Management System - Professional Git Commit Process
echo ==================================================================
echo.

REM Check if we're in a git repository
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Not in a git repository. Please run this script from the project root.
    exit /b 1
)

echo [INFO] Current branch: 
git branch --show-current
echo [INFO] Starting professional commit process...
echo.

REM Function to commit a single file
:commit_file
set "file_path=%~1"
set "commit_message=%~2"
set "commit_type=%~3"

if exist "%file_path%" (
    echo [INFO] Committing: %file_path%
    git add "%file_path%"
    git commit -m "%commit_type%: %commit_message%

- Added %file_path%
- Part of LegalPro Case Management System v1.0.1
- Professional implementation with comprehensive features

Co-authored-by: LegalPro Development Team <dev@legalpro.com>"
    echo [SUCCESS] ✅ Committed: %file_path%
    echo.
) else (
    echo [WARNING] ⚠️  File not found: %file_path%
)
goto :eof

REM Phase 1: Core Data Models
echo [INFO] Phase 1: Committing Core Data Models
echo ======================================
echo.

call :commit_file "backend\models\Case.js" "Add comprehensive Case model with validation and relationships" "feat"

call :commit_file "backend\models\CaseDocument.js" "Add CaseDocument model for file management with security" "feat"

call :commit_file "backend\models\CaseNote.js" "Add CaseNote model with collaboration features" "feat"

call :commit_file "backend\models\CaseActivity.js" "Add CaseActivity model for comprehensive audit trail" "feat"

REM Phase 2: Core Services
echo [INFO] Phase 2: Committing Core Services
echo ==================================
echo.

call :commit_file "backend\services\caseService.js" "Add comprehensive case management service with CRUD operations" "feat"

call :commit_file "backend\services\documentService.js" "Add secure document management service with file handling" "feat"

call :commit_file "backend\services\noteService.js" "Add note management service with collaboration features" "feat"

call :commit_file "backend\services\activityService.js" "Add activity tracking service for audit trail" "feat"

call :commit_file "backend\services\caseSearchService.js" "Add advanced search service with filtering and pagination" "feat"

call :commit_file "backend\services\caseWorkflowService.js" "Add workflow automation service with status management" "feat"

call :commit_file "backend\services\caseAssignmentService.js" "Add case assignment service with workload management" "feat"

REM Phase 3: Controllers
echo [INFO] Phase 3: Committing API Controllers
echo ====================================
echo.

call :commit_file "backend\controllers\caseController.js" "Add comprehensive case management API controller" "feat"

call :commit_file "backend\controllers\documentController.js" "Add document management API controller with security" "feat"

call :commit_file "backend\controllers\noteController.js" "Add note management API controller" "feat"

call :commit_file "backend\controllers\activityController.js" "Add activity tracking API controller" "feat"

call :commit_file "backend\controllers\searchController.js" "Add advanced search API controller" "feat"

call :commit_file "backend\controllers\workflowController.js" "Add workflow management API controller" "feat"

call :commit_file "backend\controllers\assignmentController.js" "Add assignment management API controller" "feat"

REM Phase 4: Middleware and Utilities
echo [INFO] Phase 4: Committing Middleware and Utilities
echo ==============================================
echo.

call :commit_file "backend\middleware\caseValidation.js" "Add comprehensive case validation middleware" "feat"

call :commit_file "backend\middleware\documentValidation.js" "Add document validation middleware with security checks" "feat"

call :commit_file "backend\middleware\noteValidation.js" "Add note validation middleware" "feat"

call :commit_file "backend\middleware\fileUpload.js" "Add secure file upload middleware with virus scanning" "feat"

call :commit_file "backend\utils\caseUtils.js" "Add case utility functions for common operations" "feat"

call :commit_file "backend\utils\searchUtils.js" "Add search utility functions with optimization" "feat"

REM Phase 5: Routes
echo [INFO] Phase 5: Committing API Routes
echo ===============================
echo.

call :commit_file "backend\routes\cases.js" "Add comprehensive case management API routes" "feat"

call :commit_file "backend\routes\documents.js" "Add document management API routes" "feat"

call :commit_file "backend\routes\notes.js" "Add note management API routes" "feat"

call :commit_file "backend\routes\activities.js" "Add activity tracking API routes" "feat"

call :commit_file "backend\routes\search.js" "Add advanced search API routes" "feat"

call :commit_file "backend\routes\workflow.js" "Add workflow management API routes" "feat"

call :commit_file "backend\routes\assignments.js" "Add assignment management API routes" "feat"

REM Phase 6: Testing Infrastructure
echo [INFO] Phase 6: Committing Testing Infrastructure
echo ===========================================
echo.

call :commit_file "backend\jest.config.js" "Add Jest configuration for comprehensive testing" "test"

call :commit_file "backend\tests\setup.js" "Add global test setup with helper functions" "test"

call :commit_file "backend\tests\globalSetup.js" "Add global test environment setup" "test"

call :commit_file "backend\tests\globalTeardown.js" "Add global test cleanup" "test"

REM Phase 7: Test Suites
echo [INFO] Phase 7: Committing Test Suites
echo ================================
echo.

call :commit_file "backend\tests\case-management.test.js" "Add comprehensive case management test suite" "test"

call :commit_file "backend\tests\case-workflow.test.js" "Add workflow management test suite" "test"

call :commit_file "backend\tests\case-search.test.js" "Add search functionality test suite" "test"

REM Phase 8: Scripts and Tools
echo [INFO] Phase 8: Committing Scripts and Tools
echo ======================================
echo.

call :commit_file "backend\scripts\test-runner.js" "Add professional test runner with reporting" "tooling"

call :commit_file "backend\scripts\run-tests.sh" "Add shell script for test execution" "tooling"

REM Phase 9: Configuration Updates
echo [INFO] Phase 9: Committing Configuration Updates
echo ==========================================
echo.

call :commit_file "backend\package.json" "Update package.json with comprehensive test scripts and dependencies" "config"

REM Phase 10: Documentation
echo [INFO] Phase 10: Committing Documentation
echo ===================================
echo.

call :commit_file "backend\docs\API_DOCUMENTATION.md" "Add comprehensive API documentation with examples" "docs"

call :commit_file "backend\docs\INTEGRATION_GUIDE.md" "Add integration guide with SDK examples" "docs"

call :commit_file "backend\docs\USAGE_EXAMPLES.md" "Add real-world usage examples and scenarios" "docs"

call :commit_file "backend\TESTING.md" "Add comprehensive testing guide and best practices" "docs"

call :commit_file "backend\README_CASE_MANAGEMENT.md" "Add complete case management system documentation" "docs"

REM Final Summary
echo.
echo [SUCCESS] 🎉 Professional Git Commit Process Completed!
echo ==============================================
echo [INFO] Summary of recent commits:
git log --oneline -20
echo.
echo [INFO] Current repository status:
git status
echo.
echo [SUCCESS] All LegalPro Case Management System files have been professionally committed!
echo [INFO] Each commit follows conventional commit standards with detailed messages.
echo [INFO] The commit history now provides clear tracking of all components.
echo.
echo [INFO] Next steps:
echo 1. Review the commit history: git log --oneline
echo 2. Push to remote repository: git push origin [branch-name]
echo 3. Create a pull request for code review
echo 4. Run the test suite: npm run test:all
echo.
echo [SUCCESS] Professional version control process complete! 🚀

pause
