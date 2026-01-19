/**
 * Crop Card Component
 * ====================
 * Reusable presentational component for displaying crop listings.
 * Dumb component - uses @Input/@Output, no direct service injection.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';

import { CropListing, QualityGrade, QUALITY_GRADE_LABELS } from '../../services/crop.service';

/** Crop status configuration */
const STATUS_CONFIG: Record<
  CropListing['status'],
  { label: string; color: string; icon: string }
> = {
  draft: { label: 'Draft', color: 'gray', icon: 'edit_note' },
  pending: { label: 'Pending Review', color: 'amber', icon: 'pending' },
  active: { label: 'Active', color: 'green', icon: 'check_circle' },
  sold: { label: 'Sold Out', color: 'blue', icon: 'sell' },
  expired: { label: 'Expired', color: 'red', icon: 'event_busy' },
};

@Component({
  selector: 'smc-crop-card',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    MatRippleModule,
    MatDividerModule,
  ],
  templateUrl: './crop-card.component.html',
  styleUrl: './crop-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropCardComponent {
  /** Crop listing data */
  readonly crop = input.required<CropListing>();

  /** Show compact view */
  readonly compact = input<boolean>(false);

  /** View crop event */
  readonly viewCrop = output<string>();

  /** Edit crop event */
  readonly editCrop = output<string>();

  /** Delete crop event */
  readonly deleteCrop = output<string>();

  /** Duplicate crop event */
  readonly duplicateCrop = output<string>();

  /** Mark as sold event */
  readonly markAsSold = output<string>();

  /** Get status configuration */
  getStatusConfig(status: CropListing['status']) {
    return STATUS_CONFIG[status];
  }

  /** Get quality grade label */
  getQualityLabel(grade: QualityGrade): string {
    return QUALITY_GRADE_LABELS[grade] || grade;
  }

  /** Get placeholder image */
  getImageUrl(): string {
    const crop = this.crop();
    if (crop.images && crop.images.length > 0) {
      return crop.images[0];
    }
    return 'assets/images/crop-placeholder.svg';
  }

  /** Format price */
  formatPrice(price: number): string {
    if (price >= 1000) {
      return `₹${(price / 1000).toFixed(1)}K`;
    }
    return `₹${price}`;
  }

  /** Check if crop is editable */
  isEditable(): boolean {
    const status = this.crop().status;
    return status === 'draft' || status === 'active' || status === 'pending';
  }

  /** Check if crop can be marked as sold */
  canMarkAsSold(): boolean {
    return this.crop().status === 'active';
  }

  /** Emit view event */
  onView(): void {
    this.viewCrop.emit(this.crop().id);
  }

  /** Emit edit event */
  onEdit(): void {
    this.editCrop.emit(this.crop().id);
  }

  /** Emit delete event */
  onDelete(): void {
    this.deleteCrop.emit(this.crop().id);
  }

  /** Emit duplicate event */
  onDuplicate(): void {
    this.duplicateCrop.emit(this.crop().id);
  }

  /** Emit mark as sold event */
  onMarkAsSold(): void {
    this.markAsSold.emit(this.crop().id);
  }
}


