process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://localhost:27017/advocate_app_test';
process.env.JWT_SECRET = 'test_secret';
process.env.JWT_EXPIRE = '1h';

const chai = require('chai');
const request = require('supertest');
const server = require('./server');
const User = require('./models/User');
const expect = chai.expect;
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

describe('Auth API', () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    await User.deleteMany({});
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new client user successfully', (done) => {
      request(server)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'Password123',
          role: 'client'
        })
        .expect(201)
        .end((err, res) => {
          expect(res.body).to.be.an('object');
          expect(res.body.success).to.be.true;
          expect(res.body).to.have.property('token');
          expect(res.body.user.firstName).to.equal('John');
          done();
        });
    });

    it('should not register a user with an existing email', (done) => {
      request(server)
        .post('/api/auth/register')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'Password123',
          role: 'client'
        })
        .expect(400)
        .end((err, res) => {
          expect(res.body.success).to.be.false;
          expect(res.body.message).to.equal('User already exists with this email');
          done();
        });
    });

    it('should not register a user with a weak password', (done) => {
      request(server)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test.user@example.com',
          password: 'pass',
          role: 'client'
        })
        .expect(400)
        .end((err, res) => {
          expect(res.body.success).to.be.false;
          expect(res.body.errors[0].msg).to.equal('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
          done();
        });
    });

    it('should register a new advocate user successfully', (done) => {
      request(server)
        .post('/api/auth/register')
        .send({
          firstName: 'Advocate',
          lastName: 'User',
          email: 'advocate.user@example.com',
          password: 'Password123',
          role: 'advocate',
          licenseNumber: '12345',
          specialization: ['Corporate Law'],
          experience: 5,
          education: 'J.D.',
          barAdmission: 'State Bar'
        })
        .expect(201)
        .end((err, res) => {
          expect(res.body.success).to.be.true;
          expect(res.body).to.have.property('token');
          expect(res.body.user.role).to.equal('advocate');
          done();
        });
    });

    it('should not register an advocate without required fields', (done) => {
      request(server)
        .post('/api/auth/register')
        .send({
          firstName: 'Incomplete',
          lastName: 'Advocate',
          email: 'incomplete.advocate@example.com',
          password: 'Password123',
          role: 'advocate'
        })
        .expect(400)
        .end((err, res) => {
          expect(res.body.success).to.be.false;
          expect(res.body.errors).to.be.an('array');
          done();
        });
    });
  });
});