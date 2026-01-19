import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';

import { User, UserRole, UserStatus } from '@domain/models/user.model';
import { environment } from '@environments/environment';

/** Storage keys for auth tokens */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'smc_access_token',
  REFRESH_TOKEN: 'smc_refresh_token',
  USER: 'smc_user',
  PHONE: 'smc_pending_phone',
  ROLE: 'smc_pending_role',
} as const;

/** OTP Request Response */
export interface OtpRequestResponse {
  success: boolean;
  message: string;
  otpLength: number;
  expiresIn: number; // seconds
}

/** OTP Verify Response */
export interface OtpVerifyResponse {
  success: boolean;
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  isNewUser: boolean;
}

/** Auth State */
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  otpSent: boolean;
  otpExpiresAt: Date | null;
  pendingPhone: string | null;
  pendingRole: string | null;
}

/**
 * Authentication Service
 * ======================
 * Signals-first authentication with mobile OTP flow.
 * Handles login, OTP verification, JWT tokens, and session management.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // ============================================
  // Private State Signals
  // ============================================

  private readonly _state = signal<AuthState>({
    user: this.loadUserFromStorage(),
    isLoading: false,
    error: null,
    otpSent: false,
    otpExpiresAt: null,
    pendingPhone: this.loadPendingPhone(),
    pendingRole: this.loadPendingRole(),
  });

  // ============================================
  // Public Computed Signals (Read-only)
  // ============================================

  /** Current authenticated user */
  readonly currentUser = computed(() => this._state().user);

  /** Is user authenticated */
  readonly isAuthenticated = computed(() => !!this._state().user);

  /** User's role */
  readonly userRole = computed(() => this._state().user?.role ?? null);

  /** Is current user a farmer */
  readonly isFarmer = computed(
    () => this._state().user?.role === UserRole.FARMER
  );

  /** Is current user a buyer */
  readonly isBuyer = computed(
    () => this._state().user?.role === UserRole.BUYER
  );

  /** Is current user an admin */
  readonly isAdmin = computed(
    () => this._state().user?.role === UserRole.ADMIN
  );

  /** Loading state */
  readonly isLoading = computed(() => this._state().isLoading);

  /** Error message */
  readonly error = computed(() => this._state().error);

  /** OTP sent status */
  readonly otpSent = computed(() => this._state().otpSent);

  /** OTP expiry time */
  readonly otpExpiresAt = computed(() => this._state().otpExpiresAt);

  /** Pending phone number for OTP verification */
  readonly pendingPhone = computed(() => this._state().pendingPhone);

  /** User's display name */
  readonly displayName = computed(() => {
    const user = this._state().user;
    return user?.fullName || 'User';
  });

  /** User's avatar URL or initials */
  readonly avatarUrl = computed(() => {
    const user = this._state().user;
    return user?.profile?.avatarUrl || null;
  });

  // ============================================
  // Authentication Methods
  // ============================================

  /**
   * Request OTP for mobile number
   */
  requestOtp(phoneNumber: string, role: string = 'FARMER'): Observable<OtpRequestResponse> {
    this.updateState({ isLoading: true, error: null });

    // Store pending phone for OTP verification
    this.storePendingPhone(phoneNumber);

    return this.http
      .post<any>(`${this.apiUrl}/send-otp`, { 
        phoneNumber: phoneNumber,
        role: role
      })
      .pipe(
        tap((response) => {
          // Get role from API response (use request role as fallback)
          const responseRole = response.role ?? response.data?.role ?? role;
          this.storePendingRole(responseRole);
          
          this.updateState({
            isLoading: false,
            otpSent: true,
            pendingPhone: phoneNumber,
            pendingRole: responseRole,
            otpExpiresAt: new Date(Date.now() + (response.expiresIn || 300) * 1000),
          });
        }),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Verify OTP and complete login
   */
  verifyOtp(otp: string): Observable<OtpVerifyResponse> {
    const phoneNumber = this._state().pendingPhone;
    const pendingRole = this._state().pendingRole || 'FARMER';

    if (!phoneNumber) {
      return throwError(() => new Error('No pending phone number'));
    }

    this.updateState({ isLoading: true, error: null });

    return this.http
      .post<any>(`${this.apiUrl}/verify-otp`, {
        phoneNumber: phoneNumber,
        otp,
        role: pendingRole,
      })
      .pipe(
        tap((response) => {
          // Get role from response or use the pending role from login
          const userRole = this.mapToUserRole(response.role ?? response.user?.role ?? pendingRole);
          
          // Handle different API response formats
          const authResponse: OtpVerifyResponse = {
            success: response.success ?? true,
            user: response.user ?? response.data?.user ?? {
              id: response.userId ?? response.id ?? 'user_' + Date.now(),
              email: response.email ?? `${phoneNumber}@smartmandi.com`,
              fullName: response.name ?? response.fullName ?? 'User',
              role: userRole,
              status: response.status ?? UserStatus.ACTIVE,
              profile: {
                phoneNumber: phoneNumber,
                avatarUrl: response.avatar ?? response.avatarUrl,
              },
              createdAt: new Date(),
              updatedAt: new Date(),
              emailVerified: response.emailVerified ?? false,
              phoneVerified: true,
            },
            accessToken: response.accessToken ?? response.token ?? response.access_token ?? 'token_' + Date.now(),
            refreshToken: response.refreshToken ?? response.refresh_token ?? 'refresh_' + Date.now(),
            expiresIn: response.expiresIn ?? response.expires_in ?? 3600,
            isNewUser: response.isNewUser ?? response.is_new_user ?? false,
          };
          
          // Ensure user has the correct role
          if (authResponse.user && !authResponse.user.role) {
            (authResponse.user as any).role = userRole;
          }
          
          this.handleAuthSuccess(authResponse);
        }),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Map string role to UserRole enum
   */
  private mapToUserRole(role: string): UserRole {
    const roleUpper = (role || '').toUpperCase();
    switch (roleUpper) {
      case 'FARMER':
        return UserRole.FARMER;
      case 'BUYER':
        return UserRole.BUYER;
      case 'ADMIN':
        return UserRole.ADMIN;
      default:
        return UserRole.FARMER;
    }
  }

  /**
   * Login with email and password
   */
  loginWithEmail(email: string, password: string): Observable<OtpVerifyResponse> {
    this.updateState({ isLoading: true, error: null });

    return this.http
      .post<any>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response) => {
          // Get role from response
          const userRole = this.mapToUserRole(response.role ?? response.user?.role ?? 'FARMER');
          
          // Handle different API response formats
          const authResponse: OtpVerifyResponse = {
            success: response.success ?? true,
            user: response.user ?? response.data?.user ?? {
              id: response.userId ?? response.id ?? 'user_' + Date.now(),
              email: response.email ?? email,
              fullName: response.name ?? response.fullName ?? email,
              role: userRole,
              status: response.status ?? UserStatus.ACTIVE,
              profile: {
                phoneNumber: response.phone ?? response.phoneNumber,
                avatarUrl: response.avatar ?? response.avatarUrl,
              },
              createdAt: new Date(),
              updatedAt: new Date(),
              emailVerified: response.emailVerified ?? true,
              phoneVerified: response.phoneVerified ?? false,
            },
            accessToken: response.accessToken ?? response.token ?? response.access_token ?? 'token_' + Date.now(),
            refreshToken: response.refreshToken ?? response.refresh_token ?? 'refresh_' + Date.now(),
            expiresIn: response.expiresIn ?? response.expires_in ?? 3600,
            isNewUser: response.isNewUser ?? response.is_new_user ?? false,
          };
          
          // Ensure user has the correct role
          if (authResponse.user && !authResponse.user.role) {
            (authResponse.user as any).role = userRole;
          }
          
          this.handleAuthSuccess(authResponse);
        }),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Signup with user details
   */
  signup(userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
    role: string;
  }): Observable<OtpVerifyResponse> {
    this.updateState({ isLoading: true, error: null });

    return this.http
      .post<any>(`${this.apiUrl}/signup`, userData)
      .pipe(
        tap((response) => {
          // Get role from response
          const userRole = this.mapToUserRole(response.role ?? response.user?.role ?? userData.role);
          
          // Handle different API response formats
          const authResponse: OtpVerifyResponse = {
            success: response.success ?? true,
            user: response.user ?? response.data?.user ?? {
              id: response.userId ?? response.id ?? 'user_' + Date.now(),
              email: response.email ?? userData.email,
              fullName: response.name ?? response.fullName ?? `${userData.firstName} ${userData.lastName}`,
              role: userRole,
              status: response.status ?? UserStatus.ACTIVE,
              profile: {
                phoneNumber: userData.phoneNumber,
                avatarUrl: response.avatar ?? response.avatarUrl,
              },
              createdAt: new Date(),
              updatedAt: new Date(),
              emailVerified: response.emailVerified ?? false,
              phoneVerified: response.phoneVerified ?? false,
            },
            accessToken: response.accessToken ?? response.token ?? response.access_token ?? 'token_' + Date.now(),
            refreshToken: response.refreshToken ?? response.refresh_token ?? 'refresh_' + Date.now(),
            expiresIn: response.expiresIn ?? response.expires_in ?? 3600,
            isNewUser: true,
          };
          
          // Ensure user has the correct role
          if (authResponse.user && !authResponse.user.role) {
            (authResponse.user as any).role = userRole;
          }
          
          this.handleAuthSuccess(authResponse);
        }),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Resend OTP to pending phone number
   */
  resendOtp(): Observable<OtpRequestResponse> {
    const phoneNumber = this._state().pendingPhone;

    if (!phoneNumber) {
      return throwError(() => new Error('No pending phone number'));
    }

    return this.requestOtp(phoneNumber);
  }

  /**
   * Logout current user
   */
  logout(): void {
    // Clear API session (fire and forget)
    if (environment.production) {
      this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
        error: () => {}, // Ignore logout API errors
      });
    }

    // Clear local state and storage
    this.clearAuthState();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Refresh access token
   */
  refreshToken(): Observable<OtpVerifyResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<OtpVerifyResponse>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(
        tap((response) => this.handleAuthSuccess(response)),
        catchError((error) => {
          this.clearAuthState();
          return throwError(() => error);
        })
      );
  }

  /**
   * Clear OTP state (when user goes back to login)
   */
  clearOtpState(): void {
    this.clearPendingPhone();
    this.clearPendingRole();
    this.updateState({
      otpSent: false,
      otpExpiresAt: null,
      pendingPhone: null,
      pendingRole: null,
      error: null,
    });
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.updateState({ error: null });
  }

  // ============================================
  // Token Management
  // ============================================

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return (
      localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ??
      sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    );
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return (
      localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) ??
      sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
    );
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: UserRole): boolean {
    return this._state().user?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: UserRole[]): boolean {
    const userRole = this._state().user?.role;
    return userRole ? roles.includes(userRole) : false;
  }

  // ============================================
  // Private Methods
  // ============================================

  private updateState(partial: Partial<AuthState>): void {
    this._state.update((state) => ({ ...state, ...partial }));
  }

  private handleAuthSuccess(response: OtpVerifyResponse): void {
    // Store tokens
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));

    // Clear pending phone
    this.clearPendingPhone();

    // Update state
    this.updateState({
      user: response.user,
      isLoading: false,
      error: null,
      otpSent: false,
      otpExpiresAt: null,
      pendingPhone: null,
    });

    // Navigate based on user role
    const role = response.user?.role;
    switch (role) {
      case UserRole.FARMER:
        this.router.navigate(['/farmer']);
        break;
      case UserRole.BUYER:
        this.router.navigate(['/marketplace']);
        break;
      case UserRole.ADMIN:
        this.router.navigate(['/admin']);
        break;
      default:
        this.router.navigate(['/dashboard']);
    }
  }

  private handleError(error: unknown): Observable<never> {
    this.updateState({ isLoading: false });

    const message =
      error instanceof Error
        ? error.message
        : (error as { error?: { message?: string } })?.error?.message ??
          'Something went wrong. Please try again.';

    this.updateState({ error: message });
    return throwError(() => error);
  }

  private clearAuthState(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    this.clearPendingPhone();
    this.clearPendingRole();

    this.updateState({
      user: null,
      error: null,
      otpSent: false,
      otpExpiresAt: null,
      pendingPhone: null,
      pendingRole: null,
    });
  }

  private loadUserFromStorage(): User | null {
    try {
      const userJson =
        localStorage.getItem(STORAGE_KEYS.USER) ??
        sessionStorage.getItem(STORAGE_KEYS.USER);

      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  }

  private storePendingPhone(phone: string): void {
    sessionStorage.setItem(STORAGE_KEYS.PHONE, phone);
  }

  private loadPendingPhone(): string | null {
    return sessionStorage.getItem(STORAGE_KEYS.PHONE);
  }

  private clearPendingPhone(): void {
    sessionStorage.removeItem(STORAGE_KEYS.PHONE);
  }

  private storePendingRole(role: string): void {
    sessionStorage.setItem(STORAGE_KEYS.ROLE, role);
  }

  private loadPendingRole(): string | null {
    return sessionStorage.getItem(STORAGE_KEYS.ROLE);
  }

  private clearPendingRole(): void {
    sessionStorage.removeItem(STORAGE_KEYS.ROLE);
  }
}
