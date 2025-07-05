# M-Pesa Daraja API Integration Specifications - LegalPro v1.0.1

## 📋 Technical Requirements Overview

### **Integration Scope**
- **C2B (Customer to Business)**: STK Push for client payments
- **B2C (Business to Customer)**: Refunds and disbursements
- **Transaction Status Queries**: Real-time payment verification
- **Account Balance**: Business account balance checking
- **Transaction Reversal**: Failed transaction handling

### **Security Requirements**
- OAuth 2.0 authentication with secure token management
- SSL/TLS encryption for all API communications
- Secure credential storage using environment variables
- Request signing and validation
- Rate limiting and retry mechanisms
- Comprehensive audit logging

## 🔐 Authentication & Authorization

### **OAuth 2.0 Flow**
```
1. Client Credentials Grant Type
2. Base64 encoded Consumer Key:Consumer Secret
3. Access token with 3600 seconds expiry
4. Automatic token refresh mechanism
```

### **Required Credentials**
```env
# Sandbox Environment
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_INITIATOR_NAME=testapi
MPESA_SECURITY_CREDENTIAL=encrypted_password

# Production Environment
MPESA_ENVIRONMENT=production
MPESA_CONSUMER_KEY=prod_consumer_key
MPESA_CONSUMER_SECRET=prod_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=prod_passkey
MPESA_INITIATOR_NAME=your_initiator
MPESA_SECURITY_CREDENTIAL=prod_encrypted_password

# Callback URLs
MPESA_STK_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/stk-callback
MPESA_B2C_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/b2c-callback
MPESA_TIMEOUT_URL=https://yourdomain.com/api/payments/mpesa/timeout
MPESA_RESULT_URL=https://yourdomain.com/api/payments/mpesa/result
```

## 🌐 API Endpoints & Integration Points

### **1. STK Push (Lipa Na M-Pesa Online)**
- **Endpoint**: `/mpesa/stkpush/v1/processrequest`
- **Purpose**: Initiate customer payment requests
- **Use Cases**: Appointment fees, consultation payments, case filing fees

### **2. Transaction Status Query**
- **Endpoint**: `/mpesa/stkpushquery/v1/query`
- **Purpose**: Check payment status for pending transactions
- **Use Cases**: Payment verification, timeout handling

### **3. B2C Payment Request**
- **Endpoint**: `/mpesa/b2c/v1/paymentrequest`
- **Purpose**: Send money to customers
- **Use Cases**: Refunds, compensation payments

### **4. Account Balance**
- **Endpoint**: `/mpesa/accountbalance/v1/query`
- **Purpose**: Check business account balance
- **Use Cases**: Financial reporting, balance monitoring

### **5. Transaction Reversal**
- **Endpoint**: `/mpesa/reversal/v1/request`
- **Purpose**: Reverse failed transactions
- **Use Cases**: Error correction, dispute resolution

## 📊 Data Models & Schema

### **Enhanced Payment Model**
```javascript
{
  // Existing fields
  clientId: ObjectId,
  appointmentId: ObjectId,
  amount: Number,
  currency: String,
  status: String,
  method: String,
  
  // Enhanced M-Pesa fields
  mpesaTransactionId: String,        // M-Pesa transaction ID
  checkoutRequestId: String,         // STK Push request ID
  merchantRequestId: String,         // Merchant request ID
  mpesaReceiptNumber: String,        // M-Pesa receipt number
  transactionDate: Date,             // Actual transaction date
  phoneNumber: String,               // Customer phone number
  accountReference: String,          // Payment reference
  transactionDesc: String,           // Transaction description
  
  // Status tracking
  stkPushStatus: String,             // STK push status
  callbackReceived: Boolean,         // Callback received flag
  resultCode: Number,                // M-Pesa result code
  resultDesc: String,                // M-Pesa result description
  
  // Retry mechanism
  retryCount: Number,                // Number of retry attempts
  lastRetryAt: Date,                 // Last retry timestamp
  maxRetries: Number,                // Maximum retry attempts
  
  // Audit trail
  requestPayload: Object,            // Original request data
  responsePayload: Object,           // M-Pesa response data
  callbackPayload: Object,           // Callback data
  errorLogs: [String],               // Error messages
  
  // Timestamps
  initiatedAt: Date,                 // Payment initiation time
  completedAt: Date,                 // Payment completion time
  failedAt: Date                     // Payment failure time
}
```

