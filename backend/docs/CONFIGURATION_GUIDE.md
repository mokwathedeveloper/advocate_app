# 🔧 Enhanced Notification System - Configuration Guide

## Overview

This guide will walk you through configuring the Enhanced Notification System for production use with real email and SMS providers.

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Node.js and npm installed
- ✅ LegalPro backend application running
- ✅ Access to email provider (Gmail/SendGrid/AWS SES)
- ✅ Twilio account for SMS (recommended for Kenya)
- ✅ WhatsApp Business API account (optional)

## 🔐 Step 1: Email Configuration

### Option A: Gmail Configuration (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Copy the 16-character password

3. **Add to .env file**:
```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM_EMAIL=noreply@legalpro.co.ke
```

### Option B: SendGrid Configuration (Recommended for Production)

1. **Create SendGrid Account**: https://sendgrid.com/
2. **Generate API Key**:
   - Go to Settings → API Keys
   - Create API Key with "Full Access"
   - Copy the API key

3. **Add to .env file**:
```env
# SendGrid SMTP Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM_EMAIL=noreply@legalpro.co.ke
```

### Option C: AWS SES Configuration (Enterprise)

1. **Set up AWS SES**:
   - Create AWS account
   - Configure SES in your region
   - Verify your domain
   - Create SMTP credentials

2. **Add to .env file**:
```env
# AWS SES SMTP Configuration
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password
SMTP_FROM_EMAIL=noreply@legalpro.co.ke
```

## 📱 Step 2: SMS Configuration (Twilio)

### Setting up Twilio for Kenya

1. **Create Twilio Account**: https://www.twilio.com/
2. **Get Account Credentials**:
   - Go to Console Dashboard
   - Copy Account SID and Auth Token
   - Purchase a phone number (recommended: US number for international SMS)

3. **Add to .env file**:
```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Alternative: Africa's Talking (Kenya-specific)

1. **Create Account**: https://africastalking.com/
2. **Get API Key and Username**
3. **Add to .env file**:
```env
# Africa's Talking Configuration
AT_API_KEY=your-api-key
AT_USERNAME=your-username
SMS_PROVIDER=africastalking
```

## 💬 Step 3: WhatsApp Configuration (Optional)

### WhatsApp Business API

1. **Apply for WhatsApp Business API**
2. **Get credentials from approved provider**
3. **Add to .env file**:
```env
# WhatsApp Business API
WHATSAPP_BUSINESS_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-verify-token
```

## ⚙️ Step 4: Notification Settings

### Basic Configuration

Add these settings to your `.env` file:

```env
# Notification Control
EMAIL_NOTIFICATIONS_ENABLED=true
SMS_NOTIFICATIONS_ENABLED=true
WHATSAPP_NOTIFICATIONS_ENABLED=false

# Retry Configuration
EMAIL_RETRY_ATTEMPTS=3
SMS_RETRY_ATTEMPTS=3
WHATSAPP_RETRY_ATTEMPTS=2
EMAIL_RETRY_DELAY=5000
SMS_RETRY_DELAY=3000
WHATSAPP_RETRY_DELAY=2000

# Rate Limiting
EMAIL_RATE_LIMIT_HOUR=100
SMS_RATE_LIMIT_HOUR=50
WHATSAPP_RATE_LIMIT_HOUR=30

# Quiet Hours (Kenya Time)
QUIET_HOURS_ENABLED=true
QUIET_HOURS_START=22:00
QUIET_HOURS_END=07:00
TIMEZONE=Africa/Nairobi

# Application URLs
FRONTEND_URL=https://legalpro.co.ke
BACKEND_URL=https://api.legalpro.co.ke
```

### Event-Specific Configuration

You can enable/disable specific notification types:

```env
# Welcome Notifications
WELCOME_EMAIL_ENABLED=true
WELCOME_SMS_ENABLED=true
WELCOME_WHATSAPP_ENABLED=false

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
EMERGENCY_WHATSAPP_ENABLED=true
```

## 🧪 Step 5: Testing Configuration

### Test Email Configuration

Create a test file `test-email.js`:

```javascript
const { sendTemplatedEmail } = require('./utils/notificationService');

