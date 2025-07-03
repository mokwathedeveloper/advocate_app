// Enhanced Notification service for LegalPro v1.0.1
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const whatsappService = require('./whatsappService');
const templateEngine = require('./templateEngine');
const {
  eventNotificationConfig,
  globalConfig,
  isEventEnabled,
  getEventConfig,
  isInQuietHours,
  shouldRespectQuietHours
} = require('../config/notificationConfig');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Notification configuration
const notificationConfig = {
  email: {
    enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED !== 'false',
    retryAttempts: parseInt(process.env.EMAIL_RETRY_ATTEMPTS) || 3,
    retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY) || 5000
  },
  sms: {
    enabled: process.env.SMS_NOTIFICATIONS_ENABLED !== 'false',
    retryAttempts: parseInt(process.env.SMS_RETRY_ATTEMPTS) || 3,
    retryDelay: parseInt(process.env.SMS_RETRY_DELAY) || 3000
  },
  whatsapp: {
    enabled: process.env.WHATSAPP_NOTIFICATIONS_ENABLED !== 'false',
    retryAttempts: parseInt(process.env.WHATSAPP_RETRY_ATTEMPTS) || 2,
    retryDelay: parseInt(process.env.WHATSAPP_RETRY_DELAY) || 2000
  }
};

// Enhanced Email setup using Nodemailer with better error handling
let transporter = null;

function createEmailTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Email configuration incomplete. Email notifications disabled.');
    return null;
  }

  try {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Additional options for better reliability
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 20000,
      rateLimit: 5
    });
  } catch (error) {
    console.error('Error creating email transporter:', error);
    return null;
  }
}

transporter = createEmailTransporter();

// Twilio setup for SMS with fallback if credentials missing
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch (error) {
    console.warn('Twilio initialization failed. SMS notifications disabled.', error.message);
  }
} else {
  console.warn('Twilio credentials missing or invalid. SMS notifications disabled.');
}