### **Transaction Log Model**
```javascript
{
  transactionId: String,
  transactionType: String,           // STK_PUSH, B2C, BALANCE_QUERY, etc.
  requestData: Object,
  responseData: Object,
  statusCode: Number,
  duration: Number,                  // Request duration in ms
  ipAddress: String,
  userAgent: String,
  userId: ObjectId,
  createdAt: Date
}
```

## 🔄 Integration Flows

### **STK Push Flow**
```
1. Client initiates payment request
2. Validate request parameters
3. Generate timestamp and password
4. Send STK Push request to M-Pesa
5. Store transaction with pending status
6. Return checkout request ID to client
7. Wait for callback confirmation
8. Update transaction status based on callback
9. Send notification to client
```

### **Transaction Status Query Flow**
```
1. Check for pending transactions older than 30 seconds
2. Query M-Pesa for transaction status
3. Update local transaction status
4. Retry failed transactions if applicable
5. Send status notifications
```

### **B2C Payment Flow**
```
1. Validate refund/disbursement request
2. Check business account balance
3. Initiate B2C payment request
4. Store transaction record
5. Wait for result callback
6. Update transaction status
7. Send confirmation notifications
```

## 🛡️ Security Implementation

### **Token Management**
- Secure token storage in memory with expiry tracking
- Automatic token refresh before expiry
- Token encryption for persistent storage
- Rate limiting for token requests

### **Request Security**
- Request payload validation
- Timestamp verification
- Signature validation for callbacks
- IP whitelisting for callback URLs
- HTTPS enforcement

### **Data Protection**
- Sensitive data encryption at rest
- PCI DSS compliance for payment data
- Audit logging for all transactions
- Data retention policies
- GDPR compliance for customer data

## 📈 Error Handling & Retry Logic

### **Error Categories**
1. **Network Errors**: Connection timeouts, DNS failures
2. **Authentication Errors**: Invalid credentials, expired tokens
3. **Validation Errors**: Invalid parameters, format errors
4. **Business Logic Errors**: Insufficient funds, duplicate transactions
5. **System Errors**: M-Pesa system downtime, maintenance

### **Retry Strategy**
```javascript
{
  maxRetries: 3,
  retryDelay: [1000, 2000, 5000], // Exponential backoff
  retryableErrors: [
    'NETWORK_ERROR',
    'TIMEOUT_ERROR',
    'SYSTEM_ERROR'
  ],
  nonRetryableErrors: [
    'INVALID_CREDENTIALS',
    'INSUFFICIENT_FUNDS',
    'DUPLICATE_TRANSACTION'
  ]
}
```

## 📊 Monitoring & Logging

### **Transaction Metrics**
- Success/failure rates
- Average transaction time
- Peak transaction volumes
- Error distribution
- Revenue tracking

### **Logging Requirements**
- All API requests/responses
- Authentication events
- Error occurrences
- Performance metrics
- Security events

### **Alerting Thresholds**
- Transaction failure rate > 5%
- Average response time > 10 seconds
- Authentication failures > 10/hour
- System errors > 3/hour

## 🧪 Testing Strategy

### **Sandbox Testing**
- STK Push with test phone numbers
- Transaction status queries
- B2C payments to test accounts
- Error scenario testing
- Callback URL validation

### **Test Scenarios**
1. Successful payment flow
2. Payment cancellation by user
3. Payment timeout scenarios
4. Network failure handling
5. Invalid parameter handling
6. Duplicate transaction prevention
7. Callback URL failures
8. Token expiry handling

## 🚀 Deployment Considerations

### **Environment Configuration**
- Separate sandbox/production configurations
- Environment-specific callback URLs
- SSL certificate requirements
- Load balancer configuration

### **Scaling Requirements**
- Horizontal scaling for high transaction volumes
- Database connection pooling
- Redis for token caching
- Queue system for retry mechanisms

### **Backup & Recovery**
- Transaction data backup
- Configuration backup
- Disaster recovery procedures
- Business continuity planning

---

## 📋 Implementation Checklist

### Phase 1: Core Implementation
- [ ] Enhanced M-Pesa service with OAuth
- [ ] STK Push implementation
- [ ] Transaction status queries
- [ ] Enhanced payment model
- [ ] Comprehensive error handling

### Phase 2: Advanced Features
- [ ] B2C payment implementation
- [ ] Account balance queries
- [ ] Transaction reversal
- [ ] Retry mechanisms
- [ ] Audit logging

### Phase 3: Testing & Validation
- [ ] Sandbox environment testing
- [ ] Error scenario validation
- [ ] Performance testing
- [ ] Security testing
- [ ] Integration testing

