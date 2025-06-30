// WhatsApp Business API Service for LegalPro v1.0.1
const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_BUSINESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.businessPhoneNumber = process.env.WHATSAPP_BUSINESS_PHONE_NUMBER || '254726745739';
    this.baseUrl = 'https://graph.facebook.com/v18.0';
    
    if (!this.accessToken || !this.phoneNumberId) {
      console.warn('WhatsApp Business API credentials missing. WhatsApp notifications disabled.');
    }
  }

  // Send a text message
  async sendTextMessage(to, message) {
    if (!this.accessToken || !this.phoneNumberId) {
      console.warn('WhatsApp credentials not configured. Message not sent.');
      return null;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(to),
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('WhatsApp message sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send a template message
  async sendTemplateMessage(to, templateName, languageCode = 'en', components = []) {
    if (!this.accessToken || !this.phoneNumberId) {
      console.warn('WhatsApp credentials not configured. Template message not sent.');
      return null;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(to),
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: languageCode
            },
            components: components
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('WhatsApp template message sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp template message:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send appointment reminder
  async sendAppointmentReminder(to, clientName, appointmentDate, appointmentTime, advocateName) {
    const message = `Hi ${clientName}! 📅

This is a reminder about your upcoming appointment:

🗓️ Date: ${appointmentDate}
⏰ Time: ${appointmentTime}
👨‍💼 Advocate: ${advocateName}

📍 Location: LegalPro Chambers, Utalii House, Nairobi CBD

Please arrive 10 minutes early. If you need to reschedule, please contact us immediately.

Thank you!
- LegalPro Team`;

    return await this.sendTextMessage(to, message);
  }

  // Send case update notification
  async sendCaseUpdate(to, clientName, caseTitle, newStatus, nextSteps = '') {
    const message = `Hi ${clientName}! ⚖️

Update on your case: "${caseTitle}"

📋 New Status: ${newStatus}

${nextSteps ? `📝 Next Steps: ${nextSteps}` : ''}

For more details, please log into your LegalPro dashboard or contact your advocate.

- LegalPro Team`;

    return await this.sendTextMessage(to, message);
  }

  // Send payment confirmation
  async sendPaymentConfirmation(to, clientName, amount, transactionId, service) {
    const message = `Hi ${clientName}! ✅

Your payment has been confirmed:

💰 Amount: KES ${amount}
🧾 Transaction ID: ${transactionId}
📋 Service: ${service}

Thank you for your payment. A receipt has been generated and sent to your email.

- LegalPro Team`;

    return await this.sendTextMessage(to, message);
  }

  // Send welcome message for new clients
  async sendWelcomeMessage(to, clientName) {
    const message = `Welcome to LegalPro, ${clientName}! 🎉

Thank you for choosing us for your legal needs. Here's what you can do:

✅ Book appointments online
✅ Track your cases in real-time
✅ Upload documents securely
✅ Chat with your advocate
✅ Make payments via M-Pesa

Need help? Just reply to this message or call us at +254 726 745 739.

- LegalPro Team`;

    return await this.sendTextMessage(to, message);
  }

  // Send court date reminder
  async sendCourtDateReminder(to, clientName, courtDate, courtTime, courtLocation, caseTitle) {
    const message = `Important Court Reminder! ⚖️

Hi ${clientName},

You have a court appearance:

📋 Case: ${caseTitle}
🗓️ Date: ${courtDate}
⏰ Time: ${courtTime}
🏛️ Location: ${courtLocation}

Please ensure you arrive at least 30 minutes early. Bring all required documents.

Contact your advocate if you have any questions.

- LegalPro Team`;

    return await this.sendTextMessage(to, message);
  }

  // Format phone number for WhatsApp API
  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Kenyan numbers
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  }

  // Validate phone number
  isValidPhoneNumber(phoneNumber) {
    const formatted = this.formatPhoneNumber(phoneNumber);
    return /^254[17]\d{8}$/.test(formatted); // Kenyan mobile numbers
  }

  // Generate WhatsApp chat URL
  generateChatUrl(phoneNumber, message = '') {
    const formatted = this.formatPhoneNumber(phoneNumber);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formatted}${message ? `?text=${encodedMessage}` : ''}`;
  }

  // Handle webhook verification (for WhatsApp Business API)
  verifyWebhook(mode, token, challenge) {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'legalpro_webhook_verify';
    
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WhatsApp webhook verified');
      return challenge;
    }
    
    return null;
  }

  // Process incoming WhatsApp messages
  async processIncomingMessage(messageData) {
    try {
      const { from, text, timestamp } = messageData;
      
      console.log('Incoming WhatsApp message:', {
        from,
        message: text?.body,
        timestamp
      });

      // Auto-reply logic
      const autoReply = this.generateAutoReply(text?.body);
      if (autoReply) {
        await this.sendTextMessage(from, autoReply);
      }

      // Store message in database (implement as needed)
      // await this.storeIncomingMessage(messageData);

      return true;
    } catch (error) {
      console.error('Error processing incoming WhatsApp message:', error);
      return false;
    }
  }

  // Generate auto-reply based on message content
  generateAutoReply(messageText) {
    if (!messageText) return null;

    const text = messageText.toLowerCase();

    if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
      return `Hello! 👋 Welcome to LegalPro. How can we assist you today?

You can:
📞 Book a consultation
⚖️ Ask about our services
📋 Get case updates
💰 Make payments

Our team will respond shortly during business hours (Mon-Fri 8AM-6PM, Sat 9AM-2PM).`;
    }

    if (text.includes('appointment') || text.includes('booking') || text.includes('consultation')) {
      return `📅 To book an appointment:

1. Visit our website: legalpro.co.ke
2. Call us: +254 726 745 739
3. Or continue this chat - our team will assist you

What type of legal service do you need?`;
    }

    if (text.includes('price') || text.includes('cost') || text.includes('fee')) {
      return `💰 Our consultation fees vary by service:

• Initial Consultation: KES 2,000
• Family Law: From KES 5,000
• Corporate Law: From KES 10,000
• Property Law: From KES 7,500

For detailed pricing, please book a consultation or call +254 726 745 739.`;
    }

    if (text.includes('hours') || text.includes('time') || text.includes('open')) {
      return `🕒 Our Business Hours:

Monday - Friday: 8:00 AM - 6:00 PM
Saturday: 9:00 AM - 2:00 PM
Sunday: Closed

📍 Location: LegalPro Chambers, 5th Floor, Utalii House, Uhuru Highway, Nairobi CBD

For emergencies, please call +254 726 745 739.`;
    }

    // Default auto-reply
    return `Thank you for contacting LegalPro! 🏛️

Our team has received your message and will respond shortly during business hours.

For immediate assistance:
📞 Call: +254 726 745 739
🌐 Visit: legalpro.co.ke

Business Hours: Mon-Fri 8AM-6PM, Sat 9AM-2PM`;
  }
}

module.exports = new WhatsAppService();
