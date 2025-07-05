// Socket.IO Server for Real-time Chat System - LegalPro v1.0.1
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { rateLimiter } = require('./middleware/rateLimiter');
const { validateMessage } = require('./middleware/validation');
const socketEvents = require('./events/socketEvents');

class ChatSocketServer {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.onlineUsers = new Map(); // userId -> { socketId, lastSeen, status }
    this.userSockets = new Map(); // socketId -> userId
    this.typingUsers = new Map(); // conversationId -> Set of userIds

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user || !user.isActive) {
          return next(new Error('Invalid user or account deactivated'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    // Rate limiting middleware
    this.io.use(rateLimiter);
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.firstName} ${socket.user.lastName} connected: ${socket.id}`);
      
      this.handleUserConnection(socket);
      this.setupSocketEvents(socket);
    });
  }

  async handleUserConnection(socket) {
    const userId = socket.userId;
    
    // Update online users
    this.onlineUsers.set(userId, {
      socketId: socket.id,
      lastSeen: new Date(),
      status: 'online'
    });
    
    this.userSockets.set(socket.id, userId);

    // Join user to their conversation rooms
    await this.joinUserRooms(socket);

    // Broadcast user online status to contacts
    await this.broadcastUserStatus(userId, 'online');

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleUserDisconnection(socket);
    });
  }

  async joinUserRooms(socket) {
    try {
      const conversations = await Conversation.findByParticipant(socket.userId);
      
      for (const conversation of conversations) {
        const roomId = `conversation_${conversation._id}`;
        socket.join(roomId);
      }

      // Join personal room for direct notifications
      socket.join(`user_${socket.userId}`);
      
      console.log(`User ${socket.userId} joined ${conversations.length} conversation rooms`);
    } catch (error) {
      console.error('Error joining user rooms:', error);
      socket.emit('error', { message: 'Failed to join conversation rooms' });
    }
  }

  async handleUserDisconnection(socket) {
    const userId = socket.userId;
    
    console.log(`User ${socket.user.firstName} ${socket.user.lastName} disconnected: ${socket.id}`);
    
    // Update user status
    this.onlineUsers.set(userId, {
      socketId: null,
      lastSeen: new Date(),
      status: 'offline'
    });
    
    this.userSockets.delete(socket.id);

    // Clear typing indicators
    this.clearUserTyping(userId);

    // Broadcast user offline status
    await this.broadcastUserStatus(userId, 'offline');

    // Clean up after 5 minutes if user doesn't reconnect
    setTimeout(() => {
      const userStatus = this.onlineUsers.get(userId);
      if (userStatus && !userStatus.socketId) {
        this.onlineUsers.delete(userId);
      }
    }, 5 * 60 * 1000);
  }

  setupSocketEvents(socket) {
    // Message events
    socket.on(socketEvents.SEND_MESSAGE, async (data) => {
      await this.handleSendMessage(socket, data);
    });

    socket.on(socketEvents.MESSAGE_DELIVERED, async (data) => {
      await this.handleMessageDelivered(socket, data);
    });

    socket.on(socketEvents.MESSAGE_READ, async (data) => {
      await this.handleMessageRead(socket, data);
    });

    // Typing events
    socket.on(socketEvents.TYPING_START, (data) => {
      this.handleTypingStart(socket, data);
    });

    socket.on(socketEvents.TYPING_STOP, (data) => {
      this.handleTypingStop(socket, data);
    });

    // Conversation events
    socket.on(socketEvents.JOIN_CONVERSATION, async (data) => {
      await this.handleJoinConversation(socket, data);
    });

    socket.on(socketEvents.LEAVE_CONVERSATION, async (data) => {
      await this.handleLeaveConversation(socket, data);
    });

    // Status events
    socket.on(socketEvents.GET_ONLINE_USERS, (data) => {
      this.handleGetOnlineUsers(socket, data);
    });

    // Message reactions
    socket.on(socketEvents.ADD_REACTION, async (data) => {
      await this.handleAddReaction(socket, data);
    });

    socket.on(socketEvents.REMOVE_REACTION, async (data) => {
      await this.handleRemoveReaction(socket, data);
    });
  }

  async handleSendMessage(socket, data) {
    try {
      // Validate message data
      const validationError = validateMessage(data);
      if (validationError) {
        return socket.emit(socketEvents.ERROR, { message: validationError });
      }

      const { conversationId, content, replyTo, priority = 'normal' } = data;

      // Verify user is participant in conversation
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return socket.emit(socketEvents.ERROR, { message: 'Conversation not found' });
      }

      const isParticipant = conversation.participants.some(p => 
        p.userId.toString() === socket.userId && !p.leftAt
      );

      if (!isParticipant) {
        return socket.emit(socketEvents.ERROR, { message: 'Not authorized to send messages in this conversation' });
      }

      // Check permissions
      if (!conversation.hasPermission(socket.userId, 'send_message')) {
        return socket.emit(socketEvents.ERROR, { message: 'No permission to send messages' });
      }

      // Create message
      const message = new Message({
        conversationId,
        senderId: socket.userId,
        content,
        replyTo,
        priority,
        metadata: {
          clientInfo: {
            userAgent: socket.handshake.headers['user-agent'],
            platform: data.platform || 'web'
          }
        }
      });

      await message.save();

      // Populate message for response
      await message.populate('senderId', 'firstName lastName avatar role');
      if (replyTo) {
        await message.populate('replyTo', 'content.text senderId timestamp');
      }

      // Update conversation last message
      await conversation.updateLastMessage(message);

      // Emit to conversation participants
      const roomId = `conversation_${conversationId}`;
      this.io.to(roomId).emit(socketEvents.RECEIVE_MESSAGE, {
        message: message.toObject(),
        conversationId
      });

      // Send delivery confirmation to sender
      socket.emit(socketEvents.MESSAGE_SENT, {
        tempId: data.tempId,
        message: message.toObject()
      });

      // Mark as delivered for online participants
      await this.markMessageAsDelivered(message, conversation);

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit(socketEvents.ERROR, { 
        message: 'Failed to send message',
        tempId: data.tempId 
      });
    }
  }

  async markMessageAsDelivered(message, conversation) {
    const onlineParticipants = conversation.participants
      .filter(p => !p.leftAt && p.userId.toString() !== message.senderId.toString())
      .filter(p => this.onlineUsers.has(p.userId.toString()));

    for (const participant of onlineParticipants) {
      await message.markAsDelivered(participant.userId);
      
      // Notify sender of delivery
      const senderSocket = this.getUserSocket(message.senderId.toString());
      if (senderSocket) {
        senderSocket.emit(socketEvents.MESSAGE_DELIVERED, {
          messageId: message._id,
          userId: participant.userId,
          timestamp: new Date()
        });
      }
    }
  }

  async handleMessageDelivered(socket, data) {
    try {
      const { messageId } = data;
      const message = await Message.findById(messageId);
      
      if (!message) {
        return socket.emit(socketEvents.ERROR, { message: 'Message not found' });
      }

      await message.markAsDelivered(socket.userId);

      // Notify sender
      const senderSocket = this.getUserSocket(message.senderId.toString());
      if (senderSocket) {
        senderSocket.emit(socketEvents.MESSAGE_DELIVERED, {
          messageId,
          userId: socket.userId,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error marking message as delivered:', error);
    }
  }

  async handleMessageRead(socket, data) {
    try {
      const { messageId, conversationId } = data;
      
      if (messageId) {
        // Mark specific message as read
        const message = await Message.findById(messageId);
        if (message) {
          await message.markAsRead(socket.userId);
          
          // Notify sender
          const senderSocket = this.getUserSocket(message.senderId.toString());
          if (senderSocket) {
            senderSocket.emit(socketEvents.MESSAGE_READ, {
              messageId,
              userId: socket.userId,
              timestamp: new Date()
            });
          }
        }
      }

      if (conversationId) {
        // Mark conversation as read
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          await conversation.markAsRead(socket.userId);
        }
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  handleTypingStart(socket, data) {
    const { conversationId } = data;
    
    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set());
    }
    
    this.typingUsers.get(conversationId).add(socket.userId);
    
    // Broadcast to other participants
    socket.to(`conversation_${conversationId}`).emit(socketEvents.TYPING_START, {
      conversationId,
      userId: socket.userId,
      user: {
        firstName: socket.user.firstName,
        lastName: socket.user.lastName
      }
    });

    // Auto-stop typing after 3 seconds
    setTimeout(() => {
      this.handleTypingStop(socket, data);
    }, 3000);
  }

  handleTypingStop(socket, data) {
    const { conversationId } = data;
    
    if (this.typingUsers.has(conversationId)) {
      this.typingUsers.get(conversationId).delete(socket.userId);
      
      if (this.typingUsers.get(conversationId).size === 0) {
        this.typingUsers.delete(conversationId);
      }
    }
    
    // Broadcast to other participants
    socket.to(`conversation_${conversationId}`).emit(socketEvents.TYPING_STOP, {
      conversationId,
      userId: socket.userId
    });
  }

  clearUserTyping(userId) {
    for (const [conversationId, typingSet] of this.typingUsers.entries()) {
      if (typingSet.has(userId)) {
        typingSet.delete(userId);
        
        // Broadcast typing stop
        this.io.to(`conversation_${conversationId}`).emit(socketEvents.TYPING_STOP, {
          conversationId,
          userId
        });
        
        if (typingSet.size === 0) {
          this.typingUsers.delete(conversationId);
        }
      }
    }
  }

  async broadcastUserStatus(userId, status) {
    // Get user's conversations to notify participants
    const conversations = await Conversation.findByParticipant(userId);
    
    const notifiedUsers = new Set();
    
    for (const conversation of conversations) {
      for (const participant of conversation.participants) {
        const participantId = participant.userId.toString();
        
        if (participantId !== userId && !notifiedUsers.has(participantId)) {
          const participantSocket = this.getUserSocket(participantId);
          if (participantSocket) {
            participantSocket.emit(socketEvents.USER_STATUS_CHANGE, {
              userId,
              status,
              lastSeen: new Date()
            });
          }
          notifiedUsers.add(participantId);
        }
      }
    }
  }

  getUserSocket(userId) {
    const userStatus = this.onlineUsers.get(userId);
    if (userStatus && userStatus.socketId) {
      return this.io.sockets.sockets.get(userStatus.socketId);
    }
    return null;
  }

  async handleJoinConversation(socket, data) {
    try {
      const { conversationId } = data;
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return socket.emit(socketEvents.ERROR, { message: 'Conversation not found' });
      }

      const isParticipant = conversation.participants.some(p =>
        p.userId.toString() === socket.userId && !p.leftAt
      );

      if (!isParticipant) {
        return socket.emit(socketEvents.ERROR, { message: 'Not authorized to join this conversation' });
      }

      const roomId = `conversation_${conversationId}`;
      socket.join(roomId);

      // Get online participants
      const onlineParticipants = this.getOnlineParticipants(conversation);

      socket.emit(socketEvents.CONVERSATION_JOINED, {
        conversationId,
        onlineParticipants
      });

      // Notify other participants
      socket.to(roomId).emit(socketEvents.USER_JOINED_CONVERSATION, {
        conversationId,
        userId: socket.userId,
        user: {
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
          avatar: socket.user.avatar
        }
      });
    } catch (error) {
      console.error('Error joining conversation:', error);
      socket.emit(socketEvents.ERROR, { message: 'Failed to join conversation' });
    }
  }

  async handleLeaveConversation(socket, data) {
    try {
      const { conversationId } = data;
      const roomId = `conversation_${conversationId}`;

      socket.leave(roomId);

      // Notify other participants
      socket.to(roomId).emit(socketEvents.USER_LEFT_CONVERSATION, {
        conversationId,
        userId: socket.userId
      });

      socket.emit(socketEvents.CONVERSATION_LEFT, { conversationId });
    } catch (error) {
      console.error('Error leaving conversation:', error);
    }
  }

  handleGetOnlineUsers(socket, data) {
    const { conversationId } = data;

    if (conversationId) {
      // Get online users for specific conversation
      Conversation.findById(conversationId)
        .then(conversation => {
          if (conversation) {
            const onlineParticipants = this.getOnlineParticipants(conversation);
            socket.emit(socketEvents.ONLINE_USERS, {
              conversationId,
              users: onlineParticipants
            });
          }
        })
        .catch(error => {
          console.error('Error getting online users:', error);
        });
    } else {
      // Get all online users (for admin or general purposes)
      const onlineUsersList = Array.from(this.onlineUsers.entries()).map(([userId, status]) => ({
        userId,
        status: status.status,
        lastSeen: status.lastSeen
      }));

      socket.emit(socketEvents.ONLINE_USERS, {
        users: onlineUsersList
      });
    }
  }

  async handleAddReaction(socket, data) {
    try {
      const { messageId, emoji } = data;
      const message = await Message.findById(messageId);

      if (!message) {
        return socket.emit(socketEvents.ERROR, { message: 'Message not found' });
      }

      // Verify user is participant in conversation
      const conversation = await Conversation.findById(message.conversationId);
      const isParticipant = conversation.participants.some(p =>
        p.userId.toString() === socket.userId && !p.leftAt
      );

      if (!isParticipant) {
        return socket.emit(socketEvents.ERROR, { message: 'Not authorized to react to this message' });
      }

      await message.addReaction(socket.userId, emoji);

      // Broadcast reaction to conversation participants
      this.io.to(`conversation_${message.conversationId}`).emit(socketEvents.REACTION_ADDED, {
        messageId,
        userId: socket.userId,
        emoji,
        user: {
          firstName: socket.user.firstName,
          lastName: socket.user.lastName
        }
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      socket.emit(socketEvents.ERROR, { message: error.message || 'Failed to add reaction' });
    }
  }

  async handleRemoveReaction(socket, data) {
    try {
      const { messageId, emoji } = data;
      const message = await Message.findById(messageId);

      if (!message) {
        return socket.emit(socketEvents.ERROR, { message: 'Message not found' });
      }

      await message.removeReaction(socket.userId, emoji);

      // Broadcast reaction removal to conversation participants
      this.io.to(`conversation_${message.conversationId}`).emit(socketEvents.REACTION_REMOVED, {
        messageId,
        userId: socket.userId,
        emoji
      });
    } catch (error) {
      console.error('Error removing reaction:', error);
      socket.emit(socketEvents.ERROR, { message: error.message || 'Failed to remove reaction' });
    }
  }

  getOnlineParticipants(conversation) {
    return conversation.participants
      .filter(p => !p.leftAt)
      .map(p => {
        const userId = p.userId.toString();
        const userStatus = this.onlineUsers.get(userId);
        return {
          userId,
          status: userStatus ? userStatus.status : 'offline',
          lastSeen: userStatus ? userStatus.lastSeen : null
        };
      })
      .filter(p => p.status === 'online');
  }

  // Admin methods for monitoring and management
  getServerStats() {
    return {
      connectedUsers: this.onlineUsers.size,
      activeConnections: this.io.sockets.sockets.size,
      activeTyping: this.typingUsers.size,
      uptime: process.uptime()
    };
  }

  // Broadcast system message to all users
  broadcastSystemMessage(message, type = 'info') {
    this.io.emit(socketEvents.SYSTEM_MESSAGE, {
      message,
      type,
      timestamp: new Date()
    });
  }

  // Force disconnect user (admin function)
  disconnectUser(userId, reason = 'Administrative action') {
    const userSocket = this.getUserSocket(userId);
    if (userSocket) {
      userSocket.emit(socketEvents.FORCE_DISCONNECT, { reason });
      userSocket.disconnect(true);
    }
  }
}

module.exports = ChatSocketServer;
