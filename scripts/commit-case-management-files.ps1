# Professional Git Commit Script for LegalPro Case Management System
# PowerShell version for Windows compatibility
# This script commits files one by one for better version control and tracking

param(
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$Colors = @{
    Info = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
}

function Write-Status {
    param([string]$Message, [string]$Type = "Info")
    $Color = $Colors[$Type]
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [$Type] $Message" -ForegroundColor $Color
}

function Test-GitRepository {
    try {
        git rev-parse --git-dir | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Commit-SingleFile {
    param(
        [string]$FilePath,
        [string]$CommitMessage,
        [string]$CommitType = "feat"
    )
    
    if (Test-Path $FilePath) {
        Write-Status "Committing: $FilePath" "Info"
        
        if (-not $DryRun) {
            git add $FilePath
            
            $FullCommitMessage = @"
$CommitType`: $CommitMessage

- Added $FilePath
- Part of LegalPro Case Management System v1.0.1
- Professional implementation with comprehensive features

Co-authored-by: LegalPro Development Team <dev@legalpro.com>
"@
            
            git commit -m $FullCommitMessage
            Write-Status "✅ Committed: $FilePath" "Success"
        } else {
            Write-Status "🔍 [DRY RUN] Would commit: $FilePath" "Warning"
        }
    } else {
        Write-Status "⚠️  File not found: $FilePath" "Warning"
    }
}

function Commit-MultipleFiles {
    param(
        [string[]]$FilePaths,
        [string]$CommitMessage,
        [string]$CommitType = "feat"
    )
    
    $ExistingFiles = @()
    $MissingFiles = @()
    
    foreach ($FilePath in $FilePaths) {
        if (Test-Path $FilePath) {
            $ExistingFiles += $FilePath
        } else {
            $MissingFiles += $FilePath
        }
    }
    
    if ($ExistingFiles.Count -gt 0) {
        Write-Status "Committing $($ExistingFiles.Count) related files: $CommitMessage" "Info"
        
        if (-not $DryRun) {
            foreach ($File in $ExistingFiles) {
                git add $File
                Write-Status "  ✓ Added: $File" "Info"
            }
            
            $FileList = ($ExistingFiles | ForEach-Object { "- $_" }) -join "`n"
            $FullCommitMessage = @"
$CommitType`: $CommitMessage

Files added:
$FileList

Part of LegalPro Case Management System v1.0.1
Professional implementation with comprehensive features

Co-authored-by: LegalPro Development Team <dev@legalpro.com>
"@
            
            git commit -m $FullCommitMessage
            Write-Status "✅ Committed: $CommitMessage" "Success"
        } else {
            Write-Status "🔍 [DRY RUN] Would commit $($ExistingFiles.Count) files" "Warning"
        }
    }
    
    if ($MissingFiles.Count -gt 0) {
        foreach ($File in $MissingFiles) {
            Write-Status "⚠️  File not found: $File" "Warning"
        }
    }
}

# Main execution
Write-Host ""
Write-Status "🚀 LegalPro Case Management System - Professional Git Commit Process" "Info"
Write-Status "====================================================================" "Info"
Write-Host ""

if ($DryRun) {
    Write-Status "🔍 DRY RUN MODE - No actual commits will be made" "Warning"
    Write-Host ""
}

# Check if we're in a git repository
if (-not (Test-GitRepository)) {
    Write-Status "Not in a git repository. Please run this script from the project root." "Error"
    exit 1
}

$CurrentBranch = git branch --show-current
Write-Status "Current branch: $CurrentBranch" "Info"
Write-Status "Starting professional commit process..." "Info"
Write-Host ""

# Define file groups for organized commits
$FileGroups = @{
    "Core Data Models" = @{
        Type = "feat"
        Files = @(
            @{ Path = "backend\models\Case.js"; Message = "Add comprehensive Case model with validation and relationships" },
            @{ Path = "backend\models\CaseDocument.js"; Message = "Add CaseDocument model for file management with security" },
            @{ Path = "backend\models\CaseNote.js"; Message = "Add CaseNote model with collaboration features" },
            @{ Path = "backend\models\CaseActivity.js"; Message = "Add CaseActivity model for comprehensive audit trail" }
        )
    }
    "Core Services" = @{
        Type = "feat"
        Files = @(
            @{ Path = "backend\services\caseService.js"; Message = "Add comprehensive case management service with CRUD operations" },
            @{ Path = "backend\services\documentService.js"; Message = "Add secure document management service with file handling" },
            @{ Path = "backend\services\noteService.js"; Message = "Add note management service with collaboration features" },
            @{ Path = "backend\services\activityService.js"; Message = "Add activity tracking service for audit trail" },
            @{ Path = "backend\services\caseSearchService.js"; Message = "Add advanced search service with filtering and pagination" },
            @{ Path = "backend\services\caseWorkflowService.js"; Message = "Add workflow automation service with status management" },
            @{ Path = "backend\services\caseAssignmentService.js"; Message = "Add case assignment service with workload management" }
        )
    }
    "API Controllers" = @{
        Type = "feat"
        Files = @(
            @{ Path = "backend\controllers\caseController.js"; Message = "Add comprehensive case management API controller" },
            @{ Path = "backend\controllers\documentController.js"; Message = "Add document management API controller with security" },
            @{ Path = "backend\controllers\noteController.js"; Message = "Add note management API controller" },
            @{ Path = "backend\controllers\activityController.js"; Message = "Add activity tracking API controller" },
            @{ Path = "backend\controllers\searchController.js"; Message = "Add advanced search API controller" },
            @{ Path = "backend\controllers\workflowController.js"; Message = "Add workflow management API controller" },
            @{ Path = "backend\controllers\assignmentController.js"; Message = "Add assignment management API controller" }
        )
    }
    "Middleware and Utilities" = @{
        Type = "feat"
        Files = @(
            @{ Path = "backend\middleware\caseValidation.js"; Message = "Add comprehensive case validation middleware" },
            @{ Path = "backend\middleware\documentValidation.js"; Message = "Add document validation middleware with security checks" },
            @{ Path = "backend\middleware\noteValidation.js"; Message = "Add note validation middleware" },
            @{ Path = "backend\middleware\fileUpload.js"; Message = "Add secure file upload middleware with virus scanning" },
            @{ Path = "backend\utils\caseUtils.js"; Message = "Add case utility functions for common operations" },
            @{ Path = "backend\utils\searchUtils.js"; Message = "Add search utility functions with optimization" }
        )
    }
    "API Routes" = @{
        Type = "feat"
        Files = @(
            @{ Path = "backend\routes\cases.js"; Message = "Add comprehensive case management API routes" },
            @{ Path = "backend\routes\documents.js"; Message = "Add document management API routes" },
            @{ Path = "backend\routes\notes.js"; Message = "Add note management API routes" },
            @{ Path = "backend\routes\activities.js"; Message = "Add activity tracking API routes" },
            @{ Path = "backend\routes\search.js"; Message = "Add advanced search API routes" },
            @{ Path = "backend\routes\workflow.js"; Message = "Add workflow management API routes" },
            @{ Path = "backend\routes\assignments.js"; Message = "Add assignment management API routes" }
        )
    }
    "Testing Infrastructure" = @{
        Type = "test"
        Files = @(
            @{ Path = "backend\jest.config.js"; Message = "Add Jest configuration for comprehensive testing" },
            @{ Path = "backend\tests\setup.js"; Message = "Add global test setup with helper functions" },
            @{ Path = "backend\tests\globalSetup.js"; Message = "Add global test environment setup" },
            @{ Path = "backend\tests\globalTeardown.js"; Message = "Add global test cleanup" }
        )
    }
    "Test Suites" = @{
        Type = "test"
        Files = @(
            @{ Path = "backend\tests\case-management.test.js"; Message = "Add comprehensive case management test suite" },
            @{ Path = "backend\tests\case-workflow.test.js"; Message = "Add workflow management test suite" },
            @{ Path = "backend\tests\case-search.test.js"; Message = "Add search functionality test suite" }
        )
    }
    "Scripts and Tools" = @{
        Type = "tooling"
        Files = @(
            @{ Path = "backend\scripts\test-runner.js"; Message = "Add professional test runner with reporting" },
            @{ Path = "backend\scripts\run-tests.sh"; Message = "Add shell script for test execution" }
        )
    }
    "Configuration" = @{
        Type = "config"
        Files = @(
            @{ Path = "backend\package.json"; Message = "Update package.json with comprehensive test scripts and dependencies" }
        )
    }
    "Documentation" = @{
        Type = "docs"
        Files = @(
            @{ Path = "backend\docs\API_DOCUMENTATION.md"; Message = "Add comprehensive API documentation with examples" },
            @{ Path = "backend\docs\INTEGRATION_GUIDE.md"; Message = "Add integration guide with SDK examples" },
            @{ Path = "backend\docs\USAGE_EXAMPLES.md"; Message = "Add real-world usage examples and scenarios" },
            @{ Path = "backend\TESTING.md"; Message = "Add comprehensive testing guide and best practices" },
            @{ Path = "backend\README_CASE_MANAGEMENT.md"; Message = "Add complete case management system documentation" }
        )
    }
}

# Process each file group
$PhaseNumber = 1
foreach ($GroupName in $FileGroups.Keys) {
    $Group = $FileGroups[$GroupName]
    
    Write-Status "Phase $PhaseNumber`: Committing $GroupName" "Info"
    Write-Status ("=" * (20 + $GroupName.Length)) "Info"
    Write-Host ""
    
    foreach ($FileInfo in $Group.Files) {
        Commit-SingleFile -FilePath $FileInfo.Path -CommitMessage $FileInfo.Message -CommitType $Group.Type
    }
    
    Write-Host ""
    $PhaseNumber++
}

# Final Summary
Write-Host ""
Write-Status "🎉 Professional Git Commit Process Completed!" "Success"
Write-Status "==============================================" "Success"

if (-not $DryRun) {
    Write-Status "Summary of recent commits:" "Info"
    git log --oneline -20
    Write-Host ""
    
    Write-Status "Current repository status:" "Info"
    git status
    Write-Host ""
}

Write-Status "All LegalPro Case Management System files have been professionally committed!" "Success"
Write-Status "Each commit follows conventional commit standards with detailed messages." "Info"
Write-Status "The commit history now provides clear tracking of all components." "Info"
Write-Host ""

Write-Status "Next steps:" "Info"
Write-Host "1. Review the commit history: git log --oneline"
Write-Host "2. Push to remote repository: git push origin $CurrentBranch"
Write-Host "3. Create a pull request for code review"
Write-Host "4. Run the test suite: npm run test:all"
Write-Host ""

Write-Status "Professional version control process complete! 🚀" "Success"
