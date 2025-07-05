// Template Engine Tests for LegalPro v1.0.1
const templateEngine = require('../utils/templateEngine');
const fs = require('fs').promises;
const path = require('path');

// Mock fs for testing
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    readdir: jest.fn()
  }
}));

describe('Template Engine', () => {
  const mockTemplateData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    appointmentDate: '2024-01-15',
    appointmentTime: '10:00 AM',
    advocateName: 'Jane Smith',
    amount: '5000',
    caseTitle: 'Property Dispute'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Clear template cache before each test
    templateEngine.clearCache();
  });

  describe('Email Template Rendering', () => {
    test('should load and compile email template', async () => {
      const mockHtmlTemplate = `
        <h1>Welcome {{firstName}}!</h1>
        <p>Your appointment is on {{appointmentDate}} at {{appointmentTime}}</p>
        <p>Amount: {{formatCurrency amount}}</p>
      `;
      
      fs.readFile.mockResolvedValue(mockHtmlTemplate);
      
      const result = await templateEngine.renderEmailTemplate('welcome', mockTemplateData);
      
      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
      expect(result.html).toContain('Welcome John!');
      expect(result.html).toContain('2024-01-15');
      expect(result.html).toContain('10:00 AM');
    });

    test('should cache compiled templates', async () => {
      const mockHtmlTemplate = '<h1>Test Template</h1>';
      fs.readFile.mockResolvedValue(mockHtmlTemplate);
      
      // First call
      await templateEngine.renderEmailTemplate('test', mockTemplateData);
      
      // Second call should use cache
      await templateEngine.renderEmailTemplate('test', mockTemplateData);
      
      // fs.readFile should only be called once
      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    test('should handle template not found error', async () => {
      fs.readFile.mockRejectedValue(new Error('ENOENT: no such file'));
      
      await expect(templateEngine.renderEmailTemplate('nonexistent', mockTemplateData))
        .rejects.toThrow("Email template 'nonexistent' not found or invalid");
    });

    test('should generate appropriate email subjects', async () => {
      const mockHtmlTemplate = '<h1>Test</h1>';
      fs.readFile.mockResolvedValue(mockHtmlTemplate);
      
      const welcomeResult = await templateEngine.renderEmailTemplate('welcome', mockTemplateData);
      expect(welcomeResult.subject).toContain('Welcome');
      expect(welcomeResult.subject).toContain('John');
      
      const appointmentResult = await templateEngine.renderEmailTemplate('appointment-confirmation', {
        ...mockTemplateData,
        appointmentDate: '2024-01-15'
      });
      expect(appointmentResult.subject).toContain('Appointment Confirmed');
      expect(appointmentResult.subject).toContain('2024-01-15');
    });

    test('should convert HTML to plain text', async () => {
      const mockHtmlTemplate = `
        <h1>Welcome {{firstName}}!</h1>
        <p>This is a <strong>test</strong> email with <em>formatting</em>.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      `;
      
      fs.readFile.mockResolvedValue(mockHtmlTemplate);
      
      const result = await templateEngine.renderEmailTemplate('test', mockTemplateData);
      
      expect(result.text).not.toContain('<h1>');
      expect(result.text).not.toContain('<p>');
      expect(result.text).not.toContain('<strong>');
      expect(result.text).toContain('Welcome John!');
      expect(result.text).toContain('test');
    });
  });

  describe('SMS Template Rendering', () => {
    test('should load and render SMS template', async () => {
      const mockSmsTemplates = {
        welcome: {
          message: 'Welcome {{firstName}}! Your account is active.',
          maxLength: 160,
          variables: ['firstName']
        }
      };
      
      fs.readFile.mockResolvedValue(JSON.stringify(mockSmsTemplates));
      
      const result = await templateEngine.renderSmsTemplate('welcome', mockTemplateData);
      
      expect(result.message).toBe('Welcome John! Your account is active.');
      expect(result.length).toBe(result.message.length);
      expect(result.maxLength).toBe(160);
      expect(result.variables).toEqual(['firstName']);
    });

    test('should handle missing SMS template', async () => {
      const mockSmsTemplates = {
        welcome: {
          message: 'Welcome!',
          maxLength: 160,
          variables: []
        }
      };
      
      fs.readFile.mockResolvedValue(JSON.stringify(mockSmsTemplates));
      
      await expect(templateEngine.renderSmsTemplate('nonexistent', mockTemplateData))
        .rejects.toThrow("SMS template 'nonexistent' not found");
    });

    test('should warn about missing variables', async () => {
      const mockSmsTemplates = {
        test: {
          message: 'Hello {{firstName}} {{lastName}}!',
          maxLength: 160,
          variables: ['firstName', 'lastName', 'missingVar']
        }
      };
      
      fs.readFile.mockResolvedValue(JSON.stringify(mockSmsTemplates));
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = await templateEngine.renderSmsTemplate('test', {
        firstName: 'John',
        lastName: 'Doe'
        // missingVar is not provided
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missing variables'),
        expect.arrayContaining(['missingVar'])
      );
      
      consoleSpy.mockRestore();
    });

    test('should replace missing variables with placeholder', async () => {
      const mockSmsTemplates = {
        test: {
          message: 'Hello {{firstName}} {{missingVar}}!',
          maxLength: 160,
          variables: ['firstName', 'missingVar']
        }
      };
      
      fs.readFile.mockResolvedValue(JSON.stringify(mockSmsTemplates));
      
      const result = await templateEngine.renderSmsTemplate('test', {
        firstName: 'John'
      });
      
      expect(result.message).toBe('Hello John [missingVar]!');
    });
  });

  describe('Handlebars Helpers', () => {
    test('should format dates correctly', async () => {
      const mockHtmlTemplate = `
        <p>Short: {{formatDate testDate 'short'}}</p>
        <p>Long: {{formatDate testDate 'long'}}</p>
        <p>Time: {{formatDate testDate 'time'}}</p>
      `;
      
      fs.readFile.mockResolvedValue(mockHtmlTemplate);
      
      const testData = {
        ...mockTemplateData,
        testDate: '2024-01-15T10:30:00Z'
      };
      
      const result = await templateEngine.renderEmailTemplate('test', testData);
      
      expect(result.html).toContain('Short:');
      expect(result.html).toContain('Long:');
      expect(result.html).toContain('Time:');
    });

    test('should format currency correctly', async () => {
      const mockHtmlTemplate = '<p>Amount: {{formatCurrency amount}}</p>';
      
      fs.readFile.mockResolvedValue(mockHtmlTemplate);
      
      const result = await templateEngine.renderEmailTemplate('test', {
        amount: 5000
      });
      
      expect(result.html).toContain('KES 5,000');
    });

    test('should handle conditional logic', async () => {
      const mockHtmlTemplate = `
        {{#if notes}}
        <p>Notes: {{notes}}</p>
        {{/if}}
        {{#ifEquals status 'confirmed'}}
        <p>Status is confirmed</p>
        {{/ifEquals}}
      `;
      
      fs.readFile.mockResolvedValue(mockHtmlTemplate);
      
      const result = await templateEngine.renderEmailTemplate('test', {
        notes: 'Important notes',
        status: 'confirmed'
      });
      
      expect(result.html).toContain('Notes: Important notes');
      expect(result.html).toContain('Status is confirmed');
    });

    test('should generate dashboard URLs', async () => {
      const mockHtmlTemplate = '<a href="{{dashboardUrl \'/cases\'}}">View Cases</a>';
      
      fs.readFile.mockResolvedValue(mockHtmlTemplate);
      
      const result = await templateEngine.renderEmailTemplate('test', mockTemplateData);
      
      expect(result.html).toContain('href="');
      expect(result.html).toContain('/dashboard/cases');
    });
  });

  describe('Template Validation', () => {
    test('should validate required fields', () => {
      const validation = templateEngine.validateTemplateData('welcome', {
        firstName: 'John',
        email: 'john@example.com',
        userType: 'client'
      });
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect missing required fields', () => {
      const validation = templateEngine.validateTemplateData('welcome', {
        // Missing firstName and email
        userType: 'client'
      });
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Missing required field: firstName');
      expect(validation.errors).toContain('Missing required field: email');
    });

    test('should validate appointment-specific fields', () => {
      const validation = templateEngine.validateTemplateData('appointment-confirmation', {
        firstName: 'John',
        clientName: 'John Doe',
        appointmentDate: '2024-01-15',
        appointmentTime: '10:00 AM',
        advocateName: 'Jane Smith'
      });
      
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Available Templates', () => {
    test('should list available email and SMS templates', async () => {
      fs.readdir.mockResolvedValue(['welcome.html', 'appointment-confirmation.html']);
      fs.readFile.mockResolvedValue(JSON.stringify({
        welcome: { message: 'test', maxLength: 160, variables: [] },
        appointmentConfirmation: { message: 'test', maxLength: 160, variables: [] }
      }));
      
      const templates = await templateEngine.getAvailableTemplates();
      
      expect(templates.email).toContain('welcome');
      expect(templates.email).toContain('appointment-confirmation');
      expect(templates.sms).toContain('welcome');
      expect(templates.sms).toContain('appointmentConfirmation');
    });
  });

  describe('Cache Management', () => {
    test('should clear template cache', async () => {
      const mockHtmlTemplate = '<h1>Test</h1>';
      fs.readFile.mockResolvedValue(mockHtmlTemplate);
      
      // Load template to cache it
      await templateEngine.renderEmailTemplate('test', mockTemplateData);
      expect(fs.readFile).toHaveBeenCalledTimes(1);
      
      // Clear cache
      templateEngine.clearCache();
      
      // Load template again - should read from file again
      await templateEngine.renderEmailTemplate('test', mockTemplateData);
      expect(fs.readFile).toHaveBeenCalledTimes(2);
    });
  });
});
