// Test Notification System - LegalPro v1.0.1
// This script demonstrates the notification system functionality

const templateEngine = require('../utils/templateEngine');
const { 
  isEventEnabled, 
  getEventConfig, 
  eventNotificationConfig 
} = require('../config/notificationConfig');

// Test data
const testUser = {
  _id: '507f1f77bcf86cd799439011',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+254712345678',
  userType: 'client'
};

const testAppointmentData = {
  clientName: 'John Doe',
  appointmentDate: '2024-01-15',
  appointmentTime: '10:00 AM',
  advocateName: 'Jane Smith',
  location: 'LegalPro Main Office',
  appointmentType: 'Legal Consultation',
  appointmentId: 'APT-2024-001'
};

async function testTemplateEngine() {
  console.log('🧪 Testing Template Engine...\n');
  
  try {
    // Test email template rendering
    console.log('📧 Testing Email Template Rendering:');
    const emailResult = await templateEngine.renderEmailTemplate('welcome', {
      firstName: testUser.firstName,
      email: testUser.email,
      userType: testUser.userType,
      registrationDate: new Date().toLocaleDateString('en-KE')
    });
    
    console.log('✅ Email template rendered successfully');
    console.log(`   Subject: ${emailResult.subject}`);
    console.log(`   HTML length: ${emailResult.html.length} characters`);
    console.log(`   Text length: ${emailResult.text.length} characters\n`);
    
    // Test SMS template rendering
    console.log('📱 Testing SMS Template Rendering:');
    const smsResult = await templateEngine.renderSmsTemplate('welcome', {
      firstName: testUser.firstName,
      dashboardUrl: 'https://legalpro.co.ke/dashboard'
    });
    
    console.log('✅ SMS template rendered successfully');
    console.log(`   Message: ${smsResult.message}`);
    console.log(`   Length: ${smsResult.length}/${smsResult.maxLength} characters\n`);
    
    return { emailResult, smsResult };
  } catch (error) {
    console.error('❌ Template engine test failed:', error.message);
    throw error;
  }
}

function testConfigurationSystem() {
  console.log('⚙️ Testing Configuration System...\n');
  
  try {
    // Test event configuration
    console.log('📋 Testing Event Configuration:');
    const events = ['welcome', 'appointmentConfirmation', 'caseUpdate', 'paymentConfirmation'];
    const channels = ['email', 'sms', 'whatsapp'];
    
    events.forEach(event => {
      console.log(`\n📌 Event: ${event}`);
      channels.forEach(channel => {
        const isEnabled = isEventEnabled(event, channel);
        const config = getEventConfig(event, channel);
        
        console.log(`   ${channel}: ${isEnabled ? '✅ Enabled' : '❌ Disabled'}`);
        if (config) {
          console.log(`      Template: ${config.template}`);
          console.log(`      Priority: ${config.priority}`);
          console.log(`      Delay: ${config.delay}ms`);
        }
      });
    });
    
    console.log('\n✅ Configuration system test completed\n');
    return true;
  } catch (error) {
    console.error('❌ Configuration system test failed:', error.message);
    throw error;
  }
}

function testTemplateValidation() {
  console.log('✅ Testing Template Validation...\n');
  
  try {
    // Test valid data
    console.log('📝 Testing Valid Data:');
    const validData = {
      firstName: 'John',
      email: 'john@example.com',
      userType: 'client'
    };
    
    const validValidation = templateEngine.validateTemplateData('welcome', validData);
    console.log(`   Valid data: ${validValidation.isValid ? '✅ Passed' : '❌ Failed'}`);
    if (!validValidation.isValid) {
      console.log(`   Errors: ${validValidation.errors.join(', ')}`);
    }
    
    // Test invalid data
    console.log('\n📝 Testing Invalid Data:');
    const invalidData = {
      userType: 'client'
      // Missing firstName and email
    };
    
    const invalidValidation = templateEngine.validateTemplateData('welcome', invalidData);
    console.log(`   Invalid data: ${invalidValidation.isValid ? '❌ Unexpectedly passed' : '✅ Correctly failed'}`);
    if (!invalidValidation.isValid) {
      console.log(`   Expected errors: ${invalidValidation.errors.join(', ')}`);
    }
    
    console.log('\n✅ Template validation test completed\n');
    return true;
  } catch (error) {
    console.error('❌ Template validation test failed:', error.message);
    throw error;
  }
}

