# 🍞 Toast Notification Implementation Guide - LegalPro v1.0.1

## 📋 Overview

This guide provides comprehensive documentation for implementing and using the toast notification system in LegalPro. The system provides real-time user feedback with WCAG 2.1 AA accessibility compliance and responsive design.

## 🚀 Quick Start

### Basic Usage

```typescript
import { showToast } from '../services/toastService';

// Success notification
showToast.success('Case created successfully!');

// Error notification with retry action
showToast.error('Failed to save case', {
  title: 'Save Failed',
  actions: [
    {
      label: 'Retry',
      action: () => handleRetry(),
      icon: RotateCcw
    }
  ]
});

// Loading notification with progress
const loadingId = showToast.loading('Uploading documents...', {
  progress: 0
});

// Info notification
showToast.info('Your session will expire in 5 minutes');

// Warning notification
showToast.warning('File size exceeds recommended limit');
```

### Promise-Based Toasts

```typescript
import { showToast } from '../services/toastService';

// Automatic loading, success, and error handling
showToast.promise(
  apiService.createCase(caseData),
  {
    loading: 'Creating case...',
    success: 'Case created successfully!',
    error: 'Failed to create case'
  }
);

// With dynamic messages
showToast.promise(
  apiService.uploadFile(file),
  {
    loading: 'Uploading file...',
    success: (result) => `File ${result.filename} uploaded successfully!`,
    error: (error) => `Upload failed: ${error.message}`
  }
);
```

## 🎨 Toast Types and Styling

