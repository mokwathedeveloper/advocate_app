# Cloudinary Integration Technical Specifications - LegalPro v1.0.1

## 🎯 Overview

This document defines comprehensive technical requirements and specifications for integrating Cloudinary as the primary file management solution for the LegalPro advocate case management system.

## 📋 Technical Requirements

### 🔧 Core Functionality Requirements

#### File Upload Operations
- **Secure Upload**: Direct upload to Cloudinary with signed URLs
- **Progress Tracking**: Real-time upload progress for large files
- **Batch Upload**: Support for multiple file uploads simultaneously
- **Resumable Upload**: Handle interrupted uploads gracefully
- **Metadata Extraction**: Automatic extraction of file metadata (size, type, dimensions)

#### File Management Operations
- **Retrieval**: Secure URL generation with expiration and access control
- **Deletion**: Secure file deletion with audit logging
- **Transformation**: On-the-fly image resizing, format conversion, and optimization
- **Organization**: Folder-based organization by case, user, and file type
- **Search**: File search by name, type, case association, and metadata

#### Security Requirements
- **Access Control**: Role-based file access (advocate, admin, client)
- **Signed URLs**: Time-limited access URLs for sensitive documents
- **Upload Validation**: Server-side file type and size validation
- **Virus Scanning**: Integration with Cloudinary's security features
- **Audit Logging**: Complete audit trail for all file operations

### 📁 Supported File Types

#### Document Files
```javascript
const DOCUMENT_TYPES = {
  PDF: {
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    maxSize: '50MB',
    description: 'Portable Document Format'
  },
  WORD: {
    mimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    extensions: ['.doc', '.docx'],
    maxSize: '25MB',
    description: 'Microsoft Word Documents'
  },
  EXCEL: {
    mimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    extensions: ['.xls', '.xlsx'],
    maxSize: '25MB',
    description: 'Microsoft Excel Spreadsheets'
  },
  POWERPOINT: {
    mimeTypes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    extensions: ['.ppt', '.pptx'],
    maxSize: '50MB',
    description: 'Microsoft PowerPoint Presentations'
  },
  TEXT: {
    mimeTypes: ['text/plain', 'text/rtf'],
    extensions: ['.txt', '.rtf'],
    maxSize: '10MB',
    description: 'Plain Text and Rich Text Files'
  }
};
```

#### Image Files
```javascript
const IMAGE_TYPES = {
  JPEG: {
    mimeTypes: ['image/jpeg', 'image/jpg'],
    extensions: ['.jpg', '.jpeg'],
    maxSize: '10MB',
    description: 'JPEG Images'
  },
  PNG: {
    mimeTypes: ['image/png'],
    extensions: ['.png'],
    maxSize: '10MB',
    description: 'PNG Images'
  },
  GIF: {
    mimeTypes: ['image/gif'],
    extensions: ['.gif'],
    maxSize: '5MB',
    description: 'GIF Images'
  },
  WEBP: {
    mimeTypes: ['image/webp'],
    extensions: ['.webp'],
    maxSize: '10MB',
    description: 'WebP Images'
  },
  SVG: {
    mimeTypes: ['image/svg+xml'],
    extensions: ['.svg'],
    maxSize: '2MB',
    description: 'SVG Vector Images'
  }
};
```

#### Media Files
```javascript
const MEDIA_TYPES = {
  VIDEO: {
    mimeTypes: [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo'
    ],
    extensions: ['.mp4', '.mpeg', '.mov', '.avi'],
    maxSize: '500MB',
    description: 'Video Files'
  },
  AUDIO: {
    mimeTypes: [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4'
    ],
    extensions: ['.mp3', '.wav', '.ogg', '.m4a'],
    maxSize: '100MB',
    description: 'Audio Files'
  }
};
```

### 🗂️ Folder Structure & Organization

```
legalpro-files/
├── users/
│   ├── {userId}/
│   │   ├── profile/
│   │   │   ├── avatar.jpg
│   │   │   └── documents/
│   │   └── temp/
├── cases/
│   ├── {caseId}/
│   │   ├── documents/
│   │   │   ├── contracts/
│   │   │   ├── evidence/
│   │   │   ├── correspondence/
│   │   │   └── court-filings/
│   │   ├── images/
│   │   └── media/
├── shared/
│   ├── templates/
│   ├── forms/
│   └── resources/
└── system/
    ├── backups/
    └── logs/
```

### 🔒 Security Specifications

