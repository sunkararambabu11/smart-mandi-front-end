/**
 * Marketplace Crop Card Component
 * ================================
 * Displays a crop listing in the marketplace.
 * Reusable dumb component with OnPush change detection.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';

import { MarketplaceCrop, QualityGrade } from '../../services/marketplace.service';

@Component({
  selector: 'smc-marketplace-crop-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatRippleModule,
    DatePipe,
  ],
  templateUrl: './marketplace-crop-card.component.html',
  styleUrl: './marketplace-crop-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketplaceCropCardComponent {
  // ============================================
  // Inputs
  // ============================================

  readonly crop = input.required<MarketplaceCrop>();
  readonly viewMode = input<'grid' | 'list'>('grid');

  // ============================================
  // Outputs
  // ============================================

  readonly viewDetails = output<MarketplaceCrop>();
  readonly placeBid = output<MarketplaceCrop>();
  readonly addToWishlist = output<MarketplaceCrop>();
  readonly viewFarmer = output<string>();

  // ============================================
  // Computed
  // ============================================

  readonly QualityGrade = QualityGrade;

  /** Quality badge class */
  readonly qualityClass = computed(() => {
    const grade = this.crop().qualityGrade;
    return {
      premium: grade === QualityGrade.PREMIUM,
      'grade-a': grade === QualityGrade.GRADE_A,
      'grade-b': grade === QualityGrade.GRADE_B,
      standard: grade === QualityGrade.STANDARD,
    };
  });

  /** Quality label */
  readonly qualityLabel = computed(() => {
    const grade = this.crop().qualityGrade;
    const labels: Record<QualityGrade, string> = {
      [QualityGrade.PREMIUM]: 'Premium',
      [QualityGrade.GRADE_A]: 'Grade A',
      [QualityGrade.GRADE_B]: 'Grade B',
      [QualityGrade.STANDARD]: 'Standard',
    };
    return labels[grade];
  });

  /** Farmer initials for avatar */
  readonly farmerInitials = computed(() => {
    const name = this.crop().farmerName;
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  });

  /** Rating stars */
  readonly ratingStars = computed(() => {
    const rating = this.crop().farmerRating;
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return { full, half, empty };
  });

  /** Days until harvest */
  readonly daysUntilHarvest = computed(() => {
    const harvest = new Date(this.crop().harvestDate).getTime();
    const now = Date.now();
    const diff = harvest - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  });

  /** Harvest status */
  readonly harvestStatus = computed(() => {
    const days = this.daysUntilHarvest();
    if (days <= 0) return 'ready';
    if (days <= 3) return 'soon';
    return 'upcoming';
  });

  /** Image URL with fallback */
  readonly imageUrl = computed(() => {
    const images = this.crop().images;
    return images.length > 0
      ? images[0]
      : 'assets/images/crop-placeholder.jpg';
  });

  // ============================================
  // Actions
  // ============================================

  onViewDetails(): void {
    this.viewDetails.emit(this.crop());
  }

  onPlaceBid(): void {
    this.placeBid.emit(this.crop());
  }

  onAddToWishlist(event: Event): void {
    event.stopPropagation();
    this.addToWishlist.emit(this.crop());
  }

  onViewFarmer(event: Event): void {
    event.stopPropagation();
    this.viewFarmer.emit(this.crop().farmerId);
  }
}



