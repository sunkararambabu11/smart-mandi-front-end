import { Routes } from '@angular/router';
import { otpGuard } from './guards/otp.guard';

/**
 * Authentication Routes
 * =====================
 * Mobile OTP-based authentication flow.
 *
 * URL Structure:
 * - /auth/login → Mobile number entry
 * - /auth/otp   → OTP verification (requires pending phone)
 */
export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
    title: 'Login | Smart Mandi Connect',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
    title: 'Sign Up | Smart Mandi Connect',
  },
  {
    path: 'otp',
    canActivate: [otpGuard],
    loadComponent: () =>
      import('./pages/otp/otp.component').then((m) => m.OtpComponent),
    title: 'Verify OTP | Smart Mandi Connect',
  },
];
