// Global Test Teardown - LegalPro v1.0.1
// Global teardown that runs after all tests

module.exports = async () => {
  console.log('Tearing down global test environment...');

  // Stop the in-memory MongoDB instance
  if (global.__MONGO_SERVER__) {
    await global.__MONGO_SERVER__.stop();
    console.log('Test MongoDB stopped.');
  }

  console.log('Global test teardown completed.');
};
