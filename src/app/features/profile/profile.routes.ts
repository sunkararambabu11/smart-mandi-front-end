import { Routes } from '@angular/router';

/**
 * Profile Routes
 * ==============
 * Routes for user profile and settings.
 * 
 * URL Structure:
 * - /profile           → Profile overview
 * - /profile/edit      → Edit profile (same component, edit mode)
 * - /profile/settings  → Account settings
 * - /profile/addresses → Manage addresses
 */
export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/profile/profile.component').then(
        (m) => m.ProfileComponent
      ),
    title: 'My Profile | Smart Mandi Connect',
  },
  {
    path: 'edit',
    loadComponent: () =>
      import('./pages/profile/profile.component').then(
        (m) => m.ProfileComponent
      ),
    title: 'Edit Profile | Smart Mandi Connect',
    data: { editMode: true },
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings.component').then(
        (m) => m.SettingsComponent
      ),
    title: 'Settings | Smart Mandi Connect',
  },
  {
    path: 'addresses',
    loadComponent: () =>
      import('./pages/addresses/addresses.component').then(
        (m) => m.AddressesComponent
      ),
    title: 'My Addresses | Smart Mandi Connect',
  },
];
