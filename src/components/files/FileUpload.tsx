// Enhanced File Upload Component for LegalPro v1.0.1 - Comprehensive File Management
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  File,
  Image,
  FileText,
  X,
  Check,
  AlertTriangle,
  Download,
  Eye,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { clsx } from 'clsx';
import Button from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { showToast } from '../../services/toastService';

// File upload interfaces
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadProgress?: number;
  status: 'uploading' | 'completed' | 'error' | 'pending';
  error?: string;
  preview?: string;
}

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  onFilesChange?: (files: UploadedFile[]) => void;
  onUpload?: (files: File[]) => Promise<UploadedFile[]>;
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  allowedTypes?: string[];
  dragAndDrop?: boolean;
  existingFiles?: UploadedFile[];
}

// File type configurations
const FILE_TYPE_CONFIGS = {
  'application/pdf': {
    icon: FileText,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'PDF'
  },
  'application/msword': {
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'DOC'
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'DOCX'
  },
  'image/jpeg': {
    icon: Image,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'JPG'
  },
  'image/png': {
    icon: Image,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'PNG'
  },
  'image/gif': {
    icon: Image,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'GIF'
  },
  default: {
    icon: File,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    label: 'FILE'
  }
};

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileTypeConfig = (type: string) => {
  return FILE_TYPE_CONFIGS[type as keyof typeof FILE_TYPE_CONFIGS] || FILE_TYPE_CONFIGS.default;
};

