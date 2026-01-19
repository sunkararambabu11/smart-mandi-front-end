/**
 * Reports & Analytics Page Component
 * ===================================
 * Admin analytics dashboard with charts and reports.
 */

import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'smc-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent {
  /** Selected time period */
  readonly selectedPeriod = signal<string>('week');

  /** Time period options */
  readonly periods = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
  ];

  /** Key metrics */
  readonly metrics = [
    {
      title: 'Total Revenue',
      value: '₹12,45,000',
      change: '+12.5%',
      trend: 'up',
      icon: 'payments',
    },
    {
      title: 'Total Orders',
      value: '1,234',
      change: '+8.3%',
      trend: 'up',
      icon: 'shopping_cart',
    },
    {
      title: 'Active Farmers',
      value: '456',
      change: '+5.2%',
      trend: 'up',
      icon: 'agriculture',
    },
    {
      title: 'Active Buyers',
      value: '2,089',
      change: '+15.7%',
      trend: 'up',
      icon: 'people',
    },
  ];

  /** Top selling products */
  readonly topProducts = [
    { name: 'Organic Tomatoes', sales: 234, revenue: '₹52,000' },
    { name: 'Basmati Rice', sales: 189, revenue: '₹1,12,000' },
    { name: 'Fresh Mangoes', sales: 156, revenue: '₹78,000' },
    { name: 'Green Chillies', sales: 145, revenue: '₹18,000' },
    { name: 'Potatoes', sales: 132, revenue: '₹26,000' },
  ];

  /** Update selected period */
  onPeriodChange(period: string): void {
    this.selectedPeriod.set(period);
    // TODO: Fetch new data based on period
  }

  /** Export report */
  exportReport(format: 'pdf' | 'excel'): void {
    console.log('Exporting report as:', format);
    // TODO: Implement export functionality
  }
}