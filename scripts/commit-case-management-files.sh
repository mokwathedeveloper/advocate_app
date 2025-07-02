#!/bin/bash

# Professional Git Commit Script for LegalPro Case Management System
# This script commits files one by one for better version control and tracking

set -e  # Exit on any error

echo "🚀 LegalPro Case Management System - Professional Git Commit Process"
echo "=================================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to commit a single file
commit_file() {
    local file_path="$1"
    local commit_message="$2"
    local commit_type="$3"
    
    if [ -f "$file_path" ]; then
        print_status "Committing: $file_path"
        git add "$file_path"
        git commit -m "$commit_type: $commit_message

- Added $file_path
- Part of LegalPro Case Management System v1.0.1
- Professional implementation with comprehensive features

Co-authored-by: LegalPro Development Team <dev@legalpro.com>"
        print_success "✅ Committed: $file_path"
        echo ""
    else
        print_warning "⚠️  File not found: $file_path"
    fi
}

# Function to commit multiple related files
commit_files() {
    local commit_message="$1"
    local commit_type="$2"
    shift 2
    local files=("$@")
    
    print_status "Committing related files: $commit_message"
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            git add "$file"
            print_status "  ✓ Added: $file"
        else
            print_warning "  ⚠️  File not found: $file"
        fi
    done
    
    git commit -m "$commit_type: $commit_message

Files added:
$(printf '- %s\n' "${files[@]}")

Part of LegalPro Case Management System v1.0.1
Professional implementation with comprehensive features

Co-authored-by: LegalPro Development Team <dev@legalpro.com>"
    
    print_success "✅ Committed: $commit_message"
    echo ""
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository. Please run this script from the project root."
    exit 1
fi

print_status "Current branch: $(git branch --show-current)"
print_status "Starting professional commit process..."
echo ""

# 1. Core Data Models
print_status "Phase 1: Committing Core Data Models"
echo "======================================"

commit_file "backend/models/Case.js" "Add comprehensive Case model with validation and relationships" "feat"

commit_file "backend/models/CaseDocument.js" "Add CaseDocument model for file management with security" "feat"

commit_file "backend/models/CaseNote.js" "Add CaseNote model with collaboration features" "feat"

commit_file "backend/models/CaseActivity.js" "Add CaseActivity model for comprehensive audit trail" "feat"

# 2. Core Services
print_status "Phase 2: Committing Core Services"
echo "=================================="

commit_file "backend/services/caseService.js" "Add comprehensive case management service with CRUD operations" "feat"

commit_file "backend/services/documentService.js" "Add secure document management service with file handling" "feat"

commit_file "backend/services/noteService.js" "Add note management service with collaboration features" "feat"

commit_file "backend/services/activityService.js" "Add activity tracking service for audit trail" "feat"

commit_file "backend/services/caseSearchService.js" "Add advanced search service with filtering and pagination" "feat"

commit_file "backend/services/caseWorkflowService.js" "Add workflow automation service with status management" "feat"

commit_file "backend/services/caseAssignmentService.js" "Add case assignment service with workload management" "feat"

# 3. Controllers
print_status "Phase 3: Committing API Controllers"
echo "===================================="

commit_file "backend/controllers/caseController.js" "Add comprehensive case management API controller" "feat"

commit_file "backend/controllers/documentController.js" "Add document management API controller with security" "feat"

commit_file "backend/controllers/noteController.js" "Add note management API controller" "feat"

commit_file "backend/controllers/activityController.js" "Add activity tracking API controller" "feat"

commit_file "backend/controllers/searchController.js" "Add advanced search API controller" "feat"

commit_file "backend/controllers/workflowController.js" "Add workflow management API controller" "feat"

commit_file "backend/controllers/assignmentController.js" "Add assignment management API controller" "feat"

# 4. Middleware and Utilities
print_status "Phase 4: Committing Middleware and Utilities"
echo "============================================="

commit_file "backend/middleware/caseValidation.js" "Add comprehensive case validation middleware" "feat"

commit_file "backend/middleware/documentValidation.js" "Add document validation middleware with security checks" "feat"

commit_file "backend/middleware/noteValidation.js" "Add note validation middleware" "feat"

commit_file "backend/middleware/fileUpload.js" "Add secure file upload middleware with virus scanning" "feat"

commit_file "backend/utils/caseUtils.js" "Add case utility functions for common operations" "feat"

commit_file "backend/utils/searchUtils.js" "Add search utility functions with optimization" "feat"

# 5. Routes
print_status "Phase 5: Committing API Routes"
echo "==============================="

commit_files "Add comprehensive case management API routes" "feat" \
    "backend/routes/cases.js" \
    "backend/routes/documents.js" \
    "backend/routes/notes.js" \
    "backend/routes/activities.js" \
    "backend/routes/search.js" \
    "backend/routes/workflow.js" \
    "backend/routes/assignments.js"

# 6. Testing Infrastructure
print_status "Phase 6: Committing Testing Infrastructure"
echo "==========================================="

commit_file "backend/jest.config.js" "Add Jest configuration for comprehensive testing" "test"

commit_file "backend/tests/setup.js" "Add global test setup with helper functions" "test"

commit_file "backend/tests/globalSetup.js" "Add global test environment setup" "test"

commit_file "backend/tests/globalTeardown.js" "Add global test cleanup" "test"

# 7. Test Suites
print_status "Phase 7: Committing Test Suites"
echo "================================"

commit_file "backend/tests/case-management.test.js" "Add comprehensive case management test suite" "test"

commit_file "backend/tests/case-workflow.test.js" "Add workflow management test suite" "test"

commit_file "backend/tests/case-search.test.js" "Add search functionality test suite" "test"

# 8. Scripts and Tools
print_status "Phase 8: Committing Scripts and Tools"
echo "======================================"

commit_file "backend/scripts/test-runner.js" "Add professional test runner with reporting" "tooling"

commit_file "backend/scripts/run-tests.sh" "Add shell script for test execution" "tooling"

# 9. Configuration Updates
print_status "Phase 9: Committing Configuration Updates"
echo "=========================================="

commit_file "backend/package.json" "Update package.json with comprehensive test scripts and dependencies" "config"

# 10. Documentation
print_status "Phase 10: Committing Documentation"
echo "==================================="

commit_file "backend/docs/API_DOCUMENTATION.md" "Add comprehensive API documentation with examples" "docs"

commit_file "backend/docs/INTEGRATION_GUIDE.md" "Add integration guide with SDK examples" "docs"

commit_file "backend/docs/USAGE_EXAMPLES.md" "Add real-world usage examples and scenarios" "docs"

commit_file "backend/TESTING.md" "Add comprehensive testing guide and best practices" "docs"

commit_file "backend/README_CASE_MANAGEMENT.md" "Add complete case management system documentation" "docs"

# Final Summary
echo ""
print_success "🎉 Professional Git Commit Process Completed!"
echo "=============================================="
print_status "Summary of commits:"
git log --oneline -20
echo ""
print_status "Current repository status:"
git status
echo ""
print_success "All LegalPro Case Management System files have been professionally committed!"
print_status "Each commit follows conventional commit standards with detailed messages."
print_status "The commit history now provides clear tracking of all components."
echo ""
print_status "Next steps:"
echo "1. Review the commit history: git log --oneline"
echo "2. Push to remote repository: git push origin $(git branch --show-current)"
echo "3. Create a pull request for code review"
echo "4. Run the test suite: npm run test:all"
echo ""
print_success "Professional version control process complete! 🚀"
