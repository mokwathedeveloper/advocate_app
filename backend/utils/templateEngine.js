// Enhanced Template Engine for LegalPro v1.0.1
const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');

class TemplateEngine {
  constructor() {
    this.emailTemplatesPath = path.join(__dirname, '../templates/email');
    this.smsTemplatesPath = path.join(__dirname, '../templates/sms');
    this.compiledTemplates = new Map();
    this.smsTemplates = null;
    
    // Register Handlebars helpers
    this.registerHelpers();
  }

  // Register custom Handlebars helpers
  registerHelpers() {
    // Format date helper
    Handlebars.registerHelper('formatDate', function(date, format) {
      if (!date) return '';
      const d = new Date(date);
      
      switch (format) {
        case 'short':
          return d.toLocaleDateString('en-KE');
        case 'long':
          return d.toLocaleDateString('en-KE', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        case 'time':
          return d.toLocaleTimeString('en-KE', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
        case 'datetime':
          return d.toLocaleString('en-KE');
        default:
          return d.toLocaleDateString('en-KE');
      }
    });

    // Format currency helper
    Handlebars.registerHelper('formatCurrency', function(amount) {
      if (!amount) return 'KES 0';
      return `KES ${parseFloat(amount).toLocaleString('en-KE')}`;
    });

    // Conditional helper
    Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    // Status class helper for styling
    Handlebars.registerHelper('statusClass', function(status) {
      if (!status || typeof status !== 'string') {
        return 'pending';
      }
      const statusMap = {
        'active': 'active',
        'pending': 'pending',
        'completed': 'completed',
        'closed': 'closed',
        'cancelled': 'closed',
        'in progress': 'active',
        'under review': 'pending'
      };
      return statusMap[status.toLowerCase()] || 'pending';
    });

    // Truncate text helper
    Handlebars.registerHelper('truncate', function(text, length) {
      if (!text) return '';
      if (text.length <= length) return text;
      return text.substring(0, length) + '...';
    });

    // Generate dashboard URL helper
    Handlebars.registerHelper('dashboardUrl', function(path = '') {
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return `${baseUrl}/dashboard${path}`;
    });
  }

  // Load and compile email template
  async loadEmailTemplate(templateName) {
    try {
      // Check if template is already compiled
      const cacheKey = `email_${templateName}`;
      if (this.compiledTemplates.has(cacheKey)) {
        return this.compiledTemplates.get(cacheKey);
      }

      // Load template file
      const templatePath = path.join(this.emailTemplatesPath, `${templateName}.html`);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      
      // Compile template
      const compiledTemplate = Handlebars.compile(templateContent);
      
      // Cache compiled template
      this.compiledTemplates.set(cacheKey, compiledTemplate);
      
      return compiledTemplate;
    } catch (error) {
      console.error(`Error loading email template ${templateName}:`, error);
      throw new Error(`Email template '${templateName}' not found or invalid`);
    }
  }

  // Load SMS templates
  async loadSmsTemplates() {
    try {
      if (this.smsTemplates) {
        return this.smsTemplates;
      }

      const templatesPath = path.join(this.smsTemplatesPath, 'templates.json');
      const templatesContent = await fs.readFile(templatesPath, 'utf8');
      this.smsTemplates = JSON.parse(templatesContent);
      
      return this.smsTemplates;
    } catch (error) {
      console.error('Error loading SMS templates:', error);
      throw new Error('SMS templates not found or invalid');
    }
  }

  // Render email template
  async renderEmailTemplate(templateName, data) {
    try {
      const template = await this.loadEmailTemplate(templateName);
      
      // Add default data
      const templateData = {
        ...data,
        currentYear: new Date().getFullYear(),
        companyName: 'LegalPro',
        supportEmail: 'support@legalpro.co.ke',
        supportPhone: '+254 726 745 739',
        websiteUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
        dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`
      };

      const renderedHtml = template(templateData);
      
      // Generate subject based on template name if not provided
      const subject = data.subject || this.generateEmailSubject(templateName, data);
      
      return {
        subject,
        html: renderedHtml,
        text: this.htmlToText(renderedHtml)
      };
    } catch (error) {
      console.error(`Error rendering email template ${templateName}:`, error);
      throw error;
    }
  }

  // Render SMS template
  async renderSmsTemplate(templateName, data) {
    try {
      const templates = await this.loadSmsTemplates();
      const template = templates[templateName];
      
      if (!template) {
        throw new Error(`SMS template '${templateName}' not found`);
      }

      // Validate required variables
      const missingVars = template.variables.filter(variable => 
        data[variable] === undefined || data[variable] === null
      );
      
      if (missingVars.length > 0) {
        console.warn(`Missing variables for SMS template ${templateName}:`, missingVars);
      }

      // Replace variables in message
      let message = template.message;
      template.variables.forEach(variable => {
        const value = data[variable] || `[${variable}]`;
        message = message.replace(new RegExp(`{{${variable}}}`, 'g'), value);
      });

      // Check message length
      if (message.length > template.maxLength) {
        console.warn(`SMS message exceeds max length (${message.length}/${template.maxLength})`);
      }

      return {
        message,
        length: message.length,
        maxLength: template.maxLength,
        variables: template.variables
      };
    } catch (error) {
      console.error(`Error rendering SMS template ${templateName}:`, error);
      throw error;
    }
  }

  // Generate email subject based on template name
  generateEmailSubject(templateName, data) {
    const subjects = {
      'welcome': `Welcome to LegalPro, ${data.firstName || 'Valued Client'}!`,
      'appointment-confirmation': `Appointment Confirmed - ${data.appointmentDate || 'LegalPro'}`,
      'appointment-reminder': `Appointment Reminder - Tomorrow at ${data.appointmentTime || 'Scheduled Time'}`,
      'case-update': `Case Update: ${data.caseTitle || 'Your Case'}`,
      'payment-confirmation': `Payment Confirmed - KES ${data.amount || '0'}`,
      'password-reset': 'Password Reset Request - LegalPro',
      'document-request': `Documents Required - ${data.caseTitle || 'Your Case'}`,
      'hearing-notice': `Court Hearing Notice - ${data.caseTitle || 'Your Case'}`
    };

    return subjects[templateName] || `Notification from LegalPro`;
  }

  // Convert HTML to plain text (basic implementation)
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  // Validate template data
  validateTemplateData(templateName, data, type = 'email') {
    const errors = [];
    
    // Common required fields
    const commonRequired = ['firstName'];
    
    // Template-specific required fields
    const requiredFields = {
      'welcome': ['email', 'userType'],
      'appointment-confirmation': ['clientName', 'appointmentDate', 'appointmentTime', 'advocateName'],
      'case-update': ['clientName', 'caseTitle', 'status', 'updateMessage'],
      'payment-confirmation': ['clientName', 'amount', 'transactionId', 'service']
    };

    const required = [...commonRequired, ...(requiredFields[templateName] || [])];
    
    required.forEach(field => {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get available templates
  async getAvailableTemplates() {
    try {
      const emailFiles = await fs.readdir(this.emailTemplatesPath);
      const emailTemplates = emailFiles
        .filter(file => file.endsWith('.html'))
        .map(file => file.replace('.html', ''));

      const smsTemplates = await this.loadSmsTemplates();
      
      return {
        email: emailTemplates,
        sms: Object.keys(smsTemplates)
      };
    } catch (error) {
      console.error('Error getting available templates:', error);
      return { email: [], sms: [] };
    }
  }

  // Clear template cache
  clearCache() {
    this.compiledTemplates.clear();
    this.smsTemplates = null;
    console.log('Template cache cleared');
  }
}

module.exports = new TemplateEngine();
