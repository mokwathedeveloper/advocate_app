// Enhanced Appointment model for LegalPro v1.0.1
const mongoose = require('mongoose');

// Appointment reminder schema
const reminderSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['email', 'sms', 'whatsapp'],
    required: true
  },
  sentAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'failed'],
    default: 'sent'
  }
}, { _id: false });

// Appointment note schema
const appointmentNoteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: [1000, 'Note cannot exceed 1000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['general', 'preparation', 'outcome', 'follow_up'],
    default: 'general'
  }
}, { timestamps: true });

// Main appointment schema
const appointmentSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Appointment title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },

  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  // Participants
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client is required']
  },

  advocateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Advocate is required']
  },

  // Scheduling
  startDateTime: {
    type: Date,
    required: [true, 'Start date and time is required']
  },

  endDateTime: {
    type: Date,
    required: [true, 'End date and time is required']
  },

  timezone: {
    type: String,
    default: 'Africa/Nairobi'
  },

  // Status and Type
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },

  type: {
    type: String,
    enum: ['consultation', 'follow_up', 'court_preparation', 'document_review', 'mediation', 'other'],
    default: 'consultation'
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Location and Meeting Details
  location: {
    type: {
      type: String,
      enum: ['office', 'virtual', 'court', 'client_location', 'other'],
      default: 'office'
    },
    address: String,
    room: String,
    meetingLink: String,
    instructions: String
  },

  // Case Association (Optional)
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case'
  },

  // Recurring Appointments
  isRecurring: {
    type: Boolean,
    default: false
  },

  recurrence: {
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: {
      type: Number,
      min: 1,
      max: 12
    },
    endDate: Date,
    daysOfWeek: [Number], // 0-6 (Sunday-Saturday)
    dayOfMonth: Number,   // 1-31
    occurrences: Number   // Total number of occurrences
  },

  parentAppointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },

  // Notifications and Reminders
  reminders: [reminderSchema],

  reminderSettings: {
    enabled: {
      type: Boolean,
      default: true
    },
    intervals: [{
      type: Number, // minutes before appointment
      default: [1440, 60] // 24 hours and 1 hour before
    }],
    methods: [{
      type: String,
      enum: ['email', 'sms', 'whatsapp'],
      default: ['email']
    }]
  },

  // Additional Information
  notes: [appointmentNoteSchema],

  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Booking Information
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  bookedAt: {
    type: Date,
    default: Date.now
  },

  // Cancellation Information
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  cancelledAt: Date,

  cancellationReason: {
    type: String,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },

  // Completion Information
  completedAt: Date,

  outcome: {
    type: String,
    maxlength: [1000, 'Outcome cannot exceed 1000 characters']
  },

  followUpRequired: {
    type: Boolean,
    default: false
  },

  followUpDate: Date,

  // Billing Information
  billable: {
    type: Boolean,
    default: true
  },

  hourlyRate: {
    type: Number,
    min: 0
  },

  totalCost: {
    type: Number,
    min: 0
  },

  // Metadata
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
appointmentSchema.index({ clientId: 1, startDateTime: 1 });
appointmentSchema.index({ advocateId: 1, startDateTime: 1 });
appointmentSchema.index({ startDateTime: 1, endDateTime: 1 });
appointmentSchema.index({ status: 1, startDateTime: 1 });
appointmentSchema.index({ caseId: 1 });
appointmentSchema.index({ bookedBy: 1 });

// Virtual for duration in minutes
appointmentSchema.virtual('duration').get(function() {
  if (this.startDateTime && this.endDateTime) {
    return Math.round((this.endDateTime - this.startDateTime) / (1000 * 60));
  }
  return 0;
});

// Virtual for formatted date
appointmentSchema.virtual('formattedDate').get(function() {
  if (this.startDateTime) {
    return this.startDateTime.toLocaleDateString('en-US', {
      timeZone: this.timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  return null;
});

// Virtual for formatted time
appointmentSchema.virtual('formattedTime').get(function() {
  if (this.startDateTime && this.endDateTime) {
    const startTime = this.startDateTime.toLocaleTimeString('en-US', {
      timeZone: this.timezone,
      hour: '2-digit',
      minute: '2-digit'
    });
    const endTime = this.endDateTime.toLocaleTimeString('en-US', {
      timeZone: this.timezone,
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${startTime} - ${endTime}`;
  }
  return null;
});

// Validation: End time must be after start time
appointmentSchema.pre('validate', function(next) {
  if (this.startDateTime && this.endDateTime) {
    if (this.endDateTime <= this.startDateTime) {
      next(new Error('End time must be after start time'));
    }
  }
  next();
});

// Validation: Appointment duration cannot exceed 4 hours
appointmentSchema.pre('validate', function(next) {
  if (this.startDateTime && this.endDateTime) {
    const duration = (this.endDateTime - this.startDateTime) / (1000 * 60 * 60); // hours
    if (duration > 4) {
      next(new Error('Appointment duration cannot exceed 4 hours'));
    }
  }
  next();
});

// Validation: Cannot schedule appointments in the past (except for updates)
appointmentSchema.pre('validate', function(next) {
  if (this.isNew && this.startDateTime && this.startDateTime < new Date()) {
    next(new Error('Cannot schedule appointments in the past'));
  }
  next();
});

// Method to check if appointment conflicts with another
appointmentSchema.methods.conflictsWith = function(otherAppointment) {
  return (
    this.advocateId.toString() === otherAppointment.advocateId.toString() &&
    this.startDateTime < otherAppointment.endDateTime &&
    this.endDateTime > otherAppointment.startDateTime &&
    this._id.toString() !== otherAppointment._id.toString()
  );
};

// Method to check if appointment is upcoming
appointmentSchema.methods.isUpcoming = function() {
  return this.startDateTime > new Date() && this.status === 'scheduled';
};

// Method to check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const hourBeforeAppointment = new Date(this.startDateTime.getTime() - (60 * 60 * 1000));
  return now < hourBeforeAppointment && ['scheduled', 'confirmed'].includes(this.status);
};

// Static method to find conflicts
appointmentSchema.statics.findConflicts = function(advocateId, startDateTime, endDateTime, excludeId = null) {
  const query = {
    advocateId,
    status: { $in: ['scheduled', 'confirmed', 'in_progress'] },
    $or: [
      {
        startDateTime: { $lt: endDateTime },
        endDateTime: { $gt: startDateTime }
      }
    ]
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return this.find(query);
};

module.exports = mongoose.model('Appointment', appointmentSchema);