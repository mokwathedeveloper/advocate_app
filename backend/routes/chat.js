// Chat routes for LegalPro v1.0.1
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMessages, markAsRead } = require('../controllers/chatController');

// Get chat messages between current user and recipient
router.get('/messages/:recipientId', protect, getMessages);

// Mark messages as read
router.put('/messages/read/:senderId', protect, markAsRead);

module.exports = router;
