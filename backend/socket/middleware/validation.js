// Validation Middleware for Socket.IO Events - LegalPro v1.0.1
const { validateEventData } = require('../events/socketEvents');
const DOMPurify = require('isomorphic-dompurify');

// Content validation and sanitization
class MessageValidator {
  constructor() {
    this.allowedFileTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];
    
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.maxMessageLength = 10000;
    this.maxAttachments = 10;
  }

  validateMessage(data) {
    const errors = [];

    // Basic structure validation
    if (!data || typeof data !== 'object') {
      return 'Message data must be an object';
    }

    // Validate conversation ID
    if (!data.conversationId) {
      errors.push('Conversation ID is required');
    } else if (!this.isValidObjectId(data.conversationId)) {
      errors.push('Invalid conversation ID format');
    }

    // Validate content
    if (!data.content) {
      errors.push('Message content is required');
    } else {
      const contentErrors = this.validateContent(data.content);
      errors.push(...contentErrors);
    }

    // Validate optional fields
    if (data.replyTo && !this.isValidObjectId(data.replyTo)) {
      errors.push('Invalid reply message ID format');
    }

    if (data.priority && !['low', 'normal', 'high', 'urgent'].includes(data.priority)) {
      errors.push('Invalid priority level');
    }

    return errors.length > 0 ? errors.join(', ') : null;
  }

  validateContent(content) {
    const errors = [];

    if (!content || typeof content !== 'object') {
      return ['Content must be an object'];
    }

    // Validate content type
    if (!content.type) {
      errors.push('Content type is required');
    } else if (!['text', 'file', 'image', 'document'].includes(content.type)) {
      errors.push('Invalid content type');
    }

    // Validate text content
    if (content.type === 'text') {
      if (!content.text || typeof content.text !== 'string') {
        errors.push('Text content is required for text messages');
      } else {
        // Sanitize and validate text
        const sanitizedText = this.sanitizeText(content.text);
        if (sanitizedText.length > this.maxMessageLength) {
          errors.push(`Message text exceeds maximum length of ${this.maxMessageLength} characters`);
        }
        // Update the content with sanitized text
        content.text = sanitizedText;
      }
    }

    // Validate attachments
    if (content.attachments) {
      const attachmentErrors = this.validateAttachments(content.attachments);
      errors.push(...attachmentErrors);
    }

    // Validate formatting
    if (content.formatting) {
      const formattingErrors = this.validateFormatting(content.formatting, content.text);
      errors.push(...formattingErrors);
    }

    return errors;
  }

  validateAttachments(attachments) {
    const errors = [];

    if (!Array.isArray(attachments)) {
      return ['Attachments must be an array'];
    }

    if (attachments.length > this.maxAttachments) {
      errors.push(`Maximum ${this.maxAttachments} attachments allowed`);
    }

    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      const attachmentErrors = this.validateSingleAttachment(attachment, i);
      errors.push(...attachmentErrors);
    }

    return errors;
  }

  validateSingleAttachment(attachment, index) {
    const errors = [];
    const prefix = `Attachment ${index + 1}:`;

    if (!attachment || typeof attachment !== 'object') {
      return [`${prefix} Must be an object`];
    }

    // Required fields
    const requiredFields = ['filename', 'originalName', 'mimeType', 'size', 'url'];
    for (const field of requiredFields) {
      if (!attachment[field]) {
        errors.push(`${prefix} Missing required field '${field}'`);
      }
    }

    // Validate file type
    if (attachment.mimeType && !this.allowedFileTypes.includes(attachment.mimeType)) {
      errors.push(`${prefix} File type '${attachment.mimeType}' is not allowed`);
    }

    // Validate file size
    if (attachment.size && attachment.size > this.maxFileSize) {
      errors.push(`${prefix} File size exceeds maximum of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Validate filename
    if (attachment.filename && !this.isValidFilename(attachment.filename)) {
      errors.push(`${prefix} Invalid filename format`);
    }

    // Validate URL
    if (attachment.url && !this.isValidUrl(attachment.url)) {
      errors.push(`${prefix} Invalid URL format`);
    }

    return errors;
  }

  validateFormatting(formatting, text) {
    const errors = [];

    if (!text) {
      return errors; // No text to format
    }

    const textLength = text.length;

    // Validate formatting ranges
    const formatTypes = ['bold', 'italic', 'code', 'links'];
    
    for (const formatType of formatTypes) {
      if (formatting[formatType] && Array.isArray(formatting[formatType])) {
        for (let i = 0; i < formatting[formatType].length; i++) {
          const format = formatting[formatType][i];
          
          if (!format || typeof format !== 'object') {
            errors.push(`Invalid ${formatType} formatting at index ${i}`);
            continue;
          }

          if (typeof format.start !== 'number' || typeof format.end !== 'number') {
            errors.push(`${formatType} formatting must have numeric start and end positions`);
            continue;
          }

          if (format.start < 0 || format.end > textLength || format.start >= format.end) {
            errors.push(`Invalid ${formatType} formatting range: ${format.start}-${format.end}`);
          }

          // Validate links specifically
          if (formatType === 'links') {
            if (!format.url || !this.isValidUrl(format.url)) {
              errors.push(`Invalid URL in link formatting: ${format.url}`);
            }
          }
        }
      }
    }

    return errors;
  }

  sanitizeText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Remove potentially dangerous HTML/script content
    let sanitized = DOMPurify.sanitize(text, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [] 
    });

    // Trim whitespace
    sanitized = sanitized.trim();

    // Remove excessive line breaks
    sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

    // Remove null bytes and other control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return sanitized;
  }

  isValidObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  isValidFilename(filename) {
    // Check for valid filename (no path traversal, reasonable length)
    if (!filename || filename.length > 255) {
      return false;
    }

    // Prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return false;
    }

    // Check for valid characters
    const validFilenameRegex = /^[a-zA-Z0-9._-]+$/;
    return validFilenameRegex.test(filename);
  }

  isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  // Validate emoji for reactions
  validateEmoji(emoji) {
    if (!emoji || typeof emoji !== 'string') {
      return 'Emoji must be a string';
    }

    if (emoji.length > 10) {
      return 'Emoji too long';
    }

    // Basic emoji validation (Unicode emoji ranges)
    const emojiRegex = /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]$/u;
    
    if (!emojiRegex.test(emoji)) {
      return 'Invalid emoji format';
    }

    return null;
  }

  // Validate conversation data
  validateConversation(data) {
    const errors = [];

    if (!data || typeof data !== 'object') {
      return 'Conversation data must be an object';
    }

    // Validate type
    if (!data.type || !['private', 'group', 'case', 'support'].includes(data.type)) {
      errors.push('Invalid conversation type');
    }

    // Validate title for group conversations
    if ((data.type === 'group' || data.type === 'case') && !data.title) {
      errors.push('Title is required for group and case conversations');
    }

    if (data.title && data.title.length > 100) {
      errors.push('Title exceeds maximum length of 100 characters');
    }

    // Validate description
    if (data.description && data.description.length > 500) {
      errors.push('Description exceeds maximum length of 500 characters');
    }

    // Validate participants
    if (!data.participants || !Array.isArray(data.participants)) {
      errors.push('Participants must be an array');
    } else if (data.participants.length === 0) {
      errors.push('At least one participant is required');
    } else {
      for (let i = 0; i < data.participants.length; i++) {
        const participant = data.participants[i];
        if (!this.isValidObjectId(participant.userId || participant)) {
          errors.push(`Invalid participant ID at index ${i}`);
        }
      }
    }

    // Validate case ID if provided
    if (data.caseId && !this.isValidObjectId(data.caseId)) {
      errors.push('Invalid case ID format');
    }

    return errors.length > 0 ? errors.join(', ') : null;
  }
}

// Create singleton instance
const messageValidator = new MessageValidator();

// Export validation functions
const validateMessage = (data) => messageValidator.validateMessage(data);
const validateEmoji = (emoji) => messageValidator.validateEmoji(emoji);
const validateConversation = (data) => messageValidator.validateConversation(data);
const sanitizeText = (text) => messageValidator.sanitizeText(text);

module.exports = {
  validateMessage,
  validateEmoji,
  validateConversation,
  sanitizeText,
  MessageValidator
};
