const chai = require('chai');
const chaiHttp = require('chai-http').default;

try {
  chai.use(chaiHttp);
  console.log('chai-http loaded successfully.');
} catch (e) {
  console.error('Error loading chai-http:', e);
}
