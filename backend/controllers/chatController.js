// Chat Controller for REST API - LegalPro v1.0.1
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Case = require('../models/Case');
const { validateConversation } = require('../socket/middleware/validation');

class ChatController {
  // Get user's conversations with pagination and filtering
  async getConversations(req, res) {
    try {
      const userId = req.user.id;
      const { 
        page = 1, 
        limit = 20, 
        type, 
        search, 
        caseId 
      } = req.query;

      const options = {
        limit: Math.min(parseInt(limit), 50),
        type,
        caseId
      };

      let conversations = await Conversation.findByParticipant(userId, options);

      // Apply search filter if provided
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        conversations = conversations.filter(conv => 
          conv.title?.match(searchRegex) || 
          conv.description?.match(searchRegex) ||
          conv.lastMessage?.content?.match(searchRegex)
        );
      }

      // Calculate pagination
      const total = conversations.length;
      const startIndex = (page - 1) * options.limit;
      const endIndex = startIndex + options.limit;
      const paginatedConversations = conversations.slice(startIndex, endIndex);

      // Add unread message count for each conversation
      const conversationsWithUnread = await Promise.all(
        paginatedConversations.map(async (conv) => {
          const participant = conv.participants.find(p => 
            p.userId._id.toString() === userId && !p.leftAt
          );
          
          const unreadCount = await Message.getUnreadCount(
            conv._id, 
            userId, 
            participant?.lastReadAt || new Date(0)
          );

          return {
            ...conv.toObject(),
            unreadCount
          };
        })
      );

      res.json({
        success: true,
        data: conversationsWithUnread,
        pagination: {
          page: parseInt(page),
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit)
        }
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversations'
      });
    }
  }

  // Get single conversation details
  async getConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      const conversation = await Conversation.findById(conversationId)
        .populate('participants.userId', 'firstName lastName email avatar role')
        .populate('caseId', 'title caseNumber')
        .populate('createdBy', 'firstName lastName');

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      // Check if user is a participant
      const isParticipant = conversation.participants.some(p => 
        p.userId._id.toString() === userId && !p.leftAt
      );

      if (!isParticipant && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this conversation'
        });
      }

      res.json({
        success: true,
        data: conversation
      });
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversation'
      });
    }
  }

  // Create new conversation
  async createConversation(req, res) {
    try {
      const userId = req.user.id;
      const conversationData = req.body;

      // Validate conversation data
      const validationError = validateConversation(conversationData);
      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError
        });
      }

      // For private conversations, check if one already exists
      if (conversationData.type === 'private' && conversationData.participants.length === 2) {
        const [participant1, participant2] = conversationData.participants;
        const existingConversation = await Conversation.findPrivateConversation(
          participant1.userId || participant1,
          participant2.userId || participant2
        );

        if (existingConversation) {
          return res.json({
            success: true,
            data: existingConversation,
            message: 'Existing private conversation returned'
          });
        }
      }

      // Validate participants exist
      const participantIds = conversationData.participants.map(p => p.userId || p);
      const users = await User.find({ _id: { $in: participantIds }, isActive: true });
      
      if (users.length !== participantIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more participants not found or inactive'
        });
      }

      // Create conversation
      const conversation = new Conversation({
        ...conversationData,
        createdBy: userId,
        participants: conversationData.participants.map(p => ({
          userId: p.userId || p,
          role: p.role || 'member',
          permissions: p.permissions || ['send_message']
        }))
      });

      await conversation.save();

      // Populate for response
      await conversation.populate('participants.userId', 'firstName lastName email avatar role');
      await conversation.populate('caseId', 'title caseNumber');
      await conversation.populate('createdBy', 'firstName lastName');

      res.status(201).json({
        success: true,
        data: conversation,
        message: 'Conversation created successfully'
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create conversation'
      });
    }
  }

  // Get messages for a conversation
  async getMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      const { 
        page = 1, 
        limit = 50, 
        before, 
        after,
        search 
      } = req.query;

      // Verify user is participant
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      const isParticipant = conversation.participants.some(p => 
        p.userId.toString() === userId && !p.leftAt
      );

      if (!isParticipant && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this conversation'
        });
      }

      let messages;
      
      if (search) {
        // Search messages
        messages = await Message.searchMessages(conversationId, search, {
          limit: Math.min(parseInt(limit), 100)
        });
      } else {
        // Get messages with pagination
        const options = {
          limit: Math.min(parseInt(limit), 100),
          before,
          after,
          ascending: false // Most recent first
        };

        messages = await Message.findByConversation(conversationId, options);
      }

      res.json({
        success: true,
        data: messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: messages.length === parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch messages'
      });
    }
  }

  // Search users for adding to conversations
  async searchUsers(req, res) {
    try {
      const { query, limit = 10, exclude } = req.query;

      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters'
        });
      }

      const searchRegex = new RegExp(query, 'i');
      const searchQuery = {
        $and: [
          {
            $or: [
              { firstName: searchRegex },
              { lastName: searchRegex },
              { email: searchRegex }
            ]
          },
          { isActive: true },
          { isEmailVerified: true }
        ]
      };

      // Exclude specified users
      if (exclude) {
        const excludeIds = Array.isArray(exclude) ? exclude : [exclude];
        searchQuery.$and.push({ _id: { $nin: excludeIds } });
      }

      const users = await User.find(searchQuery)
        .select('firstName lastName email avatar role')
        .limit(Math.min(parseInt(limit), 20))
        .sort({ firstName: 1, lastName: 1 });

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search users'
      });
    }
  }

  // Mark conversation as read
  async markAsRead(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      await conversation.markAsRead(userId);

      res.json({
        success: true,
        message: 'Conversation marked as read'
      });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to mark conversation as read'
      });
    }
  }
}

module.exports = new ChatController();
