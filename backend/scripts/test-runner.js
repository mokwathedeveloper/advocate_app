#!/usr/bin/env node

// Test Runner Script - LegalPro v1.0.1
// Comprehensive test execution with reporting and coverage

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  // Test suites
  suites: {
    unit: {
      pattern: 'tests/**/*.test.js',
      description: 'Unit tests for individual components'
    },
    integration: {
      pattern: 'tests/**/*.integration.test.js',
      description: 'Integration tests for API endpoints'
    },
    workflow: {
      pattern: 'tests/case-workflow.test.js',
      description: 'Case workflow and status management tests'
    },
    search: {
      pattern: 'tests/case-search.test.js',
      description: 'Search and filtering functionality tests'
    },
    management: {
      pattern: 'tests/case-management.test.js',
      description: 'Complete case management system tests'
    }
  },

  // Coverage thresholds
  coverage: {
    statements: 70,
    branches: 70,
    functions: 70,
    lines: 70
  },

  // Test environment
  environment: {
    NODE_ENV: 'test',
    MONGODB_TEST_URI: 'mongodb://localhost:27017/legalpro_test',
    JWT_SECRET: 'test-jwt-secret-key-for-testing',
    BCRYPT_ROUNDS: '4',
    LOG_LEVEL: 'error'
  }
};

class TestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      coverage: null,
      duration: 0
    };
  }

  /**
   * Run all tests or specific test suite
   * @param {string} suite - Test suite to run (optional)
   * @param {object} options - Test options
   */
  async runTests(suite = 'all', options = {}) {
    console.log('🚀 LegalPro Test Runner v1.0.1');
    console.log('=====================================\n');

    const startTime = Date.now();

    try {
      // Set environment variables
      this.setEnvironment();

      // Validate test environment
      await this.validateEnvironment();

      // Run tests
      if (suite === 'all') {
        await this.runAllSuites(options);
      } else {
        await this.runSuite(suite, options);
      }

      // Calculate duration
      this.results.duration = Date.now() - startTime;

      // Generate report
      this.generateReport();

      // Exit with appropriate code
      process.exit(this.results.failed > 0 ? 1 : 0);

    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Set test environment variables
   */
  setEnvironment() {
    Object.entries(TEST_CONFIG.environment).forEach(([key, value]) => {
      process.env[key] = value;
    });

    console.log('✅ Test environment configured');
  }

  /**
   * Validate test environment
   */
  async validateEnvironment() {
    console.log('🔍 Validating test environment...');

    // Check if required files exist
    const requiredFiles = [
      'jest.config.js',
      'tests/setup.js',
      'tests/globalSetup.js',
      'tests/globalTeardown.js'
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(__dirname, '..', file))) {
        throw new Error(`Required test file not found: ${file}`);
      }
    }

    // Check if test database is accessible
    try {
      const mongoose = require('mongoose');
      await mongoose.connect(TEST_CONFIG.environment.MONGODB_TEST_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      });
      await mongoose.connection.close();
      console.log('✅ Test database connection verified');
    } catch (error) {
      console.warn('⚠️  Test database not available, using in-memory database');
    }

    console.log('✅ Environment validation completed\n');
  }

  /**
   * Run all test suites
   * @param {object} options - Test options
   */
  async runAllSuites(options) {
    console.log('🧪 Running all test suites...\n');

    for (const [suiteName, suiteConfig] of Object.entries(TEST_CONFIG.suites)) {
      console.log(`📋 Running ${suiteName} tests: ${suiteConfig.description}`);
      
      try {
        await this.runSuite(suiteName, { ...options, silent: true });
        console.log(`✅ ${suiteName} tests completed\n`);
      } catch (error) {
        console.log(`❌ ${suiteName} tests failed: ${error.message}\n`);
      }
    }
  }

  /**
   * Run specific test suite
   * @param {string} suiteName - Name of test suite
   * @param {object} options - Test options
   */
  async runSuite(suiteName, options = {}) {
    const suite = TEST_CONFIG.suites[suiteName];
    if (!suite) {
      throw new Error(`Unknown test suite: ${suiteName}`);
    }

    const jestArgs = [
      '--config', 'jest.config.js',
      '--testPathPattern', suite.pattern
    ];

    // Add coverage if requested
    if (options.coverage !== false) {
      jestArgs.push('--coverage');
    }

    // Add watch mode if requested
    if (options.watch) {
      jestArgs.push('--watch');
    }

    // Add verbose mode if requested
    if (options.verbose) {
      jestArgs.push('--verbose');
    }

    // Add specific test file if provided
    if (options.testFile) {
      jestArgs.push(options.testFile);
    }

    return new Promise((resolve, reject) => {
      const jest = spawn('npx', ['jest', ...jestArgs], {
        stdio: options.silent ? 'pipe' : 'inherit',
        cwd: path.join(__dirname, '..')
      });

      let output = '';
      let errorOutput = '';

      if (options.silent) {
        jest.stdout.on('data', (data) => {
          output += data.toString();
        });

        jest.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });
      }

      jest.on('close', (code) => {
        if (code === 0) {
          this.parseTestResults(output);
          resolve();
        } else {
          reject(new Error(`Tests failed with exit code ${code}`));
        }
      });

      jest.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Parse test results from Jest output
   * @param {string} output - Jest output
   */
  parseTestResults(output) {
    // Parse Jest output to extract test results
    // This is a simplified parser - in production, you might use Jest's JSON reporter
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('Tests:')) {
        const match = line.match(/(\d+) passed.*?(\d+) failed.*?(\d+) total/);
        if (match) {
          this.results.passed += parseInt(match[1]);
          this.results.failed += parseInt(match[2]);
          this.results.total += parseInt(match[3]);
        }
      }
    }
  }

  /**
   * Generate test report
   */
  generateReport() {
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed} ✅`);
    console.log(`Failed: ${this.results.failed} ${this.results.failed > 0 ? '❌' : ''}`);
    console.log(`Skipped: ${this.results.skipped} ⏭️`);
    console.log(`Duration: ${(this.results.duration / 1000).toFixed(2)}s ⏱️`);

    if (this.results.total > 0) {
      const passRate = ((this.results.passed / this.results.total) * 100).toFixed(2);
      console.log(`Pass Rate: ${passRate}% ${passRate >= 90 ? '🎉' : passRate >= 70 ? '👍' : '⚠️'}`);
    }

    // Coverage report
    if (fs.existsSync(path.join(__dirname, '..', 'coverage', 'coverage-summary.json'))) {
      try {
        const coverageData = JSON.parse(
          fs.readFileSync(path.join(__dirname, '..', 'coverage', 'coverage-summary.json'), 'utf8')
        );

        console.log('\n📈 Coverage Summary');
        console.log('==================');
        console.log(`Statements: ${coverageData.total.statements.pct}%`);
        console.log(`Branches: ${coverageData.total.branches.pct}%`);
        console.log(`Functions: ${coverageData.total.functions.pct}%`);
        console.log(`Lines: ${coverageData.total.lines.pct}%`);
      } catch (error) {
        console.log('⚠️  Could not read coverage report');
      }
    }

    console.log('\n🏁 Test execution completed!');
  }

  /**
   * Clean up test artifacts
   */
  async cleanup() {
    console.log('🧹 Cleaning up test artifacts...');

    const artifactDirs = ['coverage', 'test-results'];
    
    for (const dir of artifactDirs) {
      const dirPath = path.join(__dirname, '..', dir);
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    }

    console.log('✅ Cleanup completed');
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const suite = args[0] || 'all';
  
  const options = {
    coverage: !args.includes('--no-coverage'),
    watch: args.includes('--watch'),
    verbose: args.includes('--verbose'),
    testFile: args.find(arg => arg.startsWith('--file='))?.split('=')[1]
  };

  const runner = new TestRunner();

  // Handle cleanup command
  if (args.includes('--cleanup')) {
    runner.cleanup().then(() => process.exit(0));
    return;
  }

  // Run tests
  runner.runTests(suite, options);
}

module.exports = TestRunner;
