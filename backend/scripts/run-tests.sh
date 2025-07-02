#!/bin/bash

# Test Execution Script - LegalPro v1.0.1
# Comprehensive test execution with proper setup and reporting

set -e  # Exit on any error

echo "🚀 LegalPro Case Management System - Test Suite"
echo "================================================"
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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ to continue."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"

if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
    print_error "Node.js version $NODE_VERSION is not supported. Please upgrade to Node.js 16+ to continue."
    exit 1
fi

print_success "Node.js version $NODE_VERSION detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm to continue."
    exit 1
fi

# Navigate to backend directory
cd "$(dirname "$0")/.."

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the backend directory."
    exit 1
fi

print_status "Installing dependencies..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    npm install
    print_success "Dependencies installed"
else
    print_status "Dependencies already installed"
fi

# Create necessary directories
mkdir -p coverage test-results logs

# Set environment variables for testing
export NODE_ENV=test
export JWT_SECRET=test-jwt-secret-key-for-testing
export BCRYPT_ROUNDS=4
export LOG_LEVEL=error

print_status "Environment configured for testing"

# Function to run specific test suite
run_test_suite() {
    local suite_name=$1
    local description=$2
    
    echo ""
    print_status "Running $suite_name tests: $description"
    echo "----------------------------------------"
    
    if npm run test:$suite_name; then
        print_success "$suite_name tests passed"
        return 0
    else
        print_error "$suite_name tests failed"
        return 1
    fi
}

# Function to run all tests
run_all_tests() {
    echo ""
    print_status "Running complete test suite..."
    echo "==============================="
    
    local failed_suites=()
    
    # Authentication tests
    if ! run_test_suite "auth" "Authentication and authorization"; then
        failed_suites+=("auth")
    fi
    
    # Unit tests
    if ! run_test_suite "unit" "Individual component unit tests"; then
        failed_suites+=("unit")
    fi
    
    # Workflow tests
    if ! run_test_suite "workflow" "Case workflow and status management"; then
        failed_suites+=("workflow")
    fi
    
    # Search tests
    if ! run_test_suite "search" "Search and filtering functionality"; then
        failed_suites+=("search")
    fi
    
    # Integration tests
    if ! run_test_suite "management" "Complete case management system"; then
        failed_suites+=("management")
    fi
    
    echo ""
    echo "==============================="
    echo "Test Execution Summary"
    echo "==============================="
    
    if [ ${#failed_suites[@]} -eq 0 ]; then
        print_success "All test suites passed! 🎉"
        return 0
    else
        print_error "Failed test suites: ${failed_suites[*]}"
        return 1
    fi
}

# Function to generate coverage report
generate_coverage() {
    print_status "Generating coverage report..."
    
    if npm run test:coverage; then
        print_success "Coverage report generated in coverage/ directory"
        
        # Check if coverage meets thresholds
        if npm run coverage:check; then
            print_success "Coverage thresholds met"
        else
            print_warning "Coverage thresholds not met"
        fi
    else
        print_error "Failed to generate coverage report"
    fi
}

# Function to cleanup test artifacts
cleanup() {
    print_status "Cleaning up test artifacts..."
    npm run test:cleanup
    print_success "Cleanup completed"
}

# Main execution logic
case "${1:-all}" in
    "auth")
        run_test_suite "auth" "Authentication and authorization tests"
        ;;
    "unit")
        run_test_suite "unit" "Unit tests"
        ;;
    "workflow")
        run_test_suite "workflow" "Workflow tests"
        ;;
    "search")
        run_test_suite "search" "Search tests"
        ;;
    "management")
        run_test_suite "management" "Management tests"
        ;;
    "coverage")
        generate_coverage
        ;;
    "cleanup")
        cleanup
        ;;
    "all")
        run_all_tests
        ;;
    "ci")
        print_status "Running CI test suite..."
        npm run test:ci
        ;;
    *)
        echo "Usage: $0 [auth|unit|workflow|search|management|coverage|cleanup|all|ci]"
        echo ""
        echo "Test Suites:"
        echo "  auth       - Authentication and authorization tests"
        echo "  unit       - Unit tests for individual components"
        echo "  workflow   - Case workflow and status management tests"
        echo "  search     - Search and filtering functionality tests"
        echo "  management - Complete case management system tests"
        echo "  coverage   - Generate coverage report"
        echo "  cleanup    - Clean up test artifacts"
        echo "  all        - Run all test suites (default)"
        echo "  ci         - Run tests in CI mode"
        exit 1
        ;;
esac

exit_code=$?

echo ""
if [ $exit_code -eq 0 ]; then
    print_success "Test execution completed successfully! ✅"
else
    print_error "Test execution failed! ❌"
fi

echo ""
print_status "Test artifacts available in:"
echo "  - Coverage report: coverage/lcov-report/index.html"
echo "  - Test results: test-results/"
echo "  - Logs: logs/"

exit $exit_code
