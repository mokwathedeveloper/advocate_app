// M-Pesa Service Unit Tests - LegalPro v1.0.1
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const TransactionLog = require('../models/TransactionLog');
const mpesaService = require('../utils/mpesaService');

describe('M-Pesa Service Unit Tests', () => {
  beforeAll(async () => {
    // Connect to test database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || process.env.MONGODB_URI);
    }
  }, 10000);

  afterAll(async () => {
    // Close database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('Utility Functions', () => {
    test('should format phone numbers correctly', () => {
      expect(mpesaService.formatPhoneNumber('0708374149')).toBe('254708374149');
      expect(mpesaService.formatPhoneNumber('708374149')).toBe('254708374149');
      expect(mpesaService.formatPhoneNumber('254708374149')).toBe('254708374149');
      expect(mpesaService.formatPhoneNumber('+254708374149')).toBe('254708374149');
    });

    test('should generate timestamp in correct format', () => {
      const timestamp = mpesaService.generateTimestamp();
      expect(timestamp).toMatch(/^\d{14}$/);
      expect(timestamp.length).toBe(14);
    });

    test('should generate password correctly', () => {
      const shortcode = '174379';
      const passkey = 'test_passkey';
      const timestamp = '20231201120000';

      const password = mpesaService.generatePassword(shortcode, passkey, timestamp);
      expect(password).toBeDefined();
      expect(typeof password).toBe('string');
    });

    test('should validate STK Push callback data correctly', () => {
      const validSTKCallback = {
        Body: {
          stkCallback: {
            MerchantRequestID: 'test-merchant-id',
            CheckoutRequestID: 'test-checkout-id',
            ResultCode: 0,
            ResultDesc: 'Success',
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: 100 },
                { Name: 'MpesaReceiptNumber', Value: 'TEST123' }
              ]
            }
          }
        }
      };

      const validated = mpesaService.validateCallbackData(validSTKCallback);
      expect(validated.type).toBe('STK_PUSH');
      expect(validated.merchantRequestID).toBe('test-merchant-id');
      expect(validated.checkoutRequestID).toBe('test-checkout-id');
    });

    test('should validate B2C callback data correctly', () => {
      const validB2CCallback = {
        Result: {
          ConversationID: 'test-conversation-id',
          OriginatorConversationID: 'test-originator-id',
          ResultCode: 0,
          ResultDesc: 'Success',
          ResultParameters: {
            ResultParameter: [
              { Key: 'TransactionReceipt', Value: 'TEST123' },
              { Key: 'TransactionAmount', Value: 100 }
            ]
          }
        }
      };

      const validated = mpesaService.validateCallbackData(validB2CCallback);
      expect(validated.type).toBe('B2C');
      expect(validated.conversationID).toBe('test-conversation-id');
      expect(validated.originatorConversationID).toBe('test-originator-id');
    });

    test('should handle invalid callback data', () => {
      const invalidCallback = { invalid: 'data' };

      expect(() => {
        mpesaService.validateCallbackData(invalidCallback);
      }).toThrow('Unknown callback format');
    });

    test('should get environment configuration', () => {
      expect(mpesaService.getEnvironment()).toBeDefined();
      expect(mpesaService.getBaseUrl()).toBeDefined();
    });
  });

  describe('Payment Model Tests', () => {
    test('should create payment with M-Pesa details', async () => {
      const paymentData = {
        clientId: new mongoose.Types.ObjectId(),
        amount: 100,
        method: 'mpesa',
        paymentType: 'consultation_fee',
        mpesaDetails: {
          phoneNumber: '254708374149',
          checkoutRequestID: 'test-checkout-id',
          merchantRequestID: 'test-merchant-id'
        }
      };

      const payment = new Payment(paymentData);
      await payment.save();

      expect(payment._id).toBeDefined();
      expect(payment.amount).toBe(100);
      expect(payment.method).toBe('mpesa');
      expect(payment.mpesaDetails.phoneNumber).toBe('254708374149');
      expect(payment.formattedPhoneNumber).toBe('+254708374149');
      expect(payment.formattedAmount).toBe('KES 100');

      // Clean up
      await Payment.findByIdAndDelete(payment._id);
    });

    test('should mark payment as completed', async () => {
      const payment = new Payment({
        clientId: new mongoose.Types.ObjectId(),
        amount: 100,
        method: 'mpesa',
        status: 'processing',
        mpesaDetails: {
          phoneNumber: '254708374149',
          checkoutRequestID: 'test-checkout-id'
        }
      });

      await payment.save();

      await payment.markAsCompleted({
        mpesaReceiptNumber: 'TEST123456',
        transactionDate: new Date()
      });

      expect(payment.status).toBe('completed');
      expect(payment.mpesaDetails.mpesaReceiptNumber).toBe('TEST123456');
      expect(payment.mpesaDetails.stkPushStatus).toBe('success');
      expect(payment.completedAt).toBeDefined();

      // Clean up
      await Payment.findByIdAndDelete(payment._id);
    });

    test('should mark payment as failed', async () => {
      const payment = new Payment({
        clientId: new mongoose.Types.ObjectId(),
        amount: 100,
        method: 'mpesa',
        status: 'processing',
        mpesaDetails: {
          phoneNumber: '254708374149',
          checkoutRequestID: 'test-checkout-id'
        }
      });

      await payment.save();

      await payment.markAsFailed('User cancelled transaction', 1032);

      expect(payment.status).toBe('failed');
      expect(payment.mpesaDetails.resultCode).toBe(1032);
      expect(payment.mpesaDetails.resultDesc).toBe('User cancelled transaction');
      expect(payment.mpesaDetails.stkPushStatus).toBe('failed');
      expect(payment.failedAt).toBeDefined();

      // Clean up
      await Payment.findByIdAndDelete(payment._id);
    });

    test('should handle retry logic', async () => {
      const payment = new Payment({
        clientId: new mongoose.Types.ObjectId(),
        amount: 100,
        method: 'mpesa',
        status: 'processing',
        mpesaDetails: {
          phoneNumber: '254708374149',
          checkoutRequestID: 'test-checkout-id',
          retryCount: 0,
          maxRetries: 3
        }
      });

      await payment.save();

      expect(payment.canRetry()).toBe(true);

      await payment.incrementRetry();
      expect(payment.mpesaDetails.retryCount).toBe(1);
      expect(payment.mpesaDetails.lastRetryAt).toBeDefined();
      expect(payment.mpesaDetails.nextRetryAt).toBeDefined();

      // Clean up
      await Payment.findByIdAndDelete(payment._id);
    });
  });

  describe('Transaction Log Tests', () => {
    test('should create transaction log', async () => {
      const logData = {
        transactionId: 'test-transaction-123',
        transactionType: 'STK_PUSH',
        userId: new mongoose.Types.ObjectId(),
        requestData: { phoneNumber: '254708374149', amount: 100 },
        responseData: { success: true },
        statusCode: 200,
        duration: 1500,
        success: true
      };

      const log = await TransactionLog.logTransaction(logData);
      expect(log).toBeDefined();
      expect(log.transactionId).toBe('test-transaction-123');
      expect(log.transactionType).toBe('STK_PUSH');
      expect(log.success).toBe(true);

      // Clean up
      if (log) {
        await TransactionLog.findByIdAndDelete(log._id);
      }
    });

    test('should get transaction statistics', async () => {
      // Create some test logs
      const logs = [
        {
          transactionId: 'test-1',
          transactionType: 'STK_PUSH',
          success: true,
          duration: 1000,
          requestData: {},
          responseData: {}
        },
        {
          transactionId: 'test-2',
          transactionType: 'STK_PUSH',
          success: false,
          duration: 2000,
          requestData: {},
          responseData: {}
        }
      ];

      const createdLogs = await TransactionLog.insertMany(logs);

      const stats = await TransactionLog.getTransactionStats();
      expect(Array.isArray(stats)).toBe(true);

      // Clean up
      await TransactionLog.deleteMany({
        _id: { $in: createdLogs.map(log => log._id) }
      });
    });
  });

  describe('Static Methods', () => {
    test('should find pending M-Pesa payments', async () => {
      // Create test payments
      const pendingPayment = await Payment.create({
        clientId: new mongoose.Types.ObjectId(),
        amount: 100,
        method: 'mpesa',
        status: 'pending',
        mpesaDetails: {
          checkoutRequestID: 'test-checkout-pending',
          phoneNumber: '254708374149'
        }
      });

      const completedPayment = await Payment.create({
        clientId: new mongoose.Types.ObjectId(),
        amount: 200,
        method: 'mpesa',
        status: 'completed',
        mpesaDetails: {
          checkoutRequestID: 'test-checkout-completed',
          phoneNumber: '254708374149'
        }
      });

      const pendingPayments = await Payment.findPendingMpesaPayments();
      expect(pendingPayments.length).toBeGreaterThan(0);

      const pendingIds = pendingPayments.map(p => p._id.toString());
      expect(pendingIds).toContain(pendingPayment._id.toString());
      expect(pendingIds).not.toContain(completedPayment._id.toString());

      // Clean up
      await Payment.findByIdAndDelete(pendingPayment._id);
      await Payment.findByIdAndDelete(completedPayment._id);
    });

    test('should get payment statistics', async () => {
      const clientId = new mongoose.Types.ObjectId();

      // Create test payments
      const payments = [
        {
          clientId,
          amount: 100,
          method: 'mpesa',
          status: 'completed'
        },
        {
          clientId,
          amount: 200,
          method: 'mpesa',
          status: 'failed'
        }
      ];

      const createdPayments = await Payment.insertMany(payments);

      const stats = await Payment.getPaymentStats(clientId);
      expect(Array.isArray(stats)).toBe(true);

      // Clean up
      await Payment.deleteMany({
        _id: { $in: createdPayments.map(p => p._id) }
      });
    });
  });
});
