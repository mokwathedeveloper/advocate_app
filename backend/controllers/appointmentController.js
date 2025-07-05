// Comprehensive Appointment Controller for LegalPro v1.0.1
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Case = require('../models/Case');
const { sendNotification } = require('../utils/notificationService');

// @desc    Get all appointments with filtering and pagination
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      advocateId,
      clientId,
      caseId,
      startDate,
      endDate,
      search
    } = req.query;

    // Build filter based on user role
    let filter = {};

    // Role-based filtering
    if (req.user.role === 'client') {
      filter.clientId = req.user._id;
    } else if (req.user.role === 'advocate') {
      filter.advocateId = req.user._id;
    }
    // Admins can see all appointments

    // Apply additional filters
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (advocateId && req.user.role !== 'client') filter.advocateId = advocateId;
    if (clientId && req.user.role === 'admin') filter.clientId = clientId;
    if (caseId) filter.caseId = caseId;

    // Date range filter
    if (startDate || endDate) {
      filter.startDateTime = {};
      if (startDate) filter.startDateTime.$gte = new Date(startDate);
      if (endDate) filter.startDateTime.$lte = new Date(endDate);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    const appointments = await Appointment.find(filter)
      .populate('clientId', 'firstName lastName email phone')
      .populate('advocateId', 'firstName lastName email specialization')
      .populate('caseId', 'title caseNumber')
      .populate('bookedBy', 'firstName lastName')
      .sort({ startDateTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointments'
    });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('clientId', 'firstName lastName email phone')
      .populate('advocateId', 'firstName lastName email specialization')
      .populate('caseId', 'title caseNumber')
      .populate('bookedBy', 'firstName lastName')
      .populate('cancelledBy', 'firstName lastName')
      .populate('notes.author', 'firstName lastName');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check access permissions
    const hasAccess =
      req.user.role === 'admin' ||
      appointment.clientId._id.toString() === req.user._id.toString() ||
      appointment.advocateId._id.toString() === req.user._id.toString();

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this appointment'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });

  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointment'
    });
  }
};

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = async (req, res) => {
  try {
    const {
      title,
      description,
      clientId,
      advocateId,
      startDateTime,
      endDateTime,
      type,
      priority,
      location,
      caseId,
      isRecurring,
      recurrence,
      reminderSettings
    } = req.body;

    // Validate required fields
    if (!title || !clientId || !advocateId || !startDateTime || !endDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if users exist and have correct roles
    const client = await User.findById(clientId);
    const advocate = await User.findById(advocateId);

    if (!client || client.role !== 'client') {
      return res.status(400).json({
        success: false,
        message: 'Invalid client'
      });
    }

    if (!advocate || advocate.role !== 'advocate') {
      return res.status(400).json({
        success: false,
        message: 'Invalid advocate'
      });
    }

    // Check for scheduling conflicts
    const conflicts = await Appointment.findConflicts(
      advocateId,
      new Date(startDateTime),
      new Date(endDateTime)
    );

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Appointment conflicts with existing schedule',
        conflicts: conflicts.map(c => ({
          id: c._id,
          title: c.title,
          startDateTime: c.startDateTime,
          endDateTime: c.endDateTime
        }))
      });
    }

    // Validate case if provided
    if (caseId) {
      const caseDoc = await Case.findById(caseId);
      if (!caseDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid case ID'
        });
      }
    }

    // Create appointment
    const appointmentData = {
      title,
      description,
      clientId,
      advocateId,
      startDateTime: new Date(startDateTime),
      endDateTime: new Date(endDateTime),
      type: type || 'consultation',
      priority: priority || 'medium',
      location,
      caseId,
      isRecurring: isRecurring || false,
      recurrence,
      reminderSettings,
      bookedBy: req.user._id
    };

    const appointment = await Appointment.create(appointmentData);

    // Populate the created appointment
    await appointment.populate([
      { path: 'clientId', select: 'firstName lastName email phone' },
      { path: 'advocateId', select: 'firstName lastName email' },
      { path: 'bookedBy', select: 'firstName lastName' }
    ]);

    // Send confirmation notifications
    try {
      // Notify client
      await sendNotification(client, 'appointmentConfirmation', {
        title: appointment.title,
        date: appointment.formattedDate,
        time: appointment.formattedTime,
        advocateName: `${advocate.firstName} ${advocate.lastName}`,
        location: appointment.location?.type || 'office'
      });

      // Notify advocate
      await sendNotification(advocate, 'appointmentScheduled', {
        title: appointment.title,
        date: appointment.formattedDate,
        time: appointment.formattedTime,
        clientName: `${client.firstName} ${client.lastName}`,
        location: appointment.location?.type || 'office'
      });
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
      // Don't fail the appointment creation if notifications fail
    }

    res.status(201).json({
      success: true,
      data: appointment,
      message: 'Appointment created successfully'
    });

  } catch (error) {
    console.error('Create appointment error:', error);

    // Handle custom validation errors from pre-save hooks
    if (error.message && (
      error.message.includes('Cannot schedule appointments in the past') ||
      error.message.includes('Appointment duration cannot exceed') ||
      error.message.includes('End time must be after start time')
    )) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create appointment'
    });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check permissions
    const canUpdate =
      req.user.role === 'admin' ||
      appointment.advocateId.toString() === req.user._id.toString() ||
      (appointment.bookedBy.toString() === req.user._id.toString() && appointment.canBeCancelled());

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }

    const {
      title,
      description,
      startDateTime,
      endDateTime,
      type,
      priority,
      location,
      status,
      notes
    } = req.body;

    // If updating time, check for conflicts
    if (startDateTime || endDateTime) {
      const newStartTime = startDateTime ? new Date(startDateTime) : appointment.startDateTime;
      const newEndTime = endDateTime ? new Date(endDateTime) : appointment.endDateTime;

      const conflicts = await Appointment.findConflicts(
        appointment.advocateId,
        newStartTime,
        newEndTime,
        appointment._id
      );

      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Updated time conflicts with existing schedule',
          conflicts: conflicts.map(c => ({
            id: c._id,
            title: c.title,
            startDateTime: c.startDateTime,
            endDateTime: c.endDateTime
          }))
        });
      }
    }

    // Update fields
    if (title) appointment.title = title;
    if (description !== undefined) appointment.description = description;
    if (startDateTime) appointment.startDateTime = new Date(startDateTime);
    if (endDateTime) appointment.endDateTime = new Date(endDateTime);
    if (type) appointment.type = type;
    if (priority) appointment.priority = priority;
    if (location) appointment.location = { ...appointment.location, ...location };
    if (status) appointment.status = status;

    // Handle status changes
    if (status === 'completed' && !appointment.completedAt) {
      appointment.completedAt = new Date();
    }

    if (status === 'cancelled') {
      appointment.cancelledBy = req.user._id;
      appointment.cancelledAt = new Date();
      if (req.body.cancellationReason) {
        appointment.cancellationReason = req.body.cancellationReason;
      }
    }

    await appointment.save();

    // Populate updated appointment
    await appointment.populate([
      { path: 'clientId', select: 'firstName lastName email phone' },
      { path: 'advocateId', select: 'firstName lastName email' },
      { path: 'bookedBy', select: 'firstName lastName' },
      { path: 'cancelledBy', select: 'firstName lastName' }
    ]);

    res.status(200).json({
      success: true,
      data: appointment,
      message: 'Appointment updated successfully'
    });

  } catch (error) {
    console.error('Update appointment error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update appointment'
    });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check permissions - only admin or the person who booked can delete
    const canDelete =
      req.user.role === 'admin' ||
      appointment.bookedBy.toString() === req.user._id.toString();

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this appointment'
      });
    }

    await appointment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });

  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete appointment'
    });
  }
};

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('clientId', 'firstName lastName email phone')
      .populate('advocateId', 'firstName lastName email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if appointment can be cancelled
    if (!appointment.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment cannot be cancelled (too close to start time or already completed/cancelled)'
      });
    }

    // Check permissions
    const canCancel =
      req.user.role === 'admin' ||
      appointment.clientId._id.toString() === req.user._id.toString() ||
      appointment.advocateId._id.toString() === req.user._id.toString();

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this appointment'
      });
    }

    // Update appointment status
    appointment.status = 'cancelled';
    appointment.cancelledBy = req.user._id;
    appointment.cancelledAt = new Date();
    appointment.cancellationReason = req.body.reason || 'No reason provided';

    await appointment.save();

    // Send cancellation notifications
    try {
      const notificationData = {
        title: appointment.title,
        date: appointment.formattedDate,
        time: appointment.formattedTime,
        reason: appointment.cancellationReason
      };

      // Notify client if cancelled by advocate/admin
      if (req.user._id.toString() !== appointment.clientId._id.toString()) {
        await sendNotification(appointment.clientId, 'appointmentCancelled', {
          ...notificationData,
          cancelledBy: `${req.user.firstName} ${req.user.lastName}`
        });
      }

      // Notify advocate if cancelled by client/admin
      if (req.user._id.toString() !== appointment.advocateId._id.toString()) {
        await sendNotification(appointment.advocateId, 'appointmentCancelled', {
          ...notificationData,
          cancelledBy: `${req.user.firstName} ${req.user.lastName}`
        });
      }
    } catch (notificationError) {
      console.error('Cancellation notification error:', notificationError);
    }

    res.status(200).json({
      success: true,
      data: appointment,
      message: 'Appointment cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment'
    });
  }
};

