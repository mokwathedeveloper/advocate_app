// Notification System Examples for LegalPro v1.0.1
const { 
  sendNotification, 
  sendTemplatedEmail, 
  sendTemplatedSMS 
} = require('../utils/notificationService');
const templateEngine = require('../utils/templateEngine');

// Example user data
const exampleUser = {
  _id: '507f1f77bcf86cd799439011',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+254712345678',
  userType: 'client'
};

// Example advocate data
const exampleAdvocate = {
  _id: '507f1f77bcf86cd799439012',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane.smith@legalpro.co.ke',
  phone: '+254723456789',
  userType: 'advocate'
};

/**
 * Example 1: Welcome Notification for New User
 */
async function sendWelcomeNotification() {
  console.log('=== Welcome Notification Example ===');
  
  try {
    const result = await sendNotification(exampleUser, 'welcome', {
      registrationDate: new Date().toLocaleDateString('en-KE'),
      dashboardUrl: 'https://legalpro.co.ke/dashboard'
    });
    
    console.log('Welcome notification result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error sending welcome notification:', error);
    throw error;
  }
}

/**
 * Example 2: Appointment Confirmation
 */
async function sendAppointmentConfirmation() {
  console.log('=== Appointment Confirmation Example ===');
  
  const appointmentData = {
    clientName: `${exampleUser.firstName} ${exampleUser.lastName}`,
    appointmentDate: '2024-01-15',
    appointmentTime: '10:00 AM',
    advocateName: `${exampleAdvocate.firstName} ${exampleAdvocate.lastName}`,
    location: 'LegalPro Main Office, Nairobi CBD',
    appointmentType: 'Legal Consultation',
    appointmentId: 'APT-2024-001',
    notes: 'Please bring all relevant documents and a valid ID.'
  };
  
  try {
    const result = await sendNotification(exampleUser, 'appointmentConfirmation', appointmentData);
    
    console.log('Appointment confirmation result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error sending appointment confirmation:', error);
    throw error;
  }
}

/**
 * Example 3: Case Update Notification
 */
async function sendCaseUpdateNotification() {
  console.log('=== Case Update Notification Example ===');
  
  const caseData = {
    clientName: `${exampleUser.firstName} ${exampleUser.lastName}`,
    caseTitle: 'Property Dispute Resolution',
    caseId: 'CASE-2024-001',
    status: 'Under Review',
    statusClass: 'pending',
    updateDate: new Date().toLocaleDateString('en-KE'),
    updateMessage: 'Your case documents have been reviewed by our legal team. We have identified key points that strengthen your position.',
    advocateName: `${exampleAdvocate.firstName} ${exampleAdvocate.lastName}`,
    nextSteps: 'We will schedule a meeting with the opposing party within the next 7 days.',
    documentsRequired: 'Please provide the original property deed and any correspondence with the other party.',
    nextHearing: {
      date: '2024-02-01',
      time: '9:00 AM',
      location: 'Milimani Law Courts, Nairobi'
    }
  };
  
  try {
    const result = await sendNotification(exampleUser, 'caseUpdate', caseData);
    
    console.log('Case update result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error sending case update:', error);
    throw error;
  }
}

/**
 * Example 4: Payment Confirmation
 */
