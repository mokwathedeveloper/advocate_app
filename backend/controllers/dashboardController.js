// Dashboard controller for LegalPro v1.0.1
const Case = require('../models/Case');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

// @desc    Get dashboard data
// @route   GET /api/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    // Get basic statistics
    const totalCases = await Case.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalAppointments = await Appointment.countDocuments();

    // Get recent cases
    const recentCases = await Case.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('clientId', 'name email');

    // Get upcoming appointments
    const upcomingAppointments = await Appointment.find({
      date: { $gte: new Date() }
    })
      .sort({ date: 1 })
      .limit(5)
      .populate('clientId', 'name email')
      .populate('advocateId', 'name email');

    res.json({
      success: true,
      data: {
        statistics: {
          totalCases,
          totalUsers,
          totalAppointments
        },
        recentCases,
        upcomingAppointments
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
};

module.exports = {
  getDashboardData
};