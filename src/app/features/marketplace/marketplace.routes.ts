import { Routes } from '@angular/router';

/**
 * Marketplace Feature Routes
 * ==========================
 * Routes for marketplace browsing and crop details.
 *
 * URL Structure:
 * - /marketplace              → Browse all crops
 * - /marketplace/crop/:id     → View crop details
 * - /marketplace/crop/:id/bid → Place bid on crop
 */
export const MARKETPLACE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/marketplace/marketplace.component').then(
        (m) => m.MarketplaceComponent
      ),
    title: 'Marketplace | Smart Mandi Connect',
  },
  {
    path: 'crop/:id',
    loadComponent: () =>
      import('./pages/crop-details/crop-details.component').then(
        (m) => m.CropDetailsComponent
      ),
    title: 'Crop Details | Smart Mandi Connect',
  },
  {
    path: 'crop/:id/bid',
    loadComponent: () =>
      import('./pages/place-bid/place-bid.component').then(
        (m) => m.PlaceBidComponent
      ),
    title: 'Place Bid | Smart Mandi Connect',
  },
];
