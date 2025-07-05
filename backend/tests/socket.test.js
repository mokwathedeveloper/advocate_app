// Socket.IO Chat System Tests - LegalPro v1.0.1
const Client = require('socket.io-client');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const http = require('http');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const ChatSocketServer = require('../socket/socketServer');

describe('Socket.IO Chat Tests', () => {
  let mongoServer;
  let httpServer;
  let chatSocketServer;
  let user1, user2;
  let user1Token, user2Token;
  let client1, client2;

  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Setup HTTP server and Socket.IO
    httpServer = http.createServer();
    chatSocketServer = new ChatSocketServer(httpServer);
    
    await new Promise((resolve) => {
      httpServer.listen(0, resolve);
    });
  });

  afterAll(async () => {
    if (client1) client1.close();
    if (client2) client2.close();
    httpServer.close();
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

    // Generate tokens
    user1Token = jwt.sign({ id: user1._id }, process.env.JWT_SECRET || 'test-secret');
    user2Token = jwt.sign({ id: user2._id }, process.env.JWT_SECRET || 'test-secret');
  });

  afterEach(() => {
    if (client1) {
      client1.close();
      client1 = null;
    }
    if (client2) {
      client2.close();
      client2 = null;
    }
  });

  const connectClient = (token) => {
    const port = httpServer.address().port;
    return new Client(`http://localhost:${port}`, {
      auth: { token },
      transports: ['websocket']
    });
  };

  describe('Connection Management', () => {
    test('should connect with valid token', (done) => {
      client1 = connectClient(user1Token);
      
      client1.on('connect', () => {
        expect(client1.connected).toBe(true);
        done();
      });

      client1.on('connect_error', (error) => {
        done(error);
      });
    });

    test('should reject connection with invalid token', (done) => {
      client1 = connectClient('invalid-token');
      
      client1.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication failed');
        done();
      });

      client1.on('connect', () => {
        done(new Error('Should not connect with invalid token'));
      });
    });

    test('should handle disconnection', (done) => {
      client1 = connectClient(user1Token);
      
      client1.on('connect', () => {
        client1.disconnect();
      });

      client1.on('disconnect', (reason) => {
        expect(reason).toBe('io client disconnect');
        done();
      });
    });
  });

  describe('Message Sending and Receiving', () => {
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

    test('should send and receive messages', (done) => {
      client1 = connectClient(user1Token);
      client2 = connectClient(user2Token);

      let connectedClients = 0;
      const checkConnections = () => {
        connectedClients++;
        if (connectedClients === 2) {
          // Both clients connected, start test
          client1.emit('join_conversation', { conversationId: conversation._id });
          client2.emit('join_conversation', { conversationId: conversation._id });

          client2.on('receive_message', (data) => {
            expect(data.message.content.text).toBe('Hello from client1');
            expect(data.conversationId).toBe(conversation._id.toString());
            done();
          });

          // Send message from client1
          client1.emit('send_message', {
            conversationId: conversation._id,
            content: { text: 'Hello from client1', type: 'text' }
          });
        }
      };

      client1.on('connect', checkConnections);
      client2.on('connect', checkConnections);
    });

    test('should handle message delivery acknowledgments', (done) => {
      client1 = connectClient(user1Token);
      client2 = connectClient(user2Token);

      let connectedClients = 0;
      const checkConnections = () => {
        connectedClients++;
        if (connectedClients === 2) {
          client1.emit('join_conversation', { conversationId: conversation._id });
          client2.emit('join_conversation', { conversationId: conversation._id });

          client1.on('message_sent', (data) => {
            expect(data.message).toBeDefined();
            expect(data.message.content.text).toBe('Test message');
            done();
          });

          client1.emit('send_message', {
            conversationId: conversation._id,
            content: { text: 'Test message', type: 'text' },
            tempId: 'temp123'
          });
        }
      };

      client1.on('connect', checkConnections);
      client2.on('connect', checkConnections);
    });

    test('should validate message content', (done) => {
      client1 = connectClient(user1Token);

      client1.on('connect', () => {
        client1.on('error', (error) => {
          expect(error.message).toContain('validation');
          done();
        });

        // Send invalid message
        client1.emit('send_message', {
          conversationId: conversation._id,
          content: { type: 'text' } // Missing text content
        });
      });
    });
  });

  describe('Typing Indicators', () => {
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

    test('should broadcast typing indicators', (done) => {
      client1 = connectClient(user1Token);
      client2 = connectClient(user2Token);

      let connectedClients = 0;
      const checkConnections = () => {
        connectedClients++;
        if (connectedClients === 2) {
          client1.emit('join_conversation', { conversationId: conversation._id });
          client2.emit('join_conversation', { conversationId: conversation._id });

          client2.on('typing_start', (data) => {
            expect(data.conversationId).toBe(conversation._id.toString());
            expect(data.userId).toBe(user1._id.toString());
            expect(data.user.firstName).toBe('John');
            done();
          });

          client1.emit('typing_start', { conversationId: conversation._id });
        }
      };

      client1.on('connect', checkConnections);
      client2.on('connect', checkConnections);
    });

    test('should handle typing stop', (done) => {
      client1 = connectClient(user1Token);
      client2 = connectClient(user2Token);

      let connectedClients = 0;
      const checkConnections = () => {
        connectedClients++;
        if (connectedClients === 2) {
          client1.emit('join_conversation', { conversationId: conversation._id });
          client2.emit('join_conversation', { conversationId: conversation._id });

          client2.on('typing_stop', (data) => {
            expect(data.conversationId).toBe(conversation._id.toString());
            expect(data.userId).toBe(user1._id.toString());
            done();
          });

          client1.emit('typing_start', { conversationId: conversation._id });
          setTimeout(() => {
            client1.emit('typing_stop', { conversationId: conversation._id });
          }, 100);
        }
      };

      client1.on('connect', checkConnections);
      client2.on('connect', checkConnections);
    });
  });

  describe('User Status', () => {
    test('should broadcast user online status', (done) => {
      client1 = connectClient(user1Token);
      client2 = connectClient(user2Token);

      let connectedClients = 0;
      const checkConnections = () => {
        connectedClients++;
        if (connectedClients === 2) {
          // Wait a bit for status to propagate
          setTimeout(() => {
            client1.on('user_status_change', (data) => {
              if (data.userId === user2._id.toString()) {
                expect(data.status).toBe('online');
                done();
              }
            });
          }, 100);
        }
      };

      client1.on('connect', checkConnections);
      client2.on('connect', checkConnections);
    });

    test('should broadcast user offline status on disconnect', (done) => {
      client1 = connectClient(user1Token);
      client2 = connectClient(user2Token);

      let connectedClients = 0;
      const checkConnections = () => {
        connectedClients++;
        if (connectedClients === 2) {
          client1.on('user_status_change', (data) => {
            if (data.userId === user2._id.toString() && data.status === 'offline') {
              done();
            }
          });

          // Disconnect client2
          setTimeout(() => {
            client2.disconnect();
          }, 100);
        }
      };

      client1.on('connect', checkConnections);
      client2.on('connect', checkConnections);
    });
  });

  describe('Room Management', () => {
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

    test('should join conversation room', (done) => {
      client1 = connectClient(user1Token);

      client1.on('connect', () => {
        client1.on('conversation_joined', (data) => {
          expect(data.conversationId).toBe(conversation._id.toString());
          done();
        });

        client1.emit('join_conversation', { conversationId: conversation._id });
      });
    });

    test('should leave conversation room', (done) => {
      client1 = connectClient(user1Token);

      client1.on('connect', () => {
        client1.emit('join_conversation', { conversationId: conversation._id });

        client1.on('conversation_left', (data) => {
          expect(data.conversationId).toBe(conversation._id.toString());
          done();
        });

        setTimeout(() => {
          client1.emit('leave_conversation', { conversationId: conversation._id });
        }, 100);
      });
    });

    test('should not allow unauthorized room access', (done) => {
      // Create conversation without user2
      const unauthorizedConversation = new Conversation({
        type: 'private',
        participants: [
          { userId: user1._id, permissions: ['send_message'] }
        ],
        createdBy: user1._id
      });

      unauthorizedConversation.save().then(() => {
        client2 = connectClient(user2Token);

        client2.on('connect', () => {
          client2.on('error', (error) => {
            expect(error.message).toContain('Not authorized');
            done();
          });

          client2.emit('join_conversation', { conversationId: unauthorizedConversation._id });
        });
      });
    });
  });

  describe('Rate Limiting', () => {
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

    test('should handle rate limiting for messages', (done) => {
      client1 = connectClient(user1Token);

      client1.on('connect', () => {
        client1.emit('join_conversation', { conversationId: conversation._id });

        let rateLimitHit = false;
        client1.on('rate_limit_exceeded', (data) => {
          rateLimitHit = true;
          expect(data.message).toContain('Rate limit exceeded');
          done();
        });

        // Send many messages quickly to trigger rate limit
        for (let i = 0; i < 150; i++) {
          client1.emit('send_message', {
            conversationId: conversation._id,
            content: { text: `Message ${i}`, type: 'text' }
          });
        }

        // If rate limit not hit in 2 seconds, fail test
        setTimeout(() => {
          if (!rateLimitHit) {
            done(new Error('Rate limit should have been triggered'));
          }
        }, 2000);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid conversation ID', (done) => {
      client1 = connectClient(user1Token);

      client1.on('connect', () => {
        client1.on('error', (error) => {
          expect(error.message).toContain('Conversation not found');
          done();
        });

        client1.emit('send_message', {
          conversationId: new mongoose.Types.ObjectId(),
          content: { text: 'Test message', type: 'text' }
        });
      });
    });

    test('should handle malformed message data', (done) => {
      client1 = connectClient(user1Token);

      client1.on('connect', () => {
        client1.on('error', (error) => {
          expect(error.message).toBeDefined();
          done();
        });

        client1.emit('send_message', 'invalid-data');
      });
    });
  });

  describe('Reconnection Handling', () => {
    test('should handle reconnection gracefully', (done) => {
      client1 = connectClient(user1Token);

      client1.on('connect', () => {
        // Simulate network disconnection
        client1.disconnect();

        client1.on('reconnect', () => {
          expect(client1.connected).toBe(true);
          done();
        });

        // Reconnect after a short delay
        setTimeout(() => {
          client1.connect();
        }, 100);
      });
    });
  });
});