### Success Toasts 🟢
- **Purpose**: Confirm successful operations
- **Auto-dismiss**: 4 seconds
- **Color**: Green gradient (#10B981 to #059669)
- **Icon**: CheckCircle

```typescript
showToast.success('Profile updated successfully!', {
  title: 'Success',
  actions: [
    {
      label: 'View Profile',
      action: () => navigate('/profile'),
      icon: User
    }
  ]
});
```

### Error Toasts 🔴
- **Purpose**: Alert users to failures
- **Auto-dismiss**: 10 seconds (or manual only)
- **Color**: Red gradient (#EF4444 to #DC2626)
- **Icon**: AlertCircle

```typescript
showToast.error('Network connection failed', {
  title: 'Connection Error',
  persistent: true,
  actions: [
    {
      label: 'Retry',
      action: () => retryConnection(),
      icon: RotateCcw
    },
    {
      label: 'Go Offline',
      action: () => enableOfflineMode(),
      variant: 'secondary'
    }
  ]
});
```

### Warning Toasts 🟡
- **Purpose**: Important information requiring attention
- **Auto-dismiss**: 7 seconds
- **Color**: Amber gradient (#F59E0B to #D97706)
- **Icon**: AlertTriangle

```typescript
showToast.warning('Password will expire in 3 days', {
  title: 'Security Warning',
  actions: [
    {
      label: 'Change Password',
      action: () => navigate('/change-password'),
      icon: Key
    }
  ]
});
```

### Info Toasts 🔵
- **Purpose**: Helpful information and updates
- **Auto-dismiss**: 5 seconds
- **Color**: Blue gradient (#3B82F6 to #2563EB)
- **Icon**: Info

```typescript
showToast.info('New feature: Dark mode is now available!', {
  title: 'Feature Update',
  actions: [
    {
      label: 'Try It',
      action: () => toggleDarkMode(),
      icon: Moon
    }
  ]
});
```

### Loading Toasts ⏳
- **Purpose**: Indicate ongoing processes
- **Auto-dismiss**: Manual or completion
- **Color**: Navy gradient (#1E3A8A to #1E40AF)
- **Icon**: Loader2 (spinning)

```typescript
const loadingId = showToast.loading('Processing payment...', {
  title: 'Payment Processing',
  progress: 0,
  dismissible: false
});

// Update progress
updateProgress(loadingId, 50);

// Complete loading
toastService.dismiss(loadingId);
showToast.success('Payment completed successfully!');
```

## 🎛️ Advanced Configuration

### Custom Actions

```typescript
const actions = [
  {
    label: 'Undo',
    action: () => undoAction(),
    icon: Undo,
    variant: 'secondary'
  },
  {
    label: 'Delete Permanently',
    action: () => permanentDelete(),
    icon: Trash,
    variant: 'danger'
  }
];

showToast.warning('Item moved to trash', {
  title: 'Item Deleted',
  actions,
  duration: 10000 // 10 seconds to allow undo
});
```

### Persistent Toasts

```typescript
// Toast that doesn't auto-dismiss
showToast.error('Critical system error', {
  title: 'System Error',
  persistent: true,
  dismissible: true,
  actions: [
    {
      label: 'Contact Support',
      action: () => openSupportChat(),
      icon: MessageCircle
    }
  ]
});
```

### Progress Tracking

```typescript
const uploadToast = showToast.loading('Uploading files...', {
  progress: 0
});

// Simulate upload progress
const interval = setInterval(() => {
  progress += 10;
  updateProgress(uploadToast, progress);
  
  if (progress >= 100) {
    clearInterval(interval);
    toastService.dismiss(uploadToast);
    showToast.success('All files uploaded successfully!');
  }
}, 500);
```

## 📱 Responsive Design

### Mobile Optimizations
- **Width**: 90% of screen width (max 400px)
- **Position**: Top-center for better thumb reach
- **Touch Targets**: Minimum 44px for all interactive elements
- **Swipe Gestures**: Swipe right to dismiss

### Tablet Adaptations
- **Width**: Fixed 400px width
- **Position**: Top-right with adjusted margins
- **Touch Support**: Both tap and swipe interactions

### Desktop Features
- **Hover Effects**: Pause auto-dismiss on hover
- **Mouse Interactions**: Click to dismiss
- **Keyboard Navigation**: Full keyboard support

## ♿ Accessibility Features

### WCAG 2.1 AA Compliance
- **Color Contrast**: 4.5:1+ ratio for all text
- **Screen Reader Support**: Proper ARIA attributes
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Proper focus indicators

### ARIA Implementation
```html
<div
  role="alert"
  aria-live="polite"
  aria-atomic="true"
  aria-describedby="toast-message"
  tabindex="0"
>
  <div id="toast-message">Toast content</div>
</div>
```

### Keyboard Support
- **Tab**: Navigate between toasts and actions
- **Enter/Space**: Activate action buttons
- **Escape**: Dismiss focused toast
- **Arrow Keys**: Navigate toast actions

## 🧪 Testing

### Accessibility Testing
```typescript
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

test('toast should be accessible', async () => {
  const { container } = render(<Toast {...props} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Responsive Testing
```typescript
import { mobileTestHelpers } from '../utils/testHelpers';

test('toast should be mobile-friendly', () => {
  mobileTestHelpers.setMobileViewport();
  render(<Toast {...props} />);
  
  const dismissButton = screen.getByRole('button');
  expect(mobileTestHelpers.checkTouchTargetSize(dismissButton)).toBe(true);
});
```

## 🔧 Integration Examples

### Authentication Flow
```typescript
// Login success
showToast.success('Welcome back!', {
  title: 'Login Successful',
  actions: [
    {
      label: 'Go to Dashboard',
      action: () => navigate('/dashboard'),
      icon: Home
    }
  ]
});

// Login error
showToast.error('Invalid credentials', {
  title: 'Login Failed',
  actions: [
    {
      label: 'Forgot Password?',
      action: () => navigate('/forgot-password'),
      icon: Key
    }
  ]
});
```

### Form Validation
```typescript
// Validation error
showToast.error('Please fill in all required fields', {
  title: 'Validation Error',
  actions: [
    {
      label: 'Review Form',
      action: () => scrollToFirstError(),
      icon: AlertCircle
    }
  ]
});
```

### File Operations
```typescript
// File upload
const uploadPromise = uploadFile(file);

showToast.promise(uploadPromise, {
  loading: `Uploading ${file.name}...`,
  success: 'File uploaded successfully!',
  error: 'Upload failed. Please try again.'
});
```

## 🎯 Best Practices

### Do's ✅
- Use appropriate toast types for different scenarios
- Provide clear, actionable messages
- Include retry actions for recoverable errors
- Test with screen readers and keyboard navigation
- Respect user motion preferences

### Don'ts ❌
- Don't use toasts for critical information that must be seen
- Don't stack too many toasts (max 5 visible)
- Don't use toasts for complex forms or lengthy content
- Don't auto-dismiss error toasts too quickly
- Don't forget to test accessibility

### Message Guidelines
- **Be Specific**: "Case #123 created" vs "Success"
- **Be Actionable**: Include next steps when appropriate
- **Be Concise**: Keep messages under 100 characters
- **Be Helpful**: Provide context and solutions

## 🔍 Troubleshooting

### Common Issues

**Toast not appearing:**
- Check if ToastContainer is rendered in Layout
- Verify toast service is imported correctly
- Ensure proper z-index configuration

**Accessibility violations:**
- Verify ARIA attributes are present
- Check color contrast ratios
- Test keyboard navigation
- Validate screen reader announcements

**Mobile display issues:**
- Check viewport meta tag
- Verify touch target sizes
- Test swipe gestures
- Validate responsive positioning

### Performance Optimization
- Limit concurrent toasts to 5
- Use toast.dismiss() to clean up loading toasts
- Avoid frequent toast updates
- Test animation performance on low-end devices

## 📚 API Reference

### showToast Methods
- `showToast.success(message, options?)`
- `showToast.error(message, options?)`
- `showToast.warning(message, options?)`
- `showToast.info(message, options?)`
- `showToast.loading(message, options?)`
- `showToast.promise(promise, messages, options?)`

### ToastService Methods
- `toastService.dismiss(id)`
- `toastService.dismissAll()`
- `toastService.updateProgress(id, progress)`

### Configuration Options
```typescript
interface ToastOptions {
  title?: string;
  actions?: ToastAction[];
  progress?: number;
  dismissible?: boolean;
  persistent?: boolean;
  duration?: number;
  ariaLabel?: string;
}
```

---

## 🎉 Conclusion

The LegalPro toast notification system provides a comprehensive, accessible, and user-friendly way to deliver real-time feedback. Follow this guide to implement consistent and effective notifications throughout your application.

For additional support or questions, refer to the test files and component documentation.

## 📖 Real-World Usage Examples

### Case Management Integration
```typescript
// Creating a new case
const handleCreateCase = async (caseData) => {
  try {
    const result = await showToast.promise(
      apiService.createCase(caseData),
      {
        loading: 'Creating new case...',
        success: (data) => `Case #${data.caseNumber} created successfully!`,
        error: 'Failed to create case. Please try again.'
      }
    );

    // Additional success actions
    showToast.info('You can now add documents and set reminders.', {
      title: 'Next Steps',
      actions: [
        {
          label: 'Add Documents',
          action: () => navigate(`/cases/${result.id}/documents`),
          icon: Upload
        }
      ]
    });
  } catch (error) {
    // Error is already handled by promise toast
  }
};

// Updating case status
const handleStatusUpdate = async (caseId, newStatus) => {
  const loadingId = showToast.loading('Updating case status...');

  try {
    await apiService.updateCaseStatus(caseId, newStatus);
    toastService.dismiss(loadingId);

    showToast.success(`Case status updated to ${newStatus}`, {
      title: 'Status Updated',
      actions: [
        {
          label: 'View Case',
          action: () => navigate(`/cases/${caseId}`),
          icon: Eye
        },
        {
          label: 'Notify Client',
          action: () => sendClientNotification(caseId),
          icon: Mail
        }
      ]
    });
  } catch (error) {
    toastService.dismiss(loadingId);
    showToast.error('Failed to update case status', {
      title: 'Update Failed',
      actions: [
        {
          label: 'Retry',
          action: () => handleStatusUpdate(caseId, newStatus),
          icon: RotateCcw
        }
      ]
    });
  }
};
```

### Appointment Booking Integration
```typescript
// Booking appointment with conflict detection
const handleBookAppointment = async (appointmentData) => {
  const loadingId = showToast.loading('Checking availability...');

  try {
    // Check for conflicts first
    const conflicts = await apiService.checkAppointmentConflicts(appointmentData);

    if (conflicts.length > 0) {
      toastService.dismiss(loadingId);
      showToast.warning('Time slot conflict detected', {
        title: 'Scheduling Conflict',
        actions: [
          {
            label: 'View Alternatives',
            action: () => showAlternativeSlots(conflicts),
            icon: Calendar
          },
          {
            label: 'Force Book',
            action: () => forceBookAppointment(appointmentData),
            variant: 'danger',
            icon: AlertTriangle
          }
        ]
      });
      return;
    }

    // Proceed with booking
    const result = await apiService.bookAppointment(appointmentData);
    toastService.dismiss(loadingId);

    showToast.success('Appointment booked successfully!', {
      title: 'Booking Confirmed',
      actions: [
        {
          label: 'Add to Calendar',
          action: () => addToCalendar(result),
          icon: Calendar
        },
        {
          label: 'Send Reminder',
          action: () => scheduleReminder(result.id),
          icon: Bell
        }
      ]
    });
  } catch (error) {
    toastService.dismiss(loadingId);
    showToast.error('Booking failed. Please try again.', {
      title: 'Booking Error',
      actions: [
        {
          label: 'Retry',
          action: () => handleBookAppointment(appointmentData),
          icon: RotateCcw
        },
        {
          label: 'Contact Support',
          action: () => openSupportChat(),
          icon: MessageCircle
        }
      ]
    });
  }
};
```

### File Upload with Progress
```typescript
// Document upload with progress tracking
const handleDocumentUpload = async (files) => {
  const uploadPromises = files.map(async (file, index) => {
    const loadingId = showToast.loading(`Uploading ${file.name}...`, {
      progress: 0,
      dismissible: false
    });

    try {
      const result = await apiService.uploadDocument(file, {
        onProgress: (progress) => {
          // Update progress in real-time
          toastService.updateProgress(loadingId, progress);
        }
      });

      toastService.dismiss(loadingId);
      showToast.success(`${file.name} uploaded successfully!`, {
        actions: [
          {
            label: 'View Document',
            action: () => viewDocument(result.id),
            icon: Eye
          }
        ]
      });

      return result;
    } catch (error) {
      toastService.dismiss(loadingId);
      showToast.error(`Failed to upload ${file.name}`, {
        title: 'Upload Failed',
        actions: [
          {
            label: 'Retry',
            action: () => handleDocumentUpload([file]),
            icon: RotateCcw
          }
        ]
      });
      throw error;
    }
  });

  // Show summary when all uploads complete
  try {
    const results = await Promise.allSettled(uploadPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    if (failed === 0) {
      showToast.success(`All ${successful} documents uploaded successfully!`, {
        title: 'Upload Complete'
      });
    } else {
      showToast.warning(`${successful} uploaded, ${failed} failed`, {
        title: 'Upload Summary',
        actions: [
          {
            label: 'Retry Failed',
            action: () => retryFailedUploads(),
            icon: RotateCcw
          }
        ]
      });
    }
  } catch (error) {
    showToast.error('Upload process encountered errors', {
      title: 'Upload Error'
    });
  }
};
```

### Payment Processing Integration
```typescript
// M-Pesa payment with status tracking
const handlePayment = async (paymentData) => {
  const loadingId = showToast.loading('Initiating payment...', {
    title: 'Payment Processing',
    dismissible: false
  });

  try {
    // Initiate payment
    const paymentResult = await apiService.initiatePayment(paymentData);

    toastService.dismiss(loadingId);
    showToast.info('Payment request sent to your phone', {
      title: 'Payment Initiated',
      actions: [
        {
          label: 'Check Status',
          action: () => checkPaymentStatus(paymentResult.id),
          icon: CreditCard
        }
      ]
    });

    // Poll for payment status
    const statusCheckId = showToast.loading('Waiting for payment confirmation...', {
      title: 'Payment Pending',
      dismissible: true
    });

    const finalStatus = await pollPaymentStatus(paymentResult.id);
    toastService.dismiss(statusCheckId);

    if (finalStatus.status === 'completed') {
      showToast.success('Payment completed successfully!', {
        title: 'Payment Successful',
        actions: [
          {
            label: 'Download Receipt',
            action: () => downloadReceipt(finalStatus.receiptId),
            icon: Download
          },
          {
            label: 'View Transaction',
            action: () => viewTransaction(finalStatus.id),
            icon: Eye
          }
        ]
      });
    } else {
      showToast.error('Payment was not completed', {
        title: 'Payment Failed',
        actions: [
          {
            label: 'Retry Payment',
            action: () => handlePayment(paymentData),
            icon: RotateCcw
          },
          {
            label: 'Use Different Method',
            action: () => showPaymentMethods(),
            icon: CreditCard
          }
        ]
      });
    }
  } catch (error) {
    toastService.dismiss(loadingId);
    showToast.error('Payment processing failed', {
      title: 'Payment Error',
      actions: [
        {
          label: 'Retry',
          action: () => handlePayment(paymentData),
          icon: RotateCcw
        },
        {
          label: 'Contact Support',
          action: () => openSupportChat(),
          icon: MessageCircle
        }
      ]
    });
  }
};
```

---
*Toast Implementation Guide - LegalPro v1.0.1*
*WCAG 2.1 AA Compliant - December 2024*
