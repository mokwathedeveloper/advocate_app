# M-Pesa Daraja API Integration Guide - LegalPro v1.0.1

## 🚀 Overview

This guide provides comprehensive documentation for the M-Pesa Daraja API integration in the LegalPro legal services platform. The integration supports STK Push payments, transaction status queries, B2C refunds, and comprehensive transaction logging.

## 📋 Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Setup & Configuration](#setup--configuration)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Testing](#testing)
7. [Security](#security)
8. [Troubleshooting](#troubleshooting)
9. [Deployment](#deployment)

## ✨ Features

### Core Payment Features
- **STK Push Payments**: Initiate payments directly to customer phones
- **Transaction Status Queries**: Real-time payment status checking
- **B2C Refunds**: Automated refund processing for administrators
- **Payment History**: Comprehensive payment tracking and history
- **Real-time Updates**: Live payment status updates with WebSocket-like polling

### Advanced Features
- **Retry Mechanisms**: Automatic retry for failed transactions
- **Transaction Logging**: Comprehensive audit trail for all transactions
- **Analytics Dashboard**: Payment statistics and performance metrics
- **Role-based Access**: Different access levels for clients and administrators
- **Multi-payment Types**: Support for consultation, case, document, and court fees

## 🏗️ Architecture

### Backend Components

```
backend/
├── utils/
│   └── mpesaService.js          # Core M-Pesa API integration
├── models/
│   ├── Payment.js               # Enhanced payment model
│   └── TransactionLog.js        # Transaction audit logging
├── controllers/
│   └── paymentController.js     # Payment API endpoints
├── routes/
│   └── payments.js              # Payment route definitions
└── tests/
    └── mpesa.test.js            # Comprehensive test suite
```

### Frontend Components

```
src/
├── services/
│   └── paymentService.ts        # Payment API client
├── components/payments/
│   ├── PaymentModal.tsx         # Enhanced payment initiation
│   ├── PaymentDashboard.tsx     # Admin payment management
│   ├── PaymentStatus.tsx        # Real-time status updates
│   ├── PaymentHistory.tsx       # Payment history display
│   └── index.ts                 # Component exports
└── pages/
    └── Payments.tsx             # Main payments page
```

## ⚙️ Setup & Configuration

### Environment Variables

Create a `.env` file with the following M-Pesa configuration:

```env
# M-Pesa Configuration
MPESA_ENVIRONMENT=sandbox                    # sandbox or production
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379                       # Your business shortcode
MPESA_PASSKEY=your_lipa_na_mpesa_passkey
MPESA_INITIATOR_NAME=testapi                 # API initiator name
MPESA_SECURITY_CREDENTIAL=your_security_credential

# Callback URLs (use ngrok for local development)
MPESA_STK_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/stk-callback
MPESA_B2C_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/b2c-callback
MPESA_TIMEOUT_URL=https://yourdomain.com/api/payments/mpesa/timeout
MPESA_RESULT_URL=https://yourdomain.com/api/payments/mpesa/result
```

### Database Setup

The integration uses MongoDB with the following collections:
- `payments`: Enhanced payment records with M-Pesa details
- `transactionlogs`: Comprehensive transaction audit trail

### Dependencies

Backend dependencies:
```bash
npm install axios express-validator
```

Frontend dependencies:
```bash
npm install react-hook-form react-toastify
```

## 🔌 API Endpoints

### Payment Initiation

**POST** `/api/payments/stk-push`

Initiate an STK Push payment request.

```javascript
// Request
{
  "phoneNumber": "254708374149",
  "amount": 1000,
  "paymentType": "consultation_fee",
  "description": "Legal consultation payment",
  "appointmentId": "optional_appointment_id",
  "caseId": "optional_case_id"
}

// Response
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

### Payment Status Query

**GET** `/api/payments/:paymentId/status`

Query the current status of a payment.

```javascript
// Response
{
  "success": true,
  "payment": {
    "id": "payment_id",
    "amount": "KES 1,000",
    "status": "completed",
    "method": "mpesa",
    "type": "consultation_fee",
    "createdAt": "2023-12-01T12:00:00Z",
    "mpesaReceipt": "NLJ7RT61SV"
  },
  "mpesaDetails": {
    "checkoutRequestID": "ws_CO_123456789",
    "stkPushStatus": "success",
    "resultCode": 0,
    "resultDesc": "The service request is processed successfully.",
    "mpesaReceiptNumber": "NLJ7RT61SV"
  }
}
```

### Payment History

**GET** `/api/payments`

Retrieve paginated payment history with filtering options.

Query Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by payment status
- `method`: Filter by payment method
- `paymentType`: Filter by payment type
- `search`: Search in descriptions and receipt numbers
- `startDate`: Filter from date
- `endDate`: Filter to date

### Refund Initiation (Admin Only)

**POST** `/api/payments/:paymentId/refund`

Initiate a B2C refund for a completed payment.

```javascript
// Request
{
  "amount": 500,  // Optional, defaults to full amount
  "reason": "Service not provided"
}

// Response
{
  "success": true,
  "message": "Refund initiated successfully",
  "data": {
    "refundPaymentId": "refund_payment_id",
    "conversationID": "AG_20231201_123456",
    "originatorConversationID": "12345-67890-1"
  }
}
```

### Transaction Analytics (Admin Only)

**GET** `/api/payments/analytics`

Retrieve comprehensive transaction analytics and statistics.

## 🎨 Frontend Components

### PaymentModal

Enhanced payment initiation modal with multi-step UI:

```typescript
import { PaymentModal } from '../components/payments';

<PaymentModal
  appointmentId="optional_appointment_id"
  caseId="optional_case_id"
  defaultAmount={1000}
  defaultPaymentType="consultation_fee"
  onClose={() => setShowModal(false)}
  onPaymentSuccess={(paymentId) => handleSuccess(paymentId)}
/>
```

Features:
- Multi-step payment flow (form → processing → waiting → success/failed)
- Real-time countdown timer
- Automatic status checking
- Comprehensive error handling
- Professional UI/UX

### PaymentStatus

Real-time payment status component with auto-refresh:

```typescript
import { PaymentStatus } from '../components/payments';

<PaymentStatus
  paymentId="payment_id"
  onStatusChange={(status) => handleStatusChange(status)}
  autoRefresh={true}
  refreshInterval={5000}
/>
```

### PaymentDashboard

Comprehensive payment management dashboard for administrators:

```typescript
import { PaymentDashboard } from '../components/payments';

<PaymentDashboard clientId="optional_client_id" />
```

Features:
- Payment statistics and analytics
- Advanced filtering and search
- Bulk operations
- Export functionality
- Real-time updates

### PaymentHistory

Payment history component with filtering and pagination:

```typescript
import { PaymentHistory } from '../components/payments';

<PaymentHistory
  clientId="optional_client_id"
  limit={10}
  showFilters={true}
/>
```

## 🧪 Testing

### Running Tests

```bash
# Backend unit tests
cd backend
npm test mpesa.test.js

# Frontend component tests
cd frontend
npm test PaymentModal.test.tsx
```

### Test Coverage

The test suite covers:
- ✅ M-Pesa service utility functions
- ✅ Payment model operations
- ✅ Transaction logging
- ✅ API endpoint validation
- ✅ Error handling scenarios
- ✅ Callback processing

### Manual Testing

Use the provided testing guide in `MPESA_INTEGRATION_SPECS.md` for comprehensive manual testing procedures.

## 🔒 Security

### Security Measures Implemented

1. **Credential Protection**
   - Environment variable storage
   - No hardcoded credentials
   - Secure credential rotation

2. **Input Validation**
   - Server-side validation for all inputs
   - Phone number format validation
   - Amount range validation
   - SQL injection prevention

3. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control
   - Admin-only operations protection

4. **Audit Logging**
   - Comprehensive transaction logging
   - Error tracking and monitoring
   - Security event logging

5. **Network Security**
   - HTTPS-only communication
   - Request timeout handling
   - Rate limiting implementation

### Security Best Practices

- Regularly rotate M-Pesa credentials
- Monitor transaction logs for anomalies
- Implement proper error handling without exposing sensitive data
- Use secure callback URLs (HTTPS)
- Validate all callback data

## 🔧 Troubleshooting

### Common Issues

1. **STK Push Not Received**
   - Verify phone number format
   - Check network connectivity
   - Ensure sufficient M-Pesa balance
   - Verify shortcode configuration

2. **Callback Not Received**
   - Check callback URL accessibility
   - Verify HTTPS configuration
   - Monitor server logs for errors
   - Test with ngrok for local development

3. **Payment Status Not Updating**
   - Check status query implementation
   - Verify database connectivity
   - Monitor transaction logs
   - Check for timeout issues

4. **Authentication Errors**
   - Verify consumer key and secret
   - Check token expiration
   - Monitor API rate limits
   - Validate environment configuration

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=mpesa:*
```

## 🚀 Deployment

### Production Checklist

- [ ] Update environment variables for production
- [ ] Configure production callback URLs
- [ ] Set up SSL certificates
- [ ] Configure monitoring and alerting
- [ ] Test all payment flows
- [ ] Set up backup and recovery
- [ ] Configure log aggregation
- [ ] Implement health checks

### Environment Configuration

```env
# Production Environment
MPESA_ENVIRONMENT=production
MPESA_CONSUMER_KEY=production_consumer_key
MPESA_CONSUMER_SECRET=production_consumer_secret
MPESA_SHORTCODE=production_shortcode
MPESA_PASSKEY=production_passkey

# Production Callback URLs
MPESA_STK_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/stk-callback
MPESA_B2C_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/b2c-callback
```

### Monitoring

Implement monitoring for:
- Payment success rates
- Response times
- Error rates
- Transaction volumes
- System health

## 📞 Support

For technical support or questions:
- Review the troubleshooting section
- Check the test suite for examples
- Monitor application logs
- Contact M-Pesa support for API issues

---

**Note**: This integration is designed for the Kenyan market using Safaricom's M-Pesa service. Ensure compliance with local regulations and M-Pesa terms of service.

---

## 🔐 Security Review & Best Practices

### Security Implementation Checklist

#### ✅ Credential Management
- [x] Environment variables for all sensitive data
- [x] No hardcoded credentials in source code
- [x] Secure credential storage and rotation capability
- [x] Separate sandbox and production credentials

#### ✅ Input Validation & Sanitization
- [x] Server-side validation for all payment inputs
- [x] Phone number format validation with regex
- [x] Amount range validation (minimum 1 KES)
- [x] Payment type enumeration validation
- [x] Description length limits and sanitization

#### ✅ Authentication & Authorization
- [x] JWT-based authentication for all endpoints
- [x] Role-based access control (client vs admin)
- [x] Admin-only operations protection
- [x] Token expiration and refresh handling

#### ✅ Data Protection
- [x] Encrypted database connections
- [x] Sensitive data hashing where applicable
- [x] PII data protection measures
- [x] Secure callback data handling

#### ✅ Network Security
- [x] HTTPS-only communication
- [x] Request timeout handling (60s for payments)
- [x] Rate limiting implementation
- [x] CORS configuration for frontend

#### ✅ Error Handling
- [x] Comprehensive error logging
- [x] No sensitive data in error responses
- [x] Graceful failure handling
- [x] User-friendly error messages

#### ✅ Audit & Monitoring
- [x] Comprehensive transaction logging
- [x] Security event logging
- [x] Error tracking and monitoring
- [x] Performance metrics collection

### Security Recommendations

1. **Regular Security Audits**
   - Conduct quarterly security reviews
   - Monitor for new vulnerabilities
   - Update dependencies regularly
   - Review access logs monthly

2. **Incident Response Plan**
   - Define security incident procedures
   - Establish communication protocols
   - Implement automated alerting
   - Regular backup and recovery testing

3. **Compliance Considerations**
   - PCI DSS compliance for payment processing
   - GDPR compliance for EU users
   - Local data protection regulations
   - M-Pesa terms of service compliance

4. **Production Security Hardening**
   - Implement Web Application Firewall (WAF)
   - Use intrusion detection systems
   - Regular penetration testing
   - Security headers implementation

### Risk Assessment

| Risk Level | Description | Mitigation |
|------------|-------------|------------|
| **High** | Credential exposure | Environment variables, rotation |
| **Medium** | Callback manipulation | Signature validation, HTTPS |
| **Medium** | Payment fraud | Amount validation, audit logs |
| **Low** | Data breach | Encryption, access controls |
| **Low** | Service disruption | Rate limiting, monitoring |

This comprehensive security implementation ensures the M-Pesa integration meets enterprise-grade security standards for financial transactions in legal services.
