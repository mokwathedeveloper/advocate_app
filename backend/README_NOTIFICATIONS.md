# 📧 Enhanced Notification System - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Option 1: Automated Setup (Recommended)

Run the interactive setup script:

```bash
npm run setup-notifications
```

This will guide you through:
- ✅ Email provider configuration (Gmail/SendGrid/AWS SES)
- ✅ SMS provider configuration (Twilio/Africa's Talking)
- ✅ WhatsApp Business API (optional)
- ✅ Application URLs and settings
- ✅ Automatic .env file generation
- ✅ Test script creation

### Option 2: Manual Configuration

1. **Copy the example environment file:**
```bash
cp .env.example .env
```

2. **Edit .env with your credentials:**
```env
# Email Configuration (Gmail Example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM_EMAIL=noreply@legalpro.co.ke

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Application URLs
FRONTEND_URL=https://legalpro.co.ke
BACKEND_URL=https://api.legalpro.co.ke
```

## 🧪 Testing Your Configuration

### Test All Components
```bash
npm run test-notifications
```

### Test Email Only
```bash
npm run test-email
```

### Test SMS Only
```bash
npm run test-sms
```

### Custom Test
```bash
# Set test recipients
export TEST_EMAIL=your-email@gmail.com
export TEST_PHONE=+254712345678

# Run tests
npm run test-notifications
```

## 📧 Email Provider Setup

### Gmail (Development)
1. Enable 2-Factor Authentication
2. Generate App Password:
   - Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and generate password
3. Use the 16-character password in SMTP_PASS

### SendGrid (Production)
1. Create account at https://sendgrid.com/
2. Generate API Key with "Full Access"
3. Use API key as SMTP_PASS with SMTP_USER=apikey

### AWS SES (Enterprise)
1. Set up AWS SES in your region
2. Verify your domain
3. Create SMTP credentials
4. Use SMTP endpoint for your region

## 📱 SMS Provider Setup

### Twilio (Recommended)
1. Create account at https://www.twilio.com/
2. Get Account SID and Auth Token from Console
3. Purchase a phone number
4. Add credentials to .env

### Africa's Talking (Kenya-specific)
1. Create account at https://africastalking.com/
2. Get API Key and Username
3. Add to .env with SMS_PROVIDER=africastalking

## 🔧 Configuration Options

### Basic Settings
```env
# Enable/Disable Notifications
EMAIL_NOTIFICATIONS_ENABLED=true
SMS_NOTIFICATIONS_ENABLED=true
WHATSAPP_NOTIFICATIONS_ENABLED=false

# Retry Configuration
EMAIL_RETRY_ATTEMPTS=3
SMS_RETRY_ATTEMPTS=3
EMAIL_RETRY_DELAY=5000
SMS_RETRY_DELAY=3000

# Quiet Hours (Kenya Time)
QUIET_HOURS_ENABLED=true
QUIET_HOURS_START=22:00
QUIET_HOURS_END=07:00
TIMEZONE=Africa/Nairobi
```

### Event-Specific Settings
```env
# Welcome Notifications
WELCOME_EMAIL_ENABLED=true
WELCOME_SMS_ENABLED=true

# Appointment Notifications
APPOINTMENT_CONFIRMATION_EMAIL_ENABLED=true
APPOINTMENT_CONFIRMATION_SMS_ENABLED=true
APPOINTMENT_REMINDER_EMAIL_ENABLED=true
APPOINTMENT_REMINDER_SMS_ENABLED=true

# Case Update Notifications
CASE_UPDATE_EMAIL_ENABLED=true
CASE_UPDATE_SMS_ENABLED=true

# Payment Notifications
PAYMENT_CONFIRMATION_EMAIL_ENABLED=true
PAYMENT_CONFIRMATION_SMS_ENABLED=true

# Emergency Notifications
EMERGENCY_EMAIL_ENABLED=true
EMERGENCY_SMS_ENABLED=true
```

## 💻 Usage Examples

### Send Welcome Notification
```javascript
const { sendNotification } = require('./utils/notificationService');

const user = {
  _id: 'user123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+254712345678',
  userType: 'client'
};

await sendNotification(user, 'welcome', {
  registrationDate: new Date().toLocaleDateString('en-KE'),
  dashboardUrl: 'https://legalpro.co.ke/dashboard'
});
```

### Send Appointment Confirmation
```javascript
await sendNotification(user, 'appointmentConfirmation', {
  clientName: 'John Doe',
  appointmentDate: '15th January 2024',
  appointmentTime: '10:00 AM',
  advocateName: 'Advocate Grace Njeri',
  location: 'LegalPro Main Office',
  appointmentId: 'APT-2024-001'
});
```

### Send Case Update
```javascript
await sendNotification(user, 'caseUpdate', {
  clientName: 'John Doe',
  caseTitle: 'Property Dispute Case',
  caseId: 'CASE-2024-001',
  status: 'Under Review',
  updateMessage: 'Court hearing scheduled for next month.',
  advocateName: 'Advocate Grace Njeri'
});
```

### Send Payment Confirmation
```javascript
await sendNotification(user, 'paymentConfirmation', {
  clientName: 'John Doe',
  amount: '15000',
  transactionId: 'TXN-2024-001',
  service: 'Legal Consultation',
  paymentMethod: 'M-Pesa',
  mpesaCode: 'QGH7X8Y9Z1'
});
```

## 🔍 Troubleshooting

### Common Issues

**Email not sending:**
- Check SMTP credentials
- Verify 2FA and app password for Gmail
- Check firewall settings

**SMS not sending:**
- Verify Twilio credentials
- Check account balance
- Ensure phone number format (+254...)

**Configuration errors:**
- Run `npm run test-notifications` for detailed diagnostics
- Check .env file syntax
- Verify all required variables are set

### Debug Mode
```bash
DEBUG=notification:* npm run test-notifications
```

### Check Configuration
```bash
# View current configuration
node -e "require('dotenv').config(); console.log('SMTP_HOST:', process.env.SMTP_HOST); console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Not set');"
```

## 📚 Documentation

- **Complete Guide**: `docs/CONFIGURATION_GUIDE.md`
- **API Documentation**: `docs/NOTIFICATION_SYSTEM.md`
- **Test Results**: `docs/TEST_RESULTS_SUMMARY.md`
- **Examples**: `examples/notificationExamples.js`

## 🎯 Available Commands

```bash
# Setup and Configuration
npm run setup-notifications      # Interactive setup wizard
npm run test-notifications       # Test all notification components
npm run test-email              # Test email configuration only
npm run test-sms                # Test SMS configuration only

# Development
npm test                        # Run all tests
npm run dev                     # Start development server
npm start                       # Start production server
```

## 🚀 Production Deployment

1. **Configure providers** using setup script or manual configuration
2. **Test thoroughly** with real email/phone numbers
3. **Set production URLs** in FRONTEND_URL and BACKEND_URL
4. **Monitor delivery rates** and error logs
5. **Set up alerts** for failed notifications

## 📞 Support

If you need help:

1. **Run diagnostics**: `npm run test-notifications`
2. **Check documentation**: `docs/CONFIGURATION_GUIDE.md`
3. **Enable debug mode**: `DEBUG=notification:*`
4. **Review examples**: `examples/`

## 🎉 You're Ready!

Once configured, your notification system will automatically:
- ✅ Send professional welcome emails to new users
- ✅ Confirm appointments via email and SMS
- ✅ Update clients on case progress
- ✅ Confirm M-Pesa payments
- ✅ Handle emergency legal assistance requests
- ✅ Respect quiet hours and user preferences
- ✅ Retry failed notifications automatically
- ✅ Log all activities for monitoring

**Your LegalPro notification system is production-ready!** 🚀
