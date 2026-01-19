import { Routes } from '@angular/router';

/**
 * Orders Feature Routes
 * =====================
 * Routes for order management (shared by Farmer & Buyer).
 *
 * URL Structure:
 * - /orders              → Orders list
 * - /orders/:id          → Order details
 * - /orders/:id/tracking → Order tracking
 */
export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/orders-list/orders-list.component').then(
        (m) => m.OrdersListComponent
      ),
    title: 'My Orders | Smart Mandi Connect',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/order-details/order-details.component').then(
        (m) => m.OrderDetailsComponent
      ),
    title: 'Order Details | Smart Mandi Connect',
  },
  {
    path: ':id/tracking',
    loadComponent: () =>
      import('./pages/order-details/order-details.component').then(
        (m) => m.OrderDetailsComponent
      ),
    title: 'Track Order | Smart Mandi Connect',
    data: { showTracking: true },
  },
];