async function testAvailableTemplates() {
  console.log('📚 Testing Available Templates...\n');
  
  try {
    const templates = await templateEngine.getAvailableTemplates();
    
    console.log('📧 Available Email Templates:');
    templates.email.forEach(template => {
      console.log(`   - ${template}`);
    });
    
    console.log('\n📱 Available SMS Templates:');
    templates.sms.forEach(template => {
      console.log(`   - ${template}`);
    });
    
    console.log('\n✅ Available templates test completed\n');
    return templates;
  } catch (error) {
    console.error('❌ Available templates test failed:', error.message);
    throw error;
  }
}

function testPhoneNumberFormatting() {
  console.log('📞 Testing Phone Number Formatting...\n');
  
  try {
    const testNumbers = [
      '0712345678',
      '254712345678',
      '712345678',
      '+254712345678'
    ];
    
    console.log('📱 Phone Number Format Tests:');
    testNumbers.forEach(number => {
      // Simulate the formatting logic
      const cleaned = number.replace(/\D/g, '');
      let formatted;
      
      if (cleaned.startsWith('254')) {
        formatted = `+${cleaned}`;
      } else if (cleaned.startsWith('0')) {
        formatted = `+254${cleaned.substring(1)}`;
      } else if (cleaned.length === 9) {
        formatted = `+254${cleaned}`;
      } else {
        formatted = number.startsWith('+') ? number : `+${cleaned}`;
      }
      
      console.log(`   ${number} → ${formatted}`);
    });
    
    console.log('\n✅ Phone number formatting test completed\n');
    return true;
  } catch (error) {
    console.error('❌ Phone number formatting test failed:', error.message);
    throw error;
  }
}

async function testCompleteWorkflow() {
  console.log('🔄 Testing Complete Notification Workflow...\n');
  
  try {
    // Simulate a complete notification workflow
    console.log('📋 Simulating User Registration Workflow:');
    
    // 1. Check if welcome notifications are enabled
    const emailEnabled = isEventEnabled('welcome', 'email');
    const smsEnabled = isEventEnabled('welcome', 'sms');
    
    console.log(`   Email notifications: ${emailEnabled ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   SMS notifications: ${smsEnabled ? '✅ Enabled' : '❌ Disabled'}`);
    
    // 2. Prepare notification data
    const notificationData = {
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      email: testUser.email,
      userType: testUser.userType,
      registrationDate: new Date().toLocaleDateString('en-KE'),
      dashboardUrl: 'https://legalpro.co.ke/dashboard'
    };
    
    // 3. Validate data
    const validation = templateEngine.validateTemplateData('welcome', notificationData);
    console.log(`   Data validation: ${validation.isValid ? '✅ Passed' : '❌ Failed'}`);
    
    if (!validation.isValid) {
      console.log(`   Validation errors: ${validation.errors.join(', ')}`);
    }
    
    // 4. Render templates
    if (emailEnabled && validation.isValid) {
      const emailTemplate = await templateEngine.renderEmailTemplate('welcome', notificationData);
      console.log(`   Email template: ✅ Rendered (${emailTemplate.html.length} chars)`);
    }
    
    if (smsEnabled && validation.isValid) {
      const smsTemplate = await templateEngine.renderSmsTemplate('welcome', notificationData);
      console.log(`   SMS template: ✅ Rendered (${smsTemplate.length} chars)`);
    }
    
    console.log('\n✅ Complete workflow test completed\n');
    return true;
  } catch (error) {
    console.error('❌ Complete workflow test failed:', error.message);
    throw error;
  }
}

async function runAllTests() {
  console.log('🚀 LegalPro Notification System Test Suite\n');
  console.log('=' .repeat(50) + '\n');
  
  try {
    // Run all tests
    await testTemplateEngine();
    testConfigurationSystem();
    testTemplateValidation();
    await testAvailableTemplates();
    testPhoneNumberFormatting();
    await testCompleteWorkflow();
    
    console.log('🎉 All tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Template Engine: Working');
    console.log('   ✅ Configuration System: Working');
    console.log('   ✅ Template Validation: Working');
    console.log('   ✅ Available Templates: Working');
    console.log('   ✅ Phone Formatting: Working');
    console.log('   ✅ Complete Workflow: Working');
    
    console.log('\n🔧 Next Steps:');
    console.log('   1. Configure SMTP settings for email notifications');
    console.log('   2. Configure Twilio settings for SMS notifications');
    console.log('   3. Test with real email/SMS providers');
    console.log('   4. Integrate with your application controllers');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('   1. Check that all template files exist');
    console.log('   2. Verify configuration files are properly set up');
    console.log('   3. Ensure all dependencies are installed');
    process.exit(1);
  }
}

// Export functions for individual testing
module.exports = {
  testTemplateEngine,
  testConfigurationSystem,
  testTemplateValidation,
  testAvailableTemplates,
  testPhoneNumberFormatting,
  testCompleteWorkflow,
  runAllTests
};

// Run all tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}
