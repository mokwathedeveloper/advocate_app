@echo off
echo.
echo 🚀 LegalPro Case Management - Execute All Commits At Once
echo ========================================================
echo.

REM Change to your project directory
cd /d "C:\Users\HP\OneDrive\Desktop\advocate\advocate_app"

echo [INFO] Current directory: %CD%
echo [INFO] Starting complete commit process...
echo.

REM Phase 1: Core Data Models
echo ============================================
echo Phase 1: Core Data Models (4 files)
echo ============================================

echo [1/46] Committing Case Model...
git add backend\models\Case.js
git commit -m "feat: Add comprehensive Case model with validation and relationships - Part of LegalPro Case Management System v1.0.1"

echo [2/46] Committing CaseDocument Model...
git add backend\models\CaseDocument.js
git commit -m "feat: Add CaseDocument model for secure file management - Part of LegalPro Case Management System v1.0.1"

echo [3/46] Committing CaseNote Model...
git add backend\models\CaseNote.js
git commit -m "feat: Add CaseNote model with advanced collaboration features - Part of LegalPro Case Management System v1.0.1"

echo [4/46] Committing CaseActivity Model...
git add backend\models\CaseActivity.js
git commit -m "feat: Add CaseActivity model for comprehensive audit trail - Part of LegalPro Case Management System v1.0.1"

echo ✅ Phase 1 Complete!
echo.

REM Phase 2: Core Services
echo ============================================
echo Phase 2: Core Services (7 files)
echo ============================================

echo [5/46] Committing Case Service...
git add backend\services\caseService.js
git commit -m "feat: Add comprehensive case management service with CRUD operations - Part of LegalPro Case Management System v1.0.1"

echo [6/46] Committing Document Service...
git add backend\services\documentService.js
git commit -m "feat: Add secure document management service with file handling - Part of LegalPro Case Management System v1.0.1"

echo [7/46] Committing Note Service...
git add backend\services\noteService.js
git commit -m "feat: Add note management service with collaboration features - Part of LegalPro Case Management System v1.0.1"

echo [8/46] Committing Activity Service...
git add backend\services\activityService.js
git commit -m "feat: Add activity tracking service for comprehensive audit trail - Part of LegalPro Case Management System v1.0.1"

echo [9/46] Committing Search Service...
git add backend\services\caseSearchService.js
git commit -m "feat: Add advanced search service with filtering and pagination - Part of LegalPro Case Management System v1.0.1"

echo [10/46] Committing Workflow Service...
git add backend\services\caseWorkflowService.js
git commit -m "feat: Add workflow automation service with status management - Part of LegalPro Case Management System v1.0.1"

echo [11/46] Committing Assignment Service...
git add backend\services\caseAssignmentService.js
git commit -m "feat: Add case assignment service with intelligent workload management - Part of LegalPro Case Management System v1.0.1"

echo ✅ Phase 2 Complete!
echo.

REM Phase 3: API Controllers
echo ============================================
echo Phase 3: API Controllers (7 files)
echo ============================================

echo [12/46] Committing Case Controller...
git add backend\controllers\caseController.js
git commit -m "feat: Add comprehensive case management API controller - Part of LegalPro Case Management System v1.0.1"

echo [13/46] Committing Document Controller...
git add backend\controllers\documentController.js
git commit -m "feat: Add document management API controller with security - Part of LegalPro Case Management System v1.0.1"

echo [14/46] Committing Note Controller...
git add backend\controllers\noteController.js
git commit -m "feat: Add note management API controller with collaboration - Part of LegalPro Case Management System v1.0.1"

echo [15/46] Committing Activity Controller...
git add backend\controllers\activityController.js
git commit -m "feat: Add activity tracking API controller for audit trail - Part of LegalPro Case Management System v1.0.1"

echo [16/46] Committing Search Controller...
git add backend\controllers\searchController.js
git commit -m "feat: Add advanced search API controller with intelligent filtering - Part of LegalPro Case Management System v1.0.1"

