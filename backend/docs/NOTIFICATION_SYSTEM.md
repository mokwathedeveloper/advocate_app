# 📧 Enhanced Notification System - LegalPro v1.0.1

## Overview

The LegalPro notification system provides a comprehensive, configurable solution for sending email, SMS, and WhatsApp notifications with professional templates and robust error handling.

## Features

- ✅ **Multi-Channel Support**: Email, SMS, and WhatsApp notifications
- ✅ **Professional Templates**: HTML email templates and SMS templates
- ✅ **Configuration System**: Event-based notification configuration
- ✅ **Retry Logic**: Automatic retry with exponential backoff
- ✅ **Template Engine**: Handlebars-based template rendering
- ✅ **Quiet Hours**: Respect user quiet hours for non-critical notifications
- ✅ **Rate Limiting**: Prevent notification spam
- ✅ **Comprehensive Testing**: Unit and integration tests

## Architecture

```
backend/
├── utils/
│   ├── notificationService.js    # Main notification service
│   └── templateEngine.js         # Template rendering engine
├── config/
│   └── notificationConfig.js     # Configuration system
├── templates/
│   ├── email/                    # HTML email templates
│   │   ├── welcome.html
│   │   ├── appointment-confirmation.html
│   │   ├── case-update.html
│   │   └── payment-confirmation.html
│   └── sms/
│       └── templates.json        # SMS templates
└── tests/
    ├── notificationService.test.js
    └── templateEngine.test.js
```

## Quick Start

### 1. Environment Configuration

Add these environment variables to your `.env` file:

```env
# Email Configuration (Required)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@legalpro.co.ke

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# WhatsApp Configuration (Optional)
WHATSAPP_BUSINESS_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id

# Notification Control
EMAIL_NOTIFICATIONS_ENABLED=true
SMS_NOTIFICATIONS_ENABLED=true
WHATSAPP_NOTIFICATIONS_ENABLED=false

# Retry Configuration
EMAIL_RETRY_ATTEMPTS=3
SMS_RETRY_ATTEMPTS=3
EMAIL_RETRY_DELAY=5000
SMS_RETRY_DELAY=3000

# Quiet Hours
QUIET_HOURS_ENABLED=true
QUIET_HOURS_START=22:00
QUIET_HOURS_END=07:00
TIMEZONE=Africa/Nairobi
```

### 2. Basic Usage

```javascript
const { sendNotification } = require('../utils/notificationService');

// Send welcome notification
const user = {
  _id: 'user123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+254712345678',
  userType: 'client'
};

const result = await sendNotification(user, 'welcome', {
  registrationDate: new Date().toLocaleDateString(),
  dashboardUrl: 'https://legalpro.co.ke/dashboard'
});

console.log('Notification result:', result);
```

## Available Event Types

### User Events
- `welcome` - New user registration
- `passwordReset` - Password reset request
- `accountVerification` - Account verification

### Appointment Events
- `appointmentConfirmation` - Appointment booked
- `appointmentReminder` - Appointment reminder (24h before)
- `appointmentReminderToday` - Same-day reminder

### Case Events
- `caseUpdate` - Case status update
- `advocateAssigned` - Advocate assigned to case
- `hearingNotice` - Court hearing notification
- `documentRequest` - Document upload request

### Payment Events
- `paymentConfirmation` - Payment received
- `paymentReminder` - Payment due reminder

### Emergency Events
- `emergencyContact` - Emergency legal assistance

## Template System

### Email Templates

Email templates are HTML files with Handlebars syntax:

```html
<!-- templates/email/welcome.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Welcome to LegalPro</title>
</head>
<body>
    <h1>Welcome {{firstName}}!</h1>
    <p>Your account was created on {{formatDate registrationDate 'long'}}</p>
    <p>Account type: {{userType}}</p>
    
    {{#if notes}}
    <p>Notes: {{notes}}</p>
    {{/if}}
    
    <a href="{{dashboardUrl}}">Access Dashboard</a>
</body>
</html>
```

### SMS Templates

SMS templates are defined in JSON format:

```json
{
  "welcome": {
    "message": "Welcome {{firstName}}! Your LegalPro account is active. Access: {{dashboardUrl}} - LegalPro",
    "maxLength": 160,
    "variables": ["firstName", "dashboardUrl"]
  }
}
```

### Available Handlebars Helpers

- `{{formatDate date 'short|long|time|datetime'}}` - Format dates
- `{{formatCurrency amount}}` - Format currency (KES)
- `{{#if condition}}...{{/if}}` - Conditional content
- `{{#ifEquals value1 value2}}...{{/ifEquals}}` - Equality check
- `{{truncate text length}}` - Truncate text
- `{{dashboardUrl path}}` - Generate dashboard URLs

## Configuration System

### Event Configuration

Each event type can be configured per channel:

```javascript
// config/notificationConfig.js
const eventNotificationConfig = {
  welcome: {
    email: {
      enabled: true,
      template: 'welcome',
      priority: 'high',
      delay: 0
    },
    sms: {
      enabled: true,
      template: 'welcome',
      priority: 'medium',
      delay: 30000  // 30 seconds after email
    },
    whatsapp: {
      enabled: false,
      template: 'welcome',
      priority: 'low',
      delay: 60000  // 1 minute after email
    }
  }
};
```

