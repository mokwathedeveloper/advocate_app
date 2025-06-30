// Socket.IO handler for LegalPro v1.0.1
const ChatMessage = require('../models/ChatMessage');

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join user to a room based on user ID
    socket.on('joinRoom', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined room ${userId}`);
    });

    // Handle sending message
    socket.on('sendMessage', async (data) => {
      const { senderId, recipientId, content, type, fileUrl, fileName } = data;

      // Save message to DB
      const message = new ChatMessage({
        senderId,
        recipientId,
        content,
        type,
        fileUrl,
        fileName,
        isRead: false
      });

      await message.save();

      // Emit message to recipient room
      io.to(recipientId).emit('receiveMessage', message);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

module.exports = socketHandler;
