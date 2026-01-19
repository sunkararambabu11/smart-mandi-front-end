/**
 * My Crops Page Component
 * =======================
 * Lists farmer's crop listings with virtual scrolling for performance.
 * Smart container component that manages state and delegates to CropCard.
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { CropService, CropListing } from '../../services/crop.service';
import { CropCardComponent } from '../../components/crop-card/crop-card.component';

/** View mode type */
type ViewMode = 'grid' | 'list';

/** Status filter type */
type StatusFilter = 'all' | CropListing['status'];

/** Sort option */
interface SortOption {
  value: string;
  label: string;
  field: keyof CropListing;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'smc-my-crops',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ScrollingModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    CropCardComponent,
  ],
  templateUrl: './my-crops.component.html',
  styleUrl: './my-crops.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyCropsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  readonly cropService = inject(CropService);

  /** Search query */
  readonly searchQuery = signal('');

  /** Status filter */
  readonly statusFilter = signal<StatusFilter>('all');

  /** View mode */
  readonly viewMode = signal<ViewMode>('grid');

  /** Selected sort option */
  readonly sortBy = signal<string>('newest');

  /** Sort options */
  readonly sortOptions: SortOption[] = [
    { value: 'newest', label: 'Newest First', field: 'createdAt', direction: 'desc' },
    { value: 'oldest', label: 'Oldest First', field: 'createdAt', direction: 'asc' },
    { value: 'price-high', label: 'Price: High to Low', field: 'expectedPrice', direction: 'desc' },
    { value: 'price-low', label: 'Price: Low to High', field: 'expectedPrice', direction: 'asc' },
    { value: 'quantity-high', label: 'Quantity: High to Low', field: 'quantity', direction: 'desc' },
    { value: 'name-asc', label: 'Name: A to Z', field: 'cropName', direction: 'asc' },
  ];

  /** Status filter options */
  readonly statusOptions: { value: StatusFilter; label: string; count: () => number }[] = [
    { value: 'all', label: 'All', count: () => this.cropService.crops().length },
    { value: 'active', label: 'Active', count: () => this.getStatusCount('active') },
    { value: 'pending', label: 'Pending', count: () => this.getStatusCount('pending') },
    { value: 'draft', label: 'Draft', count: () => this.getStatusCount('draft') },
    { value: 'sold', label: 'Sold', count: () => this.getStatusCount('sold') },
    { value: 'expired', label: 'Expired', count: () => this.getStatusCount('expired') },
  ];

  /** Filtered and sorted crops */
  readonly filteredCrops = computed(() => {
    let crops = [...this.cropService.crops()];

    // Apply search filter
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      crops = crops.filter(
        (crop) =>
          crop.cropName.toLowerCase().includes(query) ||
          crop.category.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    const status = this.statusFilter();
    if (status !== 'all') {
      crops = crops.filter((crop) => crop.status === status);
    }

    // Apply sorting
    const sortOption = this.sortOptions.find((s) => s.value === this.sortBy());
    if (sortOption) {
      crops.sort((a, b) => {
        const aVal = a[sortOption.field];
        const bVal = b[sortOption.field];

        if (aVal instanceof Date && bVal instanceof Date) {
          return sortOption.direction === 'asc'
            ? aVal.getTime() - bVal.getTime()
            : bVal.getTime() - aVal.getTime();
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOption.direction === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOption.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });
    }

    return crops;
  });

  /** Is loading */
  readonly isLoading = this.cropService.isLoading;

  /** Has crops */
  readonly hasCrops = computed(() => this.cropService.crops().length > 0);

  /** Has filtered results */
  readonly hasResults = computed(() => this.filteredCrops().length > 0);

  /** Item size for virtual scroll (approximate height in pixels) */
  readonly itemSize = computed(() => (this.viewMode() === 'grid' ? 380 : 160));

  ngOnInit(): void {
    this.cropService.loadCrops();
  }

  /** Get count for a status */
  getStatusCount(status: CropListing['status']): number {
    return this.cropService.crops().filter((c) => c.status === status).length;
  }

  /** Toggle view mode */
  toggleViewMode(): void {
    this.viewMode.update((mode) => (mode === 'grid' ? 'list' : 'grid'));
  }

  /** Clear search */
  clearSearch(): void {
    this.searchQuery.set('');
  }

  /** Handle view crop */
  onViewCrop(cropId: string): void {
    this.router.navigate(['/farmer/crops', cropId]);
  }

  /** Handle edit crop */
  onEditCrop(cropId: string): void {
    this.router.navigate(['/farmer/crops', cropId, 'edit']);
  }

  /** Handle delete crop */
  onDeleteCrop(cropId: string): void {
    // TODO: Show confirmation dialog
    const crop = this.cropService.crops().find((c) => c.id === cropId);
    if (crop) {
      this.snackBar.open(`Delete "${crop.cropName}"?`, 'Confirm', {
        duration: 5000,
      });
    }
  }

  /** Handle duplicate crop */
  onDuplicateCrop(cropId: string): void {
    const crop = this.cropService.crops().find((c) => c.id === cropId);
    if (crop) {
      this.snackBar.open(`Duplicate "${crop.cropName}"?`, 'Confirm', {
        duration: 3000,
      });
    }
  }

  /** Handle mark as sold */
  onMarkAsSold(cropId: string): void {
    const crop = this.cropService.crops().find((c) => c.id === cropId);
    if (crop) {
      this.snackBar.open(`Mark "${crop.cropName}" as sold?`, 'Confirm', {
        duration: 3000,
      });
    }
  }

  /** Refresh crops */
  onRefresh(): void {
    this.cropService.loadCrops();
  }

  /** Track by function for virtual scroll */
  trackByCrop(index: number, crop: CropListing): string {
    return crop.id;
  }
}



