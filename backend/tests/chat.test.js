// Comprehensive Chat System Tests - LegalPro v1.0.1
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');

describe('Chat System Tests', () => {
  let mongoServer;
  let user1, user2, user3;
  let user1Token, user2Token, user3Token;

  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});

    // Create test users
    user1 = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'advocate',
      isActive: true,
      isEmailVerified: true
    });

    user2 = await User.create({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      password: 'password123',
      role: 'client',
      isActive: true,
      isEmailVerified: true
    });

    user3 = await User.create({
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob@example.com',
      password: 'password123',
      role: 'advocate',
      isActive: true,
      isEmailVerified: true
    });

    // Generate tokens
    user1Token = jwt.sign({ id: user1._id }, process.env.JWT_SECRET || 'test-secret');
    user2Token = jwt.sign({ id: user2._id }, process.env.JWT_SECRET || 'test-secret');
    user3Token = jwt.sign({ id: user3._id }, process.env.JWT_SECRET || 'test-secret');
  });

  describe('Conversation Management', () => {
    test('should create a private conversation', async () => {
      const conversationData = {
        type: 'private',
        participants: [user1._id, user2._id]
      };

      const response = await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(conversationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('private');
      expect(response.body.data.participants).toHaveLength(2);
    });

    test('should create a group conversation', async () => {
      const conversationData = {
        type: 'group',
        participants: [user1._id, user2._id, user3._id],
        title: 'Test Group'
      };

      const response = await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(conversationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('group');
      expect(response.body.data.title).toBe('Test Group');
      expect(response.body.data.participants).toHaveLength(3);
    });

    test('should return existing private conversation', async () => {
      // Create first conversation
      const conversationData = {
        type: 'private',
        participants: [user1._id, user2._id]
      };

      const firstResponse = await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(conversationData)
        .expect(201);

      // Try to create the same conversation again
      const secondResponse = await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${user2Token}`)
        .send(conversationData)
        .expect(200);

      expect(secondResponse.body.data._id).toBe(firstResponse.body.data._id);
      expect(secondResponse.body.message).toContain('Existing private conversation');
    });

    test('should get user conversations', async () => {
      // Create test conversations
      await Conversation.create({
        type: 'private',
        participants: [
          { userId: user1._id, permissions: ['send_message'] },
          { userId: user2._id, permissions: ['send_message'] }
        ],
        createdBy: user1._id
      });

      await Conversation.create({
        type: 'group',
        participants: [
          { userId: user1._id, permissions: ['send_message'] },
          { userId: user2._id, permissions: ['send_message'] },
          { userId: user3._id, permissions: ['send_message'] }
        ],
        title: 'Test Group',
        createdBy: user1._id
      });

      const response = await request(app)
        .get('/api/chat/conversations')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    test('should get single conversation', async () => {
      const conversation = await Conversation.create({
        type: 'private',
        participants: [
          { userId: user1._id, permissions: ['send_message'] },
          { userId: user2._id, permissions: ['send_message'] }
        ],
        createdBy: user1._id
      });

      const response = await request(app)
        .get(`/api/chat/conversations/${conversation._id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(conversation._id.toString());
    });

    test('should not allow unauthorized access to conversation', async () => {
      const conversation = await Conversation.create({
        type: 'private',
        participants: [
          { userId: user1._id, permissions: ['send_message'] },
          { userId: user2._id, permissions: ['send_message'] }
        ],
        createdBy: user1._id
      });

      await request(app)
        .get(`/api/chat/conversations/${conversation._id}`)
        .set('Authorization', `Bearer ${user3Token}`)
        .expect(403);
    });
  });

  describe('Message Management', () => {
    let conversation;

    beforeEach(async () => {
      conversation = await Conversation.create({
        type: 'private',
        participants: [
          { userId: user1._id, permissions: ['send_message'] },
          { userId: user2._id, permissions: ['send_message'] }
        ],
        createdBy: user1._id
      });
    });

    test('should get messages for conversation', async () => {
      // Create test messages
      await Message.create({
        conversationId: conversation._id,
        senderId: user1._id,
        content: { text: 'Hello', type: 'text' }
      });

      await Message.create({
        conversationId: conversation._id,
        senderId: user2._id,
        content: { text: 'Hi there', type: 'text' }
      });

      const response = await request(app)
        .get(`/api/chat/conversations/${conversation._id}/messages`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    test('should search messages', async () => {
      await Message.create({
        conversationId: conversation._id,
        senderId: user1._id,
        content: { text: 'Hello world', type: 'text' }
      });

      await Message.create({
        conversationId: conversation._id,
        senderId: user2._id,
        content: { text: 'Goodbye', type: 'text' }
      });

      const response = await request(app)
        .get(`/api/chat/conversations/${conversation._id}/messages?search=hello`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].content.text).toContain('Hello');
    });

    test('should mark conversation as read', async () => {
      const response = await request(app)
        .put(`/api/chat/conversations/${conversation._id}/read`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('User Search', () => {
    test('should search users by name', async () => {
      const response = await request(app)
        .get('/api/chat/users/search?query=john')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].firstName).toBe('John');
    });

    test('should search users by email', async () => {
      const response = await request(app)
        .get('/api/chat/users/search?query=jane@example.com')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].email).toBe('jane@example.com');
    });

    test('should exclude specified users from search', async () => {
      const response = await request(app)
        .get(`/api/chat/users/search?query=john&exclude=${user1._id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    test('should require minimum query length', async () => {
      await request(app)
        .get('/api/chat/users/search?query=j')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);
    });
  });

  describe('Validation Tests', () => {
    test('should validate conversation creation data', async () => {
      const invalidData = {
        type: 'invalid_type',
        participants: []
      };

      await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(invalidData)
        .expect(400);
    });

    test('should require title for group conversations', async () => {
      const invalidData = {
        type: 'group',
        participants: [user1._id, user2._id, user3._id]
        // Missing title
      };

      await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(invalidData)
        .expect(400);
    });

    test('should validate participant existence', async () => {
      const invalidData = {
        type: 'private',
        participants: [user1._id, new mongoose.Types.ObjectId()]
      };

      await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('Authorization Tests', () => {
    test('should require authentication for all endpoints', async () => {
      await request(app)
        .get('/api/chat/conversations')
        .expect(401);

      await request(app)
        .post('/api/chat/conversations')
        .send({ type: 'private', participants: [user1._id, user2._id] })
        .expect(401);
    });

    test('should validate JWT token', async () => {
      await request(app)
        .get('/api/chat/conversations')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Database Model Tests', () => {
    test('should create conversation with proper schema', async () => {
      const conversation = new Conversation({
        type: 'private',
        participants: [
          { userId: user1._id, permissions: ['send_message'] },
          { userId: user2._id, permissions: ['send_message'] }
        ],
        createdBy: user1._id
      });

      await conversation.save();
      expect(conversation._id).toBeDefined();
      expect(conversation.participants).toHaveLength(2);
    });

    test('should create message with proper schema', async () => {
      const conversation = await Conversation.create({
        type: 'private',
        participants: [
          { userId: user1._id, permissions: ['send_message'] },
          { userId: user2._id, permissions: ['send_message'] }
        ],
        createdBy: user1._id
      });

      const message = new Message({
        conversationId: conversation._id,
        senderId: user1._id,
        content: { text: 'Test message', type: 'text' }
      });

      await message.save();
      expect(message._id).toBeDefined();
      expect(message.content.text).toBe('Test message');
    });

    test('should validate message content', async () => {
      const conversation = await Conversation.create({
        type: 'private',
        participants: [
          { userId: user1._id, permissions: ['send_message'] },
          { userId: user2._id, permissions: ['send_message'] }
        ],
        createdBy: user1._id
      });

      const invalidMessage = new Message({
        conversationId: conversation._id,
        senderId: user1._id,
        content: { type: 'text' } // Missing text content
      });

      await expect(invalidMessage.save()).rejects.toThrow();
    });
  });

  describe('Performance Tests', () => {
    test('should handle large conversation lists efficiently', async () => {
      // Create 100 conversations
      const conversations = [];
      for (let i = 0; i < 100; i++) {
        conversations.push({
          type: 'private',
          participants: [
            { userId: user1._id, permissions: ['send_message'] },
            { userId: user2._id, permissions: ['send_message'] }
          ],
          createdBy: user1._id
        });
      }
      await Conversation.insertMany(conversations);

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/chat/conversations?limit=50')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
      const endTime = Date.now();

      expect(response.body.data).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle message pagination efficiently', async () => {
      const conversation = await Conversation.create({
        type: 'private',
        participants: [
          { userId: user1._id, permissions: ['send_message'] },
          { userId: user2._id, permissions: ['send_message'] }
        ],
        createdBy: user1._id
      });

      // Create 200 messages
      const messages = [];
      for (let i = 0; i < 200; i++) {
        messages.push({
          conversationId: conversation._id,
          senderId: user1._id,
          content: { text: `Message ${i}`, type: 'text' }
        });
      }
      await Message.insertMany(messages);

      const startTime = Date.now();
      const response = await request(app)
        .get(`/api/chat/conversations/${conversation._id}/messages?limit=50`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
      const endTime = Date.now();

      expect(response.body.data).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