// @desc    Get available time slots for an advocate
// @route   GET /api/appointments/availability/:advocateId
// @access  Private
const getAvailability = async (req, res) => {
  try {
    const { advocateId } = req.params;
    const { date, duration = 60 } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Validate advocate
    const advocate = await User.findById(advocateId);
    if (!advocate || advocate.role !== 'advocate') {
      return res.status(400).json({
        success: false,
        message: 'Invalid advocate'
      });
    }

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

    // Generate available time slots
    const slots = [];
    const slotDuration = 30; // 30-minute slots
    const appointmentDuration = parseInt(duration);

    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotStart = new Date(requestedDate);
        slotStart.setHours(hour, minute, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + appointmentDuration);

        // Check if slot conflicts with existing appointments
        const hasConflict = existingAppointments.some(apt =>
          slotStart < apt.endDateTime && slotEnd > apt.startDateTime
        );

        // Check if slot is in the past
        const isPast = slotStart < new Date();

        if (!hasConflict && !isPast && slotEnd <= endOfDay) {
          slots.push({
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            available: true
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        date: requestedDate.toISOString().split('T')[0],
        advocateId,
        duration: appointmentDuration,
        availableSlots: slots
      }
    });

  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get availability'
    });
  }
};

module.exports = {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  cancelAppointment,
  getAvailability
};