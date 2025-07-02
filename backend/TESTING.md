# Testing Guide - LegalPro Case Management System v1.0.1

This document provides comprehensive information about testing the LegalPro case management system.

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Test Suites](#test-suites)
5. [Coverage Reports](#coverage-reports)
6. [Writing Tests](#writing-tests)
7. [Troubleshooting](#troubleshooting)

## Overview

The LegalPro case management system includes a comprehensive test suite covering:

- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **Workflow Tests**: Case status and workflow management
- **Search Tests**: Search and filtering functionality
- **Performance Tests**: System performance validation
- **Security Tests**: Authentication and authorization

## Test Structure

```
backend/
├── tests/
│   ├── setup.js                 # Global test setup
│   ├── globalSetup.js           # Global environment setup
│   ├── globalTeardown.js        # Global cleanup
│   ├── case-management.test.js  # Complete system tests
│   ├── case-workflow.test.js    # Workflow management tests
│   ├── case-search.test.js      # Search functionality tests
│   └── auth-rbac.test.js        # Authentication tests
├── scripts/
│   ├── test-runner.js           # Custom test runner
│   └── run-tests.sh            # Shell script for test execution
├── jest.config.js              # Jest configuration
└── TESTING.md                  # This file
```

## Running Tests

### Prerequisites

- Node.js 16+ installed
- MongoDB running (or use in-memory database)
- All dependencies installed (`npm install`)

### Quick Start

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:management
npm run test:workflow
npm run test:search
npm run test:auth

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Using the Test Runner

```bash
# Run all tests with detailed reporting
node scripts/test-runner.js all

# Run specific test suite
node scripts/test-runner.js workflow

# Run with custom options
node scripts/test-runner.js management --verbose --coverage
```

### Using Shell Script (Linux/Mac)

```bash
# Make script executable
chmod +x scripts/run-tests.sh

# Run all tests
./scripts/run-tests.sh

# Run specific suite
./scripts/run-tests.sh workflow

# Generate coverage report
./scripts/run-tests.sh coverage
```

## Test Suites

### 1. Authentication Tests (`test:auth`)

Tests authentication and role-based access control:

```bash
npm run test:auth
```

**Coverage:**
- User registration and login
- JWT token validation
- Role-based permissions
- Password security
- Session management

### 2. Case Management Tests (`test:management`)

Comprehensive tests for the complete case management system:

```bash
npm run test:management
```

**Coverage:**
- Case CRUD operations
- Document management
- Note management
- Activity logging
- User permissions
- Error handling

### 3. Workflow Tests (`test:workflow`)

Tests case status management and workflow automation:

```bash
npm run test:workflow
```

**Coverage:**
- Status transitions
- Workflow validation
- Permission checks
- Activity logging
- Automatic actions
- Error scenarios

### 4. Search Tests (`test:search`)

Tests search and filtering functionality:

```bash
npm run test:search
```

**Coverage:**
- Text search
- Advanced filtering
- Sorting and pagination
- User access control
- Performance optimization
- Search suggestions

### 5. Unit Tests (`test:unit`)

Individual component tests:

```bash
npm run test:unit
```

**Coverage:**
- Model validation
- Service functions
- Utility functions
- Helper methods

## Coverage Reports

### Generating Coverage

```bash
# Generate coverage report
npm run test:coverage

# Check coverage thresholds
npm run coverage:check

# Open coverage report in browser
npm run coverage:report
```

### Coverage Thresholds

The project maintains the following coverage thresholds:

- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

### Viewing Reports

Coverage reports are generated in multiple formats:

- **HTML Report**: `coverage/lcov-report/index.html`
- **JSON Report**: `coverage/coverage-final.json`
- **LCOV Report**: `coverage/lcov.info`
- **Text Summary**: Console output

## Writing Tests

### Test Structure

```javascript
describe('Feature Name', () => {
  beforeAll(async () => {
    // Setup before all tests
  });

  afterAll(async () => {
    // Cleanup after all tests
  });

  beforeEach(async () => {
    // Setup before each test
  });

  afterEach(async () => {
    // Cleanup after each test
  });

  describe('Specific Functionality', () => {
    test('Should perform expected behavior', async () => {
      // Test implementation
    });
  });
});
```

### Helper Functions

The test setup provides global helper functions:

```javascript
// Create test users
const user = await global.createTestUser({
  role: 'advocate',
  email: 'test@example.com'
});

// Create test cases
const testCase = await global.createTestCase({
  title: 'Test Case',
  client: { primary: clientUser._id }
});

// Create test documents
const document = await global.createTestDocument({
  caseId: testCase._id,
  uploadedBy: user._id
});

// Generate auth tokens
const token = global.generateAuthToken(user);

// Make authenticated requests
const response = await global.makeAuthenticatedRequest(
  app, 'GET', '/api/cases', token
);
```

### Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Descriptive Names**: Use clear, descriptive test names
4. **Assertions**: Use specific assertions
5. **Error Testing**: Test both success and failure scenarios
6. **Performance**: Keep tests fast and efficient

### Example Test

```javascript
describe('Case Creation', () => {
  test('Should create case with valid data', async () => {
    const caseData = {
      title: 'Test Case',
      description: 'Test description',
      clientId: clientUser._id,
      advocateId: advocateUser._id
    };

    const response = await request(app)
      .post('/api/cases')
      .set('Authorization', `Bearer ${advocateToken}`)
      .send(caseData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe(caseData.title);
    expect(response.body.data.caseNumber).toMatch(/^CASE-\d{4}-\d{4}$/);
  });
});
```

## Environment Configuration

### Test Environment Variables

```bash
NODE_ENV=test
JWT_SECRET=test-jwt-secret-key-for-testing
BCRYPT_ROUNDS=4
LOG_LEVEL=error
MONGODB_TEST_URI=mongodb://localhost:27017/legalpro_test
```

### Database Setup

Tests use either:

1. **In-Memory Database**: MongoDB Memory Server (default)
2. **Test Database**: Separate MongoDB instance

The test setup automatically handles database connections and cleanup.

## Continuous Integration

### CI Configuration

For CI environments, use:

```bash
npm run test:ci
```

This command:
- Runs all tests without watch mode
- Generates coverage reports
- Outputs results in CI-friendly format
- Fails if coverage thresholds aren't met

### GitHub Actions Example

```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run test:ci
      - uses: codecov/codecov-action@v1
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

```bash
# Check MongoDB is running
mongod --version

# Use in-memory database
export MONGODB_TEST_URI=""
```

#### 2. Port Conflicts

```bash
# Kill processes on test ports
lsof -ti:3000 | xargs kill -9
```

#### 3. Memory Issues

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
```

#### 4. Permission Errors

```bash
# Fix file permissions
chmod +x scripts/run-tests.sh
```

### Debug Mode

Run tests with debug information:

```bash
# Verbose output
npm run test:verbose

# Debug specific test
npm test -- --testNamePattern="specific test name"

# Run single test file
npm test tests/case-management.test.js
```

### Performance Issues

If tests are running slowly:

1. Use `--maxWorkers=1` for single-threaded execution
2. Increase test timeout in Jest configuration
3. Use `--runInBand` for sequential execution
4. Check for memory leaks in test cleanup

## Test Data Management

### Cleanup

```bash
# Clean up test artifacts
npm run test:cleanup

# Manual cleanup
rm -rf coverage test-results logs
```

### Seeding

```bash
# Seed test database
npm run seed
```

## Reporting Issues

When reporting test failures, include:

1. Test command used
2. Full error output
3. Environment details (Node.js version, OS)
4. Steps to reproduce
5. Expected vs actual behavior

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain coverage thresholds
4. Update documentation
5. Add integration tests for new endpoints

---

For more information, see the main project documentation or contact the development team.
