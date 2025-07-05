// Socket.IO Events Constants - LegalPro v1.0.1

const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  AUTHENTICATE: 'authenticate',
  FORCE_DISCONNECT: 'force_disconnect',

  // Message events
  SEND_MESSAGE: 'send_message',
  RECEIVE_MESSAGE: 'receive_message',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_READ: 'message_read',
  EDIT_MESSAGE: 'edit_message',
  DELETE_MESSAGE: 'delete_message',
  MESSAGE_UPDATED: 'message_updated',
  MESSAGE_DELETED: 'message_deleted',

  // Typing events
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',

  // Conversation events
  JOIN_CONVERSATION: 'join_conversation',
  LEAVE_CONVERSATION: 'leave_conversation',
  CONVERSATION_JOINED: 'conversation_joined',
  CONVERSATION_LEFT: 'conversation_left',
  USER_JOINED_CONVERSATION: 'user_joined_conversation',
  USER_LEFT_CONVERSATION: 'user_left_conversation',
  CONVERSATION_CREATED: 'conversation_created',
  CONVERSATION_UPDATED: 'conversation_updated',

  // Status events
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  USER_STATUS_CHANGE: 'user_status_change',
  GET_ONLINE_USERS: 'get_online_users',
  ONLINE_USERS: 'online_users',

  // Reaction events
  ADD_REACTION: 'add_reaction',
  REMOVE_REACTION: 'remove_reaction',
  REACTION_ADDED: 'reaction_added',
  REACTION_REMOVED: 'reaction_removed',

  // File sharing events
  FILE_UPLOAD_START: 'file_upload_start',
  FILE_UPLOAD_PROGRESS: 'file_upload_progress',
  FILE_UPLOAD_COMPLETE: 'file_upload_complete',
  FILE_UPLOAD_ERROR: 'file_upload_error',

  // Notification events
  NOTIFICATION: 'notification',
  MARK_NOTIFICATION_READ: 'mark_notification_read',

  // System events
  SYSTEM_MESSAGE: 'system_message',
  SERVER_MAINTENANCE: 'server_maintenance',
  ERROR: 'error',
  UNAUTHORIZED: 'unauthorized',

  // Admin events
  ADMIN_MESSAGE: 'admin_message',
  USER_BANNED: 'user_banned',
  USER_UNBANNED: 'user_unbanned'
};

// Event validation schemas
const EVENT_SCHEMAS = {
  [SOCKET_EVENTS.SEND_MESSAGE]: {
    required: ['conversationId', 'content'],
    properties: {
      conversationId: { type: 'string', pattern: /^[0-9a-fA-F]{24}$/ },
      content: {
        type: 'object',
        required: ['text', 'type'],
        properties: {
          text: { type: 'string', maxLength: 10000 },
          type: { type: 'string', enum: ['text', 'file', 'image', 'document'] },
          attachments: { type: 'array' }
        }
      },
      replyTo: { type: 'string', pattern: /^[0-9a-fA-F]{24}$/ },
      priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] },
      tempId: { type: 'string' }
    }
  },

  [SOCKET_EVENTS.MESSAGE_DELIVERED]: {
    required: ['messageId'],
    properties: {
      messageId: { type: 'string', pattern: /^[0-9a-fA-F]{24}$/ }
    }
  },

  [SOCKET_EVENTS.MESSAGE_READ]: {
    properties: {
      messageId: { type: 'string', pattern: /^[0-9a-fA-F]{24}$/ },
      conversationId: { type: 'string', pattern: /^[0-9a-fA-F]{24}$/ }
    },
    anyOf: [
      { required: ['messageId'] },
      { required: ['conversationId'] }
    ]
  },

  [SOCKET_EVENTS.TYPING_START]: {
    required: ['conversationId'],
    properties: {
      conversationId: { type: 'string', pattern: /^[0-9a-fA-F]{24}$/ }
    }
  },

  [SOCKET_EVENTS.TYPING_STOP]: {
    required: ['conversationId'],
    properties: {
      conversationId: { type: 'string', pattern: /^[0-9a-fA-F]{24}$/ }
    }
  },

  [SOCKET_EVENTS.JOIN_CONVERSATION]: {
    required: ['conversationId'],
    properties: {
      conversationId: { type: 'string', pattern: /^[0-9a-fA-F]{24}$/ }
    }
  },

  [SOCKET_EVENTS.LEAVE_CONVERSATION]: {
    required: ['conversationId'],
    properties: {
      conversationId: { type: 'string', pattern: /^[0-9a-fA-F]{24}$/ }
    }
  },

  [SOCKET_EVENTS.ADD_REACTION]: {
    required: ['messageId', 'emoji'],
    properties: {
      messageId: { type: 'string', pattern: /^[0-9a-fA-F]{24}$/ },
      emoji: { type: 'string', maxLength: 10 }
    }
  },

  [SOCKET_EVENTS.REMOVE_REACTION]: {
    required: ['messageId', 'emoji'],
    properties: {
      messageId: { type: 'string', pattern: /^[0-9a-fA-F]{24}$/ },
      emoji: { type: 'string', maxLength: 10 }
    }
  },

  [SOCKET_EVENTS.GET_ONLINE_USERS]: {
    properties: {
      conversationId: { type: 'string', pattern: /^[0-9a-fA-F]{24}$/ }
    }
  }
};

