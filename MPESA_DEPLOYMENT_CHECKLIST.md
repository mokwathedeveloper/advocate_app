# M-Pesa Integration Deployment Checklist - LegalPro v1.0.1

## 🚀 Pre-Deployment Checklist

### 📋 Code Review & Testing
- [ ] All unit tests passing (15/15 tests)
- [ ] Integration tests completed
- [ ] Manual testing in sandbox environment
- [ ] Code review completed by senior developer
- [ ] Security review completed
- [ ] Performance testing completed
- [ ] Error handling tested for all scenarios

### 🔧 Environment Configuration
- [ ] Production environment variables configured
- [ ] M-Pesa production credentials obtained and verified
- [ ] Database indexes created for performance
- [ ] SSL certificates installed and configured
- [ ] Domain name configured for callbacks
- [ ] Firewall rules configured

### 🔐 Security Verification
- [ ] All credentials stored securely (no hardcoded values)
- [ ] HTTPS enforced for all endpoints
- [ ] Rate limiting configured
- [ ] Input validation implemented
- [ ] Authentication and authorization working
- [ ] Audit logging enabled
- [ ] Error messages don't expose sensitive data

### 📊 Monitoring & Logging
- [ ] Application monitoring configured
- [ ] Database monitoring enabled
- [ ] Log aggregation setup (ELK stack or similar)
- [ ] Alert thresholds defined
- [ ] Health check endpoints configured
- [ ] Performance metrics collection enabled

## 🌐 Production Environment Setup

### Environment Variables
```env
# Production M-Pesa Configuration
NODE_ENV=production
MPESA_ENVIRONMENT=production
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_SHORTCODE=your_production_shortcode
MPESA_PASSKEY=your_production_passkey
MPESA_INITIATOR_NAME=your_production_initiator
MPESA_SECURITY_CREDENTIAL=your_production_security_credential

# Production Callback URLs
MPESA_STK_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/stk-callback
MPESA_B2C_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/b2c-callback
MPESA_TIMEOUT_URL=https://yourdomain.com/api/payments/mpesa/timeout
MPESA_RESULT_URL=https://yourdomain.com/api/payments/mpesa/result

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/production_db

# Security Configuration
JWT_SECRET=your_production_jwt_secret
CORS_ORIGIN=https://yourdomain.com

# Monitoring Configuration
LOG_LEVEL=info
ENABLE_METRICS=true
```

### Database Setup
```javascript
// Create indexes for performance
db.payments.createIndex({ "clientId": 1, "status": 1 })
db.payments.createIndex({ "mpesaDetails.checkoutRequestID": 1 }, { unique: true, sparse: true })
db.payments.createIndex({ "mpesaDetails.mpesaReceiptNumber": 1 }, { sparse: true })
db.payments.createIndex({ "createdAt": -1 })

db.transactionlogs.createIndex({ "transactionType": 1, "createdAt": -1 })
db.transactionlogs.createIndex({ "success": 1, "createdAt": -1 })
db.transactionlogs.createIndex({ "paymentId": 1 })
```

## 🔄 Deployment Process

### 1. Backend Deployment
```bash
# 1. Clone repository
git clone https://github.com/your-org/advocate_app.git
cd advocate_app/backend

# 2. Install dependencies
npm ci --production

# 3. Set environment variables
cp .env.example .env.production
# Edit .env.production with production values

# 4. Run database migrations (if any)
npm run migrate

# 5. Start application
npm run start:production
```

### 2. Frontend Deployment
```bash
# 1. Navigate to frontend
cd ../frontend

# 2. Install dependencies
npm ci

# 3. Build for production
npm run build

# 4. Deploy to CDN/hosting service
# (AWS S3, Netlify, Vercel, etc.)
```

### 3. Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # Frontend static files
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
}
```

## 📊 Post-Deployment Verification

### 1. Health Checks
- [ ] Application health endpoint responding
- [ ] Database connectivity verified
- [ ] M-Pesa API connectivity tested
- [ ] All callback URLs accessible
- [ ] SSL certificate valid and properly configured

### 2. Functional Testing
- [ ] User registration and login working
- [ ] Payment initiation successful
- [ ] STK Push received on test phone
- [ ] Payment completion flow working
- [ ] Payment status updates correctly
- [ ] Admin dashboard accessible
- [ ] Transaction logging working

### 3. Performance Testing
- [ ] Response times within acceptable limits (<5s for payments)
- [ ] Database queries optimized
- [ ] Memory usage within limits
- [ ] CPU usage acceptable under load
- [ ] Concurrent user handling tested

### 4. Security Testing
- [ ] Authentication required for protected endpoints
- [ ] Authorization working correctly
- [ ] Input validation preventing malicious inputs
- [ ] Error messages don't expose sensitive data
- [ ] Rate limiting preventing abuse

## 🚨 Monitoring & Alerting

### Key Metrics to Monitor
1. **Payment Success Rate** (target: >95%)
2. **Average Response Time** (target: <5 seconds)
3. **Error Rate** (target: <5%)
4. **Database Performance**
5. **Server Resource Usage**

### Alert Thresholds
```yaml
alerts:
  payment_failure_rate:
    threshold: 10%
    window: 5m
    severity: critical
  
  response_time:
    threshold: 10s
    window: 2m
    severity: warning
  
  error_rate:
    threshold: 5%
    window: 5m
    severity: warning
  
  database_connections:
    threshold: 80%
    severity: warning
```

## 🔄 Rollback Plan

### Immediate Rollback Steps
1. **Stop new deployments**
2. **Revert to previous stable version**
3. **Verify system functionality**
4. **Notify stakeholders**
5. **Investigate and document issues**

### Rollback Commands
```bash
# 1. Stop current application
pm2 stop advocate-backend

# 2. Switch to previous version
git checkout previous-stable-tag

# 3. Restore dependencies
npm ci --production

# 4. Start application
pm2 start advocate-backend

# 5. Verify functionality
curl https://yourdomain.com/api/payments/health
```

## 📞 Support & Maintenance

### Support Contacts
- **Technical Lead**: [email]
- **DevOps Team**: [email]
- **M-Pesa Support**: [contact details]
- **Database Admin**: [email]

### Maintenance Schedule
- **Daily**: Monitor system health and performance
- **Weekly**: Review error logs and performance metrics
- **Monthly**: Security updates and dependency updates
- **Quarterly**: Full security audit and performance review

### Documentation Updates
- [ ] API documentation updated
- [ ] User guides updated
- [ ] Troubleshooting guide updated
- [ ] Deployment documentation updated

## ✅ Sign-off

### Deployment Approval
- [ ] **Technical Lead**: _________________ Date: _______
- [ ] **Security Officer**: ______________ Date: _______
- [ ] **Product Owner**: ________________ Date: _______
- [ ] **DevOps Lead**: __________________ Date: _______

### Go-Live Confirmation
- [ ] **System Administrator**: __________ Date: _______
- [ ] **QA Lead**: _____________________ Date: _______

---

**Deployment Date**: _______________
**Deployed By**: ___________________
**Version**: v1.0.1
**Environment**: Production
