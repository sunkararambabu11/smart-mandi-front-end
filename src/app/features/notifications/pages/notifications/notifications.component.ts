/**
 * Notifications Component
 * =======================
 * Main notifications page with filtering and real-time updates.
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil } from 'rxjs';

import {
  NotificationService,
  Notification,
  NotificationType,
  NotificationFilterType,
  NOTIFICATION_TYPE_CONFIG,
} from '../../services/notification.service';
import { NotificationCardComponent } from '../../components/notification-card/notification-card.component';

@Component({
  selector: 'smc-notifications',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMenuModule,
    MatDividerModule,
    NotificationCardComponent,
  ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  // ============================================
  // Expose Service Signals
  // ============================================

  readonly notifications = this.notificationService.notifications;
  readonly filteredNotifications = this.notificationService.filteredNotifications;
  readonly groupedNotifications = this.notificationService.groupedNotifications;
  readonly filterType = this.notificationService.filterType;
  readonly isLoading = this.notificationService.isLoading;
  readonly isUpdating = this.notificationService.isUpdating;
  readonly unreadCount = this.notificationService.unreadCount;
  readonly unreadCountByType = this.notificationService.unreadCountByType;
  readonly hasUnread = this.notificationService.hasUnread;

  // ============================================
  // Filter Options
  // ============================================

  readonly NotificationType = NotificationType;
  readonly NOTIFICATION_TYPE_CONFIG = NOTIFICATION_TYPE_CONFIG;

  readonly filterOptions: { value: NotificationFilterType; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: 'notifications' },
    ...Object.values(NotificationType).map((type) => ({
      value: type as NotificationFilterType,
      label: NOTIFICATION_TYPE_CONFIG[type].label,
      icon: NOTIFICATION_TYPE_CONFIG[type].icon,
    })),
  ];

  /** Helper to get current filter config for template (safe for 'all') */
  getFilterTypeConfig(): { label: string; icon: string; color: string } {
    const type = this.filterType();
    if (type === 'all') {
      return { label: 'All', icon: 'notifications', color: '#666' };
    }
    return NOTIFICATION_TYPE_CONFIG[type];
  }

  // ============================================
  // Lifecycle
  // ============================================

  ngOnInit(): void {
    this.notificationService.loadNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // Filter Actions
  // ============================================

  onFilterChange(type: NotificationFilterType): void {
    this.notificationService.setFilterType(type);
  }

  // ============================================
  // Notification Actions
  // ============================================

  onMarkAsRead(notification: Notification): void {
    if (notification.isRead) return;

    this.notificationService.markAsRead(notification.id).subscribe({
      error: () => {
        this.snackBar.open('Failed to mark as read', 'Close', { duration: 3000 });
      },
    });
  }

  onDelete(notification: Notification): void {
    this.notificationService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.snackBar.open('Notification deleted', 'Undo', { duration: 4000 });
      },
      error: () => {
        this.snackBar.open('Failed to delete', 'Close', { duration: 3000 });
      },
    });
  }

  onNotificationClick(notification: Notification): void {
    // Mark as read
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }

    // Navigate if action URL exists
    if (notification.actionUrl) {
      this.router.navigateByUrl(notification.actionUrl);
    }
  }

  onMarkAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.snackBar.open('All notifications marked as read', 'Close', {
          duration: 3000,
        });
      },
      error: () => {
        this.snackBar.open('Failed to update', 'Close', { duration: 3000 });
      },
    });
  }

  onClearAll(): void {
    this.notificationService.clearAll().subscribe({
      next: () => {
        this.snackBar.open('All notifications cleared', 'Close', {
          duration: 3000,
        });
      },
      error: () => {
        this.snackBar.open('Failed to clear notifications', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  // ============================================
  // Tracking
  // ============================================

  trackByGroupDate(index: number, group: { date: string }): string {
    return group.date;
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id;
  }

  getUnreadCountForType(type: NotificationType): number {
    return this.unreadCountByType()[type] || 0;
  }
}
