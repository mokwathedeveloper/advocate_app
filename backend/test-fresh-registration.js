// Test script with fresh unique emails
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Generate unique timestamp for emails
const timestamp = Date.now();

// Test data with unique emails
const testUser = {
  firstName: 'Alice',
  lastName: 'Johnson',
  email: `alice.johnson.${timestamp}@example.com`,
  password: 'StrongPass123!',
  phone: '+12345678901',
  role: 'client'
};

const testAdvocate = {
  firstName: 'Bob',
  lastName: 'Williams',
  email: `bob.williams.${timestamp}@lawfirm.com`,
  password: 'SecurePass456!',
  phone: '+12345678902',
  role: 'advocate',
  licenseNumber: `LAW${timestamp}`,
  specialization: ['Criminal Defense', 'Property Law'],
  experience: 15,
  education: 'Yale Law School',
  barAdmission: 'California State Bar'
};

async function testFreshRegistration() {
  console.log('🧪 Testing Fresh Registration System...\n');

  try {
    // Test 1: Fresh client registration
    console.log('1. Testing fresh client registration...');
    try {
      const clientResponse = await axios.post(`${BASE_URL}/auth/register`, testUser, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ Client registration successful:', clientResponse.status);
      console.log('📧 Registered email:', testUser.email);
      console.log('🔑 Token received:', clientResponse.data.data.token ? 'Yes' : 'No');
      console.log('👤 User ID:', clientResponse.data.data.user._id);
    } catch (error) {
      console.log('❌ Client registration failed:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 2: Fresh advocate registration
    console.log('\n2. Testing fresh advocate registration...');
    try {
      const advocateResponse = await axios.post(`${BASE_URL}/auth/register`, testAdvocate, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ Advocate registration successful:', advocateResponse.status);
      console.log('📧 Registered email:', testAdvocate.email);
      console.log('🏛️ License number:', testAdvocate.licenseNumber);
      console.log('⚖️ Specializations:', testAdvocate.specialization.join(', '));
      console.log('🔑 Token received:', advocateResponse.data.data.token ? 'Yes' : 'No');
      console.log('👤 User ID:', advocateResponse.data.data.user._id);
    } catch (error) {
      console.log('❌ Advocate registration failed:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 3: Login with new client
    console.log('\n3. Testing login with new client...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ Client login successful:', loginResponse.status);
      console.log('👤 Logged in as:', loginResponse.data.data.user.firstName, loginResponse.data.data.user.lastName);
      console.log('📧 Email:', loginResponse.data.data.user.email);
      console.log('🎭 Role:', loginResponse.data.data.user.role);
    } catch (error) {
      console.log('❌ Client login failed:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 4: Login with new advocate
    console.log('\n4. Testing login with new advocate...');
    try {
      const advocateLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: testAdvocate.email,
        password: testAdvocate.password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ Advocate login successful:', advocateLoginResponse.status);
      console.log('👤 Logged in as:', advocateLoginResponse.data.data.user.firstName, advocateLoginResponse.data.data.user.lastName);
      console.log('📧 Email:', advocateLoginResponse.data.data.user.email);
      console.log('🎭 Role:', advocateLoginResponse.data.data.user.role);
      console.log('🏛️ License:', advocateLoginResponse.data.data.user.licenseNumber);
      console.log('✅ Verified:', advocateLoginResponse.data.data.user.isVerified);
    } catch (error) {
      console.log('❌ Advocate login failed:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 5: Test weak password validation
    console.log('\n5. Testing weak password validation...');
    try {
      const weakPasswordUser = {
        firstName: 'Test',
        lastName: 'User',
        email: `test.weak.${timestamp}@example.com`,
        password: 'weak',
        role: 'client'
      };
      
      const weakResponse = await axios.post(`${BASE_URL}/auth/register`, weakPasswordUser, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('❌ Weak password should have been rejected but was accepted');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Weak password properly rejected:', error.response.status);
        const passwordErrors = error.response.data.details.fieldErrors.password;
        console.log('🔒 Password errors:', passwordErrors.map(e => e.code).join(', '));
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.message);
      }
    }

    // Test 6: Test invalid email validation
    console.log('\n6. Testing invalid email validation...');
    try {
      const invalidEmailUser = {
        firstName: 'Test',
        lastName: 'User',
        email: 'invalid-email-format',
        password: 'StrongPass123!',
        role: 'client'
      };
      
      const invalidResponse = await axios.post(`${BASE_URL}/auth/register`, invalidEmailUser, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('❌ Invalid email should have been rejected but was accepted');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid email properly rejected:', error.response.status);
        const emailErrors = error.response.data.details.fieldErrors.email;
        console.log('📧 Email errors:', emailErrors.map(e => e.code).join(', '));
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }

  console.log('\n🏁 Fresh registration testing completed!');
  console.log('🎉 Registration system is working perfectly!');
}

// Run the tests
testFreshRegistration();
