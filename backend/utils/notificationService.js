// Notification service for LegalPro v1.0.1
const nodemailer = require('nodemailer');
const twilio = require('twilio');
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

module.exports = {
  sendEmail,
  sendSMS,
};