const generateFileId = (): string => {
  return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Enhanced File Upload Component
 */
export const FileUpload: React.FC<FileUploadProps> = ({
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif',
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 10,
  onFilesChange,
  onUpload,
  className,
  disabled = false,
  showPreview = true,
  allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif'],
  dragAndDrop = true,
  existingFiles = []
}) => {
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update files when existingFiles prop changes
  useEffect(() => {
    setFiles(existingFiles);
  }, [existingFiles]);

  // Notify parent component of file changes
  useEffect(() => {
    onFilesChange?.(files);
  }, [files, onFilesChange]);

  /**
   * Validate file before upload
   */
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size must be less than ${formatFileSize(maxSize)}`;
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed`;
    }

    // Check total file count
    if (files.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }

    return null;
  }, [maxSize, allowedTypes, files.length, maxFiles]);

  /**
   * Create file preview URL
   */
  const createPreview = useCallback((file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  }, []);

  /**
   * Process selected files
   */
  const processFiles = useCallback(async (fileList: FileList) => {
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const validationError = validateFile(file);

      if (validationError) {
        showToast.error(validationError, {
          title: 'File Validation Error'
        });
        continue;
      }

      const preview = showPreview ? await createPreview(file) : undefined;

      const uploadedFile: UploadedFile = {
        id: generateFileId(),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
        uploadProgress: 0,
        preview
      };

      newFiles.push(uploadedFile);
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);

      // Auto-upload if onUpload is provided
      if (onUpload) {
        await handleUpload(newFiles, Array.from(fileList));
      }
    }
  }, [validateFile, createPreview, showPreview, onUpload]);

  /**
   * Handle file upload
   */
  const handleUpload = useCallback(async (filesToUpload: UploadedFile[], originalFiles: File[]) => {
    setIsUploading(true);

    try {
      // Update status to uploading
      setFiles(prev => prev.map(file =>
        filesToUpload.find(f => f.id === file.id)
          ? { ...file, status: 'uploading' as const, uploadProgress: 0 }
          : file
      ));

      // Simulate upload progress (replace with actual upload logic)
      for (const file of filesToUpload) {
        // Update progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setFiles(prev => prev.map(f =>
            f.id === file.id
              ? { ...f, uploadProgress: progress }
              : f
          ));
        }
      }

      // Call actual upload function
      if (onUpload) {
        const uploadedFiles = await onUpload(originalFiles);

        setFiles(prev => prev.map(file => {
          const uploaded = uploadedFiles.find(u => u.name === file.name);
          return uploaded ? { ...file, ...uploaded, status: 'completed' as const } : file;
        }));

        showToast.success(`${uploadedFiles.length} file(s) uploaded successfully`, {
          title: 'Upload Complete'
        });
      } else {
        // Mark as completed if no upload function
        setFiles(prev => prev.map(file =>
          filesToUpload.find(f => f.id === file.id)
            ? { ...file, status: 'completed' as const, uploadProgress: 100 }
            : file
        ));
      }
    } catch (error) {
      console.error('Upload error:', error);

      // Mark files as error
      setFiles(prev => prev.map(file =>
        filesToUpload.find(f => f.id === file.id)
          ? { ...file, status: 'error' as const, error: error instanceof Error ? error.message : 'Upload failed' }
          : file
      ));

      showToast.error('Upload failed. Please try again.', {
        title: 'Upload Error',
        actions: [
          {
            label: 'Retry',
            action: () => handleUpload(filesToUpload, originalFiles),
            icon: RotateCcw
          }
        ]
      });
    } finally {
      setIsUploading(false);
    }
  }, [onUpload]);

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList && fileList.length > 0) {
      processFiles(fileList);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  /**
   * Handle drag and drop events
   */
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled && dragAndDrop) {
      setIsDragOver(true);
    }
  }, [disabled, dragAndDrop]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    if (disabled || !dragAndDrop) return;

    const fileList = event.dataTransfer.files;
    if (fileList && fileList.length > 0) {
      processFiles(fileList);
    }
  }, [disabled, dragAndDrop, processFiles]);

  /**
   * Remove file
   */
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);

  /**
   * Retry file upload
   */
  const retryUpload = useCallback(async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file || !onUpload) return;

    // Note: In a real implementation, you'd need to store the original File object
    // For now, we'll just reset the status
    setFiles(prev => prev.map(f =>
      f.id === fileId
        ? { ...f, status: 'pending' as const, error: undefined }
        : f
    ));
  }, [files, onUpload]);

  /**
   * Open file selector
   */
  const openFileSelector = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className={clsx('space-y-4', className)}>
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
        aria-label="Select files to upload"
      />

      {/* Drop Zone */}
      {dragAndDrop && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileSelector}
          className={clsx(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            {
              'border-blue-300 bg-blue-50': isDragOver && !disabled,
              'border-gray-300 hover:border-gray-400': !isDragOver && !disabled,
              'border-gray-200 bg-gray-50 cursor-not-allowed': disabled
            }
          )}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Click to select files or drag and drop files here"
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              openFileSelector();
            }
          }}
        >
          <Upload className={clsx('mx-auto h-12 w-12 mb-4', {
            'text-blue-500': isDragOver && !disabled,
            'text-gray-400': !isDragOver || disabled
          })} />

          <p className={clsx('text-lg font-medium mb-2', {
            'text-blue-600': isDragOver && !disabled,
            'text-gray-600': !isDragOver && !disabled,
            'text-gray-400': disabled
          })}>
            {isDragOver ? 'Drop files here' : 'Upload files'}
          </p>

          <p className="text-sm text-gray-500 mb-4">
            Drag and drop files here, or click to select files
          </p>

          <p className="text-xs text-gray-400">
            Supported formats: {accept} • Max size: {formatFileSize(maxSize)} • Max files: {maxFiles}
          </p>
        </div>
      )}

      {/* Upload Button (if no drag and drop) */}
      {!dragAndDrop && (
        <Button
          onClick={openFileSelector}
          disabled={disabled || isUploading}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          Select Files
        </Button>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            Files ({files.length}/{maxFiles})
          </h4>

          <div className="space-y-2">
            {files.map((file) => (
              <FileItem
                key={file.id}
                file={file}
                onRemove={removeFile}
                onRetry={retryUpload}
                showPreview={showPreview}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <LoadingSpinner size="sm" />
          <span>Uploading files...</span>
        </div>
      )}
    </div>
  );
};

/**
 * Individual File Item Component
 */
interface FileItemProps {
  file: UploadedFile;
  onRemove: (fileId: string) => void;
  onRetry: (fileId: string) => void;
  showPreview: boolean;
}

const FileItem: React.FC<FileItemProps> = ({ file, onRemove, onRetry, showPreview }) => {
  const config = getFileTypeConfig(file.type);
  const Icon = config.icon;

  const getStatusIcon = () => {
    switch (file.status) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'uploading':
        return <LoadingSpinner size="sm" />;
      default:
        return <Icon className={clsx('w-4 h-4', config.color)} />;
    }
  };

  const getStatusColor = () => {
    switch (file.status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'uploading':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className={clsx('border rounded-lg p-3', getStatusColor())}>
      <div className="flex items-center space-x-3">
        {/* File Preview or Icon */}
        <div className="flex-shrink-0">
          {showPreview && file.preview ? (
            <img
              src={file.preview}
              alt={file.name}
              className="w-10 h-10 object-cover rounded"
            />
          ) : (
            <div className={clsx('w-10 h-10 rounded flex items-center justify-center', config.bgColor)}>
              <Icon className={clsx('w-5 h-5', config.color)} />
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.name}
            </p>
            <span className={clsx('px-2 py-1 text-xs font-medium rounded', config.bgColor, config.color)}>
              {config.label}
            </span>
          </div>

          <div className="flex items-center space-x-2 mt-1">
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)}
            </p>

            {file.status === 'uploading' && typeof file.uploadProgress === 'number' && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <p className="text-xs text-blue-600">
                  {file.uploadProgress}% uploaded
                </p>
              </>
            )}

            {file.status === 'error' && file.error && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <p className="text-xs text-red-600">
                  {file.error}
                </p>
              </>
            )}
          </div>

          {/* Progress Bar */}
          {file.status === 'uploading' && typeof file.uploadProgress === 'number' && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                style={{ width: `${file.uploadProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Status Icon */}
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center space-x-1">
          {/* View/Download Button */}
          {file.status === 'completed' && file.url && (
            <button
              onClick={() => window.open(file.url, '_blank')}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={`View ${file.name}`}
            >
              <Eye className="w-4 h-4" />
            </button>
          )}

          {/* Retry Button */}
          {file.status === 'error' && (
            <button
              onClick={() => onRetry(file.id)}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              aria-label={`Retry upload for ${file.name}`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Remove Button */}
          <button
            onClick={() => onRemove(file.id)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            aria-label={`Remove ${file.name}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;