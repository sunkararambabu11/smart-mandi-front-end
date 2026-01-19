/**
 * Product Detail Page Component
 * =============================
 * View product details with image gallery, bids, and buyer info.
 */

import { Component, ChangeDetectionStrategy, input, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface ProductDetail {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  quantity: number;
  images: string[];
  status: 'active' | 'draft' | 'sold' | 'expired';
  isOrganic: boolean;
  quality: string;
  harvestDate: Date;
  location: string;
  viewCount: number;
  bidCount: number;
  createdAt: Date;
}

interface Bid {
  id: string;
  buyerName: string;
  buyerAvatar?: string;
  amount: number;
  quantity: number;
  message?: string;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
}

@Component({
  selector: 'smc-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTabsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit {
  private readonly snackBar = inject(MatSnackBar);

  readonly productId = input.required<string>();

  readonly isLoading = signal(true);
  readonly selectedImageIndex = signal(0);
  readonly selectedTab = signal(0);
  
  readonly product = signal<ProductDetail | null>(null);
  readonly bids = signal<Bid[]>([]);

  ngOnInit(): void {
    this.loadProduct();
  }

  private loadProduct(): void {
    this.isLoading.set(true);
    
    // Simulate API call
    setTimeout(() => {
      this.product.set({
        id: this.productId(),
        name: 'Organic Tomatoes',
        category: 'Vegetables',
        description: 'Fresh organic tomatoes grown without pesticides in our family farm. These tomatoes are hand-picked at peak ripeness to ensure the best flavor. Perfect for salads, cooking, or making fresh sauce.',
        price: 45,
        unit: 'kg',
        quantity: 500,
        images: [
          'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800',
          'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=800',
          'https://images.unsplash.com/photo-1594995846645-e58528c11f32?w=800',
        ],
        status: 'active',
        isOrganic: true,
        quality: 'Premium',
        harvestDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Nashik, Maharashtra',
        viewCount: 234,
        bidCount: 5,
        createdAt: new Date(),
      });

      this.bids.set([
        {
          id: '1',
          buyerName: 'Suresh Kumar',
          amount: 48,
          quantity: 100,
          message: 'I can pick up tomorrow',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'pending',
        },
        {
          id: '2',
          buyerName: 'Priya Sharma',
          amount: 46,
          quantity: 200,
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
          status: 'pending',
        },
        {
          id: '3',
          buyerName: 'Vikram Singh',
          amount: 44,
          quantity: 150,
          message: 'Regular buyer, need weekly supply',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          status: 'rejected',
        },
      ]);

      this.isLoading.set(false);
    }, 600);
  }

  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  onAcceptBid(bid: Bid): void {
    this.bids.update(list =>
      list.map(b => ({
        ...b,
        status: b.id === bid.id ? 'accepted' as const : 
                b.status === 'pending' ? 'rejected' as const : b.status
      }))
    );
    this.snackBar.open(`Bid from ${bid.buyerName} accepted!`, 'Close', { duration: 3000 });
  }

  onRejectBid(bid: Bid): void {
    this.bids.update(list =>
      list.map(b => b.id === bid.id ? { ...b, status: 'rejected' as const } : b)
    );
    this.snackBar.open(`Bid rejected`, 'Undo', { duration: 3000 });
  }

  trackByBidId(_index: number, bid: Bid): string {
    return bid.id;
  }

  get pendingBids(): Bid[] {
    return this.bids().filter(b => b.status === 'pending');
  }

  get highestBid(): Bid | null {
    const pending = this.pendingBids;
    if (pending.length === 0) return null;
    return pending.reduce((max, b) => b.amount > max.amount ? b : max);
  }
}
