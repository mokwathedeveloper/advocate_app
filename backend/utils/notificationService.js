// Notification service for LegalPro v1.0.1
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const whatsappService = require('./whatsappService');
require('dotenv').config();

// Email setup using Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Twilio setup for SMS with fallback if credentials missing
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
} else {
  console.warn('Twilio credentials missing. SMS notifications disabled.');
}

// Send email notification
async function sendEmail(to, subject, text, html) {
  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Send SMS notification
async function sendSMS(to, body) {
  if (!twilioClient) {
    console.warn('Twilio client not initialized. SMS not sent.');
    return null;
  }
  try {
    const message = await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    console.log('SMS sent:', message.sid);
    return message;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
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
  }),

  // Appointment-related templates
  appointmentConfirmation: (name, title, date, time, advocateName, location) => ({
    subject: 'Appointment Confirmed - LegalPro',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Appointment Confirmed</h2>
        <p>Dear ${name},</p>
        <p>Your appointment has been successfully scheduled:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>With:</strong> ${advocateName}</p>
          <p><strong>Location:</strong> ${location}</p>
        </div>
        <p>Please arrive 10 minutes early for your appointment.</p>
        <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
        <p>Best regards,<br>LegalPro Team</p>
      </div>
    `
  }),

  appointmentScheduled: (name, title, date, time, clientName, location) => ({
    subject: 'New Appointment Scheduled - LegalPro',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">New Appointment Scheduled</h2>
        <p>Dear ${name},</p>
        <p>A new appointment has been scheduled with you:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Client:</strong> ${clientName}</p>
          <p><strong>Location:</strong> ${location}</p>
        </div>
        <p>Please review your calendar and prepare for the meeting.</p>
        <p>Best regards,<br>LegalPro Team</p>
      </div>
    `
  }),

  appointmentReminder: (name, title, date, time, advocateName, location, hoursAhead) => ({
    subject: `Appointment Reminder - ${hoursAhead}h Notice - LegalPro`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Appointment Reminder</h2>
        <p>Dear ${name},</p>
        <p>This is a reminder that you have an appointment in ${hoursAhead} hours:</p>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>With:</strong> ${advocateName}</p>
          <p><strong>Location:</strong> ${location}</p>
        </div>
        <p>Please arrive 10 minutes early for your appointment.</p>
        <p>If you need to reschedule or cancel, please contact us immediately.</p>
        <p>Best regards,<br>LegalPro Team</p>
      </div>
    `
  }),

  appointmentCancelled: (name, title, date, time, reason, cancelledBy) => ({
    subject: 'Appointment Cancelled - LegalPro',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Appointment Cancelled</h2>
        <p>Dear ${name},</p>
        <p>Your appointment has been cancelled:</p>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Cancelled by:</strong> ${cancelledBy}</p>
          <p><strong>Reason:</strong> ${reason}</p>
        </div>
        <p>If you would like to reschedule, please contact us to book a new appointment.</p>
        <p>We apologize for any inconvenience caused.</p>
        <p>Best regards,<br>LegalPro Team</p>
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

// Send templated email
async function sendTemplatedEmail(to, templateName, data) {
  try {
    const template = emailTemplates[templateName];
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const { subject, html } = template(data.name, ...Object.values(data).slice(1));
    return await sendEmail(to, subject, '', html);
  } catch (error) {
    console.error('Error sending templated email:', error);
    throw error;
  }
}

// Send templated SMS
async function sendTemplatedSMS(to, templateName, data) {
  try {
    const template = smsTemplates[templateName];
    if (!template) {
      throw new Error(`SMS template '${templateName}' not found`);
    }

    const message = template(data.name, ...Object.values(data).slice(1));
    return await sendSMS(to, message);
  } catch (error) {
    console.error('Error sending templated SMS:', error);
    throw error;
  }
}

// Send notification (email + SMS + WhatsApp)
async function sendNotification(user, type, data) {
  const results = {};

  // Send email
  if (user.email) {
    try {
      results.email = await sendTemplatedEmail(user.email, type, { name: user.firstName, ...data });
    } catch (error) {
      results.email = { error: error.message };
    }
  }

  // Send SMS
  if (user.phone) {
    try {
      results.sms = await sendTemplatedSMS(user.phone, type, { name: user.firstName, ...data });
    } catch (error) {
      results.sms = { error: error.message };
    }
  }

  // Send WhatsApp
  if (user.phone && user.preferences?.whatsappNotifications !== false) {
    try {
      results.whatsapp = await sendWhatsAppNotification(user.phone, type, { name: user.firstName, ...data });
    } catch (error) {
      results.whatsapp = { error: error.message };
    }
  }

  return results;
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
