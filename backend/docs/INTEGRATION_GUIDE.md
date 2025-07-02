# LegalPro Case Management System - Integration Guide v1.0.1

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication Setup](#authentication-setup)
3. [SDK and Libraries](#sdk-and-libraries)
4. [Common Integration Patterns](#common-integration-patterns)
5. [Webhook Integration](#webhook-integration)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Testing Integration](#testing-integration)

## Getting Started

### Prerequisites

- Node.js 16+ for backend integration
- Valid API credentials
- Understanding of REST API principles
- JWT token handling capability

### Quick Setup

1. **Obtain API Credentials**
   ```bash
   # Contact your system administrator for:
   # - API Base URL
   # - Client credentials (if using OAuth)
   # - Test environment access
   ```

2. **Install Dependencies**
   ```bash
   npm install axios jsonwebtoken
   ```

3. **Basic Configuration**
   ```javascript
   const config = {
     baseURL: 'https://api.legalpro.com/api',
     timeout: 30000,
     headers: {
       'Content-Type': 'application/json'
     }
   };
   ```

## Authentication Setup

### JWT Token Authentication

```javascript
class LegalProClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = null;
    this.axios = axios.create({
      baseURL: this.baseURL,
      timeout: 30000
    });

    // Add request interceptor for authentication
    this.axios.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.token = null;
          // Redirect to login or refresh token
        }
        return Promise.reject(error);
      }
    );
  }

  async login(email, password) {
    try {
      const response = await this.axios.post('/auth/login', {
        email,
        password
      });

      this.token = response.data.token;
      return response.data;
    } catch (error) {
      throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async refreshToken() {
    try {
      const response = await this.axios.post('/auth/refresh');
      this.token = response.data.token;
      return response.data;
    } catch (error) {
      this.token = null;
      throw new Error('Token refresh failed');
    }
  }
}
```

### Usage Example

```javascript
const client = new LegalProClient('https://api.legalpro.com/api');

// Login
await client.login('advocate@example.com', 'password123');

// Now you can make authenticated requests
const cases = await client.getCases();
```

## SDK and Libraries

### JavaScript/Node.js SDK

```javascript
class CaseManager {
  constructor(client) {
    this.client = client;
  }

  async getCases(filters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });

    const response = await this.client.axios.get(`/cases?${params}`);
    return response.data;
  }

  async getCase(caseId) {
    const response = await this.client.axios.get(`/cases/${caseId}`);
    return response.data;
  }

  async createCase(caseData) {
    const response = await this.client.axios.post('/cases', caseData);
    return response.data;
  }

  async updateCase(caseId, updates) {
    const response = await this.client.axios.put(`/cases/${caseId}`, updates);
    return response.data;
  }

  async deleteCase(caseId, reason) {
    const response = await this.client.axios.delete(`/cases/${caseId}`, {
      data: { reason }
    });
    return response.data;
  }

  async uploadDocument(caseId, file, metadata = {}) {
    const formData = new FormData();
    formData.append('document', file);
    
    Object.entries(metadata).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await this.client.axios.post(
      `/cases/${caseId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  }

  async searchCases(query, filters = {}) {
    const params = new URLSearchParams({ q: query });
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });

    const response = await this.client.axios.get(`/search/cases?${params}`);
    return response.data;
  }
}
```

### Python SDK Example

```python
import requests
import json
from typing import Optional, Dict, Any

class LegalProClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.token = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json'
        })

    def login(self, email: str, password: str) -> Dict[str, Any]:
        response = self.session.post(
            f"{self.base_url}/auth/login",
            json={"email": email, "password": password}
        )
        response.raise_for_status()
        
        data = response.json()
        self.token = data['token']
        self.session.headers.update({
            'Authorization': f"Bearer {self.token}"
        })
        return data

    def get_cases(self, **filters) -> Dict[str, Any]:
        params = {k: v for k, v in filters.items() if v is not None}
        response = self.session.get(f"{self.base_url}/cases", params=params)
        response.raise_for_status()
        return response.json()

    def create_case(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        response = self.session.post(f"{self.base_url}/cases", json=case_data)
        response.raise_for_status()
        return response.json()
```

## Common Integration Patterns

### 1. Case Management Workflow

```javascript
class CaseWorkflow {
  constructor(caseManager) {
    this.caseManager = caseManager;
  }

  async createNewCase(clientData, caseDetails) {
    try {
      // 1. Create the case
      const newCase = await this.caseManager.createCase({
        title: caseDetails.title,
        description: caseDetails.description,
        caseType: caseDetails.type,
        priority: caseDetails.priority,
        clientId: clientData.id,
        advocateId: caseDetails.advocateId
      });

      // 2. Upload initial documents if any
      if (caseDetails.documents) {
        for (const doc of caseDetails.documents) {
          await this.caseManager.uploadDocument(
            newCase.data.id,
            doc.file,
            {
              documentType: doc.type,
              description: doc.description
            }
          );
        }
      }

      // 3. Create initial notes
      if (caseDetails.initialNotes) {
        await this.createNote(newCase.data.id, {
          title: 'Initial Case Notes',
          content: caseDetails.initialNotes,
          noteType: 'general'
        });
      }

      return newCase;
    } catch (error) {
      console.error('Case creation workflow failed:', error);
      throw error;
    }
  }

  async updateCaseStatus(caseId, newStatus, reason) {
    try {
      const result = await this.caseManager.updateCaseStatus(caseId, {
        status: newStatus,
        reason: reason
      });

      // Log the status change
      console.log(`Case ${caseId} status changed to ${newStatus}`);
      
      return result;
    } catch (error) {
      console.error('Status update failed:', error);
      throw error;
    }
  }
}
```

### 2. Document Management Integration

```javascript
class DocumentManager {
  constructor(client) {
    this.client = client;
  }

  async uploadMultipleDocuments(caseId, files) {
    const results = [];
    
    for (const file of files) {
      try {
        const result = await this.client.uploadDocument(caseId, file.data, {
          documentType: file.type,
          description: file.description,
          accessLevel: file.accessLevel || 'restricted'
        });
        results.push({ success: true, file: file.name, result });
      } catch (error) {
        results.push({ success: false, file: file.name, error: error.message });
      }
    }
    
    return results;
  }

  async downloadDocument(documentId, savePath) {
    try {
      const response = await this.client.axios.get(
        `/documents/${documentId}/download`,
        { responseType: 'stream' }
      );

      const writer = fs.createWriteStream(savePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Document download failed:', error);
      throw error;
    }
  }
}
```

### 3. Real-time Updates with WebSockets

```javascript
class RealTimeUpdates {
  constructor(client) {
    this.client = client;
    this.socket = null;
    this.eventHandlers = new Map();
  }

  connect() {
    this.socket = new WebSocket('wss://api.legalpro.com/ws', {
      headers: {
        Authorization: `Bearer ${this.client.token}`
      }
    });

    this.socket.on('message', (data) => {
      const event = JSON.parse(data);
      this.handleEvent(event);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  on(eventType, handler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType).push(handler);
  }

  handleEvent(event) {
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(handler => {
      try {
        handler(event.data);
      } catch (error) {
        console.error('Event handler error:', error);
      }
    });
  }
}

// Usage
const realTime = new RealTimeUpdates(client);
realTime.connect();

realTime.on('case.status_changed', (data) => {
  console.log(`Case ${data.caseId} status changed to ${data.newStatus}`);
  // Update UI or trigger other actions
});
```

## Webhook Integration

### Setting Up Webhooks

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Webhook endpoint
app.post('/webhooks/legalpro', (req, res) => {
  const signature = req.headers['x-legalpro-signature'];
  const payload = JSON.stringify(req.body);
  
  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== `sha256=${expectedSignature}`) {
    return res.status(401).send('Invalid signature');
  }

  // Process webhook event
  const event = req.body;
  
  switch (event.type) {
    case 'case.created':
      handleCaseCreated(event.data);
      break;
    case 'case.status_changed':
      handleStatusChanged(event.data);
      break;
    case 'document.uploaded':
      handleDocumentUploaded(event.data);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).send('OK');
});

function handleCaseCreated(data) {
  console.log(`New case created: ${data.caseNumber}`);
  // Send notification, update external systems, etc.
}

function handleStatusChanged(data) {
  console.log(`Case ${data.caseId} status: ${data.previousStatus} → ${data.newStatus}`);
  // Update external tracking systems
}

function handleDocumentUploaded(data) {
  console.log(`Document uploaded to case ${data.caseId}: ${data.fileName}`);
  // Process document, extract metadata, etc.
}
```

### Webhook Security

```javascript
function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
}
```

## Error Handling

### Comprehensive Error Handling

```javascript
class APIError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

class ErrorHandler {
  static handle(error) {
    if (error.response) {
      // API returned an error response
      const { status, data } = error.response;
      throw new APIError(
        data.message || 'API Error',
        status,
        data.code,
        data.errors
      );
    } else if (error.request) {
      // Network error
      throw new APIError('Network Error', 0, 'NETWORK_ERROR');
    } else {
      // Other error
      throw new APIError(error.message, 0, 'UNKNOWN_ERROR');
    }
  }

  static async withRetry(fn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        // Only retry on network errors or 5xx status codes
        if (error.status >= 500 || error.code === 'NETWORK_ERROR') {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
          continue;
        }
        
        throw error;
      }
    }
  }
}

// Usage
try {
  const result = await ErrorHandler.withRetry(async () => {
    return await client.getCases();
  });
} catch (error) {
  if (error instanceof APIError) {
    console.error(`API Error ${error.status}: ${error.message}`);
    if (error.details) {
      console.error('Details:', error.details);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Best Practices

### 1. Rate Limiting and Throttling

```javascript
class RateLimiter {
  constructor(requestsPerSecond = 10) {
    this.requestsPerSecond = requestsPerSecond;
    this.queue = [];
    this.processing = false;
  }

  async request(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const { fn, resolve, reject } = this.queue.shift();
      
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
      
      // Wait before next request
      await new Promise(resolve => 
        setTimeout(resolve, 1000 / this.requestsPerSecond)
      );
    }
    
    this.processing = false;
  }
}

const rateLimiter = new RateLimiter(5); // 5 requests per second

// Usage
const result = await rateLimiter.request(() => client.getCases());
```

### 2. Caching Strategy

```javascript
class CacheManager {
  constructor(ttl = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async getOrFetch(key, fetchFn) {
    let value = this.get(key);
    if (value === null) {
      value = await fetchFn();
      this.set(key, value);
    }
    return value;
  }
}

const cache = new CacheManager();

// Usage
const cases = await cache.getOrFetch('cases-page-1', () => 
  client.getCases({ page: 1, limit: 20 })
);
```

### 3. Batch Operations

```javascript
class BatchProcessor {
  constructor(client, batchSize = 10) {
    this.client = client;
    this.batchSize = batchSize;
  }

  async processBatch(items, processor) {
    const results = [];
    
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      const batchPromises = batch.map(processor);
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        console.error(`Batch ${i / this.batchSize + 1} failed:`, error);
      }
    }
    
    return results;
  }
}

// Usage
const batchProcessor = new BatchProcessor(client);
const results = await batchProcessor.processBatch(
  caseIds,
  (caseId) => client.getCase(caseId)
);
```

## Testing Integration

### Unit Tests

```javascript
const { jest } = require('@jest/globals');

describe('LegalPro Client Integration', () => {
  let client;
  let mockAxios;

  beforeEach(() => {
    mockAxios = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };
    
    client = new LegalProClient('https://api.test.com');
    client.axios = mockAxios;
  });

  test('should login successfully', async () => {
    const mockResponse = {
      data: {
        success: true,
        token: 'test-token',
        user: { id: '1', email: 'test@example.com' }
      }
    };
    
    mockAxios.post.mockResolvedValue(mockResponse);
    
    const result = await client.login('test@example.com', 'password');
    
    expect(mockAxios.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password'
    });
    expect(result.token).toBe('test-token');
    expect(client.token).toBe('test-token');
  });

  test('should handle API errors', async () => {
    const mockError = {
      response: {
        status: 400,
        data: {
          success: false,
          message: 'Invalid credentials'
        }
      }
    };
    
    mockAxios.post.mockRejectedValue(mockError);
    
    await expect(client.login('invalid@example.com', 'wrong'))
      .rejects.toThrow('Login failed: Invalid credentials');
  });
});
```

### Integration Tests

```javascript
describe('Case Management Integration', () => {
  let client;
  let testCase;

  beforeAll(async () => {
    client = new LegalProClient(process.env.TEST_API_URL);
    await client.login(
      process.env.TEST_EMAIL,
      process.env.TEST_PASSWORD
    );
  });

  test('should create and retrieve case', async () => {
    // Create case
    const caseData = {
      title: 'Integration Test Case',
      description: 'Test case for integration testing',
      caseType: 'corporate',
      priority: 'medium',
      clientId: process.env.TEST_CLIENT_ID
    };

    const createResult = await client.createCase(caseData);
    expect(createResult.success).toBe(true);
    
    testCase = createResult.data;

    // Retrieve case
    const getResult = await client.getCase(testCase.id);
    expect(getResult.success).toBe(true);
    expect(getResult.data.case.title).toBe(caseData.title);
  });

  afterAll(async () => {
    // Cleanup
    if (testCase) {
      await client.deleteCase(testCase.id, 'Integration test cleanup');
    }
  });
});
```

---

This integration guide provides comprehensive examples for integrating with the LegalPro Case Management System. For specific use cases or additional support, please refer to the API documentation or contact the development team.
