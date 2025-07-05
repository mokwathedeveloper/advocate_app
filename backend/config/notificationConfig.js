// Notification Configuration for LegalPro v1.0.1
require('dotenv').config();

// Event-based notification configuration
const eventNotificationConfig = {
  // User registration and authentication events
  welcome: {
    email: {
      enabled: process.env.WELCOME_EMAIL_ENABLED !== 'false',
      template: 'welcome',
      priority: 'high',
      delay: 0 // Send immediately
    },
    sms: {
      enabled: process.env.WELCOME_SMS_ENABLED !== 'false',
      template: 'welcome',
      priority: 'medium',
      delay: 30000 // 30 seconds after email
    },
    whatsapp: {
      enabled: process.env.WELCOME_WHATSAPP_ENABLED === 'true',
      template: 'welcome',
      priority: 'low',
      delay: 60000 // 1 minute after email
    }
  },

  // Appointment-related events
  appointmentConfirmation: {
    email: {
      enabled: process.env.APPOINTMENT_CONFIRMATION_EMAIL_ENABLED !== 'false',
      template: 'appointment-confirmation',
      priority: 'high',
      delay: 0
    },
    sms: {
      enabled: process.env.APPOINTMENT_CONFIRMATION_SMS_ENABLED !== 'false',
      template: 'appointmentConfirmation',
      priority: 'high',
      delay: 5000 // 5 seconds after email
    },
    whatsapp: {
      enabled: process.env.APPOINTMENT_CONFIRMATION_WHATSAPP_ENABLED === 'true',
      template: 'appointmentConfirmation',
      priority: 'medium',
      delay: 30000
    }
  },

  appointmentReminder: {
    email: {
      enabled: process.env.APPOINTMENT_REMINDER_EMAIL_ENABLED !== 'false',
      template: 'appointment-reminder',
      priority: 'high',
      delay: 0
    },
    sms: {
      enabled: process.env.APPOINTMENT_REMINDER_SMS_ENABLED !== 'false',
      template: 'appointmentReminder',
      priority: 'high',
      delay: 0 // Send simultaneously with email
    },
    whatsapp: {
      enabled: process.env.APPOINTMENT_REMINDER_WHATSAPP_ENABLED === 'true',
      template: 'appointmentReminder',
      priority: 'medium',
      delay: 10000
    }
  },

  // Case management events
  caseUpdate: {
    email: {
      enabled: process.env.CASE_UPDATE_EMAIL_ENABLED !== 'false',
      template: 'case-update',
      priority: 'high',
      delay: 0
    },
    sms: {
      enabled: process.env.CASE_UPDATE_SMS_ENABLED !== 'false',
      template: 'caseUpdate',
      priority: 'medium',
      delay: 10000
    },
    whatsapp: {
      enabled: process.env.CASE_UPDATE_WHATSAPP_ENABLED === 'true',
      template: 'caseUpdate',
      priority: 'medium',
      delay: 30000
    }
  },

  // Payment events
  paymentConfirmation: {
    email: {
      enabled: process.env.PAYMENT_CONFIRMATION_EMAIL_ENABLED !== 'false',
      template: 'payment-confirmation',
      priority: 'high',
      delay: 0
    },
    sms: {
      enabled: process.env.PAYMENT_CONFIRMATION_SMS_ENABLED !== 'false',
      template: 'paymentConfirmation',
      priority: 'high',
      delay: 5000
    },
    whatsapp: {
      enabled: process.env.PAYMENT_CONFIRMATION_WHATSAPP_ENABLED === 'true',
      template: 'paymentConfirmation',
      priority: 'medium',
      delay: 15000
    }
  },

  // Document and legal process events
  documentRequest: {
    email: {
      enabled: process.env.DOCUMENT_REQUEST_EMAIL_ENABLED !== 'false',
      template: 'document-request',
      priority: 'medium',
      delay: 0
    },
    sms: {
      enabled: process.env.DOCUMENT_REQUEST_SMS_ENABLED !== 'false',
      template: 'documentRequest',
      priority: 'medium',
      delay: 30000
    },
    whatsapp: {
      enabled: process.env.DOCUMENT_REQUEST_WHATSAPP_ENABLED === 'true',
      template: 'documentRequest',
      priority: 'low',
      delay: 60000
    }
  },

  hearingNotice: {
    email: {
      enabled: process.env.HEARING_NOTICE_EMAIL_ENABLED !== 'false',
      template: 'hearing-notice',
      priority: 'critical',
      delay: 0
    },
    sms: {
      enabled: process.env.HEARING_NOTICE_SMS_ENABLED !== 'false',
      template: 'hearingNotice',
      priority: 'critical',
      delay: 0 // Send immediately with email
    },
    whatsapp: {
      enabled: process.env.HEARING_NOTICE_WHATSAPP_ENABLED === 'true',
      template: 'hearingNotice',
      priority: 'high',
      delay: 5000
    }
  },

  // Security events
  passwordReset: {
    email: {
      enabled: process.env.PASSWORD_RESET_EMAIL_ENABLED !== 'false',
      template: 'password-reset',
      priority: 'critical',
      delay: 0
    },
    sms: {
      enabled: process.env.PASSWORD_RESET_SMS_ENABLED !== 'false',
      template: 'passwordReset',
      priority: 'critical',
      delay: 0
    },
    whatsapp: {
      enabled: false, // Security-sensitive, disable WhatsApp by default
      template: null,
      priority: 'none',
      delay: 0
    }
  },

  // Emergency events
  emergencyContact: {
    email: {
      enabled: process.env.EMERGENCY_EMAIL_ENABLED !== 'false',
      template: 'emergency-contact',
      priority: 'critical',
      delay: 0
    },
    sms: {
      enabled: process.env.EMERGENCY_SMS_ENABLED !== 'false',
      template: 'emergencyContact',
      priority: 'critical',
      delay: 0
    },
    whatsapp: {
      enabled: process.env.EMERGENCY_WHATSAPP_ENABLED !== 'false',
      template: 'emergencyContact',
      priority: 'critical',
      delay: 0
    }
  }
};