echo [17/46] Committing Workflow Controller...
git add backend\controllers\workflowController.js
git commit -m "feat: Add workflow management API controller with automation - Part of LegalPro Case Management System v1.0.1"

echo [18/46] Committing Assignment Controller...
git add backend\controllers\assignmentController.js
git commit -m "feat: Add assignment management API controller with workload optimization - Part of LegalPro Case Management System v1.0.1"

echo ✅ Phase 3 Complete!
echo.

REM Phase 4: Middleware and Utilities
echo ============================================
echo Phase 4: Middleware and Utilities (6 files)
echo ============================================

echo [19/46] Committing Case Validation Middleware...
git add backend\middleware\caseValidation.js
git commit -m "feat: Add comprehensive case validation middleware with security - Part of LegalPro Case Management System v1.0.1"

echo [20/46] Committing Document Validation Middleware...
git add backend\middleware\documentValidation.js
git commit -m "feat: Add document validation middleware with advanced security - Part of LegalPro Case Management System v1.0.1"

echo [21/46] Committing Note Validation Middleware...
git add backend\middleware\noteValidation.js
git commit -m "feat: Add note validation middleware with collaboration controls - Part of LegalPro Case Management System v1.0.1"

echo [22/46] Committing File Upload Middleware...
git add backend\middleware\fileUpload.js
git commit -m "feat: Add secure file upload middleware with virus scanning - Part of LegalPro Case Management System v1.0.1"

echo [23/46] Committing Case Utilities...
git add backend\utils\caseUtils.js
git commit -m "feat: Add case utility functions for common operations - Part of LegalPro Case Management System v1.0.1"

echo [24/46] Committing Search Utilities...
git add backend\utils\searchUtils.js
git commit -m "feat: Add search utility functions with performance optimization - Part of LegalPro Case Management System v1.0.1"

echo ✅ Phase 4 Complete!
echo.

REM Phase 5: API Routes
echo ============================================
echo Phase 5: API Routes (7 files)
echo ============================================

echo [25/46] Committing Case Routes...
git add backend\routes\cases.js
git commit -m "feat: Add comprehensive case management API routes - Part of LegalPro Case Management System v1.0.1"

echo [26/46] Committing Document Routes...
git add backend\routes\documents.js
git commit -m "feat: Add document management API routes with security - Part of LegalPro Case Management System v1.0.1"

echo [27/46] Committing Note Routes...
git add backend\routes\notes.js
git commit -m "feat: Add note management API routes with collaboration - Part of LegalPro Case Management System v1.0.1"

echo [28/46] Committing Activity Routes...
git add backend\routes\activities.js
git commit -m "feat: Add activity tracking API routes for audit trail - Part of LegalPro Case Management System v1.0.1"

echo [29/46] Committing Search Routes...
git add backend\routes\search.js
git commit -m "feat: Add advanced search API routes with intelligent filtering - Part of LegalPro Case Management System v1.0.1"

echo [30/46] Committing Workflow Routes...
git add backend\routes\workflow.js
git commit -m "feat: Add workflow management API routes with automation - Part of LegalPro Case Management System v1.0.1"

echo [31/46] Committing Assignment Routes...
git add backend\routes\assignments.js
git commit -m "feat: Add assignment management API routes with workload optimization - Part of LegalPro Case Management System v1.0.1"

echo ✅ Phase 5 Complete!
echo.

REM Phase 6: Testing Infrastructure
echo ============================================
echo Phase 6: Testing Infrastructure (4 files)
echo ============================================

echo [32/46] Committing Jest Configuration...
git add backend\jest.config.js
git commit -m "test: Add Jest configuration for comprehensive testing framework - Part of LegalPro Case Management System v1.0.1"

echo [33/46] Committing Test Setup...
git add backend\tests\setup.js
git commit -m "test: Add global test setup with comprehensive helper functions - Part of LegalPro Case Management System v1.0.1"

echo [34/46] Committing Global Test Setup...
git add backend\tests\globalSetup.js
git commit -m "test: Add global test environment setup with database initialization - Part of LegalPro Case Management System v1.0.1"

