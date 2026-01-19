/**
 * Product List Page Component
 * ===========================
 * Farmer's product management dashboard with listing grid.
 */

import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '@core/services/auth.service';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  quantity: number;
  imageUrl?: string;
  status: 'active' | 'draft' | 'sold' | 'expired';
  isOrganic: boolean;
  quality: string;
  viewCount: number;
  bidCount: number;
  createdAt: Date;
}

@Component({
  selector: 'smc-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatMenuModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent implements OnInit {
  private readonly snackBar = inject(MatSnackBar);
  readonly authService = inject(AuthService);

  /** Check if current user is a farmer */
  readonly isFarmer = this.authService.isFarmer;

  readonly isLoading = signal(true);
  readonly selectedTab = signal(0);
  
  readonly products = signal<Product[]>([]);

  readonly tabs = [
    { label: 'All', value: 'all', icon: 'inventory_2' },
    { label: 'Active', value: 'active', icon: 'check_circle' },
    { label: 'Drafts', value: 'draft', icon: 'edit_note' },
    { label: 'Sold', value: 'sold', icon: 'sell' },
  ];

  readonly stats = signal({
    total: 0,
    active: 0,
    drafts: 0,
    sold: 0,
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.isLoading.set(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Organic Tomatoes',
          category: 'Vegetables',
          price: 45,
          unit: 'kg',
          quantity: 500,
          imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
          status: 'active',
          isOrganic: true,
          quality: 'Premium',
          viewCount: 234,
          bidCount: 5,
          createdAt: new Date(),
        },
        {
          id: '2',
          name: 'Fresh Potatoes',
          category: 'Vegetables',
          price: 28,
          unit: 'kg',
          quantity: 1000,
          imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82abe3b2?w=400',
          status: 'active',
          isOrganic: false,
          quality: 'Grade A',
          viewCount: 156,
          bidCount: 3,
          createdAt: new Date(),
        },
        {
          id: '3',
          name: 'Basmati Rice',
          category: 'Grains',
          price: 85,
          unit: 'kg',
          quantity: 2000,
          status: 'draft',
          isOrganic: false,
          quality: 'Grade A',
          viewCount: 0,
          bidCount: 0,
          createdAt: new Date(),
        },
        {
          id: '4',
          name: 'Green Chillies',
          category: 'Vegetables',
          price: 65,
          unit: 'kg',
          quantity: 0,
          status: 'sold',
          isOrganic: true,
          quality: 'Premium',
          viewCount: 312,
          bidCount: 8,
          createdAt: new Date(),
        },
      ];

      this.products.set(mockProducts);
      this.stats.set({
        total: mockProducts.length,
        active: mockProducts.filter(p => p.status === 'active').length,
        drafts: mockProducts.filter(p => p.status === 'draft').length,
        sold: mockProducts.filter(p => p.status === 'sold').length,
      });
      this.isLoading.set(false);
    }, 600);
  }

  get filteredProducts(): Product[] {
    const tab = this.tabs[this.selectedTab()].value;
    if (tab === 'all') return this.products();
    return this.products().filter(p => p.status === tab);
  }

  onTabChange(index: number): void {
    this.selectedTab.set(index);
  }

  onEditProduct(product: Product): void {
    // Navigate to edit
  }

  onDeleteProduct(product: Product): void {
    this.products.update(list => list.filter(p => p.id !== product.id));
    this.snackBar.open(`${product.name} deleted`, 'Undo', { duration: 3000 });
  }

  onToggleStatus(product: Product): void {
    const newStatus = product.status === 'active' ? 'draft' : 'active';
    this.products.update(list => 
      list.map(p => p.id === product.id ? { ...p, status: newStatus } : p)
    );
    this.snackBar.open(`${product.name} is now ${newStatus}`, 'Close', { duration: 3000 });
  }

  trackByProductId(_index: number, product: Product): string {
    return product.id;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      active: 'primary',
      draft: 'accent',
      sold: 'warn',
      expired: 'warn',
    };
    return colors[status] || 'primary';
  }
}
