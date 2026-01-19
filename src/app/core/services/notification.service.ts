import { Injectable, inject, signal, computed } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

/** Notification types */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/** Notification message */
export interface Notification {
  readonly id: string;
  readonly type: NotificationType;
  readonly message: string;
  readonly title?: string;
  readonly duration?: number;
  readonly dismissible?: boolean;
  readonly timestamp: Date;
}

/**
 * Notification Service
 * ====================
 * Centralized notification management using signals.
 * Provides snackbar notifications and in-app notification history.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  /** Notification history */
  private readonly _notifications = signal<Notification[]>([]);

  /** Unread count */
  private readonly _unreadCount = signal(0);

  // ============================================
  // Public Signals
  // ============================================

  /** All notifications */
  readonly notifications = this._notifications.asReadonly();

  /** Unread notification count */
  readonly unreadCount = this._unreadCount.asReadonly();

  /** Has unread notifications */
  readonly hasUnread = computed(() => this._unreadCount() > 0);

  /** Recent notifications (last 10) */
  readonly recentNotifications = computed(() =>
    this._notifications().slice(0, 10)
  );

  // ============================================
  // Notification Methods
  // ============================================

  /**
   * Show success notification
   */
  success(message: string, title?: string): void {
    this.show('success', message, title);
  }

  /**
   * Show error notification
   */
  error(message: string, title?: string): void {
    this.show('error', message, title, 5000);
  }

  /**
   * Show warning notification
   */
  warning(message: string, title?: string): void {
    this.show('warning', message, title);
  }

  /**
   * Show info notification
   */
  info(message: string, title?: string): void {
    this.show('info', message, title);
  }

  /**
   * Show notification with custom type
   */
  show(
    type: NotificationType,
    message: string,
    title?: string,
    duration = 3000
  ): void {
    const notification: Notification = {
      id: this.generateId(),
      type,
      message,
      title,
      duration,
      dismissible: true,
      timestamp: new Date(),
    };

    // Add to history
    this._notifications.update((notifications) => [
      notification,
      ...notifications,
    ]);
    this._unreadCount.update((count) => count + 1);

    // Show snackbar
    const config: MatSnackBarConfig = {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: this.getSnackbarClass(type),
    };

    this.snackBar.open(message, 'Dismiss', config);
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this._unreadCount.set(0);
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this._notifications.set([]);
    this._unreadCount.set(0);
  }

  /**
   * Remove specific notification
   */
  remove(id: string): void {
    this._notifications.update((notifications) =>
      notifications.filter((n) => n.id !== id)
    );
  }

  // ============================================
  // Private Methods
  // ============================================

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  private getSnackbarClass(type: NotificationType): string[] {
    const baseClass = 'smc-snackbar';
    return [baseClass, `smc-snackbar-${type}`];
  }
}
