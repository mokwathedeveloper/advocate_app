# LegalPro Case Management System - API Documentation v1.0.1

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Case Management](#case-management)
4. [Document Management](#document-management)
5. [Note Management](#note-management)
6. [Activity Tracking](#activity-tracking)
7. [Search & Filtering](#search--filtering)
8. [Workflow Management](#workflow-management)
9. [Assignment Management](#assignment-management)
10. [Error Handling](#error-handling)

## Overview

The LegalPro Case Management System provides a comprehensive REST API for managing legal cases, documents, notes, and activities. The system supports role-based access control with different permission levels for clients, advocates, admins, and super admins.

### Base URL
```
https://api.legalpro.com/api
```

### API Version
```
v1.0.1
```

### Content Type
All requests and responses use JSON format:
```
Content-Type: application/json
```

## Authentication

All API endpoints require authentication using JWT tokens.

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "role": "advocate"
  }
}
```

### Authorization Header
Include the JWT token in all subsequent requests:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Case Management

### Get Cases
```http
GET /cases
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `status` (string): Filter by case status
- `caseType` (string): Filter by case type
- `priority` (string): Filter by priority
- `search` (string): Search in title, description, case number

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "pagination": {
    "page": 1,
    "limit": 20,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "statusCounts": {
    "draft": 5,
    "open": 15,
    "closed": 30
  },
  "data": [
    {
      "id": "case_id",
      "caseNumber": "CASE-2024-0001",
      "title": "Corporate Merger Case",
      "description": "Large corporate merger case",
      "status": "open",
      "caseType": "corporate",
      "priority": "high",
      "client": {
        "primary": {
          "id": "client_id",
          "firstName": "Jane",
          "lastName": "Client",
          "email": "client@example.com"
        }
      },
      "advocate": {
        "primary": {
          "id": "advocate_id",
          "firstName": "John",
          "lastName": "Advocate",
          "email": "advocate@example.com"
        }
      },
      "dateCreated": "2024-01-15T10:00:00Z",
      "lastActivity": "2024-01-20T15:30:00Z"
    }
  ]
}
```

### Get Single Case
```http
GET /cases/{caseId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "case": {
      "id": "case_id",
      "caseNumber": "CASE-2024-0001",
      "title": "Corporate Merger Case",
      "description": "Detailed case description",
      "status": "open",
      "caseType": "corporate",
      "priority": "high",
      "progress": 45,
      "client": {
        "primary": {
          "id": "client_id",
          "firstName": "Jane",
          "lastName": "Client",
          "email": "client@example.com",
          "phone": "+1234567890"
        }
      },
      "advocate": {
        "primary": {
          "id": "advocate_id",
          "firstName": "John",
          "lastName": "Advocate",
          "email": "advocate@example.com",
          "specialization": "Corporate Law"
        }
      },
      "courtDetails": {
        "courtName": "Supreme Court",
        "judge": "Justice Smith",
        "courtCaseNumber": "SC-2024-001"
      },
      "billing": {
        "billingType": "hourly",
        "hourlyRate": 500,
        "totalAmount": 25000,
        "paymentStatus": "partial"
      },
      "tags": ["merger", "corporate", "urgent"],
      "dateCreated": "2024-01-15T10:00:00Z",
      "expectedCompletion": "2024-06-15T00:00:00Z"
    },
    "documents": [
      {
        "id": "doc_id",
        "originalName": "contract.pdf",
        "documentType": "contract",
        "uploadedAt": "2024-01-16T09:00:00Z",
        "uploadedBy": {
          "firstName": "John",
          "lastName": "Advocate"
        }
      }
    ],
    "notes": [
      {
        "id": "note_id",
        "title": "Initial Meeting Notes",
        "noteType": "meeting",
        "createdAt": "2024-01-16T14:00:00Z",
        "createdBy": {
          "firstName": "John",
          "lastName": "Advocate"
        }
      }
    ],
    "recentActivity": [
      {
        "id": "activity_id",
        "action": "Case Created",
        "description": "Case CASE-2024-0001 was created",
        "performedAt": "2024-01-15T10:00:00Z",
        "performedBy": {
          "firstName": "John",
          "lastName": "Advocate"
        }
      }
    ],
    "permissions": {
      "canEdit": true,
      "canDelete": false,
      "canAddDocuments": true,
      "canAddNotes": true
    }
  }
}
```

### Create Case
```http
POST /cases
```

**Request Body:**
```json
{
  "title": "New Corporate Case",
  "description": "Description of the case",
  "caseType": "corporate",
  "priority": "medium",
  "clientId": "client_id",
  "advocateId": "advocate_id",
  "courtDetails": {
    "courtName": "District Court",
    "judge": "Justice Johnson"
  },
  "billing": {
    "billingType": "fixed",
    "fixedAmount": 10000
  },
  "expectedCompletion": "2024-12-31T00:00:00Z",
  "tags": ["corporate", "new"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Case created successfully",
  "data": {
    "id": "new_case_id",
    "caseNumber": "CASE-2024-0002",
    "title": "New Corporate Case",
    "status": "draft",
    "dateCreated": "2024-01-21T10:00:00Z"
  }
}
```

### Update Case
```http
PUT /cases/{caseId}
```

**Request Body:**
```json
{
  "title": "Updated Case Title",
  "priority": "high",
  "notes": "Updated case notes",
  "statusChangeReason": "Priority escalation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Case updated successfully",
  "data": {
    "id": "case_id",
    "title": "Updated Case Title",
    "priority": "high",
    "updatedAt": "2024-01-21T11:00:00Z"
  }
}
```

### Delete Case (Archive)
```http
DELETE /cases/{caseId}
```

**Request Body:**
```json
{
  "reason": "Case no longer needed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Case archived successfully"
}
```

## Document Management

### Upload Document
```http
POST /cases/{caseId}/documents
```

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `document` (file): The document file
- `documentType` (string): Type of document (pleading, contract, evidence, etc.)
- `description` (string): Document description
- `accessLevel` (string): Access level (public, restricted, confidential)
- `category` (string): Document category
- `tags` (string): Comma-separated tags

**Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": "doc_id",
    "fileName": "generated-filename.pdf",
    "originalName": "contract.pdf",
    "fileSize": 1048576,
    "mimeType": "application/pdf",
    "documentType": "contract",
    "description": "Main contract document",
    "accessLevel": "restricted",
    "uploadedAt": "2024-01-21T12:00:00Z",
    "uploadedBy": {
      "firstName": "John",
      "lastName": "Advocate"
    }
  }
}
```

### Get Case Documents
```http
GET /cases/{caseId}/documents
```

**Query Parameters:**
- `documentType` (string): Filter by document type
- `accessLevel` (string): Filter by access level
- `search` (string): Search in filename and description
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 15,
  "pagination": {
    "page": 1,
    "limit": 20,
    "pages": 1
  },
  "data": [
    {
      "id": "doc_id",
      "originalName": "contract.pdf",
      "documentType": "contract",
      "fileSize": 1048576,
      "description": "Main contract document",
      "accessLevel": "restricted",
      "uploadedAt": "2024-01-21T12:00:00Z",
      "uploadedBy": {
        "firstName": "John",
        "lastName": "Advocate"
      },
      "downloadCount": 3
    }
  ]
}
```

### Download Document
```http
GET /documents/{documentId}/download
```

**Response:** Binary file download with appropriate headers

### Update Document
```http
PUT /documents/{documentId}
```

**Request Body:**
```json
{
  "description": "Updated document description",
  "documentType": "evidence",
  "accessLevel": "confidential",
  "tags": ["evidence", "important"]
}
```

### Delete Document
```http
DELETE /documents/{documentId}
```

**Request Body:**
```json
{
  "reason": "Document no longer needed"
}
```

## Note Management

### Create Note
```http
POST /cases/{caseId}/notes
```

**Request Body:**
```json
{
  "title": "Meeting Notes",
  "content": "Detailed meeting notes content",
  "noteType": "meeting",
  "priority": "medium",
  "isPrivate": false,
  "isConfidential": false,
  "tags": ["meeting", "client"],
  "category": "client-communication",
  "meetingDetails": {
    "attendees": ["user_id_1", "user_id_2"],
    "duration": 60,
    "location": "Conference Room A",
    "meetingDate": "2024-01-21T14:00:00Z"
  },
  "followUp": {
    "required": true,
    "dueDate": "2024-01-25T00:00:00Z",
    "assignedTo": "advocate_id"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Note created successfully",
  "data": {
    "id": "note_id",
    "title": "Meeting Notes",
    "content": "Detailed meeting notes content",
    "noteType": "meeting",
    "priority": "medium",
    "wordCount": 25,
    "createdAt": "2024-01-21T15:00:00Z",
    "createdBy": {
      "firstName": "John",
      "lastName": "Advocate"
    }
  }
}
```

### Get Case Notes
```http
GET /cases/{caseId}/notes
```

**Query Parameters:**
- `noteType` (string): Filter by note type
- `priority` (string): Filter by priority
- `isPinned` (boolean): Filter pinned notes
- `search` (string): Search in title and content
- `page` (number): Page number
- `limit` (number): Items per page

### Update Note
```http
PUT /notes/{noteId}
```

### Delete Note
```http
DELETE /notes/{noteId}
```

### Pin/Unpin Note
```http
PUT /notes/{noteId}/pin
```

### Complete Follow-up
```http
PUT /notes/{noteId}/complete-followup
```

**Request Body:**
```json
{
  "notes": "Follow-up completed successfully"
}
```

## Activity Tracking

### Get Case Activities
```http
GET /cases/{caseId}/activities
```

**Query Parameters:**
- `types` (string): Comma-separated activity types
- `category` (string): Activity category
- `priority` (string): Activity priority
- `dateFrom` (string): Start date (ISO format)
- `dateTo` (string): End date (ISO format)
- `performedBy` (string): User ID
- `includeSystem` (boolean): Include system-generated activities
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": "activity_id",
      "activityType": "case_created",
      "action": "Case Created",
      "description": "Case CASE-2024-0001 was created",
      "category": "case_management",
      "priority": "medium",
      "performedAt": "2024-01-15T10:00:00Z",
      "performedBy": {
        "firstName": "John",
        "lastName": "Advocate",
        "email": "advocate@example.com"
      },
      "details": {
        "caseType": "corporate",
        "priority": "high",
        "clientName": "Jane Client"
      },
      "isSystemGenerated": false
    }
  ]
}
```

### Get User Activities
```http
GET /users/{userId}/activities
```

### Get Activity Statistics
```http
GET /activities/statistics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "byType": [
      { "_id": "case_created", "count": 15 },
      { "_id": "status_changed", "count": 25 }
    ],
    "byCategory": [
      { "_id": "case_management", "count": 40 },
      { "_id": "document_management", "count": 20 }
    ],
    "byUser": [
      {
        "count": 30,
        "user": {
          "firstName": "John",
          "lastName": "Advocate"
        }
      }
    ],
    "totalActivities": 100
  }
}
```

## Search & Filtering

### Search Cases
```http
GET /search/cases
```

**Query Parameters:**
- `q` (string): Search query
- `status` (string): Case status filter
- `caseType` (string): Case type filter
- `priority` (string): Priority filter
- `advocateId` (string): Advocate ID filter
- `clientId` (string): Client ID filter
- `dateFrom` (string): Date range start
- `dateTo` (string): Date range end
- `courtName` (string): Court name filter
- `tags` (string): Comma-separated tags
- `isUrgent` (boolean): Urgent cases filter
- `sortBy` (string): Sort field
- `sortOrder` (string): Sort direction (asc/desc)
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
{
  "success": true,
  "message": "Found 25 cases",
  "data": [
    {
      "id": "case_id",
      "caseNumber": "CASE-2024-0001",
      "title": "Corporate Merger Case",
      "status": "open",
      "priority": "high"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "pages": 2
  },
  "statistics": {
    "byStatus": [
      { "_id": "open", "count": 15 },
      { "_id": "closed", "count": 10 }
    ]
  },
  "appliedFilters": {
    "textSearch": "merger",
    "status": "open",
    "priority": "high"
  }
}
```

### Search Suggestions
```http
GET /search/suggestions?q=corp
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": {
      "cases": [
        {
          "id": "case_id",
          "title": "Corporate Merger Case",
          "caseNumber": "CASE-2024-0001"
        }
      ],
      "clients": [
        {
          "id": "client_id",
          "firstName": "Corporate",
          "lastName": "Client"
        }
      ],
      "advocates": [
        {
          "id": "advocate_id",
          "firstName": "John",
          "lastName": "Corporate",
          "specialization": "Corporate Law"
        }
      ]
    }
  }
}
```

### Search Filters Configuration
```http
GET /search/filters
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": [
      { "value": "draft", "label": "Draft" },
      { "value": "open", "label": "Open" }
    ],
    "caseType": [
      { "value": "corporate", "label": "Corporate" },
      { "value": "employment", "label": "Employment" }
    ],
    "priority": [
      { "value": "low", "label": "Low" },
      { "value": "medium", "label": "Medium" }
    ],
    "advocates": [
      {
        "value": "advocate_id",
        "label": "John Advocate",
        "specialization": "Corporate Law"
      }
    ]
  }
}
```

## Workflow Management

### Change Case Status
```http
PUT /cases/{caseId}/status
```

**Request Body:**
```json
{
  "status": "in_review",
  "reason": "Case ready for review",
  "outcome": "Preliminary review completed",
  "notes": "All documents reviewed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Case status updated successfully",
  "data": {
    "case": {
      "id": "case_id",
      "status": "in_review",
      "progress": 75
    },
    "previousStatus": "open",
    "newStatus": "in_review"
  }
}
```

### Get Available Transitions
```http
GET /cases/{caseId}/transitions
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentStatus": "open",
    "currentStatusLabel": "Open",
    "availableTransitions": [
      {
        "status": "in_review",
        "label": "In Review",
        "description": "Case is under review",
        "requirements": {
          "requiresReason": false,
          "requiresOutcome": false,
          "requiresApproval": false
        }
      }
    ]
  }
}
```

### Get Status History
```http
GET /cases/{caseId}/status-history
```

### Get Workflow Statistics
```http
GET /workflow/statistics
```

## Assignment Management

### Assign Primary Advocate
```http
PUT /cases/{caseId}/assign/primary
```

**Request Body:**
```json
{
  "advocateId": "advocate_id",
  "reason": "Specialization match",
  "maxCases": 50
}
```

### Add Secondary Advocate
```http
PUT /cases/{caseId}/assign/secondary
```

### Remove Advocate
```http
DELETE /cases/{caseId}/assign/{advocateId}
```

### Get Available Advocates
```http
GET /advocates/available
```

**Query Parameters:**
- `specialization` (string): Filter by specialization
- `maxWorkload` (string): Maximum workload level
- `exclude` (string): Comma-separated advocate IDs to exclude

### Auto-assign Case
```http
POST /cases/{caseId}/auto-assign
```

**Request Body:**
```json
{
  "preferredSpecialization": "Corporate Law",
  "maxWorkload": "moderate",
  "prioritizeExperience": true
}
```

### Transfer Case
```http
PUT /cases/{caseId}/transfer
```

**Request Body:**
```json
{
  "fromAdvocateId": "current_advocate_id",
  "toAdvocateId": "new_advocate_id",
  "reason": "Workload balancing",
  "notes": "Transfer notes"
}
```

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### HTTP Status Codes

- **200 OK**: Successful GET, PUT requests
- **201 Created**: Successful POST requests
- **400 Bad Request**: Validation errors, invalid input
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict
- **422 Unprocessable Entity**: Validation failed
- **500 Internal Server Error**: Server errors

### Common Error Scenarios

#### Authentication Errors
```json
{
  "success": false,
  "message": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

#### Authorization Errors
```json
{
  "success": false,
  "message": "Access denied to this resource",
  "code": "ACCESS_DENIED"
}
```

#### Validation Errors
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    },
    {
      "field": "clientId",
      "message": "Invalid client ID"
    }
  ]
}
```

#### Resource Not Found
```json
{
  "success": false,
  "message": "Case not found",
  "code": "RESOURCE_NOT_FOUND"
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Standard Users**: 1000 requests per hour
- **Premium Users**: 5000 requests per hour
- **Admin Users**: 10000 requests per hour

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642781400
```

## Pagination

All list endpoints support pagination:

**Request Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response Format:**
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Webhooks

The system supports webhooks for real-time notifications:

### Webhook Events
- `case.created`
- `case.updated`
- `case.status_changed`
- `document.uploaded`
- `note.created`

### Webhook Payload Example
```json
{
  "event": "case.status_changed",
  "timestamp": "2024-01-21T15:00:00Z",
  "data": {
    "caseId": "case_id",
    "previousStatus": "open",
    "newStatus": "closed",
    "changedBy": "advocate_id"
  }
}
```

---

For more detailed examples and integration guides, see the [Integration Guide](INTEGRATION_GUIDE.md) and [Usage Examples](USAGE_EXAMPLES.md).
