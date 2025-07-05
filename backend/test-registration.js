// Test script for registration endpoint
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Test data
const testUser = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  password: 'StrongPass123!',
  phone: '+12345678901',
  role: 'client'
};

const testAdvocate = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane.smith@lawfirm.com',
  password: 'SecurePass456!',
  phone: '+12345678901',
  role: 'advocate',
  licenseNumber: 'LAW123456',
  specialization: ['Family Law', 'Corporate Law'],
  experience: 10,
  education: 'Harvard Law School',
  barAdmission: 'New York State Bar'
};

async function testRegistration() {
  console.log('🧪 Testing Registration System...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing server health...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is running:', healthResponse.status);
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
    }

    // Test 2: Valid client registration
    console.log('\n2. Testing valid client registration...');
    try {
      const clientResponse = await axios.post(`${BASE_URL}/auth/register`, testUser, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ Client registration successful:', clientResponse.status);
      console.log('📄 Response:', JSON.stringify(clientResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Client registration failed:', error.response?.status, error.response?.data || error.message);
    }

    // Test 3: Valid advocate registration
    console.log('\n3. Testing valid advocate registration...');
    try {
      const advocateResponse = await axios.post(`${BASE_URL}/auth/register`, testAdvocate, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ Advocate registration successful:', advocateResponse.status);
      console.log('📄 Response:', JSON.stringify(advocateResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Advocate registration failed:', error.response?.status, error.response?.data || error.message);
    }

    // Test 4: Duplicate email registration
    console.log('\n4. Testing duplicate email registration...');
    try {
      const duplicateResponse = await axios.post(`${BASE_URL}/auth/register`, testUser, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('❌ Duplicate registration should have failed but succeeded:', duplicateResponse.status);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ Duplicate email properly rejected:', error.response.status);
        console.log('📄 Error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data || error.message);
      }
    }

    // Test 5: Invalid data validation
    console.log('\n5. Testing validation errors...');
    try {
      const invalidResponse = await axios.post(`${BASE_URL}/auth/register`, {
        firstName: 'John',
        // Missing required fields
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('❌ Invalid data should have failed but succeeded:', invalidResponse.status);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation errors properly caught:', error.response.status);
        console.log('📄 Validation response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Unexpected validation error:', error.response?.status, error.response?.data || error.message);
      }
    }

    // Test 6: Missing Content-Type header
    console.log('\n6. Testing missing Content-Type header...');
    try {
      const noHeaderResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
      console.log('❌ Missing Content-Type should have failed but succeeded:', noHeaderResponse.status);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Missing Content-Type properly rejected:', error.response.status);
        console.log('📄 Header error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Unexpected header error:', error.response?.status, error.response?.data || error.message);
      }
    }

    // Test 7: Login with registered user
    console.log('\n7. Testing login with registered user...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ Login successful:', loginResponse.status);
      console.log('📄 Login response:', JSON.stringify(loginResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Login failed:', error.response?.status, error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }

  console.log('\n🏁 Registration system testing completed!');
}

// Run the tests
testRegistration();