async function sendPaymentConfirmation() {
  console.log('=== Payment Confirmation Example ===');
  
  const paymentData = {
    clientName: `${exampleUser.firstName} ${exampleUser.lastName}`,
    amount: '15000',
    transactionId: 'TXN-2024-001',
    paymentDate: new Date().toLocaleString('en-KE'),
    service: 'Legal Consultation - Property Law',
    paymentMethod: 'M-Pesa',
    mpesaCode: 'QGH7X8Y9Z1',
    caseId: 'CASE-2024-001',
    caseTitle: 'Property Dispute Resolution',
    receiptUrl: 'https://legalpro.co.ke/receipts/TXN-2024-001',
    notes: 'Thank you for your prompt payment. Your case will proceed as scheduled.'
  };
  
  try {
    const result = await sendNotification(exampleUser, 'paymentConfirmation', paymentData);
    
    console.log('Payment confirmation result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    throw error;
  }
}

/**
 * Example 5: Individual Email Notification
 */
async function sendIndividualEmail() {
  console.log('=== Individual Email Example ===');
  
  try {
    const result = await sendTemplatedEmail(
      exampleUser.email,
      'appointment-confirmation',
      {
        clientName: `${exampleUser.firstName} ${exampleUser.lastName}`,
        appointmentDate: '2024-01-20',
        appointmentTime: '2:00 PM',
        advocateName: `${exampleAdvocate.firstName} ${exampleAdvocate.lastName}`,
        location: 'LegalPro Branch Office, Thika',
        appointmentType: 'Follow-up Consultation',
        appointmentId: 'APT-2024-002'
      }
    );
    
    console.log('Individual email result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error sending individual email:', error);
    throw error;
  }
}

/**
 * Example 6: Individual SMS Notification
 */
async function sendIndividualSMS() {
  console.log('=== Individual SMS Example ===');
  
  try {
    const result = await sendTemplatedSMS(
      exampleUser.phone,
      'appointmentReminder',
      {
        clientName: exampleUser.firstName,
        advocateName: `${exampleAdvocate.firstName} ${exampleAdvocate.lastName}`,
        appointmentTime: '2:00 PM'
      }
    );
    
    console.log('Individual SMS result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error sending individual SMS:', error);
    throw error;
  }
}

/**
 * Example 7: Template Validation
 */
async function validateTemplateData() {
  console.log('=== Template Validation Example ===');
  
  // Valid data
  const validData = {
    firstName: 'John',
    email: 'john@example.com',
    userType: 'client'
  };
  
  // Invalid data (missing required fields)
  const invalidData = {
    userType: 'client'
    // Missing firstName and email
  };
  
  try {
    const validValidation = templateEngine.validateTemplateData('welcome', validData);
    console.log('Valid data validation:', validValidation);
    
    const invalidValidation = templateEngine.validateTemplateData('welcome', invalidData);
    console.log('Invalid data validation:', invalidValidation);
    
    return { validValidation, invalidValidation };
  } catch (error) {
    console.error('Error validating template data:', error);
    throw error;
  }
}

/**
 * Example 8: Get Available Templates
 */
async function getAvailableTemplates() {
  console.log('=== Available Templates Example ===');
  
  try {
    const templates = await templateEngine.getAvailableTemplates();
    console.log('Available templates:', JSON.stringify(templates, null, 2));
    return templates;
  } catch (error) {
    console.error('Error getting available templates:', error);
    throw error;
  }
}

/**
 * Example 9: Bulk Notifications (Multiple Users)
 */
async function sendBulkNotifications() {
  console.log('=== Bulk Notifications Example ===');
  
  const users = [
    exampleUser,
    {
      ...exampleUser,
      _id: '507f1f77bcf86cd799439013',
      firstName: 'Alice',
      email: 'alice@example.com',
      phone: '+254734567890'
    },
    {
      ...exampleUser,
      _id: '507f1f77bcf86cd799439014',
      firstName: 'Bob',
      email: 'bob@example.com',
      phone: '+254745678901'
    }
  ];
  
  const maintenanceData = {
    maintenanceDate: '2024-01-30',
    startTime: '2:00 AM',
    endTime: '6:00 AM'
  };
  
  try {
    const results = await Promise.all(
      users.map(user => 
        sendNotification(user, 'maintenanceNotice', maintenanceData)
      )
    );
    
    console.log('Bulk notification results:', JSON.stringify(results, null, 2));
    return results;
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    throw error;
  }
}

/**
 * Example 10: Error Handling and Retry
 */
async function demonstrateErrorHandling() {
  console.log('=== Error Handling Example ===');
  
  const userWithInvalidEmail = {
    ...exampleUser,
    email: 'invalid-email-address'
  };
  
  try {
    const result = await sendNotification(userWithInvalidEmail, 'welcome', {
      registrationDate: new Date().toLocaleDateString('en-KE')
    });
    
    console.log('Error handling result:', JSON.stringify(result, null, 2));
    
    // Check for errors in specific channels
    Object.entries(result.channels).forEach(([channel, channelResult]) => {
      if (channelResult.error) {
        console.log(`❌ ${channel} failed:`, channelResult.error);
      } else if (channelResult.skipped) {
        console.log(`⏭️ ${channel} skipped:`, channelResult.skipped);
      } else {
        console.log(`✅ ${channel} sent successfully`);
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error in error handling example:', error);
    throw error;
  }
}

// Export all examples for testing
module.exports = {
  sendWelcomeNotification,
  sendAppointmentConfirmation,
  sendCaseUpdateNotification,
  sendPaymentConfirmation,
  sendIndividualEmail,
  sendIndividualSMS,
  validateTemplateData,
  getAvailableTemplates,
  sendBulkNotifications,
  demonstrateErrorHandling
};

// Run examples if this file is executed directly
if (require.main === module) {
  async function runAllExamples() {
    console.log('🚀 Running Notification System Examples...\n');
    
    try {
      await sendWelcomeNotification();
      console.log('\n');
      
      await sendAppointmentConfirmation();
      console.log('\n');
      
      await sendCaseUpdateNotification();
      console.log('\n');
      
      await sendPaymentConfirmation();
      console.log('\n');
      
      await sendIndividualEmail();
      console.log('\n');
      
      await sendIndividualSMS();
      console.log('\n');
      
      await validateTemplateData();
      console.log('\n');
      
      await getAvailableTemplates();
      console.log('\n');
      
      await sendBulkNotifications();
      console.log('\n');
      
      await demonstrateErrorHandling();
      console.log('\n');
      
      console.log('✅ All examples completed successfully!');
    } catch (error) {
      console.error('❌ Error running examples:', error);
      process.exit(1);
    }
  }
  
  runAllExamples();
}
