// Comprehensive Notification Service for LegalPro v1.0.1 - Email & SMS Management
import { showToast } from './toastService';

// Notification types
export type NotificationType = 'email' | 'sms' | 'push' | 'in-app';

// Notification priority levels
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// Notification status
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';

// Base notification interface
export interface BaseNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  recipient: string;
  subject?: string;
  message: string;
  templateId?: string;
  templateData?: Record<string, any>;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>;
}

// Email notification interface
export interface EmailNotification extends BaseNotification {
  type: 'email';
  recipient: string; // email address
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
  htmlContent?: string;
  textContent?: string;
}

// SMS notification interface
export interface SmsNotification extends BaseNotification {
  type: 'sms';
  recipient: string; // phone number
  countryCode?: string;
}

// Email attachment interface
export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType: string;
  size: number;
}

// Notification template interface
export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  smsContent?: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Notification preferences interface
export interface NotificationPreferences {
  userId: string;
  email: {
    enabled: boolean;
    caseUpdates: boolean;
    appointmentReminders: boolean;
    paymentNotifications: boolean;
    systemAlerts: boolean;
  };
  sms: {
    enabled: boolean;
    urgentOnly: boolean;
    appointmentReminders: boolean;
    paymentNotifications: boolean;
  };
  inApp: {
    enabled: boolean;
    showDesktopNotifications: boolean;
  };
}

// Notification queue interface
export interface NotificationQueue {
  notifications: BaseNotification[];
  isProcessing: boolean;
  lastProcessedAt?: Date;
  failedCount: number;
  successCount: number;
}

