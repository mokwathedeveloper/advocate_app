const ChatMessage = require('../models/ChatMessage');

// Get chat messages between two users
const getMessages = async (req, res) => {
  try {
    const { userId } = req.user;
    const { recipientId } = req.params;

    const messages = await ChatMessage.find({
      $or: [
        { senderId: userId, recipientId },
        { senderId: recipientId, recipientId: userId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { userId } = req.user;
    const { senderId } = req.params;

    await ChatMessage.updateMany(
      { senderId, recipientId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getMessages,
  markAsRead
};