#### Access Control Matrix
```javascript
const ACCESS_CONTROL = {
  ADVOCATE: {
    upload: ['cases/*', 'users/{self}/*'],
    read: ['cases/*', 'users/{self}/*', 'shared/*'],
    delete: ['cases/{assigned}/*', 'users/{self}/*'],
    transform: ['images/*']
  },
  ADMIN: {
    upload: ['*'],
    read: ['*'],
    delete: ['*'],
    transform: ['*']
  },
  CLIENT: {
    upload: ['cases/{associated}/*', 'users/{self}/*'],
    read: ['cases/{associated}/*', 'users/{self}/*', 'shared/forms/*'],
    delete: ['users/{self}/temp/*'],
    transform: ['users/{self}/profile/*']
  }
};
```

#### File Size Limits
```javascript
const SIZE_LIMITS = {
  GLOBAL_MAX: '500MB',
  PER_REQUEST_MAX: '100MB',
  DAILY_QUOTA_PER_USER: '2GB',
  MONTHLY_QUOTA_PER_ORGANIZATION: '50GB',
  
  BY_FILE_TYPE: {
    images: '10MB',
    documents: '50MB',
    media: '500MB',
    archives: '100MB'
  },
  
  BY_USER_ROLE: {
    client: '100MB_per_file',
    advocate: '500MB_per_file',
    admin: 'unlimited'
  }
};
```

### 🔧 API Specifications

#### Upload Endpoint
```javascript
POST /api/files/upload
Content-Type: multipart/form-data

Headers:
- Authorization: Bearer {jwt_token}
- X-Case-ID: {case_id} (optional)
- X-Folder-Path: {folder_path} (optional)

Body:
- files: File[] (required)
- metadata: {
    description?: string,
    tags?: string[],
    isPublic?: boolean,
    expiresAt?: Date
  }

Response:
{
  success: boolean,
  files: [{
    id: string,
    originalName: string,
    cloudinaryId: string,
    url: string,
    secureUrl: string,
    size: number,
    format: string,
    resourceType: string,
    folder: string,
    uploadedAt: Date,
    metadata: object
  }],
  errors?: string[]
}
```

#### File Management Endpoints
```javascript
// Get file details
GET /api/files/:fileId
Response: FileDetails

// Get files by case
GET /api/files/case/:caseId
Query: ?page=1&limit=20&type=document&sort=uploadedAt

// Delete file
DELETE /api/files/:fileId
Response: { success: boolean, message: string }

// Generate signed URL
POST /api/files/:fileId/signed-url
Body: { expiresIn: number, transformation?: object }
Response: { url: string, expiresAt: Date }

// Transform image
POST /api/files/:fileId/transform
Body: { width?: number, height?: number, format?: string, quality?: number }
Response: { url: string, transformedUrl: string }
```

### 🌐 Environment Configuration

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_SECURE=true
CLOUDINARY_FOLDER_PREFIX=legalpro

# Upload Configuration
MAX_FILE_SIZE=52428800  # 50MB in bytes
MAX_FILES_PER_REQUEST=10
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png,gif,mp4,mp3

# Security Configuration
SIGNED_URL_EXPIRY=3600  # 1 hour in seconds
ENABLE_VIRUS_SCAN=true
REQUIRE_AUTHENTICATION=true

# Storage Configuration
AUTO_BACKUP=true
BACKUP_RETENTION_DAYS=30
ENABLE_CDN=true
```

### 📊 Performance Requirements

#### Upload Performance
- **Small Files** (< 1MB): Upload completion within 5 seconds
- **Medium Files** (1-10MB): Upload completion within 30 seconds
- **Large Files** (10-50MB): Upload completion within 2 minutes
- **Concurrent Uploads**: Support up to 10 simultaneous uploads per user

#### Retrieval Performance
- **File URL Generation**: < 100ms response time
- **Image Transformations**: < 2 seconds for standard transformations
- **File Listing**: < 500ms for paginated results (20 items)
- **Search Operations**: < 1 second for metadata-based searches

#### Availability & Reliability
- **Uptime**: 99.9% availability target
- **Error Rate**: < 0.1% for upload operations
- **Backup**: Daily automated backups with 30-day retention
- **Disaster Recovery**: 4-hour RTO (Recovery Time Objective)

### 🔍 Monitoring & Analytics

#### Key Metrics
- Upload success/failure rates
- File access patterns and frequency
- Storage usage by user/case/organization
- Performance metrics (upload/download times)
- Security events (unauthorized access attempts)

#### Alerting Thresholds
- Upload failure rate > 5%
- Storage usage > 80% of quota
- Unusual access patterns detected
- Large file uploads (> 100MB)
- Multiple failed authentication attempts

### 🧪 Testing Requirements

#### Unit Tests
- File validation functions
- Cloudinary service methods
- Access control logic
- Error handling scenarios

#### Integration Tests
- End-to-end upload workflows
- File retrieval and URL generation
- Permission-based access control
- Error scenarios and edge cases

#### Performance Tests
- Concurrent upload handling
- Large file upload performance
- API response time validation
- Storage quota enforcement

### 📚 Documentation Requirements

#### Technical Documentation
- API endpoint documentation with examples
- Configuration guide and environment setup
- Security implementation details
- Troubleshooting guide and common issues

#### User Documentation
- File upload user guide
- File management interface instructions
- Mobile app file handling guide
- Best practices for file organization

## 🔐 Secure Credential Management

### Environment Variables Structure
```env
# Primary Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=legalpro-production
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_secure_api_secret_here
CLOUDINARY_SECURE=true
CLOUDINARY_FOLDER_PREFIX=legalpro-v1

