/**
 * Dashboard Page Component (Smart)
 * 
 * Role-based dashboard showing relevant information for farmers and buyers.
 */

import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

import { AuthService } from '@core/services/auth.service';

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
  color: string;
}

interface QuickAction {
  label: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'smc-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  readonly authService = inject(AuthService);

  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  });

  readonly quickActions = computed<QuickAction[]>(() => {
    if (this.authService.isFarmer()) {
      return [
        { label: 'Add Product', icon: 'add_circle', route: '/products/add', color: 'bg-primary-500' },
        { label: 'My Products', icon: 'inventory_2', route: '/products', color: 'bg-blue-500' },
        { label: 'Orders', icon: 'receipt_long', route: '/orders', color: 'bg-amber-500' },
        { label: 'Messages', icon: 'chat', route: '/messages', color: 'bg-purple-500' },
      ];
    }
    return [
      { label: 'Marketplace', icon: 'storefront', route: '/marketplace', color: 'bg-primary-500' },
      { label: 'My Cart', icon: 'shopping_cart', route: '/cart', color: 'bg-blue-500' },
      { label: 'Orders', icon: 'receipt_long', route: '/orders', color: 'bg-amber-500' },
      { label: 'Messages', icon: 'chat', route: '/messages', color: 'bg-purple-500' },
    ];
  });

  readonly stats = computed<StatCard[]>(() => {
    if (this.authService.isFarmer()) {
      return [
        { title: 'Total Sales', value: '₹1,24,500', change: '+12.5% from last month', changeType: 'positive', icon: 'payments', color: 'bg-green-500' },
        { title: 'Active Products', value: '24', change: '+3 new this week', changeType: 'positive', icon: 'inventory_2', color: 'bg-blue-500' },
        { title: 'Orders', value: '156', change: '+8% from last month', changeType: 'positive', icon: 'receipt_long', color: 'bg-amber-500' },
        { title: 'Rating', value: '4.8', change: '320 reviews', changeType: 'neutral', icon: 'star', color: 'bg-purple-500' },
      ];
    }
    return [
      { title: 'Total Spent', value: '₹45,200', change: 'This month', changeType: 'neutral', icon: 'payments', color: 'bg-green-500' },
      { title: 'Orders', value: '12', change: '+2 this week', changeType: 'positive', icon: 'shopping_bag', color: 'bg-blue-500' },
      { title: 'Saved Items', value: '8', change: 'In wishlist', changeType: 'neutral', icon: 'favorite', color: 'bg-red-500' },
      { title: 'Farmers', value: '15', change: 'Connected', changeType: 'neutral', icon: 'people', color: 'bg-purple-500' },
    ];
  });

  readonly recentOrders = [
    { id: '1', product: 'Organic Tomatoes', customer: 'Rahul Sharma', amount: '2,400', status: 'delivered', image: 'https://images.unsplash.com/photo-1546470427-227c7369a9b8?w=100&h=100&fit=crop' },
    { id: '2', product: 'Fresh Potatoes', customer: 'Priya Patel', amount: '1,800', status: 'shipped', image: 'https://images.unsplash.com/photo-1518977676601-b53f82ber?w=100&h=100&fit=crop' },
    { id: '3', product: 'Green Chillies', customer: 'Amit Kumar', amount: '650', status: 'pending', image: 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=100&h=100&fit=crop' },
  ];

  readonly topItems = [
    { name: 'Vegetables', emoji: '🥬', percentage: 85, color: '#22c55e', bgColor: '#dcfce7' },
    { name: 'Fruits', emoji: '🍎', percentage: 72, color: '#f97316', bgColor: '#ffedd5' },
    { name: 'Grains', emoji: '🌾', percentage: 58, color: '#eab308', bgColor: '#fef9c3' },
    { name: 'Dairy', emoji: '🥛', percentage: 45, color: '#3b82f6', bgColor: '#dbeafe' },
  ];

  readonly marketPrices = [
    { commodity: 'Tomato', emoji: '🍅', price: '45/kg', change: 5.2 },
    { commodity: 'Onion', emoji: '🧅', price: '32/kg', change: -2.1 },
    { commodity: 'Potato', emoji: '🥔', price: '28/kg', change: 0 },
    { commodity: 'Rice', emoji: '🍚', price: '58/kg', change: 1.5 },
    { commodity: 'Wheat', emoji: '🌾', price: '32/kg', change: -0.8 },
    { commodity: 'Apple', emoji: '🍎', price: '180/kg', change: 3.2 },
  ];
}