// Enhanced email sending with retry logic and better error handling
async function sendEmail(to, subject, text, html, retryCount = 0) {
  if (!transporter) {
    throw new Error('Email transporter not configured');
  }

  if (!notificationConfig.email.enabled) {
    console.log('Email notifications disabled');
    return { disabled: true };
  }

  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL || 'noreply@legalpro.co.ke',
    to,
    subject,
    text,
    html,
    // Additional headers for better deliverability
    headers: {
      'X-Mailer': 'LegalPro v1.0.1',
      'X-Priority': '3',
      'X-MSMail-Priority': 'Normal'
    }
  };

  try {
    // Verify transporter connection before sending
    if (retryCount === 0) {
      await transporter.verify();
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}:`, info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      to,
      subject,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error sending email to ${to} (attempt ${retryCount + 1}):`, error.message);

    // Retry logic
    if (retryCount < notificationConfig.email.retryAttempts) {
      console.log(`Retrying email send in ${notificationConfig.email.retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, notificationConfig.email.retryDelay));
      return sendEmail(to, subject, text, html, retryCount + 1);
    }

    throw new Error(`Failed to send email after ${notificationConfig.email.retryAttempts + 1} attempts: ${error.message}`);
  }
}

// Enhanced SMS sending with retry logic and better error handling
async function sendSMS(to, message, retryCount = 0) {
  if (!twilioClient) {
    throw new Error('Twilio client not configured');
  }

  if (!notificationConfig.sms.enabled) {
    console.log('SMS notifications disabled');
    return { disabled: true };
  }

  // Format phone number
  const formattedPhone = formatPhoneNumber(to);

  // Validate message length (SMS limit is typically 160 characters)
  if (message.length > 160) {
    console.warn(`SMS message length (${message.length}) exceeds 160 characters`);
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
      // Optional: Add status callback for delivery tracking
      statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL
    });

    console.log(`SMS sent successfully to ${formattedPhone}:`, result.sid);

    return {
      success: true,
      sid: result.sid,
      to: formattedPhone,
      message,
      status: result.status,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error sending SMS to ${formattedPhone} (attempt ${retryCount + 1}):`, error.message);

    // Retry logic for specific error types
    const retryableErrors = ['20003', '21610', '30001', '30002', '30003'];
    const shouldRetry = retryableErrors.includes(error.code) || error.status >= 500;

    if (shouldRetry && retryCount < notificationConfig.sms.retryAttempts) {
      console.log(`Retrying SMS send in ${notificationConfig.sms.retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, notificationConfig.sms.retryDelay));
      return sendSMS(to, message, retryCount + 1);
    }

    throw new Error(`Failed to send SMS after ${notificationConfig.sms.retryAttempts + 1} attempts: ${error.message}`);
  }
}

// Helper function to format phone numbers
function formatPhoneNumber(phone) {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Handle Kenyan numbers
  if (cleaned.startsWith('254')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `+254${cleaned.substring(1)}`;
  } else if (cleaned.length === 9) {
    return `+254${cleaned}`;
  }

  // Default: assume it's already properly formatted or international
  return phone.startsWith('+') ? phone : `+${cleaned}`;
}

// Email templates
const emailTemplates = {
  welcome: (name) => ({
    subject: 'Welcome to LegalPro - Your Legal Journey Begins',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a;">Welcome to LegalPro, ${name}!</h2>
        <p>Thank you for registering with LegalPro. We're excited to help you with your legal needs.</p>
        <p>You can now:</p>
        <ul>
          <li>Book appointments with our experienced advocates</li>
          <li>Track your cases in real-time</li>
          <li>Upload and manage documents securely</li>
          <li>Communicate directly with your legal team</li>
        </ul>
        <p>If you have any questions, don't hesitate to contact us.</p>
        <p>Best regards,<br>The LegalPro Team</p>
      </div>
    `
  }),

  appointmentConfirmation: (name, date, time, advocate) => ({
    subject: 'Appointment Confirmation - LegalPro',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a;">Appointment Confirmed</h2>
        <p>Dear ${name},</p>
        <p>Your appointment has been confirmed with the following details:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Advocate:</strong> ${advocate}</p>
        </div>
        <p>Please arrive 10 minutes early and bring any relevant documents.</p>
        <p>Best regards,<br>The LegalPro Team</p>
      </div>
    `
  }),

  caseUpdate: (name, caseTitle, status, notes) => ({
    subject: `Case Update: ${caseTitle} - LegalPro`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a;">Case Update</h2>
        <p>Dear ${name},</p>
        <p>There's an update on your case: <strong>${caseTitle}</strong></p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>New Status:</strong> ${status}</p>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
        </div>
        <p>You can view more details by logging into your dashboard.</p>
        <p>Best regards,<br>The LegalPro Team</p>
      </div>
    `
  }),

  paymentConfirmation: (name, amount, transactionId, service) => ({
    subject: 'Payment Confirmation - LegalPro',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Payment Confirmed</h2>
        <p>Dear ${name},</p>
        <p>Your payment has been successfully processed:</p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Amount:</strong> KES ${amount}</p>
          <p><strong>Service:</strong> ${service}</p>
          <p><strong>Transaction ID:</strong> ${transactionId}</p>
        </div>
        <p>Thank you for your payment. A receipt has been generated for your records.</p>
        <p>Best regards,<br>The LegalPro Team</p>
      </div>
    `
  })
};

// SMS templates
const smsTemplates = {
  appointmentReminder: (name, date, time) =>
    `Hi ${name}, reminder: You have an appointment tomorrow at ${time} on ${date}. Please arrive 10 minutes early. - LegalPro`,

  caseUpdate: (name, caseTitle, status) =>
    `Hi ${name}, update on ${caseTitle}: Status changed to ${status}. Check your dashboard for details. - LegalPro`,

  paymentConfirmation: (name, amount) =>
    `Hi ${name}, payment of KES ${amount} confirmed. Thank you! - LegalPro`
};

// Enhanced templated email sending
async function sendTemplatedEmail(to, templateName, data) {
  try {
    // Validate template data
    const validation = templateEngine.validateTemplateData(templateName, data, 'email');
    if (!validation.isValid) {
      console.warn(`Template validation warnings for ${templateName}:`, validation.errors);
    }

    // Render template
    const rendered = await templateEngine.renderEmailTemplate(templateName, data);

    // Send email
    return await sendEmail(to, rendered.subject, rendered.text, rendered.html);
  } catch (error) {
    console.error(`Error sending templated email ${templateName}:`, error);
    throw error;
  }
}

// Enhanced templated SMS sending
async function sendTemplatedSMS(to, templateName, data) {
  try {
    // Render SMS template
    const rendered = await templateEngine.renderSmsTemplate(templateName, data);

    // Log if message is too long
    if (rendered.length > rendered.maxLength) {
      console.warn(`SMS template ${templateName} exceeds max length: ${rendered.length}/${rendered.maxLength}`);
    }

    // Send SMS
    return await sendSMS(to, rendered.message);
  } catch (error) {
    console.error(`Error sending templated SMS ${templateName}:`, error);
    throw error;
  }
}

// Enhanced notification sending with configuration support
async function sendNotification(user, eventType, data, options = {}) {
  const results = {
    eventType,
    userId: user._id || user.id,
    timestamp: new Date().toISOString(),
    channels: {}
  };

  // Prepare template data
  const templateData = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    userType: user.userType || 'client',
    ...data
  };

  // Check if event type is configured
  if (!eventNotificationConfig[eventType]) {
    console.warn(`Unknown event type: ${eventType}`);
    results.error = `Unknown event type: ${eventType}`;
    return results;
  }

  // Process each notification channel
  const channels = ['email', 'sms', 'whatsapp'];
  const promises = [];

  for (const channel of channels) {
    const channelConfig = getEventConfig(eventType, channel);

    if (!channelConfig || !channelConfig.enabled) {
      results.channels[channel] = { skipped: 'disabled' };
      continue;
    }

    // Check if user has the required contact info
    if (channel === 'email' && !user.email) {
      results.channels[channel] = { skipped: 'no_email' };
      continue;
    }
    if ((channel === 'sms' || channel === 'whatsapp') && !user.phone) {
      results.channels[channel] = { skipped: 'no_phone' };
      continue;
    }

    // Check quiet hours for non-critical notifications
    if (isInQuietHours() && shouldRespectQuietHours(channelConfig.priority)) {
      results.channels[channel] = {
        skipped: 'quiet_hours',
        scheduledFor: calculateNextSendTime()
      };
      continue;
    }

    // Create promise for this channel with delay
    const promise = new Promise(async (resolve) => {
      try {
        // Apply delay if configured
        if (channelConfig.delay > 0) {
          await new Promise(delayResolve => setTimeout(delayResolve, channelConfig.delay));
        }

        let result;
        switch (channel) {
          case 'email':
            result = await sendTemplatedEmail(user.email, channelConfig.template, templateData);
            break;
          case 'sms':
            result = await sendTemplatedSMS(user.phone, channelConfig.template, templateData);
            break;
          case 'whatsapp':
            result = await sendWhatsAppNotification(user.phone, eventType, templateData);
            break;
        }

        resolve({ channel, result });
      } catch (error) {
        console.error(`Error sending ${channel} notification for ${eventType}:`, error);
        resolve({
          channel,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    promises.push(promise);
  }

  // Wait for all notifications to complete
  const channelResults = await Promise.all(promises);

  // Organize results by channel
  channelResults.forEach(({ channel, result, error }) => {
    if (error) {
      results.channels[channel] = { error };
    } else {
      results.channels[channel] = result;
    }
  });

  // Log notification summary
  console.log(`Notification sent for event ${eventType}:`, {
    userId: user._id || user.id,
    channels: Object.keys(results.channels).filter(ch => !results.channels[ch].skipped && !results.channels[ch].error)
  });

  return results;
}

// Helper function to calculate next send time outside quiet hours
function calculateNextSendTime() {
  if (!globalConfig.quietHours.enabled) {
    return null;
  }

  const now = new Date();
  const endTime = globalConfig.quietHours.end;
  const [hours, minutes] = endTime.split(':').map(Number);

  const nextSend = new Date(now);
  nextSend.setHours(hours, minutes, 0, 0);

  // If end time is tomorrow (overnight quiet hours)
  if (nextSend <= now) {
    nextSend.setDate(nextSend.getDate() + 1);
  }

  return nextSend.toISOString();
}

// Send WhatsApp notification
async function sendWhatsAppNotification(to, type, data) {
  try {
    switch (type) {
      case 'welcome':
        return await whatsappService.sendWelcomeMessage(to, data.name);

      case 'appointmentReminder':
        return await whatsappService.sendAppointmentReminder(
          to,
          data.name,
          data.date,
          data.time,
          data.advocateName
        );

      case 'caseUpdate':
        return await whatsappService.sendCaseUpdate(
          to,
          data.name,
          data.caseTitle,
          data.status,
          data.nextSteps
        );

      case 'paymentConfirmation':
        return await whatsappService.sendPaymentConfirmation(
          to,
          data.name,
          data.amount,
          data.transactionId,
          data.service
        );

      default:
        console.warn(`Unknown WhatsApp notification type: ${type}`);
        return null;
    }
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    throw error;
  }
}

module.exports = {
  sendEmail,
  sendSMS,
  sendTemplatedEmail,
  sendTemplatedSMS,
  sendNotification,
  sendWhatsAppNotification,
  emailTemplates,
  smsTemplates
};
