// Appointment utility functions for LegalPro v1.0.1
const Appointment = require('../models/Appointment');
const { sendNotification } = require('./notificationService');

/**
 * Check for appointment conflicts
 * @param {String} advocateId - Advocate's user ID
 * @param {Date} startDateTime - Appointment start time
 * @param {Date} endDateTime - Appointment end time
 * @param {String} excludeId - Appointment ID to exclude from conflict check
 * @returns {Array} Array of conflicting appointments
 */
const checkAppointmentConflicts = async (advocateId, startDateTime, endDateTime, excludeId = null) => {
  try {
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
    
    return await Appointment.find(query)
      .populate('clientId', 'firstName lastName')
      .select('title startDateTime endDateTime clientId');
  } catch (error) {
    console.error('Error checking appointment conflicts:', error);
    throw error;
  }
};

/**
 * Generate available time slots for a specific date and advocate
 * @param {String} advocateId - Advocate's user ID
 * @param {Date} date - Date to check availability
 * @param {Number} duration - Appointment duration in minutes
 * @param {Number} slotInterval - Time slot interval in minutes (default: 30)
 * @returns {Array} Array of available time slots
 */
const generateAvailableSlots = async (advocateId, date, duration = 60, slotInterval = 30) => {
  try {
    const requestedDate = new Date(date);
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(8, 0, 0, 0); // 8 AM

    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(18, 0, 0, 0); // 6 PM

    // Get existing appointments for the day
    const existingAppointments = await Appointment.find({
      advocateId,
      startDateTime: { $gte: startOfDay, $lt: endOfDay },
      status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
    }).sort({ startDateTime: 1 });

    const slots = [];
    const now = new Date();

    // Generate time slots
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += slotInterval) {
        const slotStart = new Date(requestedDate);
        slotStart.setHours(hour, minute, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + duration);

        // Skip if slot would extend beyond business hours
        if (slotEnd > endOfDay) continue;

        // Skip if slot is in the past
        if (slotStart <= now) continue;

        // Check for conflicts with existing appointments
        const hasConflict = existingAppointments.some(apt => 
          slotStart < apt.endDateTime && slotEnd > apt.startDateTime
        );

        if (!hasConflict) {
          slots.push({
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            available: true,
            formattedTime: `${slotStart.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })} - ${slotEnd.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}`
          });
        }
      }
    }

    return slots;
  } catch (error) {
    console.error('Error generating available slots:', error);
    throw error;
  }
};

/**
 * Send appointment reminders for upcoming appointments
 * @param {Number} hoursAhead - How many hours ahead to send reminders
 * @returns {Object} Results of reminder sending
 */
const sendAppointmentReminders = async (hoursAhead = 24) => {
  try {
    const now = new Date();
    const reminderTime = new Date(now.getTime() + (hoursAhead * 60 * 60 * 1000));

    // Find appointments that need reminders
    const appointments = await Appointment.find({
      startDateTime: {
        $gte: now,
        $lte: reminderTime
      },
      status: { $in: ['scheduled', 'confirmed'] },
      'reminderSettings.enabled': true,
      // Check if reminder hasn't been sent for this interval
      'reminders.sentAt': {
        $not: {
          $elemMatch: {
            $gte: new Date(now.getTime() - (60 * 60 * 1000)) // Within last hour
          }
        }
      }
    })
    .populate('clientId', 'firstName lastName email phone')
    .populate('advocateId', 'firstName lastName email');

    const results = [];

    for (const appointment of appointments) {
      try {
        const reminderData = {
          title: appointment.title,
          date: appointment.formattedDate,
          time: appointment.formattedTime,
          advocateName: `${appointment.advocateId.firstName} ${appointment.advocateId.lastName}`,
          location: appointment.location?.type || 'office',
          hoursAhead
        };

        // Send reminder to client
        const clientResult = await sendNotification(
          appointment.clientId,
          'appointmentReminder',
          reminderData
        );

        // Record reminder sent
        appointment.reminders.push({
          type: 'email',
          sentAt: new Date(),
          status: 'sent'
        });

        await appointment.save();

        results.push({
          appointmentId: appointment._id,
          clientName: `${appointment.clientId.firstName} ${appointment.clientId.lastName}`,
          result: clientResult
        });

      } catch (error) {
        results.push({
          appointmentId: appointment._id,
          error: error.message
        });
      }
    }

    return {
      success: true,
      processed: appointments.length,
      results
    };

  } catch (error) {
    console.error('Error sending appointment reminders:', error);
    throw error;
  }
};

