// Notification controller for LegalPro v1.0.1
const { sendNotification, sendTemplatedEmail, sendTemplatedSMS } = require('../utils/notificationService');
const User = require('../models/User');
const Case = require('../models/Case');
const Appointment = require('../models/Appointment');

// @desc    Send welcome notification to new user
// @route   POST /api/notifications/welcome
// @access  Private (Admin/Super Admin)
const sendWelcomeNotification = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const result = await sendNotification(user, 'welcome', {});
    
    res.status(200).json({
      success: true,
      message: 'Welcome notification sent',
      result
    });
  } catch (error) {
    console.error('Error sending welcome notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send welcome notification',
      error: error.message
    });
  }
};

// @desc    Send appointment confirmation
// @route   POST /api/notifications/appointment-confirmation
// @access  Private
const sendAppointmentConfirmation = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    
    const appointment = await Appointment.findById(appointmentId)
      .populate('clientId', 'firstName lastName email phone')
      .populate('advocateId', 'firstName lastName');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const data = {
      date: appointment.date.toDateString(),
      time: appointment.time,
      advocate: `${appointment.advocateId.firstName} ${appointment.advocateId.lastName}`
    };

    const result = await sendNotification(appointment.clientId, 'appointmentConfirmation', data);
    
    res.status(200).json({
      success: true,
      message: 'Appointment confirmation sent',
      result
    });
  } catch (error) {
    console.error('Error sending appointment confirmation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send appointment confirmation',
      error: error.message
    });
  }
};

// @desc    Send case update notification
// @route   POST /api/notifications/case-update
// @access  Private (Admin/Super Admin)
const sendCaseUpdateNotification = async (req, res) => {
  try {
    const { caseId, notes } = req.body;
    
    const caseData = await Case.findById(caseId)
      .populate('clientId', 'firstName lastName email phone');
    
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    const data = {
      caseTitle: caseData.title,
      status: caseData.status,
      notes: notes || ''
    };

    const result = await sendNotification(caseData.clientId, 'caseUpdate', data);
    
    res.status(200).json({
      success: true,
      message: 'Case update notification sent',
      result
    });
  } catch (error) {
    console.error('Error sending case update notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send case update notification',
      error: error.message
    });
  }
};

// @desc    Send payment confirmation
// @route   POST /api/notifications/payment-confirmation
// @access  Private
const sendPaymentConfirmation = async (req, res) => {
  try {
    const { userId, amount, transactionId, service } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const data = {
      amount,
      transactionId,
      service: service || 'Legal Consultation'
    };

    const result = await sendNotification(user, 'paymentConfirmation', data);
    
    res.status(200).json({
      success: true,
      message: 'Payment confirmation sent',
      result
    });
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send payment confirmation',
      error: error.message
    });
  }
};

// @desc    Send appointment reminder (for scheduled job)
// @route   POST /api/notifications/appointment-reminder
// @access  Private (System)
const sendAppointmentReminder = async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Find appointments for tomorrow
    const appointments = await Appointment.find({
      date: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow
      },
      status: 'scheduled'
    }).populate('clientId', 'firstName lastName email phone');

    const results = [];
    
    for (const appointment of appointments) {
      const data = {
        date: appointment.date.toDateString(),
        time: appointment.time
      };

      try {
        const result = await sendNotification(appointment.clientId, 'appointmentReminder', data);
        results.push({
          appointmentId: appointment._id,
          clientName: `${appointment.clientId.firstName} ${appointment.clientId.lastName}`,
          result
        });
      } catch (error) {
        results.push({
          appointmentId: appointment._id,
          clientName: `${appointment.clientId.firstName} ${appointment.clientId.lastName}`,
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Processed ${appointments.length} appointment reminders`,
      results
    });
  } catch (error) {
    console.error('Error sending appointment reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send appointment reminders',
      error: error.message
    });
  }
};

// @desc    Send bulk notification
// @route   POST /api/notifications/bulk
// @access  Private (Admin/Super Admin)
const sendBulkNotification = async (req, res) => {
  try {
    const { userIds, type, subject, message } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    const users = await User.find({ _id: { $in: userIds } });
    const results = [];

    for (const user of users) {
      try {
        let result;
        if (type === 'email') {
          result = await sendTemplatedEmail(user.email, 'custom', { subject, message });
        } else if (type === 'sms') {
          result = await sendTemplatedSMS(user.phone, 'custom', { message });
        } else {
          // Send both
          result = {
            email: user.email ? await sendTemplatedEmail(user.email, 'custom', { subject, message }) : null,
            sms: user.phone ? await sendTemplatedSMS(user.phone, 'custom', { message }) : null
          };
        }

        results.push({
          userId: user._id,
          userName: `${user.firstName} ${user.lastName}`,
          result
        });
      } catch (error) {
        results.push({
          userId: user._id,
          userName: `${user.firstName} ${user.lastName}`,
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Processed bulk notification for ${users.length} users`,
      results
    });
  } catch (error) {
    console.error('Error sending bulk notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk notification',
      error: error.message
    });
  }
};

module.exports = {
  sendWelcomeNotification,
  sendAppointmentConfirmation,
  sendCaseUpdateNotification,
  sendPaymentConfirmation,
  sendAppointmentReminder,
  sendBulkNotification
};
