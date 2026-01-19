/**
 * Auth Interceptor
 * ================
 * Functional interceptor for Angular that:
 * - Attaches JWT Bearer token to outgoing requests
 * - Handles 401 errors with automatic token refresh
 * - Queues requests during token refresh using signals
 * - Skips authentication for public endpoints
 * 
 * Refactored to use signals instead of BehaviorSubject for
 * better performance and simpler state management.
 */

import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpEvent,
} from '@angular/common/http';
import { inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError, from, firstValueFrom } from 'rxjs';
import { catchError, switchMap, finalize } from 'rxjs/operators';

import { AuthService } from '@core/services/auth.service';
import { environment } from '@environments/environment';

// ============================================
// Token Refresh State (Module-level Signals)
// ============================================

/** Flag to track if token refresh is in progress */
const isRefreshing = signal(false);

/** Promise that resolves when refresh completes */
let refreshPromise: Promise<string | null> | null = null;

/**
 * Public endpoints that don't require authentication
 */
const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/request-otp',
  '/auth/verify-otp',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/refresh',
  '/public/',
] as const;

/**
 * Check if URL is a public endpoint
 */
function isPublicEndpoint(url: string): boolean {
  return PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

/**
 * Add Bearer token to request headers
 * Note: For FormData requests, we don't set Content-Type to let the browser
 * set it automatically with the proper boundary.
 */
function addTokenToRequest(
  req: HttpRequest<unknown>,
  token: string
): HttpRequest<unknown> {
  const isFormData = req.body instanceof FormData;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  // Only set Content-Type if it's not FormData and not already set
  if (!isFormData && !req.headers.has('Content-Type')) {
    headers['Content-Type'] = 'application/json';
  }

  return req.clone({
    setHeaders: headers,
  });
}

/**
 * Wait for ongoing token refresh to complete
 */
async function waitForTokenRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }
  return null;
}

/**
 * Auth Interceptor
 * ================
 * Functional interceptor that uses signals for state management
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip auth for external URLs
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  // Skip auth for public endpoints
  if (isPublicEndpoint(req.url)) {
    return next(req);
  }

  // Get current access token
  const token = authService.getAccessToken();

  // If no token, proceed without auth header
  if (!token) {
    return next(req);
  }

  // Clone request with auth header
  const authReq = addTokenToRequest(req, token);

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized
      if (error.status === 401 && !isPublicEndpoint(req.url)) {
        return handleUnauthorizedError(req, next, authService, router);
      }

      return throwError(() => error);
    })
  );
};

/**
 * Handle 401 Unauthorized errors
 * Uses signals for synchronization instead of BehaviorSubject
 */
function handleUnauthorizedError(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
): Observable<HttpEvent<unknown>> {
  // If already refreshing, wait for the current refresh to complete
  if (isRefreshing()) {
    return from(waitForTokenRefresh()).pipe(
      switchMap((newToken) => {
        if (newToken) {
          return next(addTokenToRequest(req, newToken));
        }
        return throwError(() => new Error('Token refresh failed'));
      })
    );
  }

  // Start refresh process
  isRefreshing.set(true);

  const refreshToken = authService.getRefreshToken();

  // No refresh token available, logout
  if (!refreshToken) {
    isRefreshing.set(false);
    authService.logout();
    return throwError(() => new Error('Session expired'));
  }

  // Create a promise for the refresh operation
  refreshPromise = new Promise<string | null>((resolve) => {
    authService.refreshToken().subscribe({
      next: (response) => {
        resolve(response.accessToken);
      },
      error: () => {
        resolve(null);
      },
    });
  });

  // Attempt to refresh token
  return authService.refreshToken().pipe(
    switchMap((response) => {
      // Retry original request with new token
      return next(addTokenToRequest(req, response.accessToken));
    }),
    catchError((refreshError) => {
      // Refresh failed, logout user
      authService.logout();
      router.navigate(['/auth/login'], {
        queryParams: { sessionExpired: true },
      });

      return throwError(() => refreshError);
    }),
    finalize(() => {
      isRefreshing.set(false);
      refreshPromise = null;
    })
  );
}
