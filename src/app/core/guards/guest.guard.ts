import { inject } from '@angular/core';
import { Router, CanActivateFn, CanMatchFn, UrlTree } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

/**
 * Guest Guard
 * ===========
 * Protects routes that should only be accessible to unauthenticated users.
 * Redirects authenticated users to appropriate dashboard based on role.
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'auth',
 *   canActivate: [guestGuard],
 *   loadChildren: () => import('./auth/auth.routes')
 * }
 * ```
 */
export const guestGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If not authenticated, allow access to guest routes
  if (!authService.isAuthenticated()) {
    return true;
  }

  // User is already logged in, redirect based on role
  const redirectUrl = getRedirectUrlForRole(authService);
  return router.createUrlTree([redirectUrl]);
};

/**
 * Guest Guard for Route Matching
 * ==============================
 * Prevents loading auth modules if already authenticated.
 */
export const guestGuardMatch: CanMatchFn = (): boolean => {
  const authService = inject(AuthService);
  return !authService.isAuthenticated();
};

/**
 * Get appropriate redirect URL based on user role
 */
function getRedirectUrlForRole(authService: AuthService): string {
  if (authService.isAdmin()) {
    return '/admin';
  }

  if (authService.isFarmer()) {
    return '/dashboard';
  }

  if (authService.isBuyer()) {
    return '/marketplace';
  }

  // Default redirect
  return '/dashboard';
}
