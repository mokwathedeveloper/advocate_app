# Cloudinary Integration Guide - LegalPro v1.0.1

## 🎯 Overview

This guide provides comprehensive instructions for setting up, configuring, and using the Cloudinary file management integration in the LegalPro advocate case management system.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation & Setup](#installation--setup)
3. [Configuration](#configuration)
4. [API Usage](#api-usage)
5. [Frontend Components](#frontend-components)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

## 🔧 Prerequisites

### System Requirements
- Node.js 16.x or higher
- MongoDB 4.4 or higher
- Cloudinary account (free tier available)
- 2GB+ available storage space
- Stable internet connection

### Dependencies
```json
{
  "cloudinary": "^1.41.0",
  "multer": "^1.4.5-lts.1",
  "express-validator": "^7.0.1",
  "mongoose": "^7.5.0"
}
```

## 🚀 Installation & Setup

### Step 1: Cloudinary Account Setup

1. **Create Cloudinary Account**
   ```bash
   # Visit https://cloudinary.com/users/register/free
   # Sign up for a free account
   ```

2. **Get API Credentials**
   - Navigate to Dashboard → Settings → Security
   - Copy your Cloud Name, API Key, and API Secret
   - Enable "Secure URLs" for production

3. **Configure Upload Presets**
   ```javascript
   // In Cloudinary Dashboard → Settings → Upload
   // Create preset: "legalpro_signed_upload"
   {
     "name": "legalpro_signed_upload",
     "unsigned": false,
     "mode": "authenticated",
     "folder": "legalpro",
     "resource_type": "auto",
     "allowed_formats": ["pdf", "doc", "docx", "jpg", "jpeg", "png", "gif", "mp4", "mp3"],
     "max_file_size": 52428800,
     "tags": ["legalpro", "auto-upload"]
   }
   ```

### Step 2: Backend Installation

1. **Install Dependencies**
   ```bash
   cd backend
   npm install cloudinary multer express-validator
   ```

2. **Environment Configuration**
   ```bash
   # Create/update .env file
   cp .env.example .env
   ```

3. **Add Cloudinary Configuration**
   ```env
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   CLOUDINARY_SECURE=true
   CLOUDINARY_FOLDER_PREFIX=legalpro
   
   # Upload Configuration
   MAX_FILE_SIZE=52428800
   MAX_FILES_PER_REQUEST=10
   ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,jpg,jpeg,png,gif,webp,svg,mp4,mp3,wav,ogg
   
   # Security Configuration
   SIGNED_URL_EXPIRY=3600
   ENABLE_VIRUS_SCAN=true
   REQUIRE_AUTHENTICATION=true
   ```

### Step 3: Frontend Installation

1. **Install Dependencies**
   ```bash
   cd ../
   npm install axios framer-motion lucide-react
   ```

2. **Environment Configuration**
   ```env
   # Frontend .env
   VITE_API_URL=http://localhost:5000/api
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   ```

## ⚙️ Configuration

### Backend Configuration

1. **Cloudinary Service Setup**
   ```javascript
   // backend/config/cloudinary.js
   const cloudinary = require('cloudinary').v2;
   
   cloudinary.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_API_KEY,
     api_secret: process.env.CLOUDINARY_API_SECRET,
     secure: true
   });
   ```

2. **File Upload Middleware**
   ```javascript
   // backend/middleware/upload.js
   const multer = require('multer');
   const storage = multer.memoryStorage();
   
   const upload = multer({
     storage,
     limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
     fileFilter: (req, file, cb) => {
       // Validation logic
     }
   });
   ```

3. **Database Models**
   ```javascript
   // backend/models/File.js
   const fileSchema = new mongoose.Schema({
     cloudinaryId: { type: String, required: true, unique: true },
     originalName: { type: String, required: true },
     size: { type: Number, required: true },
     // ... other fields
   });
   ```

### Frontend Configuration

1. **File Service Setup**
   ```typescript
   // src/services/fileService.ts
   class FileService {
     private getAuthHeaders() {
       const token = localStorage.getItem('token');
       return { 'Authorization': `Bearer ${token}` };
     }
     
     async uploadFile(file: File, options: FileUploadOptions) {
       // Upload implementation
     }
   }
   ```

2. **Component Integration**
   ```tsx
   // src/components/files/FileUpload.tsx
   import { FileUpload } from '../components/files';
   
   <FileUpload
     onUpload={handleFileUpload}
     maxFiles={10}
     acceptedTypes={['.pdf', '.doc', '.jpg']}
   />
   ```

## 🔌 API Usage

### Upload Endpoints

#### Single File Upload
```http
POST /api/files/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- file: File (required)
- type: string (optional) - documents|images|media|evidence|contracts
- description: string (optional)
- tags: string (optional) - comma-separated
- isPublic: boolean (optional)
- caseId: string (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "id": "legalpro/cases/123/documents/file_id",
    "originalName": "contract.pdf",
    "url": "https://res.cloudinary.com/...",
    "secureUrl": "https://res.cloudinary.com/...",
    "size": 1024000,
    "format": "pdf",
    "uploadedAt": "2023-12-01T10:00:00Z",
    "uploadedBy": {
      "id": "user_id",
      "name": "John Doe",
      "role": "advocate"
    }
  }
}
```

#### Multiple File Upload
```http
POST /api/files/upload-multiple
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- files: File[] (required)
- type: string (optional)
- description: string (optional)
- tags: string (optional)
- isPublic: boolean (optional)
- caseId: string (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "3 files uploaded successfully",
  "files": [...],
  "failed": [],
  "summary": {
    "totalUploaded": 3,
    "totalFailed": 0
  }
}
```

### File Management Endpoints

#### Get File Details
```http
GET /api/files/:fileId
Authorization: Bearer <token>
```

#### Delete File
```http
DELETE /api/files/:fileId
Authorization: Bearer <token>
```

#### Generate Signed URL
```http
POST /api/files/:fileId/signed-url
Authorization: Bearer <token>
Content-Type: application/json

{
  "expiresIn": 3600,
  "transformation": {
    "width": 800,
    "height": 600,
    "quality": "auto"
  }
}
```

#### Search Files
```http
GET /api/files/search?caseId=123&type=documents&maxResults=20
Authorization: Bearer <token>
```

#### Transform Image
```http
POST /api/files/:fileId/transform
Authorization: Bearer <token>
Content-Type: application/json

{
  "width": 800,
  "height": 600,
  "quality": "auto:good",
  "format": "webp"
}
```

### Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
- `FILE_TOO_LARGE` - File exceeds size limit
- `INVALID_FILE_TYPE` - File type not allowed
- `UPLOAD_FAILED` - Cloudinary upload error
- `UNAUTHORIZED` - Authentication required
- `NOT_FOUND` - File not found
- `VALIDATION_ERROR` - Input validation failed

## 🎨 Frontend Components

### FileUpload Component

```tsx
import { FileUpload } from '../components/files';

const MyComponent = () => {
  const handleUpload = async (files: File[]) => {
    try {
      await fileService.uploadMultipleFiles(files, {
        caseId: 'case_123',
        type: 'documents',
        tags: ['contract', 'legal']
      });
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <FileUpload
      onUpload={handleUpload}
      onError={(error) => console.error(error)}
      maxFiles={5}
      maxFileSize={50 * 1024 * 1024} // 50MB
      acceptedTypes={['.pdf', '.doc', '.docx']}
      multiple={true}
      caseId="case_123"
      type="documents"
    />
  );
};
```

### FileGallery Component

```tsx
import { FileGallery } from '../components/files';

const MyGallery = () => {
  const handleFileSelect = (file: UploadedFile) => {
    // Handle file selection
    window.open(file.secureUrl, '_blank');
  };

  const handleFileDelete = (fileId: string) => {
    // Handle file deletion
    console.log('File deleted:', fileId);
  };

  return (
    <FileGallery
      caseId="case_123"
      type="documents"
      onFileSelect={handleFileSelect}
      onFileDelete={handleFileDelete}
      showUpload={true}
    />
  );
};
```

### Custom Hooks

```tsx
// useFileUpload hook
import { useState } from 'react';
import { fileService } from '../services/fileService';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFiles = async (files: File[], options: FileUploadOptions) => {
    setUploading(true);
    setProgress(0);

    try {
      const result = await fileService.uploadMultipleFiles(
        files, 
        options,
        (progress) => setProgress(progress)
      );
      return result;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return { uploadFiles, uploading, progress };
};
```

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd backend
npm test -- --testPathPattern=cloudinary
npm test -- --testPathPattern=fileValidation

# Frontend tests (if implemented)
cd ../
npm test -- --testPathPattern=file
```

### Test Coverage

```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Manual Testing Checklist

- [ ] Single file upload (PDF, DOC, JPG)
- [ ] Multiple file upload
- [ ] File size validation (reject >50MB)
- [ ] File type validation (reject .exe, .bat)
- [ ] File download via signed URL
- [ ] File deletion
- [ ] File search and filtering
- [ ] Image transformation
- [ ] Error handling (network issues, invalid files)
- [ ] Authentication and authorization
- [ ] Mobile responsiveness

## 🚀 Deployment

### Environment Setup

1. **Production Environment Variables**
   ```env
   # Production .env
   NODE_ENV=production
   CLOUDINARY_CLOUD_NAME=legalpro-production
   CLOUDINARY_API_KEY=prod_api_key
   CLOUDINARY_API_SECRET=prod_api_secret
   CLOUDINARY_SECURE=true
   CLOUDINARY_FOLDER_PREFIX=legalpro-prod
   ```

2. **Cloudinary Production Settings**
   - Enable "Secure URLs" globally
   - Set up webhook notifications
   - Configure auto-backup
   - Enable access logs

### Deployment Steps

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Deploy Backend**
   ```bash
   # Deploy to your hosting platform
   # Ensure environment variables are set
   ```

3. **Deploy Frontend**
   ```bash
   # Build and deploy frontend
   npm run build
   # Upload dist/ to CDN or hosting
   ```

4. **Verify Deployment**
   ```bash
   # Test file upload in production
   curl -X POST https://your-api.com/api/files/upload \
     -H "Authorization: Bearer <token>" \
     -F "file=@test.pdf"
   ```

## 🔧 Troubleshooting

### Common Issues

#### Upload Failures

**Problem:** Files fail to upload with "Upload failed" error
**Solutions:**
1. Check Cloudinary credentials
2. Verify file size and type limits
3. Check network connectivity
4. Review server logs for detailed errors

```bash
# Debug upload issues
curl -v -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.pdf"
```

#### Authentication Errors

**Problem:** "Unauthorized" errors during file operations
**Solutions:**
1. Verify JWT token is valid
2. Check token expiration
3. Ensure user has proper permissions

```javascript
// Debug authentication
const token = localStorage.getItem('token');
console.log('Token:', token);
// Decode JWT to check expiration
```

#### File Not Found Errors

**Problem:** Files return 404 when accessing
**Solutions:**
1. Check if file exists in Cloudinary
2. Verify file permissions
3. Check folder structure

```bash
# Check Cloudinary directly
curl "https://api.cloudinary.com/v1_1/your-cloud/resources/search" \
  -H "Authorization: Basic <base64(api_key:api_secret)>"
```

#### Performance Issues

**Problem:** Slow upload/download speeds
**Solutions:**
1. Enable CDN delivery
2. Optimize file sizes
3. Use appropriate image formats
4. Implement progressive loading

### Debug Mode

Enable debug logging:
```env
CLOUDINARY_LOG_LEVEL=debug
DEBUG=cloudinary*
```

### Health Checks

```javascript
// Health check endpoint
app.get('/api/files/health', async (req, res) => {
  try {
    const usage = await cloudinaryService.getUsageStats();
    res.json({
      status: 'healthy',
      cloudinary: 'connected',
      usage: usage.stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

## 📚 Best Practices

### Security

1. **Always validate files server-side**
2. **Use signed URLs for sensitive files**
3. **Implement rate limiting**
4. **Scan files for viruses**
5. **Use HTTPS in production**

### Performance

1. **Optimize image sizes and formats**
2. **Use lazy loading for file galleries**
3. **Implement caching strategies**
4. **Use CDN for file delivery**
5. **Compress files before upload**

### User Experience

1. **Show upload progress**
2. **Provide clear error messages**
3. **Support drag-and-drop**
4. **Enable file previews**
5. **Implement retry mechanisms**

### Maintenance

1. **Monitor storage usage**
2. **Set up automated backups**
3. **Regular security audits**
4. **Update dependencies regularly**
5. **Monitor error rates**

---

For additional support, refer to the [Cloudinary Documentation](https://cloudinary.com/documentation) or contact the development team.