// Helper function to validate event data
function validateEventData(eventName, data) {
  const schema = EVENT_SCHEMAS[eventName];
  if (!schema) {
    return null; // No validation schema defined
  }

  const errors = [];

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in data)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Check anyOf requirements (at least one of the specified fields must be present)
  if (schema.anyOf) {
    const anyOfSatisfied = schema.anyOf.some(requirement => 
      requirement.required.every(field => field in data)
    );
    if (!anyOfSatisfied) {
      errors.push(`Must provide one of: ${schema.anyOf.map(req => req.required.join(', ')).join(' OR ')}`);
    }
  }

  // Validate properties
  if (schema.properties) {
    for (const [key, value] of Object.entries(data)) {
      const propSchema = schema.properties[key];
      if (propSchema) {
        const propErrors = validateProperty(key, value, propSchema);
        errors.push(...propErrors);
      }
    }
  }

  return errors.length > 0 ? errors : null;
}

function validateProperty(key, value, schema) {
  const errors = [];

  // Type validation
  if (schema.type) {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== schema.type) {
      errors.push(`Field ${key} must be of type ${schema.type}, got ${actualType}`);
      return errors; // Skip further validation if type is wrong
    }
  }

  // String validations
  if (schema.type === 'string') {
    if (schema.maxLength && value.length > schema.maxLength) {
      errors.push(`Field ${key} exceeds maximum length of ${schema.maxLength}`);
    }
    if (schema.pattern && !schema.pattern.test(value)) {
      errors.push(`Field ${key} does not match required pattern`);
    }
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`Field ${key} must be one of: ${schema.enum.join(', ')}`);
    }
  }

  // Object validations
  if (schema.type === 'object' && schema.properties) {
    // Check required fields in nested object
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in value)) {
          errors.push(`Missing required field in ${key}: ${field}`);
        }
      }
    }

    // Validate nested properties
    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      const nestedSchema = schema.properties[nestedKey];
      if (nestedSchema) {
        const nestedErrors = validateProperty(`${key}.${nestedKey}`, nestedValue, nestedSchema);
        errors.push(...nestedErrors);
      }
    }
  }

  return errors;
}

// Rate limiting configurations for different events
const RATE_LIMITS = {
  [SOCKET_EVENTS.SEND_MESSAGE]: {
    points: 100, // Number of messages
    duration: 60, // Per minute
    blockDuration: 60 // Block for 1 minute if exceeded
  },
  [SOCKET_EVENTS.TYPING_START]: {
    points: 60, // Number of typing events
    duration: 60, // Per minute
    blockDuration: 10 // Block for 10 seconds
  },
  [SOCKET_EVENTS.ADD_REACTION]: {
    points: 200, // Number of reactions
    duration: 60, // Per minute
    blockDuration: 30 // Block for 30 seconds
  },
  [SOCKET_EVENTS.FILE_UPLOAD_START]: {
    points: 10, // Number of file uploads
    duration: 3600, // Per hour
    blockDuration: 300 // Block for 5 minutes
  }
};

module.exports = {
  SOCKET_EVENTS,
  EVENT_SCHEMAS,
  RATE_LIMITS,
  validateEventData
};
