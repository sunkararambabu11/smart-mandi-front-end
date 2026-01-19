import { inject } from '@angular/core';
import {
  Router,
  CanActivateFn,
  CanActivateChildFn,
  CanMatchFn,
  UrlTree,
} from '@angular/router';
import { AuthService } from '@core/services/auth.service';

/**
 * Auth Guard
 * ==========
 * Protects routes that require authentication using Angular signals.
 * Redirects unauthenticated users to login page with return URL.
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'dashboard',
 *   canActivate: [authGuard],
 *   loadComponent: () => import('./dashboard.component')
 * }
 * ```
 */
export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check authentication using signal
  if (authService.isAuthenticated()) {
    return true;
  }

  // Store intended URL for redirect after login
  const returnUrl = state.url;

  // Create URL tree for navigation (preferred over router.navigate in guards)
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl },
  });
};

/**
 * Auth Guard for Child Routes
 * ===========================
 * Protects all child routes under a parent route.
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'admin',
 *   canActivateChild: [authGuardChild],
 *   children: [...]
 * }
 * ```
 */
export const authGuardChild: CanActivateChildFn = (childRoute, state) => {
  // Reuse the same logic as authGuard
  return authGuard(childRoute, state);
};

/**
 * Auth Guard for Route Matching
 * =============================
 * Prevents lazy loading of modules if not authenticated.
 * More efficient as it prevents unnecessary code loading.
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'admin',
 *   canMatch: [authGuardMatch],
 *   loadChildren: () => import('./admin/admin.routes')
 * }
 * ```
 */
export const authGuardMatch: CanMatchFn = (): boolean => {
  const authService = inject(AuthService);

  // Simply return boolean - no navigation in canMatch
  return authService.isAuthenticated();
};