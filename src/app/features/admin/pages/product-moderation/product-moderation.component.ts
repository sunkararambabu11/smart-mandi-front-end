/**
 * Product Moderation Page Component
 * ==================================
 * Admin tool for reviewing and moderating farmer products.
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'smc-product-moderation',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatMenuModule,
  ],
  templateUrl: './product-moderation.component.html',
  styleUrl: './product-moderation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductModerationComponent {
  /** Pending products for moderation */
  readonly pendingProducts = [
    {
      id: '1',
      name: 'Organic Tomatoes',
      farmer: 'Ramesh Kumar',
      category: 'Vegetables',
      price: '₹45/kg',
      status: 'pending',
      submittedAt: new Date(),
    },
    {
      id: '2',
      name: 'Fresh Mangoes',
      farmer: 'Suresh Patel',
      category: 'Fruits',
      price: '₹120/kg',
      status: 'pending',
      submittedAt: new Date(),
    },
    {
      id: '3',
      name: 'Basmati Rice',
      farmer: 'Anil Singh',
      category: 'Grains',
      price: '₹85/kg',
      status: 'pending',
      submittedAt: new Date(),
    },
  ];

  /** Displayed columns for table */
  readonly displayedColumns = [
    'name',
    'farmer',
    'category',
    'price',
    'submittedAt',
    'actions',
  ];

  /** Approve a product */
  approveProduct(productId: string): void {
    console.log('Approving product:', productId);
    // TODO: Implement approval logic
  }

  /** Reject a product */
  rejectProduct(productId: string): void {
    console.log('Rejecting product:', productId);
    // TODO: Implement rejection logic
  }

  /** View product details */
  viewDetails(productId: string): void {
    console.log('Viewing product:', productId);
    // TODO: Navigate to product details
  }
}