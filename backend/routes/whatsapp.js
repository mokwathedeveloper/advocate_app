// WhatsApp webhook routes for LegalPro v1.0.1
const express = require('express');
const router = express.Router();
const whatsappService = require('../utils/whatsappService');

// Webhook verification endpoint
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verificationResult = whatsappService.verifyWebhook(mode, token, challenge);
  
  if (verificationResult) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});

// Webhook endpoint for receiving messages
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Check if this is a WhatsApp message
    if (body.object === 'whatsapp_business_account') {
      body.entry.forEach(async (entry) => {
        const changes = entry.changes;
        
        changes.forEach(async (change) => {
          if (change.field === 'messages') {
            const messages = change.value.messages;
            
            if (messages) {
              messages.forEach(async (message) => {
                await whatsappService.processIncomingMessage(message);
              });
            }
          }
        });
      });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Send WhatsApp message endpoint
router.post('/send-message', async (req, res) => {
  try {
    const { to, message, type = 'text' } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and message are required'
      });
    }

    let result;
    if (type === 'template') {
      const { templateName, languageCode, components } = req.body;
      result = await whatsappService.sendTemplateMessage(to, templateName, languageCode, components);
    } else {
      result = await whatsappService.sendTextMessage(to, message);
    }

    res.json({
      success: true,
      message: 'WhatsApp message sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send WhatsApp message',
      error: error.message
    });
  }
});

// Send appointment reminder
router.post('/send-appointment-reminder', async (req, res) => {
  try {
    const { to, clientName, appointmentDate, appointmentTime, advocateName } = req.body;

    if (!to || !clientName || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: to, clientName, appointmentDate, appointmentTime'
      });
    }

    const result = await whatsappService.sendAppointmentReminder(
      to, 
      clientName, 
      appointmentDate, 
      appointmentTime, 
      advocateName
    );

    res.json({
      success: true,
      message: 'Appointment reminder sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending appointment reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send appointment reminder',
      error: error.message
    });
  }
});

// Send case update notification
router.post('/send-case-update', async (req, res) => {
  try {
    const { to, clientName, caseTitle, newStatus, nextSteps } = req.body;

    if (!to || !clientName || !caseTitle || !newStatus) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: to, clientName, caseTitle, newStatus'
      });
    }

    const result = await whatsappService.sendCaseUpdate(
      to, 
      clientName, 
      caseTitle, 
      newStatus, 
      nextSteps
    );

    res.json({
      success: true,
      message: 'Case update sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending case update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send case update',
      error: error.message
    });
  }
});

// Send payment confirmation
router.post('/send-payment-confirmation', async (req, res) => {
  try {
    const { to, clientName, amount, transactionId, service } = req.body;

    if (!to || !clientName || !amount || !transactionId || !service) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: to, clientName, amount, transactionId, service'
      });
    }

    const result = await whatsappService.sendPaymentConfirmation(
      to, 
      clientName, 
      amount, 
      transactionId, 
      service
    );

    res.json({
      success: true,
      message: 'Payment confirmation sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send payment confirmation',
      error: error.message
    });
  }
});

// Send welcome message
router.post('/send-welcome-message', async (req, res) => {
  try {
    const { to, clientName } = req.body;

    if (!to || !clientName) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and client name are required'
      });
    }

    const result = await whatsappService.sendWelcomeMessage(to, clientName);

    res.json({
      success: true,
      message: 'Welcome message sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending welcome message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send welcome message',
      error: error.message
    });
  }
});

// Generate WhatsApp chat URL
router.post('/generate-chat-url', (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const chatUrl = whatsappService.generateChatUrl(phoneNumber, message);

    res.json({
      success: true,
      message: 'WhatsApp chat URL generated successfully',
      data: {
        url: chatUrl,
        phoneNumber: whatsappService.formatPhoneNumber(phoneNumber)
      }
    });
  } catch (error) {
    console.error('Error generating WhatsApp chat URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate WhatsApp chat URL',
      error: error.message
    });
  }
});

// Validate phone number
router.post('/validate-phone', (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const isValid = whatsappService.isValidPhoneNumber(phoneNumber);
    const formatted = whatsappService.formatPhoneNumber(phoneNumber);

    res.json({
      success: true,
      data: {
        isValid,
        formatted,
        original: phoneNumber
      }
    });
  } catch (error) {
    console.error('Error validating phone number:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate phone number',
      error: error.message
    });
  }
});

module.exports = router;
