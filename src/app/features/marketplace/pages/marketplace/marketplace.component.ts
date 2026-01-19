/**
 * Marketplace Component
 * =====================
 * Main marketplace page with crop listings, filters, and search.
 * Uses signals for reactive state management with minimal subscriptions.
 * 
 * Refactored to:
 * - Use DestroyRef + takeUntilDestroyed (no manual Subject cleanup)
 * - Use HostListener for scroll events (no fromEvent subscription)
 * - Improve accessibility with ARIA attributes
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  DestroyRef,
  ViewChild,
  ElementRef,
  HostListener,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  MarketplaceService,
  MarketplaceCrop,
  MarketplaceFilters,
} from '../../services/marketplace.service';
import { MarketplaceCropCardComponent } from '../../components/marketplace-crop-card/marketplace-crop-card.component';
import { MarketplaceFiltersComponent } from '../../components/marketplace-filters/marketplace-filters.component';

@Component({
  selector: 'smc-marketplace',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatSidenavModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSnackBarModule,
    MarketplaceCropCardComponent,
    MarketplaceFiltersComponent,
  ],
  templateUrl: './marketplace.component.html',
  styleUrl: './marketplace.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'main',
    '[attr.aria-busy]': 'isLoading()',
    '[attr.aria-label]': '"Marketplace - Browse fresh produce"',
  },
})
export class MarketplaceComponent implements AfterViewInit {
  private readonly marketplaceService = inject(MarketplaceService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('filterDrawer') filterDrawer!: MatDrawer;
  @ViewChild('cropsGrid') cropsGrid!: ElementRef;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  // ============================================
  // Expose Service Signals
  // ============================================

  readonly crops = this.marketplaceService.crops;
  readonly featuredCrops = this.marketplaceService.featuredCrops;
  readonly categories = this.marketplaceService.categories;
  readonly locations = this.marketplaceService.locations;
  readonly filters = this.marketplaceService.filters;
  readonly pagination = this.marketplaceService.pagination;
  readonly isLoading = this.marketplaceService.isLoading;
  readonly isLoadingMore = this.marketplaceService.isLoadingMore;
  readonly hasMore = this.marketplaceService.hasMore;
  readonly activeFilterCount = this.marketplaceService.activeFilterCount;
  readonly hasActiveFilters = this.marketplaceService.hasActiveFilters;

  // ============================================
  // Local State (Signals)
  // ============================================

  readonly viewMode = signal<'grid' | 'list'>('grid');
  readonly searchTerm = signal('');
  readonly showFiltersOnMobile = signal(false);
  readonly isScrolled = signal(false);
  
  /** Scroll position for scroll-to-top button visibility */
  private readonly scrollY = signal(0);
  private scrollCheckScheduled = false;

  /** Sort option labels */
  readonly sortLabels: Record<string, string> = {
    newest: 'Newest',
    price_low: 'Price ↑',
    price_high: 'Price ↓',
    popular: 'Popular',
    rating: 'Top Rated',
  };

  /** Current sort label */
  readonly currentSortLabel = computed(() => {
    return this.sortLabels[this.filters().sortBy] || 'Sort';
  });

  /** Show scroll-to-top button */
  readonly showScrollToTop = computed(() => this.scrollY() > 500);

  /** Crops count for screen readers */
  readonly cropsCountAnnouncement = computed(() => {
    const count = this.crops().length;
    const total = this.pagination().total;
    return `Showing ${count} of ${total} crops`;
  });

  // ============================================
  // Lifecycle
  // ============================================

  ngAfterViewInit(): void {
    // Focus search input for keyboard users
    this.searchInput?.nativeElement?.focus();
  }

  // ============================================
  // Scroll Handling (HostListener - no subscription needed)
  // ============================================

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const scrollTop = window.scrollY;
    this.isScrolled.set(scrollTop > 100);
    this.scrollY.set(scrollTop);

    // Debounce infinite scroll check
    if (!this.scrollCheckScheduled) {
      this.scrollCheckScheduled = true;
      requestAnimationFrame(() => {
        this.checkInfiniteScroll();
        this.scrollCheckScheduled = false;
      });
    }
  }

  private checkInfiniteScroll(): void {
    if (this.isLoading() || this.isLoadingMore() || !this.hasMore()) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight - 500;

    if (scrollPosition >= threshold) {
      this.loadMore();
    }
  }

  // ============================================
  // Keyboard Navigation
  // ============================================

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Ctrl/Cmd + K to focus search
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.searchInput?.nativeElement?.focus();
    }
    
    // Escape to close filters
    if (event.key === 'Escape' && this.filterDrawer?.opened) {
      this.closeFilters();
    }
  }

  // ============================================
  // Search
  // ============================================

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.marketplaceService.search(value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.marketplaceService.search('');
    this.searchInput?.nativeElement?.focus();
  }

  // ============================================
  // Filter Actions
  // ============================================

  onFilterChange(partial: Partial<MarketplaceFilters>): void {
    this.marketplaceService.updateFilters(partial);
  }

  onApplyFilters(): void {
    this.marketplaceService.applyFilters();
    this.closeFilters();
    
    // Announce filter results to screen readers
    this.announceToScreenReader(
      `Filters applied. ${this.cropsCountAnnouncement()}`
    );
  }

  onResetFilters(): void {
    this.marketplaceService.resetFilters();
    this.searchTerm.set('');
    this.announceToScreenReader('All filters cleared');
  }

  toggleFilters(): void {
    this.filterDrawer?.toggle();
  }

  closeFilters(): void {
    this.filterDrawer?.close();
  }

  // ============================================
  // Sort & View
  // ============================================

  onSortChange(sortBy: MarketplaceFilters['sortBy']): void {
    this.marketplaceService.setSortBy(sortBy);
    this.announceToScreenReader(`Sorted by ${this.sortLabels[sortBy]}`);
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
    this.announceToScreenReader(`Switched to ${mode} view`);
  }

  // ============================================
  // Category Quick Filter
  // ============================================

  onCategoryClick(category: string): void {
    this.marketplaceService.setCategory(category);
  }

  // ============================================
  // Crop Actions
  // ============================================

  onViewDetails(crop: MarketplaceCrop): void {
    this.router.navigate(['/marketplace/crop', crop.id]);
  }

  onPlaceBid(crop: MarketplaceCrop): void {
    this.router.navigate(['/marketplace/crop', crop.id, 'bid']);
  }

  onAddToWishlist(crop: MarketplaceCrop): void {
    this.snackBar.open(`${crop.cropName} added to wishlist`, 'View', {
      duration: 3000,
      politeness: 'polite',
    });
  }

  onViewFarmer(farmerId: string): void {
    this.router.navigate(['/profile', farmerId]);
  }

  // ============================================
  // Load More
  // ============================================

  loadMore(): void {
    this.marketplaceService.loadMore();
  }

  // ============================================
  // Tracking Functions (for *ngFor)
  // ============================================

  trackByCropId(_index: number, crop: MarketplaceCrop): string {
    return crop.id;
  }

  trackByCategoryId(_index: number, category: { id: string }): string {
    return category.id;
  }

  // ============================================
  // Scroll To Top
  // ============================================

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Focus first crop card for keyboard users
    setTimeout(() => {
      this.searchInput?.nativeElement?.focus();
    }, 500);
  }

  // ============================================
  // Accessibility Helpers
  // ============================================

  private announceToScreenReader(message: string): void {
    // Create a live region announcement
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => announcement.remove(), 1000);
  }
}
