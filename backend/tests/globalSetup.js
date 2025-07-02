// Global Test Setup - LegalPro v1.0.1
// Global setup that runs before all tests

const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  console.log('Setting up global test environment...');

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.BCRYPT_ROUNDS = '4'; // Faster hashing for tests
  process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

  // Start in-memory MongoDB instance
  const mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'legalpro_test'
    }
  });

  const mongoUri = mongoServer.getUri();
  
  // Store the URI and server instance for use in tests
  global.__MONGO_URI__ = mongoUri;
  global.__MONGO_SERVER__ = mongoServer;

  console.log(`Test MongoDB started at: ${mongoUri}`);
  console.log('Global test setup completed.');
};
