import { inject } from '@angular/core';
import {
  Router,
  CanActivateFn,
  CanMatchFn,
  ActivatedRouteSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { UserRole } from '@domain/models/user.model';

/**
 * Role Guard
 * ==========
 * Protects routes based on user roles using Angular signals.
 * Configure required roles in route data.
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'admin',
 *   canActivate: [authGuard, roleGuard],
 *   data: { roles: [UserRole.ADMIN] },
 *   loadComponent: () => import('./admin.component')
 * }
 * ```
 */
export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Get required roles from route data
  const requiredRoles = route.data['roles'] as UserRole[] | undefined;

  // No role requirements specified, allow access
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // Check if user has any of the required roles using signal
  const currentUser = authService.currentUser();

  if (!currentUser) {
    // Not authenticated, redirect to login
    return router.createUrlTree(['/auth/login']);
  }

  if (requiredRoles.includes(currentUser.role)) {
    return true;
  }

  // User doesn't have required role, redirect to forbidden page
  return router.createUrlTree(['/error/403']);
};

/**
 * Role Guard for Route Matching
 * =============================
 * Prevents lazy loading if user doesn't have required role.
 */
export const roleGuardMatch: CanMatchFn = (route): boolean => {
  const authService = inject(AuthService);

  const requiredRoles = route.data?.['roles'] as UserRole[] | undefined;

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  return authService.hasAnyRole(requiredRoles);
};

// ============================================
// Role-Specific Guards
// ============================================

/**
 * Farmer Guard
 * ============
 * Only allows FARMER role access.
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'my-products',
 *   canActivate: [authGuard, farmerGuard],
 *   loadComponent: () => import('./products.component')
 * }
 * ```
 */
export const farmerGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Use computed signal for farmer check
  if (authService.isFarmer()) {
    return true;
  }

  // Admin can also access farmer routes
  if (authService.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/error/403']);
};

/**
 * Buyer Guard
 * ===========
 * Only allows BUYER role access.
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'my-orders',
 *   canActivate: [authGuard, buyerGuard],
 *   loadComponent: () => import('./orders.component')
 * }
 * ```
 */
export const buyerGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Use computed signal for buyer check
  if (authService.isBuyer()) {
    return true;
  }

  // Admin can also access buyer routes
  if (authService.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/error/403']);
};

/**
 * Admin Guard
 * ===========
 * Only allows ADMIN role access.
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'admin',
 *   canActivate: [authGuard, adminGuard],
 *   loadComponent: () => import('./admin.component')
 * }
 * ```
 */
export const adminGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Use computed signal for admin check
  if (authService.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/error/403']);
};

/**
 * Farmer or Buyer Guard
 * =====================
 * Allows both FARMER and BUYER roles (excludes admin-only areas).
 */
export const farmerOrBuyerGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isFarmer() || authService.isBuyer() || authService.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/error/403']);
};

/**
 * Create Role Guard Factory
 * =========================
 * Factory function to create custom role guards.
 *
 * Usage:
 * ```typescript
 * const customGuard = createRoleGuard([UserRole.FARMER, UserRole.ADMIN]);
 *
 * {
 *   path: 'products',
 *   canActivate: [authGuard, customGuard],
 *   loadComponent: () => import('./products.component')
 * }
 * ```
 */
export function createRoleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return (): boolean | UrlTree => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.hasAnyRole(allowedRoles)) {
      return true;
    }

    return router.createUrlTree(['/error/403']);
  };
}