/**
 * Get appointment statistics for dashboard
 * @param {String} userId - User ID (optional, for user-specific stats)
 * @param {String} role - User role
 * @param {Date} startDate - Start date for statistics
 * @param {Date} endDate - End date for statistics
 * @returns {Object} Appointment statistics
 */
const getAppointmentStatistics = async (userId = null, role = 'admin', startDate = null, endDate = null) => {
  try {
    // Default to current month if no dates provided
    if (!startDate) {
      startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    if (!endDate) {
      endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
    }

    // Build base query
    let baseQuery = {
      startDateTime: { $gte: startDate, $lte: endDate }
    };

    // Add user-specific filtering
    if (userId && role === 'client') {
      baseQuery.clientId = userId;
    } else if (userId && role === 'advocate') {
      baseQuery.advocateId = userId;
    }

    // Get various statistics
    const [
      totalAppointments,
      scheduledAppointments,
      completedAppointments,
      cancelledAppointments,
      upcomingAppointments,
      appointmentsByType,
      appointmentsByStatus
    ] = await Promise.all([
      Appointment.countDocuments(baseQuery),
      Appointment.countDocuments({ ...baseQuery, status: 'scheduled' }),
      Appointment.countDocuments({ ...baseQuery, status: 'completed' }),
      Appointment.countDocuments({ ...baseQuery, status: 'cancelled' }),
      Appointment.countDocuments({
        ...baseQuery,
        startDateTime: { $gte: new Date() },
        status: { $in: ['scheduled', 'confirmed'] }
      }),
      Appointment.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Appointment.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      totals: {
        total: totalAppointments,
        scheduled: scheduledAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        upcoming: upcomingAppointments
      },
      breakdown: {
        byType: appointmentsByType,
        byStatus: appointmentsByStatus
      },
      completionRate: totalAppointments > 0 ? 
        ((completedAppointments / totalAppointments) * 100).toFixed(2) : 0,
      cancellationRate: totalAppointments > 0 ? 
        ((cancelledAppointments / totalAppointments) * 100).toFixed(2) : 0
    };

  } catch (error) {
    console.error('Error getting appointment statistics:', error);
    throw error;
  }
};

/**
 * Validate appointment business rules
 * @param {Object} appointmentData - Appointment data to validate
 * @returns {Object} Validation result
 */
const validateAppointmentRules = (appointmentData) => {
  const errors = [];
  const { startDateTime, endDateTime } = appointmentData;

  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  const now = new Date();

  // Check if appointment is in the past
  if (start <= now) {
    errors.push('Appointment cannot be scheduled in the past');
  }

  // Check if appointment is at least 1 hour in advance
  const oneHourFromNow = new Date(now.getTime() + (60 * 60 * 1000));
  if (start < oneHourFromNow) {
    errors.push('Appointment must be scheduled at least 1 hour in advance');
  }

  // Check business hours (8 AM - 6 PM)
  const startHour = start.getHours();
  const endHour = end.getHours();
  
  if (startHour < 8 || startHour >= 18 || endHour < 8 || endHour > 18) {
    errors.push('Appointments must be scheduled during business hours (8 AM - 6 PM)');
  }

  // Check if it's a weekday
  const dayOfWeek = start.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    errors.push('Appointments can only be scheduled on weekdays (Monday - Friday)');
  }

  // Check duration (max 4 hours)
  const duration = (end - start) / (1000 * 60 * 60); // hours
  if (duration > 4) {
    errors.push('Appointment duration cannot exceed 4 hours');
  }

  // Check minimum duration (15 minutes)
  if (duration < 0.25) {
    errors.push('Appointment duration must be at least 15 minutes');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  checkAppointmentConflicts,
  generateAvailableSlots,
  sendAppointmentReminders,
  getAppointmentStatistics,
  validateAppointmentRules
};