### Phase 4: Production Readiness
- [ ] Production configuration
- [ ] Monitoring setup
- [ ] Documentation completion
- [ ] Security review
- [ ] Deployment procedures

This specification provides the foundation for a robust, secure, and scalable M-Pesa integration that meets enterprise standards for financial transactions in legal services.

---

## 🧪 Sandbox Testing Guide

### **Test Environment Setup**

#### **Required Test Credentials**
```env
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_sandbox_consumer_key
MPESA_CONSUMER_SECRET=your_sandbox_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_INITIATOR_NAME=testapi
MPESA_SECURITY_CREDENTIAL=Safaricom999!*!
```

#### **Test Phone Numbers**
- **254708374149** - Safaricom test number (always succeeds)
- **254711XXXXXX** - Airtel test numbers
- **254733XXXXXX** - Orange test numbers

### **Manual Testing Procedures**

#### **1. STK Push Testing**
```bash
# Test successful payment
curl -X POST http://localhost:5000/api/payments/stk-push \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "254708374149",
    "amount": 100,
    "paymentType": "consultation_fee",
    "description": "Test payment"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "STK Push initiated successfully",
  "data": {
    "paymentId": "payment_id",
    "checkoutRequestID": "ws_CO_123456789",
    "merchantRequestID": "merchant_123456789",
    "customerMessage": "Success. Request accepted for processing"
  }
}
```

#### **2. Payment Status Query Testing**
```bash
# Query payment status
curl -X GET http://localhost:5000/api/payments/PAYMENT_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **3. Callback Testing**
Use ngrok or similar tool to expose local server:
```bash
ngrok http 5000
```

Update callback URLs in environment:
```env
MPESA_STK_CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/payments/mpesa/stk-callback
```

#### **4. B2C Refund Testing**
```bash
# Test refund (admin only)
curl -X POST http://localhost:5000/api/payments/PAYMENT_ID/refund \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50,
    "reason": "Test refund"
  }'
```

### **Test Scenarios**

#### **Positive Test Cases**
1. ✅ Successful STK Push with valid phone number
2. ✅ Payment completion via callback
3. ✅ Status query for completed payment
4. ✅ Successful B2C refund
5. ✅ Payment listing with filters
6. ✅ Transaction analytics retrieval

#### **Negative Test Cases**
1. ❌ Invalid phone number format
2. ❌ Insufficient amount (< 1 KES)
3. ❌ Unauthorized access attempts
4. ❌ Payment cancellation by user
5. ❌ Network timeout scenarios
6. ❌ Invalid callback data

#### **Edge Cases**
1. 🔄 Duplicate payment requests
2. 🔄 Callback received multiple times
3. 🔄 Payment timeout scenarios
4. 🔄 Large payment amounts
5. 🔄 Concurrent payment requests

### **Automated Test Execution**

#### **Run Unit Tests**
```bash
cd backend
npm test -- --testPathPattern=mpesa.test.js
```

#### **Run Integration Tests**
```bash
npm run test:integration
```

#### **Generate Coverage Report**
```bash
npm run test:coverage
```

### **Monitoring and Debugging**

#### **Log Analysis**
- Check application logs for M-Pesa API calls
- Monitor transaction logs in database
- Review error patterns and frequencies

#### **Database Verification**
```javascript
// Check payment records
db.payments.find({ method: 'mpesa' }).sort({ createdAt: -1 }).limit(10)

// Check transaction logs
db.transactionlogs.find({ transactionType: 'STK_PUSH' }).sort({ createdAt: -1 }).limit(10)
```

#### **Performance Metrics**
- Average response time: < 5 seconds
- Success rate: > 95%
- Callback processing time: < 2 seconds

### **Production Readiness Checklist**

#### **Security Verification**
- [ ] All credentials properly encrypted
- [ ] Callback URLs use HTTPS
- [ ] Input validation implemented
- [ ] Rate limiting configured
- [ ] Audit logging enabled

#### **Performance Validation**
- [ ] Load testing completed
- [ ] Database indexes optimized
- [ ] Caching implemented where appropriate
- [ ] Error handling comprehensive

#### **Monitoring Setup**
- [ ] Application monitoring configured
- [ ] Database monitoring enabled
- [ ] Alert thresholds defined
- [ ] Log aggregation setup

#### **Documentation Complete**
- [ ] API documentation updated
- [ ] Deployment guide created
- [ ] Troubleshooting guide available
- [ ] User documentation provided

This comprehensive testing approach ensures the M-Pesa integration is production-ready and meets all quality standards for financial transactions in the legal services platform.
