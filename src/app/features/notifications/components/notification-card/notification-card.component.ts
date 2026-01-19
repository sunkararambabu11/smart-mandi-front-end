/**
 * Notification Card Component
 * ===========================
 * Displays a single notification with actions.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';

import {
  Notification,
  NotificationType,
  NotificationPriority,
  NOTIFICATION_TYPE_CONFIG,
} from '../../services/notification.service';

@Component({
  selector: 'smc-notification-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatRippleModule,
    DatePipe,
  ],
  templateUrl: './notification-card.component.html',
  styleUrl: './notification-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationCardComponent {
  readonly notification = input.required<Notification>();

  readonly markAsRead = output<Notification>();
  readonly delete = output<Notification>();
  readonly click = output<Notification>();

  readonly typeConfig = computed(() => {
    return NOTIFICATION_TYPE_CONFIG[this.notification().type];
  });

  readonly isHighPriority = computed(() => {
    const priority = this.notification().priority;
    return priority === NotificationPriority.HIGH || priority === NotificationPriority.URGENT;
  });

  readonly timeAgo = computed(() => {
    const date = new Date(this.notification().createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  });

  onCardClick(): void {
    if (!this.notification().isRead) {
      this.markAsRead.emit(this.notification());
    }
    this.click.emit(this.notification());
  }

  onMarkAsRead(): void {
    this.markAsRead.emit(this.notification());
  }

  onDelete(): void {
    this.delete.emit(this.notification());
  }
}
