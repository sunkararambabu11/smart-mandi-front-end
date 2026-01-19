/**
 * Admin Dashboard Page Component
 * ===============================
 * Main admin dashboard with overview statistics and quick actions.
 */

import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

interface StatCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
  color: string;
  link: string;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'product' | 'order';
  message: string;
  timestamp: Date;
  icon: string;
}

@Component({
  selector: 'smc-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent {
  /** Dashboard statistics */
  readonly stats = signal<StatCard[]>([
    {
      title: 'Total Users',
      value: '2,543',
      change: '+12.5%',
      trend: 'up',
      icon: 'people',
      color: 'blue',
      link: '/admin/users',
    },
    {
      title: 'Active Products',
      value: '1,234',
      change: '+8.3%',
      trend: 'up',
      icon: 'inventory_2',
      color: 'green',
      link: '/admin/products',
    },
    {
      title: 'Orders Today',
      value: '156',
      change: '+23.1%',
      trend: 'up',
      icon: 'receipt_long',
      color: 'amber',
      link: '/admin/orders',
    },
    {
      title: 'Revenue',
      value: '₹4.5L',
      change: '+15.7%',
      trend: 'up',
      icon: 'payments',
      color: 'purple',
      link: '/admin/reports',
    },
  ]);

  /** Quick action buttons */
  readonly quickActions = [
    { label: 'Add User', icon: 'person_add', action: 'addUser' },
    { label: 'Moderate Products', icon: 'fact_check', link: '/admin/products' },
    { label: 'View Reports', icon: 'analytics', link: '/admin/reports' },
    { label: 'System Settings', icon: 'settings', link: '/admin/settings' },
  ];

  /** Recent activity feed */
  readonly recentActivity = signal<RecentActivity[]>([
    {
      id: '1',
      type: 'user',
      message: 'New farmer registered: Ramesh Kumar',
      timestamp: new Date(),
      icon: 'person_add',
    },
    {
      id: '2',
      type: 'product',
      message: 'Product approved: Organic Tomatoes',
      timestamp: new Date(Date.now() - 300000),
      icon: 'check_circle',
    },
    {
      id: '3',
      type: 'order',
      message: 'Large order placed: ₹25,000',
      timestamp: new Date(Date.now() - 600000),
      icon: 'shopping_cart',
    },
    {
      id: '4',
      type: 'user',
      message: 'New buyer registered: Fresh Mart',
      timestamp: new Date(Date.now() - 900000),
      icon: 'person_add',
    },
    {
      id: '5',
      type: 'product',
      message: 'Product flagged for review: Basmati Rice',
      timestamp: new Date(Date.now() - 1200000),
      icon: 'flag',
    },
  ]);

  /** Handle quick action click */
  onQuickAction(action: string): void {
    console.log('Quick action:', action);
    // TODO: Implement quick actions
  }

  /** Format relative time */
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}