async function testEmail() {
  try {
    const result = await sendTemplatedEmail(
      'your-test-email@gmail.com',
      'welcome',
      {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        userType: 'client',
        registrationDate: new Date().toLocaleDateString('en-KE')
      }
    );
    
    console.log('✅ Email sent successfully:', result);
  } catch (error) {
    console.error('❌ Email failed:', error.message);
  }
}

testEmail();
```

Run: `node test-email.js`

### Test SMS Configuration

Create a test file `test-sms.js`:

```javascript
const { sendTemplatedSMS } = require('./utils/notificationService');

async function testSMS() {
  try {
    const result = await sendTemplatedSMS(
      '+254712345678', // Replace with your phone number
      'welcome',
      {
        firstName: 'Test',
        dashboardUrl: 'https://legalpro.co.ke/dashboard'
      }
    );
    
    console.log('✅ SMS sent successfully:', result);
  } catch (error) {
    console.error('❌ SMS failed:', error.message);
  }
}

testSMS();
```

Run: `node test-sms.js`

### Test Complete Notification

Create a test file `test-notification.js`:

```javascript
const { sendNotification } = require('./utils/notificationService');

async function testNotification() {
  const testUser = {
    _id: '507f1f77bcf86cd799439011',
    firstName: 'Test',
    lastName: 'User',
    email: 'your-email@gmail.com', // Replace with your email
    phone: '+254712345678', // Replace with your phone
    userType: 'client'
  };

  try {
    const result = await sendNotification(testUser, 'welcome', {
      registrationDate: new Date().toLocaleDateString('en-KE'),
      dashboardUrl: 'https://legalpro.co.ke/dashboard'
    });
    
    console.log('✅ Notification sent:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Notification failed:', error.message);
  }
}

testNotification();
```

Run: `node test-notification.js`

## 🔍 Step 6: Troubleshooting

### Common Issues and Solutions

#### Email Issues

**Problem**: "Invalid login" error
**Solution**: 
- Check if 2FA is enabled and app password is used
- Verify SMTP credentials are correct
- Check if "Less secure app access" is enabled (Gmail)

**Problem**: "Connection timeout"
**Solution**:
- Check firewall settings
- Try different SMTP ports (587, 465, 25)
- Verify SMTP_SECURE setting

#### SMS Issues

**Problem**: "Authentication failed"
**Solution**:
- Verify Twilio Account SID and Auth Token
- Check account balance
- Ensure phone number is verified

**Problem**: "Invalid phone number"
**Solution**:
- Use international format (+254...)
- Check phone number formatting function
- Verify recipient number is valid

#### General Issues

**Problem**: Notifications not sending
**Solution**:
- Check environment variables are loaded
- Verify notification is enabled in config
- Check logs for specific errors
- Test individual components

### Debug Mode

Enable debug logging:

```env
DEBUG=notification:*
NODE_ENV=development
```

This will show detailed logs for troubleshooting.

## 🚀 Step 7: Production Deployment

### Environment Variables Checklist

Before deploying to production, ensure all required variables are set:

```bash
# Check required variables
echo "SMTP_HOST: $SMTP_HOST"
echo "SMTP_USER: $SMTP_USER"
echo "TWILIO_ACCOUNT_SID: $TWILIO_ACCOUNT_SID"
echo "FRONTEND_URL: $FRONTEND_URL"
```

### Security Considerations

1. **Never commit .env files** to version control
2. **Use environment-specific configurations**
3. **Rotate API keys regularly**
4. **Monitor usage and costs**
5. **Set up proper logging and monitoring**

### Monitoring Setup

Add monitoring for:
- Email delivery rates
- SMS delivery rates
- Error rates and types
- API usage and costs
- Template performance

## 📞 Support

If you encounter issues:

1. **Check logs**: Enable debug mode and check application logs
2. **Test components**: Use individual test scripts
3. **Verify credentials**: Double-check all API keys and passwords
4. **Check documentation**: Review provider-specific documentation
5. **Contact support**: Reach out to provider support if needed

## 🎯 Next Steps

After configuration:

1. **Test all notification types** with real data
2. **Monitor delivery rates** and performance
3. **Set up alerts** for failures
4. **Train team** on notification management
5. **Plan for scaling** as user base grows

Your Enhanced Notification System is now ready for production use! 🎉
