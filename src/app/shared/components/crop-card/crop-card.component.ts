/**
 * Shared Crop Card Component
 * ==========================
 * Reusable component for displaying crop information across the app.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';

import { StatusChipComponent } from '../status-chip/status-chip.component';
import { PriceBadgeComponent } from '../price-badge/price-badge.component';

// ============================================
// Interfaces
// ============================================

export interface CropCardData {
  readonly id: string;
  readonly name: string;
  readonly category?: string;
  readonly quantity: number;
  readonly unit: string;
  readonly price: number;
  readonly originalPrice?: number;
  readonly imageUrl?: string;
  readonly images?: string[];
  readonly quality?: 'A' | 'B' | 'C' | 'PREMIUM';
  readonly isOrganic?: boolean;
  readonly status?: 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'PENDING' | 'DRAFT';
  readonly harvestDate?: Date | string;
  readonly location?: string;
  readonly farmer?: {
    readonly id: string;
    readonly name: string;
    readonly avatar?: string;
    readonly rating?: number;
  };
  readonly bidsCount?: number;
  readonly viewsCount?: number;
  readonly createdAt?: Date | string;
}

export type CropCardVariant = 'default' | 'compact' | 'horizontal' | 'detailed';

@Component({
  selector: 'smc-crop-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatRippleModule,
    MatTooltipModule,
    CurrencyPipe,
    DatePipe,
    StatusChipComponent,
    PriceBadgeComponent,
  ],
  templateUrl: './crop-card.component.html',
  styleUrl: './crop-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropCardComponent {
  readonly crop = input.required<CropCardData>();
  readonly variant = input<CropCardVariant>('default');
  readonly clickable = input<boolean>(true);
  readonly showActions = input<boolean>(false);
  readonly actionType = input<'buyer' | 'farmer'>('buyer');
  readonly showWishlist = input<boolean>(false);
  readonly isWishlisted = input<boolean>(false);

  readonly cardClick = output<CropCardData>();
  readonly wishlistToggle = output<CropCardData>();
  readonly bid = output<CropCardData>();
  readonly buyNow = output<CropCardData>();
  readonly edit = output<CropCardData>();
  readonly viewBids = output<CropCardData>();

  readonly variantClass = computed(() => this.variant());

  /** Accessible label for the card */
  readonly cardAriaLabel = computed(() => {
    const c = this.crop();
    const organic = c.isOrganic ? 'Organic ' : '';
    const grade = c.quality ? `Grade ${c.quality}. ` : '';
    const status = c.status && c.status !== 'ACTIVE' ? `Status: ${c.status}. ` : '';
    return `${organic}${c.name}. ${grade}${c.quantity} ${c.unit} at ₹${c.price} per ${c.unit}. ${status}${c.location || ''}`;
  });

  onCardClick(): void {
    if (this.clickable()) {
      this.cardClick.emit(this.crop());
    }
  }

  onWishlistToggle(event: Event): void {
    event.stopPropagation();
    this.wishlistToggle.emit(this.crop());
  }

  onBid(event: Event): void {
    event.stopPropagation();
    this.bid.emit(this.crop());
  }

  onBuyNow(event: Event): void {
    event.stopPropagation();
    this.buyNow.emit(this.crop());
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit(this.crop());
  }

  onViewBids(event: Event): void {
    event.stopPropagation();
    this.viewBids.emit(this.crop());
  }
}