// Global notification settings
const globalConfig = {
  // Rate limiting
  rateLimiting: {
    email: {
      maxPerHour: parseInt(process.env.EMAIL_RATE_LIMIT_HOUR) || 100,
      maxPerDay: parseInt(process.env.EMAIL_RATE_LIMIT_DAY) || 1000
    },
    sms: {
      maxPerHour: parseInt(process.env.SMS_RATE_LIMIT_HOUR) || 50,
      maxPerDay: parseInt(process.env.SMS_RATE_LIMIT_DAY) || 200
    },
    whatsapp: {
      maxPerHour: parseInt(process.env.WHATSAPP_RATE_LIMIT_HOUR) || 30,
      maxPerDay: parseInt(process.env.WHATSAPP_RATE_LIMIT_DAY) || 100
    }
  },

  // Retry configuration
  retry: {
    email: {
      attempts: parseInt(process.env.EMAIL_RETRY_ATTEMPTS) || 3,
      delay: parseInt(process.env.EMAIL_RETRY_DELAY) || 5000,
      backoff: process.env.EMAIL_RETRY_BACKOFF === 'true'
    },
    sms: {
      attempts: parseInt(process.env.SMS_RETRY_ATTEMPTS) || 3,
      delay: parseInt(process.env.SMS_RETRY_DELAY) || 3000,
      backoff: process.env.SMS_RETRY_BACKOFF === 'true'
    },
    whatsapp: {
      attempts: parseInt(process.env.WHATSAPP_RETRY_ATTEMPTS) || 2,
      delay: parseInt(process.env.WHATSAPP_RETRY_DELAY) || 2000,
      backoff: process.env.WHATSAPP_RETRY_BACKOFF === 'true'
    }
  },

  // Quiet hours (notifications will be delayed)
  quietHours: {
    enabled: process.env.QUIET_HOURS_ENABLED === 'true',
    start: process.env.QUIET_HOURS_START || '22:00',
    end: process.env.QUIET_HOURS_END || '07:00',
    timezone: process.env.TIMEZONE || 'Africa/Nairobi',
    exceptions: ['critical', 'emergency'] // Priority levels that ignore quiet hours
  },

  // Fallback settings
  fallback: {
    enabled: process.env.NOTIFICATION_FALLBACK_ENABLED !== 'false',
    emailToSms: process.env.EMAIL_TO_SMS_FALLBACK === 'true',
    smsToWhatsapp: process.env.SMS_TO_WHATSAPP_FALLBACK === 'true'
  }
};

// Helper functions
function isEventEnabled(eventType, channel) {
  const eventConfig = eventNotificationConfig[eventType];
  if (!eventConfig || !eventConfig[channel]) {
    return false;
  }
  return eventConfig[channel].enabled;
}

function getEventConfig(eventType, channel) {
  const eventConfig = eventNotificationConfig[eventType];
  if (!eventConfig || !eventConfig[channel]) {
    return null;
  }
  return eventConfig[channel];
}

function isInQuietHours() {
  if (!globalConfig.quietHours.enabled) {
    return false;
  }

  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-GB', { 
    hour12: false, 
    timeZone: globalConfig.quietHours.timezone 
  });
  
  const start = globalConfig.quietHours.start;
  const end = globalConfig.quietHours.end;
  
  // Handle overnight quiet hours (e.g., 22:00 to 07:00)
  if (start > end) {
    return currentTime >= start || currentTime <= end;
  } else {
    return currentTime >= start && currentTime <= end;
  }
}

function shouldRespectQuietHours(priority) {
  if (!globalConfig.quietHours.enabled) {
    return false;
  }
  
  return !globalConfig.quietHours.exceptions.includes(priority);
}

module.exports = {
  eventNotificationConfig,
  globalConfig,
  isEventEnabled,
  getEventConfig,
  isInQuietHours,
  shouldRespectQuietHours
};