# Advanced Configuration
CLOUDINARY_UPLOAD_PRESET=legalpro_signed_upload
CLOUDINARY_TRANSFORMATION_QUALITY=auto:good
CLOUDINARY_AUTO_TAGGING=true
CLOUDINARY_BACKUP_ENABLED=true

# Security Configuration
CLOUDINARY_SIGNED_UPLOADS_ONLY=true
CLOUDINARY_INVALIDATE_ON_DELETE=true
CLOUDINARY_ENABLE_EAGER_TRANSFORMATION=false
CLOUDINARY_MAX_TRANSFORMATION_SIZE=4000000  # 4MB

# Rate Limiting & Quotas
CLOUDINARY_RATE_LIMIT_PER_MINUTE=100
CLOUDINARY_DAILY_QUOTA_GB=10
CLOUDINARY_MONTHLY_QUOTA_GB=300
CLOUDINARY_MAX_CONCURRENT_UPLOADS=5

# Monitoring & Logging
CLOUDINARY_ENABLE_ANALYTICS=true
CLOUDINARY_LOG_LEVEL=info
CLOUDINARY_WEBHOOK_URL=https://yourdomain.com/api/webhooks/cloudinary
CLOUDINARY_WEBHOOK_SECRET=your_webhook_secret
```

### Credential Security Best Practices

#### Development Environment
```env
# .env.development
CLOUDINARY_CLOUD_NAME=legalpro-dev
CLOUDINARY_API_KEY=dev_api_key
CLOUDINARY_API_SECRET=dev_api_secret
CLOUDINARY_FOLDER_PREFIX=legalpro-dev
CLOUDINARY_SECURE=false  # For local development only
```

#### Staging Environment
```env
# .env.staging
CLOUDINARY_CLOUD_NAME=legalpro-staging
CLOUDINARY_API_KEY=staging_api_key
CLOUDINARY_API_SECRET=staging_api_secret
CLOUDINARY_FOLDER_PREFIX=legalpro-staging
CLOUDINARY_SECURE=true
```

#### Production Environment
```env
# .env.production
CLOUDINARY_CLOUD_NAME=legalpro-production
CLOUDINARY_API_KEY=prod_api_key
CLOUDINARY_API_SECRET=prod_api_secret
CLOUDINARY_FOLDER_PREFIX=legalpro-prod
CLOUDINARY_SECURE=true
CLOUDINARY_SIGNED_UPLOADS_ONLY=true
```

### Configuration Validation Schema
```javascript
const configSchema = {
  CLOUDINARY_CLOUD_NAME: {
    required: true,
    type: 'string',
    minLength: 3,
    pattern: /^[a-zA-Z0-9_-]+$/
  },
  CLOUDINARY_API_KEY: {
    required: true,
    type: 'string',
    length: 15,
    pattern: /^\d{15}$/
  },
  CLOUDINARY_API_SECRET: {
    required: true,
    type: 'string',
    minLength: 20,
    pattern: /^[a-zA-Z0-9_-]+$/
  },
  CLOUDINARY_SECURE: {
    required: true,
    type: 'boolean',
    default: true
  },
  CLOUDINARY_FOLDER_PREFIX: {
    required: false,
    type: 'string',
    pattern: /^[a-zA-Z0-9_-]+$/
  }
};
```

### Credential Rotation Strategy
```javascript
const credentialRotation = {
  frequency: 'quarterly', // Every 3 months
  process: [
    'Generate new API credentials in Cloudinary dashboard',
    'Update staging environment first',
    'Run integration tests',
    'Update production environment during maintenance window',
    'Verify all services are functioning',
    'Revoke old credentials after 24-hour grace period'
  ],
  automation: {
    enabled: true,
    notificationChannels: ['email', 'slack'],
    rollbackPlan: 'automatic_revert_on_failure'
  }
};
```

---

This specification provides the foundation for a robust, secure, and scalable Cloudinary integration that meets enterprise standards for file management in legal services applications.
