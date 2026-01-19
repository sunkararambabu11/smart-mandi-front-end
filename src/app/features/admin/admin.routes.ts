import { Routes } from '@angular/router';

/**
 * Admin Routes
 * ============
 * Routes for admin panel (ADMIN role only).
 * 
 * URL Structure:
 * - /admin              → Admin dashboard
 * - /admin/users        → User management
 * - /admin/products     → Product moderation
 * - /admin/orders       → Order oversight
 * - /admin/reports      → Analytics & reports
 * - /admin/settings     → System settings
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent
      ),
    title: 'Admin Dashboard | Smart Mandi Connect',
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./pages/user-management/user-management.component').then(
        (m) => m.UserManagementComponent
      ),
    title: 'User Management | Smart Mandi Connect',
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./pages/product-moderation/product-moderation.component').then(
        (m) => m.ProductModerationComponent
      ),
    title: 'Product Moderation | Smart Mandi Connect',
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./pages/category-management/category-management.component').then(
        (m) => m.CategoryManagementComponent
      ),
    title: 'Category Management | Smart Mandi Connect',
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./pages/reports/reports.component').then(
        (m) => m.ReportsComponent
      ),
    title: 'Reports & Analytics | Smart Mandi Connect',
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/admin-settings/admin-settings.component').then(
        (m) => m.AdminSettingsComponent
      ),
    title: 'Admin Settings | Smart Mandi Connect',
  },
];


