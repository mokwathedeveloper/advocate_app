// Test Configuration Script - LegalPro Enhanced Notification System
// This script tests your notification configuration

require('dotenv').config();
const { sendNotification, sendTemplatedEmail, sendTemplatedSMS } = require('../utils/notificationService');

async function testEmailConfiguration() {
  console.log('📧 Testing Email Configuration...\n');
  
  // Check required environment variables
  const requiredVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM_EMAIL'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.log('❌ Missing email configuration:');
    missing.forEach(varName => console.log(`   - ${varName}`));
    return false;
  }
  
  console.log('✅ Email environment variables configured');
  console.log(`   Host: ${process.env.SMTP_HOST}`);
  console.log(`   User: ${process.env.SMTP_USER}`);
  console.log(`   From: ${process.env.SMTP_FROM_EMAIL}`);
  
  // Test email sending
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';
  
  try {
    console.log(`\n📤 Sending test email to ${testEmail}...`);
    
    const result = await sendTemplatedEmail(testEmail, 'welcome', {
      firstName: 'Test',
      lastName: 'User',
      email: testEmail,
      userType: 'client',
      registrationDate: new Date().toLocaleDateString('en-KE'),
      dashboardUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
    });
    
    console.log('✅ Email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    return true;
    
  } catch (error) {
    console.log('❌ Email test failed:');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testSMSConfiguration() {
  console.log('\n📱 Testing SMS Configuration...\n');
  
  // Check Twilio configuration
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    console.log('✅ Twilio configuration found');
    console.log(`   Account SID: ${process.env.TWILIO_ACCOUNT_SID.substring(0, 10)}...`);
    console.log(`   Phone Number: ${process.env.TWILIO_PHONE_NUMBER}`);
    
    const testPhone = process.env.TEST_PHONE || '+254712345678';
    
    try {
      console.log(`\n📤 Sending test SMS to ${testPhone}...`);
      
      const result = await sendTemplatedSMS(testPhone, 'welcome', {
        firstName: 'Test',
        dashboardUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
      });
      
      console.log('✅ SMS sent successfully!');
      console.log(`   SID: ${result.sid}`);
      return true;
      
    } catch (error) {
      console.log('❌ SMS test failed:');
      console.log(`   Error: ${error.message}`);
      return false;
    }
  }
  
  // Check Africa's Talking configuration
  else if (process.env.AT_API_KEY && process.env.AT_USERNAME) {
    console.log('✅ Africa\'s Talking configuration found');
    console.log(`   Username: ${process.env.AT_USERNAME}`);
    console.log('⚠️  Africa\'s Talking integration not implemented in this demo');
    return true;
  }
  
  else {
    console.log('⚠️  No SMS configuration found');
    console.log('   Configure TWILIO_* or AT_* variables to enable SMS');
    return false;
  }
}

async function testCompleteNotification() {
  console.log('\n🔄 Testing Complete Notification Flow...\n');
  
  const testUser = {
    _id: 'test-user-' + Date.now(),
    firstName: 'Test',
    lastName: 'User',
    email: process.env.TEST_EMAIL || 'test@example.com',
    phone: process.env.TEST_PHONE || '+254712345678',
    userType: 'client'
  };
  
  console.log('👤 Test User:');
  console.log(`   Name: ${testUser.firstName} ${testUser.lastName}`);
  console.log(`   Email: ${testUser.email}`);
  console.log(`   Phone: ${testUser.phone}`);
  
  try {
    console.log('\n📤 Sending welcome notification...');
    
    const result = await sendNotification(testUser, 'welcome', {
      registrationDate: new Date().toLocaleDateString('en-KE'),
      dashboardUrl: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/dashboard'
    });
    
    console.log('✅ Complete notification sent!');
    console.log('\n📊 Results:');
    
    Object.entries(result.channels).forEach(([channel, channelResult]) => {
      if (channelResult.success) {
        console.log(`   ${channel}: ✅ Success`);
      } else if (channelResult.error) {
        console.log(`   ${channel}: ❌ Error - ${channelResult.error}`);
      } else if (channelResult.skipped) {
        console.log(`   ${channel}: ⏭️ Skipped - ${channelResult.skipped}`);
      }
    });
    
    return true;
    
  } catch (error) {
    console.log('❌ Complete notification test failed:');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

function testConfiguration() {
  console.log('🧪 LegalPro Notification System - Configuration Test\n');
  console.log('=' .repeat(60) + '\n');
  
  // Check basic environment
  console.log('🔍 Environment Check:');
  console.log(`   Node.js: ${process.version}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}`);
  console.log(`   Backend URL: ${process.env.BACKEND_URL || 'Not configured'}`);
  
  // Check notification settings
  console.log('\n⚙️ Notification Settings:');
  console.log(`   Email Enabled: ${process.env.EMAIL_NOTIFICATIONS_ENABLED !== 'false' ? '✅' : '❌'}`);
  console.log(`   SMS Enabled: ${process.env.SMS_NOTIFICATIONS_ENABLED !== 'false' ? '✅' : '❌'}`);
  console.log(`   WhatsApp Enabled: ${process.env.WHATSAPP_NOTIFICATIONS_ENABLED === 'true' ? '✅' : '❌'}`);
  console.log(`   Quiet Hours: ${process.env.QUIET_HOURS_ENABLED === 'true' ? '✅' : '❌'} (${process.env.QUIET_HOURS_START || '22:00'} - ${process.env.QUIET_HOURS_END || '07:00'})`);
  
  console.log('\n' + '=' .repeat(60) + '\n');
}

async function runAllTests() {
  testConfiguration();
  
  const results = {
    email: false,
    sms: false,
    complete: false
  };
  
  // Test email
  results.email = await testEmailConfiguration();
  
  // Test SMS
  results.sms = await testSMSConfiguration();
  
  // Test complete notification
  results.complete = await testCompleteNotification();
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY\n');
  
  console.log(`📧 Email Configuration: ${results.email ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`📱 SMS Configuration: ${results.sms ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`🔄 Complete Notification: ${results.complete ? '✅ PASSED' : '❌ FAILED'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall Score: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Your notification system is ready for production.');
  } else if (passedTests > 0) {
    console.log('⚠️  Some tests failed. Check the configuration and try again.');
  } else {
    console.log('❌ All tests failed. Please check your configuration.');
  }
  
  console.log('\n📚 For help with configuration, see:');
  console.log('   - docs/CONFIGURATION_GUIDE.md');
  console.log('   - Run: node scripts/setup-notifications.js');
  
  return passedTests === totalTests;
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--email-only')) {
  testEmailConfiguration().then(success => {
    process.exit(success ? 0 : 1);
  });
} else if (args.includes('--sms-only')) {
  testSMSConfiguration().then(success => {
    process.exit(success ? 0 : 1);
  });
} else if (args.includes('--complete-only')) {
  testCompleteNotification().then(success => {
    process.exit(success ? 0 : 1);
  });
} else {
  // Run all tests
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testEmailConfiguration,
  testSMSConfiguration,
  testCompleteNotification,
  runAllTests
};