### Priority Levels

- `critical` - Always sent, ignores quiet hours
- `high` - Important notifications
- `medium` - Standard notifications
- `low` - Optional notifications

### Quiet Hours

Notifications respect quiet hours (default: 22:00 - 07:00):

```env
QUIET_HOURS_ENABLED=true
QUIET_HOURS_START=22:00
QUIET_HOURS_END=07:00
TIMEZONE=Africa/Nairobi
```

Critical and emergency notifications ignore quiet hours.

## API Usage Examples

### Send Individual Notifications

```javascript
// Email only
await sendTemplatedEmail(
  'user@example.com',
  'appointment-confirmation',
  {
    clientName: 'John Doe',
    appointmentDate: '2024-01-15',
    appointmentTime: '10:00 AM',
    advocateName: 'Jane Smith',
    location: 'Main Office'
  }
);

// SMS only
await sendTemplatedSMS(
  '+254712345678',
  'appointmentReminder',
  {
    clientName: 'John Doe',
    advocateName: 'Jane Smith',
    appointmentTime: '10:00 AM'
  }
);
```

### Send Multi-Channel Notifications

```javascript
// All enabled channels
const result = await sendNotification(user, 'caseUpdate', {
  caseTitle: 'Property Dispute Case',
  caseId: 'CASE-001',
  status: 'Under Review',
  updateMessage: 'Documents have been reviewed by the advocate.',
  nextSteps: 'Waiting for court date assignment.',
  advocateName: 'Jane Smith'
});

// Check results
if (result.channels.email?.success) {
  console.log('Email sent successfully');
}
if (result.channels.sms?.success) {
  console.log('SMS sent successfully');
}
```

## Error Handling

The system includes comprehensive error handling:

```javascript
try {
  const result = await sendNotification(user, 'welcome', data);
  
  // Check for errors in specific channels
  Object.entries(result.channels).forEach(([channel, result]) => {
    if (result.error) {
      console.error(`${channel} notification failed:`, result.error);
    } else if (result.skipped) {
      console.log(`${channel} notification skipped:`, result.skipped);
    } else {
      console.log(`${channel} notification sent successfully`);
    }
  });
} catch (error) {
  console.error('Notification system error:', error);
}
```

## Testing

Run the notification system tests:

```bash
# Run all notification tests
npm test -- --testPathPattern=notification

# Run specific test files
npm test notificationService.test.js
npm test templateEngine.test.js

# Run with coverage
npm test -- --coverage --testPathPattern=notification
```

## Monitoring and Logging

The system provides detailed logging:

```javascript
// Enable debug logging
process.env.DEBUG = 'notification:*';

// Logs include:
// - Template rendering
// - Retry attempts
// - Rate limiting
// - Configuration warnings
// - Delivery status
```

## Best Practices

1. **Template Design**:
   - Keep SMS messages under 160 characters
   - Use responsive HTML for emails
   - Include fallback text for HTML emails

2. **Configuration**:
   - Test with disabled notifications in development
   - Use appropriate delays between channels
   - Set realistic retry limits

3. **Error Handling**:
   - Always check notification results
   - Implement fallback mechanisms
   - Log failures for monitoring

4. **Performance**:
   - Use template caching in production
   - Monitor rate limits
   - Implement queue for high-volume notifications

## Troubleshooting

### Common Issues

1. **Email not sending**:
   - Check SMTP credentials
   - Verify firewall settings
   - Check email provider limits

2. **SMS not sending**:
   - Verify Twilio credentials
   - Check phone number format
   - Verify account balance

3. **Templates not rendering**:
   - Check template file paths
   - Verify Handlebars syntax
   - Check required variables

### Debug Mode

Enable debug logging:

```env
DEBUG=notification:*
NODE_ENV=development
```

This will provide detailed logs for troubleshooting.

## Integration Examples

### Controller Integration

```javascript
// controllers/authController.js
const { sendNotification } = require('../utils/notificationService');

exports.register = async (req, res) => {
  try {
    // Create user
    const user = await User.create(req.body);

    // Send welcome notification
    const notificationResult = await sendNotification(user, 'welcome', {
      registrationDate: new Date().toLocaleDateString('en-KE'),
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
    });

    res.status(201).json({
      success: true,
      user,
      notifications: notificationResult
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Scheduled Notifications

```javascript
// utils/scheduledNotifications.js
const cron = require('node-cron');
const { sendNotification } = require('./notificationService');
const Appointment = require('../models/Appointment');

// Send appointment reminders daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await Appointment.find({
    date: {
      $gte: tomorrow.setHours(0, 0, 0, 0),
      $lt: tomorrow.setHours(23, 59, 59, 999)
    }
  }).populate('clientId advocateId');

  for (const appointment of appointments) {
    await sendNotification(appointment.clientId, 'appointmentReminder', {
      appointmentDate: appointment.date.toLocaleDateString(),
      appointmentTime: appointment.time,
      advocateName: appointment.advocateId.firstName + ' ' + appointment.advocateId.lastName,
      location: appointment.location
    });
  }
});
```
