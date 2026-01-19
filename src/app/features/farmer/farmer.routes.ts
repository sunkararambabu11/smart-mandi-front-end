import { Routes } from '@angular/router';

/**
 * Farmer Feature Routes
 * =====================
 * Routes for farmer-specific features.
 *
 * URL Structure:
 * - /farmer/dashboard      → Farmer dashboard with mandi prices
 * - /farmer/add-crop       → Add new crop listing
 * - /farmer/crops          → My crops listing
 * - /farmer/crops/:id      → View crop details
 * - /farmer/bids           → All bids overview
 * - /farmer/bids/:cropId   → Real-time bids for specific crop
 * - /farmer/earnings       → Earnings & analytics
 */
export const FARMER_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/farmer-dashboard/farmer-dashboard.component').then(
        (m) => m.FarmerDashboardComponent
      ),
    title: 'Farmer Dashboard | Smart Mandi Connect',
  },
  {
    path: 'add-crop',
    loadComponent: () =>
      import('./pages/add-crop/add-crop.component').then(
        (m) => m.AddCropComponent
      ),
    title: 'Add Crop Listing | Smart Mandi Connect',
  },
  {
    path: 'crops',
    loadComponent: () =>
      import('./pages/my-crops/my-crops.component').then(
        (m) => m.MyCropsComponent
      ),
    title: 'My Crops | Smart Mandi Connect',
  },
  {
    path: 'crops/:id',
    loadComponent: () =>
      import('./pages/crop-detail/crop-detail.component').then(
        (m) => m.CropDetailComponent
      ),
    title: 'Crop Details | Smart Mandi Connect',
  },
  {
    path: 'crops/:id/edit',
    loadComponent: () =>
      import('./pages/add-crop/add-crop.component').then(
        (m) => m.AddCropComponent
      ),
    title: 'Edit Crop | Smart Mandi Connect',
    data: { mode: 'edit' },
  },
  {
    path: 'products',
    redirectTo: 'crops',
    pathMatch: 'full',
  },
  {
    path: 'bids',
    loadComponent: () =>
      import('./pages/bids/bids.component').then((m) => m.BidsComponent),
    title: 'My Bids | Smart Mandi Connect',
  },
  {
    path: 'bids/:cropId',
    loadComponent: () =>
      import('./pages/crop-bids/crop-bids.component').then(
        (m) => m.CropBidsComponent
      ),
    title: 'Crop Bids | Smart Mandi Connect',
  },
  {
    path: 'earnings',
    loadComponent: () =>
      import('./pages/earnings/earnings.component').then(
        (m) => m.EarningsComponent
      ),
    title: 'Earnings | Smart Mandi Connect',
  },
];
