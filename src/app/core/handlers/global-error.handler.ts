import { ErrorHandler, Injectable, inject, isDevMode } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '@core/services/notification.service';
import { environment } from '@environments/environment';

/**
 * Error Information Interface
 */
interface ErrorInfo {
  message: string;
  stack?: string;
  source?: string;
  timestamp: Date;
  userAgent?: string;
  url?: string;
}

/**
 * Global Error Handler
 * ====================
 * Catches all unhandled errors in the application.
 * Logs errors, shows user-friendly notifications, and optionally
 * reports to external error tracking service.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly notificationService = inject(NotificationService);

  /**
   * Handle all uncaught errors
   */
  handleError(error: Error | HttpErrorResponse): void {
    // Extract error information
    const errorInfo = this.extractErrorInfo(error);

    // Log to console in development
    if (isDevMode() || environment.features.debugMode) {
      this.logErrorToConsole(error, errorInfo);
    }

    // Show user-friendly notification
    this.showUserNotification(error, errorInfo);

    // Report to external service in production
    if (environment.production && environment.logging.enableRemote) {
      this.reportErrorToService(errorInfo);
    }
  }

  /**
   * Extract structured error information
   */
  private extractErrorInfo(error: Error | HttpErrorResponse): ErrorInfo {
    const errorInfo: ErrorInfo = {
      message: 'An unexpected error occurred',
      timestamp: new Date(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    if (error instanceof HttpErrorResponse) {
      // HTTP Error
      errorInfo.message = error.message || `HTTP Error: ${error.status}`;
      errorInfo.source = 'HTTP';
    } else if (error instanceof Error) {
      // JavaScript Error
      errorInfo.message = error.message;
      errorInfo.stack = error.stack;
      errorInfo.source = error.name || 'Error';
    } else if (typeof error === 'string') {
      // String error
      errorInfo.message = error;
      errorInfo.source = 'String';
    } else {
      // Unknown error type
      errorInfo.message = JSON.stringify(error);
      errorInfo.source = 'Unknown';
    }

    return errorInfo;
  }

  /**
   * Log error to console with formatting
   */
  private logErrorToConsole(
    error: Error | HttpErrorResponse,
    errorInfo: ErrorInfo
  ): void {
    console.group('%c🚨 Application Error', 'color: #ef4444; font-weight: bold;');
    console.error('Error:', error);
    console.log('Info:', errorInfo);
    console.log('Timestamp:', errorInfo.timestamp.toISOString());
    console.log('URL:', errorInfo.url);
    if (errorInfo.stack) {
      console.log('Stack:', errorInfo.stack);
    }
    console.groupEnd();
  }

  /**
   * Show user-friendly notification
   */
  private showUserNotification(
    error: Error | HttpErrorResponse,
    errorInfo: ErrorInfo
  ): void {
    // Don't show notification for HTTP errors (handled by interceptor)
    if (error instanceof HttpErrorResponse) {
      return;
    }

    // Determine user-friendly message
    let userMessage = 'Something went wrong. Please try again.';

    // Check for specific error types
    if (errorInfo.message.includes('ChunkLoadError')) {
      userMessage =
        'A new version is available. Please refresh the page.';
    } else if (errorInfo.message.includes('NetworkError')) {
      userMessage =
        'Network connection lost. Please check your internet connection.';
    } else if (errorInfo.message.includes('timeout')) {
      userMessage = 'The request timed out. Please try again.';
    }

    // Show notification
    this.notificationService.error(userMessage, 'Error');
  }

  /**
   * Report error to external error tracking service
   * (e.g., Sentry, LogRocket, etc.)
   */
  private reportErrorToService(errorInfo: ErrorInfo): void {
    // TODO: Implement error reporting to external service
    // Example: Sentry.captureException(error);

    // For now, we'll just log that we would report
    if (isDevMode()) {
      console.log('📤 Would report error to external service:', errorInfo);
    }

    // Example implementation:
    // try {
    //   fetch('/api/errors', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(errorInfo),
    //   });
    // } catch {
    //   // Silently fail - don't create error loop
    // }
  }
}



