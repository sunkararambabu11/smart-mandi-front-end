import { Injectable, signal, computed } from '@angular/core';

/**
 * Loading Service
 * ===============
 * Centralized loading state management using signals.
 * Tracks multiple concurrent loading operations.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  /** Active loading requests counter */
  private readonly _activeRequests = signal(0);

  /** Map of named loading states for specific operations */
  private readonly _namedLoaders = signal<Record<string, boolean>>({});

  // ============================================
  // Public Signals
  // ============================================

  /** Global loading state - true when any request is active */
  readonly isLoading = computed(() => this._activeRequests() > 0);

  /** Number of active requests */
  readonly activeRequests = this._activeRequests.asReadonly();

  /** Named loading states */
  readonly namedLoaders = this._namedLoaders.asReadonly();

  // ============================================
  // Methods
  // ============================================

  /**
   * Start a global loading operation
   */
  start(): void {
    this._activeRequests.update((count) => count + 1);
  }

  /**
   * Stop a global loading operation
   */
  stop(): void {
    this._activeRequests.update((count) => Math.max(0, count - 1));
  }

  /**
   * Reset all loading states
   */
  reset(): void {
    this._activeRequests.set(0);
    this._namedLoaders.set({});
  }

  /**
   * Start a named loading operation
   */
  startNamed(name: string): void {
    this._namedLoaders.update((loaders) => ({
      ...loaders,
      [name]: true,
    }));
  }

  /**
   * Stop a named loading operation
   */
  stopNamed(name: string): void {
    this._namedLoaders.update((loaders) => ({
      ...loaders,
      [name]: false,
    }));
  }

  /**
   * Check if a named loader is active
   */
  isLoadingNamed(name: string): boolean {
    return this._namedLoaders()[name] ?? false;
  }

  /**
   * Get a computed signal for a named loader
   */
  getNamedLoader(name: string) {
    return computed(() => this._namedLoaders()[name] ?? false);
  }
}
