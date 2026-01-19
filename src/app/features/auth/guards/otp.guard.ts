import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

/**
 * OTP Guard
 * =========
 * Ensures OTP page is only accessible when OTP has been sent.
 * Redirects to login if no pending phone number.
 */
export const otpGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if there's a pending phone number waiting for OTP
  if (authService.pendingPhone() && authService.otpSent()) {
    return true;
  }

  // No pending OTP, redirect to login
  router.navigate(['/auth/login']);
  return false;
};