echo [35/46] Committing Global Test Teardown...
git add backend\tests\globalTeardown.js
git commit -m "test: Add global test cleanup with proper resource management - Part of LegalPro Case Management System v1.0.1"

echo ✅ Phase 6 Complete!
echo.

REM Phase 7: Test Suites
echo ============================================
echo Phase 7: Test Suites (3 files)
echo ============================================

echo [36/46] Committing Case Management Tests...
git add backend\tests\case-management.test.js
git commit -m "test: Add comprehensive case management test suite with full coverage - Part of LegalPro Case Management System v1.0.1"

echo [37/46] Committing Workflow Tests...
git add backend\tests\case-workflow.test.js
git commit -m "test: Add workflow management test suite with business rule validation - Part of LegalPro Case Management System v1.0.1"

echo [38/46] Committing Search Tests...
git add backend\tests\case-search.test.js
git commit -m "test: Add search functionality test suite with performance validation - Part of LegalPro Case Management System v1.0.1"

echo ✅ Phase 7 Complete!
echo.

REM Phase 8: Scripts and Tools
echo ============================================
echo Phase 8: Scripts and Tools (2 files)
echo ============================================

echo [39/46] Committing Test Runner...
git add backend\scripts\test-runner.js
git commit -m "tooling: Add professional test runner with comprehensive reporting - Part of LegalPro Case Management System v1.0.1"

echo [40/46] Committing Shell Scripts...
git add backend\scripts\run-tests.sh
git commit -m "tooling: Add shell script for cross-platform test execution - Part of LegalPro Case Management System v1.0.1"

echo ✅ Phase 8 Complete!
echo.

REM Phase 9: Configuration
echo ============================================
echo Phase 9: Configuration (1 file)
echo ============================================

echo [41/46] Committing Package Configuration...
git add backend\package.json
git commit -m "config: Update package.json with comprehensive test scripts and dependencies - Part of LegalPro Case Management System v1.0.1"

echo ✅ Phase 9 Complete!
echo.

REM Phase 10: Documentation
echo ============================================
echo Phase 10: Documentation (5 files)
echo ============================================

echo [42/46] Committing API Documentation...
git add backend\docs\API_DOCUMENTATION.md
git commit -m "docs: Add comprehensive API documentation with examples - Part of LegalPro Case Management System v1.0.1"

echo [43/46] Committing Integration Guide...
git add backend\docs\INTEGRATION_GUIDE.md
git commit -m "docs: Add integration guide with SDK examples and best practices - Part of LegalPro Case Management System v1.0.1"

echo [44/46] Committing Usage Examples...
git add backend\docs\USAGE_EXAMPLES.md
git commit -m "docs: Add real-world usage examples and implementation scenarios - Part of LegalPro Case Management System v1.0.1"

echo [45/46] Committing Testing Documentation...
git add backend\TESTING.md
git commit -m "docs: Add comprehensive testing guide and best practices - Part of LegalPro Case Management System v1.0.1"

echo [46/46] Committing System README...
git add backend\README_CASE_MANAGEMENT.md
git commit -m "docs: Add complete case management system documentation and overview - Part of LegalPro Case Management System v1.0.1"

echo ✅ Phase 10 Complete!
echo.

echo ============================================
echo 🎉 ALL COMMITS COMPLETED SUCCESSFULLY! 🎉
echo ============================================
echo.
echo [INFO] Total files committed: 46
echo [INFO] Professional git history created with individual commits
echo [INFO] Each file has its own commit for better tracking and debugging
echo.

echo [INFO] Checking final git log...
git log --oneline -20

echo.
echo [SUCCESS] LegalPro Case Management System v1.0.1 - All files committed!
echo [INFO] Next steps:
echo   1. Review git history: git log --oneline
echo   2. Push to remote: git push origin [branch-name]
echo   3. Create pull request for code review
echo   4. Run test suite: npm run test:all
echo.

pause
