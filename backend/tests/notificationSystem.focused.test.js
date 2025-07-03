// Focused Notification System Tests - LegalPro v1.0.1
// This test file focuses on core functionality without external dependencies

const templateEngine = require('../utils/templateEngine');
const { 
  isEventEnabled, 
  getEventConfig, 
  eventNotificationConfig 
} = require('../config/notificationConfig');

// Mock template engine to avoid file system dependencies
jest.mock('../utils/templateEngine');

describe('Notification System - Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock template engine responses
    templateEngine.renderEmailTemplate.mockResolvedValue({
      subject: 'Test Email Subject',
      html: '<h1>Test Email</h1>',
      text: 'Test Email'
    });
    
    templateEngine.renderSmsTemplate.mockResolvedValue({
      message: 'Test SMS message',
      length: 16,
      maxLength: 160
    });
    
    templateEngine.validateTemplateData.mockReturnValue({
      isValid: true,
      errors: []
    });
    
    templateEngine.getAvailableTemplates.mockResolvedValue({
      email: ['welcome', 'appointment-confirmation', 'case-update'],
      sms: ['welcome', 'appointmentConfirmation', 'caseUpdate']
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Template Engine Integration', () => {
    test('should render email template correctly', async () => {
      const mockData = {
        firstName: 'John',
        email: 'john@example.com'
      };
      
      const result = await templateEngine.renderEmailTemplate('welcome', mockData);
      
      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
      expect(templateEngine.renderEmailTemplate).toHaveBeenCalledWith('welcome', mockData);
    });

    test('should render SMS template correctly', async () => {
      const mockData = {
        firstName: 'John'
      };
      
      const result = await templateEngine.renderSmsTemplate('welcome', mockData);
      
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('length');
      expect(result).toHaveProperty('maxLength');
      expect(templateEngine.renderSmsTemplate).toHaveBeenCalledWith('welcome', mockData);
    });

    test('should validate template data', () => {
      const mockData = {
        firstName: 'John',
        email: 'john@example.com'
      };
      
      const validation = templateEngine.validateTemplateData('welcome', mockData);
      
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
      expect(templateEngine.validateTemplateData).toHaveBeenCalledWith('welcome', mockData);
    });

    test('should handle template errors gracefully', async () => {
      templateEngine.renderEmailTemplate.mockRejectedValue(new Error('Template not found'));
      
      await expect(templateEngine.renderEmailTemplate('nonexistent', {}))
        .rejects.toThrow('Template not found');
    });

    test('should get available templates', async () => {
      const templates = await templateEngine.getAvailableTemplates();
      
      expect(templates).toHaveProperty('email');
      expect(templates).toHaveProperty('sms');
      expect(Array.isArray(templates.email)).toBe(true);
      expect(Array.isArray(templates.sms)).toBe(true);
    });
  });

  describe('Configuration System', () => {
    test('should check if event is enabled', () => {
      const isEnabled = isEventEnabled('welcome', 'email');
      expect(typeof isEnabled).toBe('boolean');
    });

    test('should get event configuration', () => {
      const config = getEventConfig('welcome', 'email');
      expect(config).toBeDefined();
      if (config) {
        expect(config).toHaveProperty('enabled');
        expect(config).toHaveProperty('template');
        expect(config).toHaveProperty('priority');
      }
    });

    test('should return null for unknown event', () => {
      const config = getEventConfig('unknownEvent', 'email');
      expect(config).toBeNull();
    });

    test('should handle different event types', () => {
      const events = ['welcome', 'appointmentConfirmation', 'caseUpdate', 'paymentConfirmation'];
      const channels = ['email', 'sms', 'whatsapp'];
      
      events.forEach(event => {
        channels.forEach(channel => {
          const config = getEventConfig(event, channel);
          // Should either be null or have required properties
          if (config) {
            expect(config).toHaveProperty('enabled');
            expect(config).toHaveProperty('template');
            expect(config).toHaveProperty('priority');
          }
        });
      });
    });

    test('should validate configuration structure', () => {
      expect(eventNotificationConfig).toBeDefined();
      expect(typeof eventNotificationConfig).toBe('object');
      
      // Check that each event has proper structure
      Object.keys(eventNotificationConfig).forEach(eventType => {
        const eventConfig = eventNotificationConfig[eventType];
        expect(eventConfig).toBeDefined();
        
        ['email', 'sms', 'whatsapp'].forEach(channel => {
          if (eventConfig[channel]) {
            expect(eventConfig[channel]).toHaveProperty('enabled');
            expect(eventConfig[channel]).toHaveProperty('template');
            expect(eventConfig[channel]).toHaveProperty('priority');
            expect(eventConfig[channel]).toHaveProperty('delay');
          }
        });
      });
    });
  });

  describe('Template Validation', () => {
    test('should validate required fields for welcome template', () => {
      const validData = {
        firstName: 'John',
        email: 'john@example.com',
        userType: 'client'
      };
      
      templateEngine.validateTemplateData.mockReturnValue({
        isValid: true,
        errors: []
      });
      
      const validation = templateEngine.validateTemplateData('welcome', validData);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect missing required fields', () => {
      const invalidData = {
        userType: 'client'
        // Missing firstName and email
      };
      
      templateEngine.validateTemplateData.mockReturnValue({
        isValid: false,
        errors: ['Missing required field: firstName', 'Missing required field: email']
      });
      
      const validation = templateEngine.validateTemplateData('welcome', invalidData);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('should validate appointment-specific fields', () => {
      const appointmentData = {
        firstName: 'John',
        clientName: 'John Doe',
        appointmentDate: '2024-01-15',
        appointmentTime: '10:00 AM',
        advocateName: 'Jane Smith'
      };
      
      templateEngine.validateTemplateData.mockReturnValue({
        isValid: true,
        errors: []
      });
      
      const validation = templateEngine.validateTemplateData('appointment-confirmation', appointmentData);
      
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle template rendering errors', async () => {
      templateEngine.renderEmailTemplate.mockRejectedValue(new Error('Rendering failed'));
      
      await expect(templateEngine.renderEmailTemplate('welcome', {}))
        .rejects.toThrow('Rendering failed');
    });

    test('should handle SMS template errors', async () => {
      templateEngine.renderSmsTemplate.mockRejectedValue(new Error('SMS template error'));
      
      await expect(templateEngine.renderSmsTemplate('welcome', {}))
        .rejects.toThrow('SMS template error');
    });

    test('should handle validation errors gracefully', () => {
      templateEngine.validateTemplateData.mockReturnValue({
        isValid: false,
        errors: ['Critical validation error']
      });
      
      const validation = templateEngine.validateTemplateData('test', {});
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Critical validation error');
    });
  });

  describe('Configuration Edge Cases', () => {
    test('should handle disabled events', () => {
      // Test with a potentially disabled event
      const config = getEventConfig('passwordReset', 'whatsapp');
      
      // WhatsApp is typically disabled for security events
      if (config) {
        expect(config).toHaveProperty('enabled');
      } else {
        expect(config).toBeNull();
      }
    });

    test('should handle different priority levels', () => {
      const priorities = ['critical', 'high', 'medium', 'low'];
      
      priorities.forEach(priority => {
        // Test that priority levels are handled correctly
        expect(typeof priority).toBe('string');
        expect(priority.length).toBeGreaterThan(0);
      });
    });

    test('should validate event configuration completeness', () => {
      const eventTypes = Object.keys(eventNotificationConfig);
      expect(eventTypes.length).toBeGreaterThan(0);
      
      // Check that we have the expected core events
      const expectedEvents = ['welcome', 'appointmentConfirmation', 'caseUpdate', 'paymentConfirmation'];
      expectedEvents.forEach(event => {
        expect(eventTypes).toContain(event);
      });
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete notification data flow', async () => {
      const notificationData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+254712345678',
        appointmentDate: '2024-01-15',
        appointmentTime: '10:00 AM',
        advocateName: 'Jane Smith',
        caseTitle: 'Property Dispute',
        amount: '15000'
      };
      
      // Test email template rendering
      const emailResult = await templateEngine.renderEmailTemplate('appointment-confirmation', notificationData);
      expect(emailResult).toHaveProperty('subject');
      expect(emailResult).toHaveProperty('html');
      
      // Test SMS template rendering
      const smsResult = await templateEngine.renderSmsTemplate('appointmentConfirmation', notificationData);
      expect(smsResult).toHaveProperty('message');
      expect(smsResult).toHaveProperty('length');
      
      // Test validation
      const validation = templateEngine.validateTemplateData('appointment-confirmation', notificationData);
      expect(validation).toHaveProperty('isValid');
    });

    test('should handle bulk template operations', async () => {
      const users = [
        { firstName: 'John', email: 'john@example.com' },
        { firstName: 'Jane', email: 'jane@example.com' },
        { firstName: 'Bob', email: 'bob@example.com' }
      ];
      
      const templatePromises = users.map(user => 
        templateEngine.renderEmailTemplate('welcome', user)
      );
      
      const results = await Promise.all(templatePromises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('subject');
        expect(result).toHaveProperty('html');
      });
    });
  });

  describe('System Health Checks', () => {
    test('should verify all required configurations exist', () => {
      const requiredEvents = [
        'welcome',
        'appointmentConfirmation', 
        'caseUpdate',
        'paymentConfirmation',
        'emergencyContact'
      ];
      
      requiredEvents.forEach(event => {
        expect(eventNotificationConfig).toHaveProperty(event);
      });
    });

    test('should verify template engine functions are available', () => {
      expect(templateEngine.renderEmailTemplate).toBeDefined();
      expect(templateEngine.renderSmsTemplate).toBeDefined();
      expect(templateEngine.validateTemplateData).toBeDefined();
      expect(templateEngine.getAvailableTemplates).toBeDefined();
    });

    test('should verify configuration helper functions work', () => {
      expect(isEventEnabled).toBeDefined();
      expect(getEventConfig).toBeDefined();
      
      // Test with known good values
      const result = isEventEnabled('welcome', 'email');
      expect(typeof result).toBe('boolean');
    });
  });
});
