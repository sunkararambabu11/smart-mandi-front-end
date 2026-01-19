import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';

/**
 * Error Interceptor
 * =================
 * Global HTTP error handler.
 * Handles authentication errors, network errors, and server errors.
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      switch (error.status) {
        case 0:
          // Network error
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
          break;

        case 400:
          // Bad request
          errorMessage = error.error?.message || 'Invalid request. Please check your input.';
          break;

        case 401:
          // Unauthorized - token expired or invalid
          errorMessage = 'Your session has expired. Please login again.';
          authService.logout();
          break;

        case 403:
          // Forbidden
          errorMessage = 'You do not have permission to perform this action.';
          router.navigate(['/error/403']);
          break;

        case 404:
          // Not found
          errorMessage = error.error?.message || 'The requested resource was not found.';
          break;

        case 422:
          // Validation error
          errorMessage = error.error?.message || 'Validation failed. Please check your input.';
          break;

        case 429:
          // Rate limited
          errorMessage = 'Too many requests. Please try again later.';
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors
          errorMessage = 'Server error. Please try again later.';
          router.navigate(['/error/500']);
          break;

        default:
          errorMessage = error.error?.message || 'Something went wrong. Please try again.';
      }

      // Show error notification (skip for 401 as logout handles it)
      if (error.status !== 401) {
        notificationService.error(errorMessage);
      }

      return throwError(() => new Error(errorMessage));
    })
  );
};
