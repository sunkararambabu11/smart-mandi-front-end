import { Routes } from '@angular/router';

/**
 * Product Management Routes
 * =========================
 * Routes for farmers to manage their products.
 * Protected by role guard (FARMER, ADMIN only).
 * 
 * URL Structure:
 * - /products           → My products list
 * - /products/add       → Add new product
 * - /products/edit/:id  → Edit existing product
 * - /products/:id       → View product details
 */
export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/product-list/product-list.component').then(
        (m) => m.ProductListComponent
      ),
    title: 'My Products | Smart Mandi Connect',
  },
  {
    path: 'add',
    loadComponent: () =>
      import('./pages/product-form/product-form.component').then(
        (m) => m.ProductFormComponent
      ),
    title: 'Add Product | Smart Mandi Connect',
    data: { mode: 'create' },
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./pages/product-form/product-form.component').then(
        (m) => m.ProductFormComponent
      ),
    title: 'Edit Product | Smart Mandi Connect',
    data: { mode: 'edit' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/product-detail/product-detail.component').then(
        (m) => m.ProductDetailComponent
      ),
    title: 'Product Details | Smart Mandi Connect',
  },
];
