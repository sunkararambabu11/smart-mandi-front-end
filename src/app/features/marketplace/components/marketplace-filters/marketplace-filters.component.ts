/**
 * Marketplace Filters Component
 * ==============================
 * Filter sidebar/panel for marketplace with responsive design.
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import {
  MarketplaceFilters,
  CropCategory,
  Location,
  QualityGrade,
  PriceRange,
} from '../../services/marketplace.service';

@Component({
  selector: 'smc-marketplace-filters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSliderModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
  ],
  templateUrl: './marketplace-filters.component.html',
  styleUrl: './marketplace-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketplaceFiltersComponent {
  // ============================================
  // Inputs
  // ============================================

  readonly filters = input.required<MarketplaceFilters>();
  readonly categories = input.required<CropCategory[]>();
  readonly locations = input.required<Location[]>();
  readonly activeFilterCount = input(0);

  // ============================================
  // Outputs
  // ============================================

  readonly filterChange = output<Partial<MarketplaceFilters>>();
  readonly applyFilters = output<void>();
  readonly resetFilters = output<void>();
  readonly close = output<void>();

  // ============================================
  // Local State
  // ============================================

  readonly QualityGrade = QualityGrade;

  readonly qualityGrades = [
    { value: QualityGrade.PREMIUM, label: 'Premium', icon: 'diamond' },
    { value: QualityGrade.GRADE_A, label: 'Grade A', icon: 'verified' },
    { value: QualityGrade.GRADE_B, label: 'Grade B', icon: 'check_circle' },
    { value: QualityGrade.STANDARD, label: 'Standard', icon: 'radio_button_checked' },
  ];

  readonly sortOptions = [
    { value: 'newest', label: 'Newest First', icon: 'schedule' },
    { value: 'price_low', label: 'Price: Low to High', icon: 'arrow_upward' },
    { value: 'price_high', label: 'Price: High to Low', icon: 'arrow_downward' },
    { value: 'popular', label: 'Most Popular', icon: 'trending_up' },
    { value: 'rating', label: 'Highest Rated', icon: 'star' },
  ];

  // Local price range for slider
  localPriceMin = signal(0);
  localPriceMax = signal(10000);

  // ============================================
  // Methods
  // ============================================

  onCategoryChange(category: string): void {
    this.filterChange.emit({ category });
  }

  onLocationChange(location: string): void {
    this.filterChange.emit({ location });
  }

  onQualityToggle(grade: QualityGrade): void {
    const current = this.filters().qualityGrades;
    const updated = current.includes(grade)
      ? current.filter((g) => g !== grade)
      : [...current, grade];
    this.filterChange.emit({ qualityGrades: updated });
  }

  isQualitySelected(grade: QualityGrade): boolean {
    return this.filters().qualityGrades.includes(grade);
  }

  onOrganicChange(value: boolean | null): void {
    this.filterChange.emit({ isOrganic: value });
  }

  onPriceRangeChange(): void {
    this.filterChange.emit({
      priceRange: {
        min: this.localPriceMin(),
        max: this.localPriceMax(),
      },
    });
  }

  onSortChange(sortBy: MarketplaceFilters['sortBy']): void {
    this.filterChange.emit({ sortBy });
  }

  onApply(): void {
    this.applyFilters.emit();
  }

  onReset(): void {
    this.localPriceMin.set(0);
    this.localPriceMax.set(10000);
    this.resetFilters.emit();
  }

  onClose(): void {
    this.close.emit();
  }
}



