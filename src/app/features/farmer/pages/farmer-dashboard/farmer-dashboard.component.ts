/**
 * Farmer Dashboard Component
 * ==========================
 * Main dashboard for farmers showing mandi prices, stats, and activities.
 * Uses signals-based state management with OnPush change detection.
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';

import { AuthService } from '@core/services/auth.service';
import {
  FarmerDashboardService,
  MandiPrice,
  ActivityItem,
} from '../../services/farmer-dashboard.service';

@Component({
  selector: 'smc-farmer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatTooltipModule,
    MatRippleModule,
  ],
  templateUrl: './farmer-dashboard.component.html',
  styleUrl: './farmer-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  readonly dashboardService = inject(FarmerDashboardService);

  /** Current time for greeting */
  readonly currentHour = new Date().getHours();

  /** Greeting based on time of day */
  readonly greeting = computed(() => {
    if (this.currentHour < 12) return 'Good Morning';
    if (this.currentHour < 17) return 'Good Afternoon';
    return 'Good Evening';
  });

  /** User's display name */
  readonly userName = this.authService.displayName;

  /** Stats cards configuration */
  readonly statsCards = computed(() => [
    {
      id: 'earnings',
      title: 'Total Earnings',
      value: this.dashboardService.totalEarnings(),
      icon: 'account_balance_wallet',
      color: 'primary',
      prefix: '₹',
      suffix: '',
      format: 'currency',
      route: '/earnings',
    },
    {
      id: 'crops',
      title: 'Active Crops',
      value: this.dashboardService.activeCrops(),
      icon: 'eco',
      color: 'success',
      prefix: '',
      suffix: '',
      format: 'number',
      route: '/products',
    },
    {
      id: 'bids',
      title: 'New Bids',
      value: this.dashboardService.newBids(),
      icon: 'gavel',
      color: 'accent',
      prefix: '',
      suffix: '',
      format: 'number',
      route: '/bids',
    },
    {
      id: 'orders',
      title: 'Pending Orders',
      value: this.dashboardService.pendingOrders(),
      icon: 'pending_actions',
      color: 'warning',
      prefix: '',
      suffix: '',
      format: 'number',
      route: '/orders',
    },
  ]);

  /** Quick actions */
  readonly quickActions = this.dashboardService.quickActions;

  /** Mandi prices */
  readonly mandiPrices = this.dashboardService.mandiPrices;

  /** Recent activities */
  readonly activities = this.dashboardService.activities;

  /** Unread count */
  readonly unreadCount = this.dashboardService.unreadCount;

  /** Loading state */
  readonly isLoading = this.dashboardService.isLoading;

  /** Last updated */
  readonly lastUpdated = this.dashboardService.lastUpdated;

  ngOnInit(): void {
    this.dashboardService.loadDashboard();
  }

  /** Refresh dashboard data */
  onRefresh(): void {
    this.dashboardService.loadDashboard();
  }

  /** Refresh mandi prices */
  onRefreshPrices(): void {
    this.dashboardService.refreshPrices();
  }

  /** Mark activity as read */
  onActivityClick(activity: ActivityItem): void {
    if (!activity.isRead) {
      this.dashboardService.markActivityRead(activity.id);
    }
  }

  /** Get activity icon based on type */
  getActivityIcon(type: ActivityItem['type']): string {
    const icons: Record<ActivityItem['type'], string> = {
      bid: 'gavel',
      order: 'receipt_long',
      view: 'visibility',
      message: 'chat',
      payment: 'payments',
    };
    return icons[type];
  }

  /** Get activity color based on type */
  getActivityColor(type: ActivityItem['type']): string {
    const colors: Record<ActivityItem['type'], string> = {
      bid: 'accent',
      order: 'primary',
      view: 'info',
      message: 'warning',
      payment: 'success',
    };
    return colors[type];
  }

  /** Format relative time */
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString();
  }

  /** Format currency for display */
  formatCurrency(value: number): string {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value}`;
  }

  /** Track by function for mandi prices */
  trackByPrice(index: number, price: MandiPrice): string {
    return price.id;
  }

  /** Track by function for activities */
  trackByActivity(index: number, activity: ActivityItem): string {
    return activity.id;
  }
}



