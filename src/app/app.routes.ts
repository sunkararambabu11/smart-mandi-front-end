import { Routes } from '@angular/router';
import {
  authGuard,
  authGuardChild,
  guestGuard,
  roleGuard,
  farmerGuard,
  adminGuard,
} from '@core/guards';
import { UserRole } from '@domain/models/user.model';

/**
 * Application Routes Configuration
 * =================================
 * Smart Mandi Connect uses a clean URL structure with lazy-loaded standalone components.
 * All routes are protected by authentication and role-based guards.
 *
 * Guard Usage:
 * - authGuard: Requires authentication
 * - guestGuard: Only for unauthenticated users
 * - roleGuard: Role-based access via route data
 * - farmerGuard: FARMER or ADMIN only
 * - adminGuard: ADMIN only
 *
 * URL Structure:
 * - /auth/*          → Authentication (login, OTP)
 * - /dashboard       → Role-specific dashboard
 * - /marketplace/*   → Browse & search products
 * - /products/*      → Product management (farmers)
 * - /orders/*        → Order management
 * - /profile/*       → User profile & settings
 * - /admin/*         → Admin panel (admin only)
 */
export const routes: Routes = [
  // ============================================
  // Default Redirect
  // ============================================
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth/login',
  },

  // ============================================
  // Authentication Routes (Guests Only)
  // ============================================
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () =>
      import('@features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // ============================================
  // Dashboard (All Authenticated Users)
  // ============================================
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@features/dashboard/pages/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    title: 'Dashboard | Smart Mandi Connect',
  },

  // ============================================
  // Farmer Dashboard & Features (FARMER & ADMIN)
  // ============================================
  {
    path: 'farmer',
    canActivate: [authGuard, farmerGuard],
    loadChildren: () =>
      import('@features/farmer/farmer.routes').then((m) => m.FARMER_ROUTES),
  },

  // ============================================
  // Marketplace (All Authenticated Users)
  // ============================================
  {
    path: 'marketplace',
    canActivate: [authGuard],
    loadChildren: () =>
      import('@features/marketplace/marketplace.routes').then(
        (m) => m.MARKETPLACE_ROUTES
      ),
  },

  // ============================================
  // Product Management (FARMER & ADMIN Only)
  // ============================================
  {
    path: 'products',
    canActivate: [authGuard, farmerGuard],
    loadChildren: () =>
      import('@features/products/products.routes').then(
        (m) => m.PRODUCTS_ROUTES
      ),
  },

  // ============================================
  // Order Management (All Authenticated Users)
  // ============================================
  {
    path: 'orders',
    canActivate: [authGuard],
    loadChildren: () =>
      import('@features/orders/orders.routes').then((m) => m.ORDERS_ROUTES),
  },

  // ============================================
  // User Profile (All Authenticated Users)
  // ============================================
  {
    path: 'profile',
    canActivate: [authGuard],
    loadChildren: () =>
      import('@features/profile/profile.routes').then((m) => m.PROFILE_ROUTES),
  },

  // ============================================
  // Real-time Chat (All Authenticated Users)
  // ============================================
  {
    path: 'chat',
    canActivate: [authGuard],
    loadChildren: () =>
      import('@features/chat/chat.routes').then((m) => m.CHAT_ROUTES),
  },

  // ============================================
  // Notifications (All Authenticated Users)
  // ============================================
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        '@features/notifications/pages/notifications/notifications.component'
      ).then((m) => m.NotificationsComponent),
    title: 'Notifications | Smart Mandi Connect',
  },

  // ============================================
  // Admin Panel (ADMIN Only)
  // ============================================
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    canActivateChild: [authGuardChild],
    loadChildren: () =>
      import('@features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },

  // ============================================
  // Error Pages (Public)
  // ============================================
  {
    path: 'error',
    children: [
      {
        path: '403',
        loadComponent: () =>
          import('@shared/components/errors/forbidden.component').then(
            (m) => m.ForbiddenComponent
          ),
        title: 'Access Denied | Smart Mandi Connect',
      },
      {
        path: '404',
        loadComponent: () =>
          import('@shared/components/errors/not-found.component').then(
            (m) => m.NotFoundComponent
          ),
        title: 'Page Not Found | Smart Mandi Connect',
      },
      {
        path: '500',
        loadComponent: () =>
          import('@shared/components/errors/server-error.component').then(
            (m) => m.ServerErrorComponent
          ),
        title: 'Server Error | Smart Mandi Connect',
      },
    ],
  },

  // ============================================
  // Wildcard - Redirect to 404
  // ============================================
  {
    path: '**',
    redirectTo: 'error/404',
  },
];
