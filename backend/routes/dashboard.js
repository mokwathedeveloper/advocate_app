// Dashboard routes for LegalPro v1.0.1
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// GET /api/dashboard
router.get('/', dashboardController.getDashboardData);

module.exports = router;