// Email templates
const EMAIL_TEMPLATES: Record<string, NotificationTemplate> = {
  welcome: {
    id: 'welcome',
    name: 'Welcome Email',
    type: 'email',
    subject: 'Welcome to LegalPro - {{firstName}}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af;">Welcome to LegalPro, {{firstName}}!</h1>
        <p>Thank you for joining our legal case management platform.</p>
        <p>Your account has been successfully created with the email: <strong>{{email}}</strong></p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Next Steps:</h3>
          <ul>
            <li>Complete your profile setup</li>
            <li>Explore the dashboard</li>
            <li>Schedule your first appointment</li>
          </ul>
        </div>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The LegalPro Team</p>
      </div>
    `,
    textContent: `Welcome to LegalPro, {{firstName}}!\n\nThank you for joining our legal case management platform.\n\nYour account: {{email}}\n\nNext Steps:\n- Complete your profile\n- Explore the dashboard\n- Schedule your first appointment\n\nBest regards,\nThe LegalPro Team`,
    variables: ['firstName', 'email'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  appointmentReminder: {
    id: 'appointmentReminder',
    name: 'Appointment Reminder',
    type: 'email',
    subject: 'Appointment Reminder - {{appointmentDate}}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af;">Appointment Reminder</h1>
        <p>Hello {{clientName}},</p>
        <p>This is a reminder about your upcoming appointment:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Appointment Details:</h3>
          <p><strong>Date:</strong> {{appointmentDate}}</p>
          <p><strong>Time:</strong> {{appointmentTime}}</p>
          <p><strong>Advocate:</strong> {{advocateName}}</p>
          <p><strong>Location:</strong> {{location}}</p>
          <p><strong>Type:</strong> {{appointmentType}}</p>
        </div>
        <p>Please arrive 10 minutes early and bring any relevant documents.</p>
        <p>If you need to reschedule, please contact us at least 24 hours in advance.</p>
      </div>
    `,
    textContent: `Appointment Reminder\n\nHello {{clientName}},\n\nUpcoming appointment:\nDate: {{appointmentDate}}\nTime: {{appointmentTime}}\nAdvocate: {{advocateName}}\nLocation: {{location}}\n\nPlease arrive 10 minutes early.`,
    variables: ['clientName', 'appointmentDate', 'appointmentTime', 'advocateName', 'location', 'appointmentType'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  caseUpdate: {
    id: 'caseUpdate',
    name: 'Case Status Update',
    type: 'email',
    subject: 'Case Update - {{caseTitle}}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af;">Case Status Update</h1>
        <p>Hello {{clientName}},</p>
        <p>We have an update regarding your case:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Case Details:</h3>
          <p><strong>Case:</strong> {{caseTitle}}</p>
          <p><strong>Status:</strong> {{newStatus}}</p>
          <p><strong>Updated by:</strong> {{updatedBy}}</p>
          <p><strong>Date:</strong> {{updateDate}}</p>
        </div>
        <div style="background: #fff; border-left: 4px solid #1e40af; padding: 15px; margin: 20px 0;">
          <h4>Update Details:</h4>
          <p>{{updateMessage}}</p>
        </div>
        <p>You can view the full case details in your dashboard.</p>
      </div>
    `,
    textContent: `Case Status Update\n\nHello {{clientName}},\n\nCase: {{caseTitle}}\nNew Status: {{newStatus}}\nUpdated by: {{updatedBy}}\nDate: {{updateDate}}\n\nUpdate: {{updateMessage}}\n\nView full details in your dashboard.`,
    variables: ['clientName', 'caseTitle', 'newStatus', 'updatedBy', 'updateDate', 'updateMessage'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

// SMS templates
const SMS_TEMPLATES: Record<string, NotificationTemplate> = {
  appointmentReminder: {
    id: 'smsAppointmentReminder',
    name: 'SMS Appointment Reminder',
    type: 'sms',
    smsContent: 'LegalPro Reminder: You have an appointment with {{advocateName}} on {{appointmentDate}} at {{appointmentTime}}. Location: {{location}}',
    variables: ['advocateName', 'appointmentDate', 'appointmentTime', 'location'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  urgentCaseUpdate: {
    id: 'smsUrgentUpdate',
    name: 'SMS Urgent Case Update',
    type: 'sms',
    smsContent: 'URGENT: {{caseTitle}} status updated to {{newStatus}}. Please check your dashboard or contact us immediately.',
    variables: ['caseTitle', 'newStatus'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  paymentReminder: {
    id: 'smsPaymentReminder',
    name: 'SMS Payment Reminder',
    type: 'sms',
    smsContent: 'LegalPro: Payment of {{amount}} for {{caseTitle}} is due on {{dueDate}}. Pay now to avoid late fees.',
    variables: ['amount', 'caseTitle', 'dueDate'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

/**
 * Comprehensive Notification Service
 */
class NotificationService {
  private queue: NotificationQueue = {
    notifications: [],
    isProcessing: false,
    failedCount: 0,
    successCount: 0
  };

  private preferences: Map<string, NotificationPreferences> = new Map();
  private processingInterval?: NodeJS.Timeout;

  constructor() {
    // Start queue processing
    this.startQueueProcessing();
  }

  /**
   * Send email notification
   */
  async sendEmail(notification: Omit<EmailNotification, 'id' | 'status' | 'retryCount'>): Promise<string> {
    const emailNotification: EmailNotification = {
      ...notification,
      id: this.generateNotificationId(),
      status: 'pending',
      retryCount: 0,
      maxRetries: notification.maxRetries || 3
    };

    // Check user preferences
    if (!this.canSendNotification(notification.recipient, 'email')) {
      throw new Error('Email notifications disabled for this user');
    }

    // Process template if provided
    if (notification.templateId) {
      this.processTemplate(emailNotification);
    }

    // Add to queue
    this.addToQueue(emailNotification);

    return emailNotification.id;
  }

  /**
   * Send SMS notification
   */
  async sendSms(notification: Omit<SmsNotification, 'id' | 'status' | 'retryCount'>): Promise<string> {
    const smsNotification: SmsNotification = {
      ...notification,
      id: this.generateNotificationId(),
      status: 'pending',
      retryCount: 0,
      maxRetries: notification.maxRetries || 3
    };

    // Check user preferences
    if (!this.canSendNotification(notification.recipient, 'sms')) {
      throw new Error('SMS notifications disabled for this user');
    }

    // Process template if provided
    if (notification.templateId) {
      this.processTemplate(smsNotification);
    }

    // Add to queue
    this.addToQueue(smsNotification);

    return smsNotification.id;
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<string> {
    return this.sendEmail({
      type: 'email',
      priority: 'normal',
      recipient: email,
      message: '',
      templateId: 'welcome',
      templateData: { firstName, email },
      maxRetries: 3
    });
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(
    email: string,
    phone: string,
    appointmentData: {
      clientName: string;
      appointmentDate: string;
      appointmentTime: string;
      advocateName: string;
      location: string;
      appointmentType: string;
    }
  ): Promise<{ emailId: string; smsId?: string }> {
    const emailId = await this.sendEmail({
      type: 'email',
      priority: 'high',
      recipient: email,
      message: '',
      templateId: 'appointmentReminder',
      templateData: appointmentData,
      maxRetries: 3
    });

    let smsId: string | undefined;
    
    // Send SMS reminder if phone number provided
    if (phone) {
      try {
        smsId = await this.sendSms({
          type: 'sms',
          priority: 'high',
          recipient: phone,
          message: '',
          templateId: 'smsAppointmentReminder',
          templateData: appointmentData,
          maxRetries: 3
        });
      } catch (error) {
        console.warn('Failed to send SMS reminder:', error);
      }
    }

    return { emailId, smsId };
  }

  /**
   * Send case update notification
   */
  async sendCaseUpdate(
    email: string,
    phone: string,
    caseData: {
      clientName: string;
      caseTitle: string;
      newStatus: string;
      updatedBy: string;
      updateDate: string;
      updateMessage: string;
    },
    isUrgent: boolean = false
  ): Promise<{ emailId: string; smsId?: string }> {
    const priority: NotificationPriority = isUrgent ? 'urgent' : 'normal';

    const emailId = await this.sendEmail({
      type: 'email',
      priority,
      recipient: email,
      message: '',
      templateId: 'caseUpdate',
      templateData: caseData,
      maxRetries: 3
    });

    let smsId: string | undefined;

    // Send SMS for urgent updates
    if (isUrgent && phone) {
      try {
        smsId = await this.sendSms({
          type: 'sms',
          priority: 'urgent',
          recipient: phone,
          message: '',
          templateId: 'smsUrgentUpdate',
          templateData: caseData,
          maxRetries: 3
        });
      } catch (error) {
        console.warn('Failed to send urgent SMS:', error);
      }
    }

    return { emailId, smsId };
  }

  /**
   * Process notification template
   */
  private processTemplate(notification: BaseNotification): void {
    if (!notification.templateId || !notification.templateData) return;

    const template = notification.type === 'email' 
      ? EMAIL_TEMPLATES[notification.templateId]
      : SMS_TEMPLATES[notification.templateId];

    if (!template) {
      console.warn(`Template not found: ${notification.templateId}`);
      return;
    }

    // Replace template variables
    const replaceVariables = (content: string): string => {
      return content.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
        return notification.templateData?.[variable] || match;
      });
    };

    if (notification.type === 'email') {
      const emailNotification = notification as EmailNotification;
      if (template.subject) {
        emailNotification.subject = replaceVariables(template.subject);
      }
      if (template.htmlContent) {
        emailNotification.htmlContent = replaceVariables(template.htmlContent);
      }
      if (template.textContent) {
        emailNotification.textContent = replaceVariables(template.textContent);
      }
    } else if (notification.type === 'sms') {
      if (template.smsContent) {
        notification.message = replaceVariables(template.smsContent);
      }
    }
  }

  /**
   * Check if notification can be sent based on user preferences
   */
  private canSendNotification(recipient: string, type: NotificationType): boolean {
    const preferences = this.preferences.get(recipient);
    if (!preferences) return true; // Default to allow if no preferences set

    switch (type) {
      case 'email':
        return preferences.email.enabled;
      case 'sms':
        return preferences.sms.enabled;
      default:
        return true;
    }
  }

  /**
   * Add notification to queue
   */
  private addToQueue(notification: BaseNotification): void {
    this.queue.notifications.push(notification);
    
    // Process immediately if high priority
    if (notification.priority === 'urgent' || notification.priority === 'high') {
      this.processQueue();
    }
  }

  /**
   * Start queue processing
   */
  private startQueueProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 30000); // Process every 30 seconds
  }

  /**
   * Process notification queue
   */
  private async processQueue(): Promise<void> {
    if (this.queue.isProcessing || this.queue.notifications.length === 0) return;

    this.queue.isProcessing = true;

    try {
      const pendingNotifications = this.queue.notifications.filter(n => n.status === 'pending');
      
      for (const notification of pendingNotifications) {
        try {
          await this.processNotification(notification);
          this.queue.successCount++;
        } catch (error) {
          console.error('Failed to process notification:', error);
          notification.retryCount++;
          
          if (notification.retryCount >= notification.maxRetries) {
            notification.status = 'failed';
            notification.failureReason = error instanceof Error ? error.message : 'Unknown error';
            this.queue.failedCount++;
          }
        }
      }

      // Remove processed notifications
      this.queue.notifications = this.queue.notifications.filter(
        n => n.status === 'pending' && n.retryCount < n.maxRetries
      );

      this.queue.lastProcessedAt = new Date();
    } finally {
      this.queue.isProcessing = false;
    }
  }

  /**
   * Process individual notification
   */
  private async processNotification(notification: BaseNotification): Promise<void> {
    notification.status = 'sent';
    notification.sentAt = new Date();

    // Simulate API calls (replace with actual service calls)
    if (notification.type === 'email') {
      await this.sendEmailViaAPI(notification as EmailNotification);
    } else if (notification.type === 'sms') {
      await this.sendSmsViaAPI(notification as SmsNotification);
    }

    // Show success toast
    showToast.success(`${notification.type.toUpperCase()} sent successfully`, {
      title: 'Notification Sent'
    });
  }

  /**
   * Send email via API (mock implementation)
   */
  private async sendEmailViaAPI(notification: EmailNotification): Promise<void> {
    // Mock API call - replace with actual email service
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Email sent:', {
      to: notification.recipient,
      subject: notification.subject,
      content: notification.htmlContent || notification.textContent
    });
  }

  /**
   * Send SMS via API (mock implementation)
   */
  private async sendSmsViaAPI(notification: SmsNotification): Promise<void> {
    // Mock API call - replace with actual SMS service (Twilio, etc.)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('SMS sent:', {
      to: notification.recipient,
      message: notification.message
    });
  }

  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): string {
    return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): NotificationQueue {
    return { ...this.queue };
  }

  /**
   * Set user notification preferences
   */
  setUserPreferences(userId: string, preferences: NotificationPreferences): void {
    this.preferences.set(userId, preferences);
  }

  /**
   * Get user notification preferences
   */
  getUserPreferences(userId: string): NotificationPreferences | undefined {
    return this.preferences.get(userId);
  }

  /**
   * Stop queue processing
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

export default notificationService;
