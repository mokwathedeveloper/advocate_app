// Chat Routes for REST API - LegalPro v1.0.1
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

// Conversation routes
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:conversationId', chatController.getConversation);
router.post('/conversations', chatController.createConversation);

// Message routes
router.get('/conversations/:conversationId/messages', chatController.getMessages);

// Utility routes
router.get('/users/search', chatController.searchUsers);
router.put('/conversations/:conversationId/read', chatController.markAsRead);

module.exports = router;
