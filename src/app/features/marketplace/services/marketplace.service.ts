/**
 * Marketplace Service
 * ====================
 * Pure signals-based service for marketplace operations.
 * Handles crop listings, filtering, search, and pagination.
 * 
 * Refactored to:
 * - Replace BehaviorSubject with signals
 * - Use effect() for debounced search
 * - Eliminate manual subscriptions
 */

import { Injectable, inject, signal, computed, effect, DestroyRef } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, tap, of, delay } from 'rxjs';
import { environment } from '@environments/environment';

// ============================================
// Types & Interfaces
// ============================================

export enum QualityGrade {
  PREMIUM = 'PREMIUM',
  GRADE_A = 'GRADE_A',
  GRADE_B = 'GRADE_B',
  STANDARD = 'STANDARD',
}

export interface MarketplaceCrop {
  readonly id: string;
  readonly farmerId: string;
  readonly farmerName: string;
  readonly farmerRating: number;
  readonly farmerLocation: string;
  readonly cropName: string;
  readonly category: string;
  readonly quantity: number;
  readonly unit: string;
  readonly price: number;
  readonly qualityGrade: QualityGrade;
  readonly harvestDate: Date;
  readonly images: string[];
  readonly description?: string;
  readonly isOrganic: boolean;
  readonly isFeatured: boolean;
  readonly bidCount: number;
  readonly viewCount: number;
  readonly createdAt: Date;
}

export interface CropCategory {
  readonly id: string;
  readonly name: string;
  readonly localName: string;
  readonly icon: string;
  readonly count: number;
}

export interface Location {
  readonly id: string;
  readonly name: string;
  readonly state: string;
  readonly count: number;
}

export interface PriceRange {
  readonly min: number;
  readonly max: number;
}

export interface MarketplaceFilters {
  search: string;
  category: string;
  location: string;
  qualityGrades: QualityGrade[];
  priceRange: PriceRange;
  isOrganic: boolean | null;
  sortBy: 'newest' | 'price_low' | 'price_high' | 'popular' | 'rating';
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface MarketplaceState {
  crops: MarketplaceCrop[];
  categories: CropCategory[];
  locations: Location[];
  filters: MarketplaceFilters;
  pagination: PaginationState;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

// ============================================
// Default Values
// ============================================

const DEFAULT_FILTERS: MarketplaceFilters = {
  search: '',
  category: '',
  location: '',
  qualityGrades: [],
  priceRange: { min: 0, max: 10000 },
  isOrganic: null,
  sortBy: 'newest',
};

const DEFAULT_PAGINATION: PaginationState = {
  page: 1,
  pageSize: 12,
  total: 0,
  totalPages: 0,
};

@Injectable({ providedIn: 'root' })
export class MarketplaceService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiUrl = `${environment.apiUrl}/marketplace`;

  // ============================================
  // Private State Signal
  // ============================================

  private readonly _state = signal<MarketplaceState>({
    crops: [],
    categories: [],
    locations: [],
    filters: { ...DEFAULT_FILTERS },
    pagination: { ...DEFAULT_PAGINATION },
    isLoading: false,
    isLoadingMore: false,
    error: null,
  });

  // ============================================
  // Search Signal (replaces BehaviorSubject)
  // ============================================

  /** Raw search term input */
  private readonly _searchTerm = signal('');

  /** Debounce timer for search */
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  /** Debounced search term - updated after 400ms delay */
  readonly debouncedSearchTerm = signal('');

  // ============================================
  // Public Computed Signals
  // ============================================

  /** All crops */
  readonly crops = computed(() => this._state().crops);

  /** Featured crops */
  readonly featuredCrops = computed(() =>
    this._state().crops.filter((c) => c.isFeatured)
  );

  /** Categories with counts */
  readonly categories = computed(() => this._state().categories);

  /** Available locations */
  readonly locations = computed(() => this._state().locations);

  /** Current filters */
  readonly filters = computed(() => this._state().filters);

  /** Pagination state */
  readonly pagination = computed(() => this._state().pagination);

  /** Loading state */
  readonly isLoading = computed(() => this._state().isLoading);

  /** Loading more state */
  readonly isLoadingMore = computed(() => this._state().isLoadingMore);

  /** Error message */
  readonly error = computed(() => this._state().error);

  /** Has more pages */
  readonly hasMore = computed(() => {
    const p = this._state().pagination;
    return p.page < p.totalPages;
  });

  /** Active filter count */
  readonly activeFilterCount = computed(() => {
    const f = this._state().filters;
    let count = 0;
    if (f.search) count++;
    if (f.category) count++;
    if (f.location) count++;
    if (f.qualityGrades.length > 0) count++;
    if (f.isOrganic !== null) count++;
    if (f.priceRange.min > 0 || f.priceRange.max < 10000) count++;
    return count;
  });

  /** Is any filter active */
  readonly hasActiveFilters = computed(() => this.activeFilterCount() > 0);

  /** Price range bounds (for slider) */
  readonly priceRangeBounds = computed(() => {
    const crops = this._state().crops;
    if (crops.length === 0) return { min: 0, max: 10000 };
    const prices = crops.map((c) => c.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  });

  /** Search is pending debounce */
  readonly isSearchPending = computed(() => 
    this._searchTerm() !== this.debouncedSearchTerm()
  );

  // ============================================
  // Constructor
  // ============================================

  constructor() {
    // Effect to handle debounced search (replaces RxJS subscription)
    effect(() => {
      const searchTerm = this.debouncedSearchTerm();
      const currentFilter = this._state().filters.search;
      
      // Only trigger search if debounced value differs from current filter
      if (searchTerm !== currentFilter) {
        this.updateFilters({ search: searchTerm });
        this.loadCrops();
      }
    });

    // Load initial data
    this.loadInitialData();
  }

  // ============================================
  // Public Methods
  // ============================================

  /**
   * Load initial data (categories, locations, crops)
   */
  loadInitialData(): void {
    this.updateState({ isLoading: true, error: null });

    if (!environment.production) {
      // Mock data for development
      of(null)
        .pipe(
          delay(800),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => {
          this.updateState({
            categories: this.getMockCategories(),
            locations: this.getMockLocations(),
            crops: this.getMockCrops(),
            pagination: {
              page: 1,
              pageSize: 12,
              total: 24,
              totalPages: 2,
            },
            isLoading: false,
          });
        });
      return;
    }

    // Real API calls would go here
    this.loadCrops();
    this.loadCategories();
    this.loadLocations();
  }

  /**
   * Load crops with current filters
   */
  loadCrops(): void {
    this.updateState({ isLoading: true, error: null });

    if (!environment.production) {
      of(null)
        .pipe(
          delay(600),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => {
          const filteredCrops = this.applyFiltersToMockData(this.getMockCrops());
          this.updateState({
            crops: filteredCrops,
            pagination: {
              ...this._state().pagination,
              total: filteredCrops.length,
              totalPages: Math.ceil(filteredCrops.length / 12),
            },
            isLoading: false,
          });
        });
      return;
    }

    const params = this.buildHttpParams();
    this.http
      .get<{ data: MarketplaceCrop[]; pagination: PaginationState }>(
        `${this.apiUrl}/crops`,
        { params }
      )
      .pipe(
        tap((response) => {
          this.updateState({
            crops: response.data,
            pagination: response.pagination,
            isLoading: false,
          });
        }),
        catchError((error) => {
          this.updateState({
            isLoading: false,
            error: 'Failed to load crops',
          });
          throw error;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Load more crops (pagination)
   */
  loadMore(): void {
    if (!this.hasMore() || this.isLoadingMore()) return;

    this.updateState({ isLoadingMore: true });

    const nextPage = this._state().pagination.page + 1;

    if (!environment.production) {
      of(null)
        .pipe(
          delay(600),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => {
          const moreCrops = this.getMockCrops().slice(0, 6);
          this.updateState({
            crops: [...this._state().crops, ...moreCrops],
            pagination: {
              ...this._state().pagination,
              page: nextPage,
            },
            isLoadingMore: false,
          });
        });
      return;
    }

    const params = this.buildHttpParams().set('page', nextPage.toString());
    this.http
      .get<{ data: MarketplaceCrop[]; pagination: PaginationState }>(
        `${this.apiUrl}/crops`,
        { params }
      )
      .pipe(
        tap((response) => {
          this.updateState({
            crops: [...this._state().crops, ...response.data],
            pagination: response.pagination,
            isLoadingMore: false,
          });
        }),
        catchError((error) => {
          this.updateState({ isLoadingMore: false });
          throw error;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Update search term (triggers debounced search via effect)
   */
  search(term: string): void {
    this._searchTerm.set(term);
    
    // Clear existing timer
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    
    // Set new debounce timer (replaces RxJS debounceTime)
    this.searchDebounceTimer = setTimeout(() => {
      this.debouncedSearchTerm.set(term);
      this.searchDebounceTimer = null;
    }, 400);
  }

  /**
   * Update filters and reload
   */
  updateFilters(partial: Partial<MarketplaceFilters>): void {
    const newFilters = { ...this._state().filters, ...partial };
    this.updateState({
      filters: newFilters,
      pagination: { ...DEFAULT_PAGINATION },
    });
  }

  /**
   * Apply filters and reload crops
   */
  applyFilters(): void {
    this.loadCrops();
  }

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this._searchTerm.set('');
    this.debouncedSearchTerm.set('');
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
    this.updateState({
      filters: { ...DEFAULT_FILTERS },
      pagination: { ...DEFAULT_PAGINATION },
    });
    this.loadCrops();
  }

  /**
   * Set sort option
   */
  setSortBy(sortBy: MarketplaceFilters['sortBy']): void {
    this.updateFilters({ sortBy });
    this.loadCrops();
  }

  /**
   * Toggle quality grade filter
   */
  toggleQualityGrade(grade: QualityGrade): void {
    const current = this._state().filters.qualityGrades;
    const updated = current.includes(grade)
      ? current.filter((g) => g !== grade)
      : [...current, grade];
    this.updateFilters({ qualityGrades: updated });
  }

  /**
   * Set category filter
   */
  setCategory(category: string): void {
    this.updateFilters({ category });
    this.loadCrops();
  }

  /**
   * Set location filter
   */
  setLocation(location: string): void {
    this.updateFilters({ location });
    this.loadCrops();
  }

  /**
   * Set price range
   */
  setPriceRange(min: number, max: number): void {
    this.updateFilters({ priceRange: { min, max } });
  }

  /**
   * Toggle organic filter
   */
  toggleOrganic(): void {
    const current = this._state().filters.isOrganic;
    const next = current === null ? true : current === true ? false : null;
    this.updateFilters({ isOrganic: next });
    this.loadCrops();
  }

  // ============================================
  // Private Methods
  // ============================================

  private updateState(partial: Partial<MarketplaceState>): void {
    this._state.update((state) => ({ ...state, ...partial }));
  }

  private buildHttpParams(): HttpParams {
    const f = this._state().filters;
    const p = this._state().pagination;

    let params = new HttpParams()
      .set('page', p.page.toString())
      .set('pageSize', p.pageSize.toString())
      .set('sortBy', f.sortBy);

    if (f.search) params = params.set('search', f.search);
    if (f.category) params = params.set('category', f.category);
    if (f.location) params = params.set('location', f.location);
    if (f.qualityGrades.length > 0) {
      params = params.set('qualityGrades', f.qualityGrades.join(','));
    }
    if (f.isOrganic !== null) {
      params = params.set('isOrganic', f.isOrganic.toString());
    }
    if (f.priceRange.min > 0) {
      params = params.set('minPrice', f.priceRange.min.toString());
    }
    if (f.priceRange.max < 10000) {
      params = params.set('maxPrice', f.priceRange.max.toString());
    }

    return params;
  }

  private loadCategories(): void {
    this.http
      .get<CropCategory[]>(`${this.apiUrl}/categories`)
      .pipe(
        tap((categories) => this.updateState({ categories })),
        catchError(() => of([])),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private loadLocations(): void {
    this.http
      .get<Location[]>(`${this.apiUrl}/locations`)
      .pipe(
        tap((locations) => this.updateState({ locations })),
        catchError(() => of([])),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private applyFiltersToMockData(crops: MarketplaceCrop[]): MarketplaceCrop[] {
    const f = this._state().filters;
    let filtered = [...crops];

    // Search filter
    if (f.search) {
      const term = f.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.cropName.toLowerCase().includes(term) ||
          c.category.toLowerCase().includes(term) ||
          c.farmerName.toLowerCase().includes(term) ||
          c.farmerLocation.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (f.category) {
      filtered = filtered.filter((c) => c.category === f.category);
    }

    // Location filter
    if (f.location) {
      filtered = filtered.filter((c) => c.farmerLocation.includes(f.location));
    }

    // Quality grades filter
    if (f.qualityGrades.length > 0) {
      filtered = filtered.filter((c) => f.qualityGrades.includes(c.qualityGrade));
    }

    // Organic filter
    if (f.isOrganic !== null) {
      filtered = filtered.filter((c) => c.isOrganic === f.isOrganic);
    }

    // Price range filter
    filtered = filtered.filter(
      (c) => c.price >= f.priceRange.min && c.price <= f.priceRange.max
    );

    // Sorting
    switch (f.sortBy) {
      case 'newest':
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        filtered.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case 'rating':
        filtered.sort((a, b) => b.farmerRating - a.farmerRating);
        break;
    }

    return filtered;
  }

  // ============================================
  // Mock Data
  // ============================================

  private getMockCategories(): CropCategory[] {
    return [
      { id: '1', name: 'Vegetables', localName: 'सब्जियां', icon: 'eco', count: 45 },
      { id: '2', name: 'Fruits', localName: 'फल', icon: 'nutrition', count: 32 },
      { id: '3', name: 'Grains', localName: 'अनाज', icon: 'grain', count: 28 },
      { id: '4', name: 'Pulses', localName: 'दालें', icon: 'spa', count: 18 },
      { id: '5', name: 'Spices', localName: 'मसाले', icon: 'local_fire_department', count: 22 },
      { id: '6', name: 'Oilseeds', localName: 'तिलहन', icon: 'water_drop', count: 15 },
    ];
  }

  private getMockLocations(): Location[] {
    return [
      { id: '1', name: 'Nashik', state: 'Maharashtra', count: 42 },
      { id: '2', name: 'Pune', state: 'Maharashtra', count: 38 },
      { id: '3', name: 'Nagpur', state: 'Maharashtra', count: 25 },
      { id: '4', name: 'Indore', state: 'Madhya Pradesh', count: 31 },
      { id: '5', name: 'Jaipur', state: 'Rajasthan', count: 28 },
      { id: '6', name: 'Lucknow', state: 'Uttar Pradesh', count: 35 },
    ];
  }

  private getMockCrops(): MarketplaceCrop[] {
    const now = Date.now();
    return [
      {
        id: 'crop_1',
        farmerId: 'farmer_1',
        farmerName: 'Ramesh Patil',
        farmerRating: 4.8,
        farmerLocation: 'Nashik, Maharashtra',
        cropName: 'Organic Tomatoes',
        category: 'Vegetables',
        quantity: 500,
        unit: 'kg',
        price: 45,
        qualityGrade: QualityGrade.PREMIUM,
        harvestDate: new Date(now + 7 * 24 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400'],
        description: 'Fresh organic tomatoes grown without pesticides',
        isOrganic: true,
        isFeatured: true,
        bidCount: 5,
        viewCount: 234,
        createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'crop_2',
        farmerId: 'farmer_2',
        farmerName: 'Suresh Kumar',
        farmerRating: 4.5,
        farmerLocation: 'Indore, Madhya Pradesh',
        cropName: 'Basmati Rice',
        category: 'Grains',
        quantity: 2000,
        unit: 'kg',
        price: 85,
        qualityGrade: QualityGrade.GRADE_A,
        harvestDate: new Date(now + 14 * 24 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'],
        description: 'Premium aged basmati rice',
        isOrganic: false,
        isFeatured: true,
        bidCount: 8,
        viewCount: 456,
        createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'crop_3',
        farmerId: 'farmer_3',
        farmerName: 'Priya Sharma',
        farmerRating: 4.9,
        farmerLocation: 'Jaipur, Rajasthan',
        cropName: 'Alphonso Mangoes',
        category: 'Fruits',
        quantity: 300,
        unit: 'kg',
        price: 350,
        qualityGrade: QualityGrade.PREMIUM,
        harvestDate: new Date(now + 5 * 24 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=400'],
        description: 'Sweet Alphonso mangoes from Ratnagiri',
        isOrganic: false,
        isFeatured: true,
        bidCount: 12,
        viewCount: 789,
        createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'crop_4',
        farmerId: 'farmer_4',
        farmerName: 'Vikram Singh',
        farmerRating: 4.3,
        farmerLocation: 'Lucknow, Uttar Pradesh',
        cropName: 'Fresh Potatoes',
        category: 'Vegetables',
        quantity: 1500,
        unit: 'kg',
        price: 28,
        qualityGrade: QualityGrade.GRADE_A,
        harvestDate: new Date(now + 3 * 24 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1518977676601-b53f82abe3b2?w=400'],
        description: 'Farm fresh potatoes',
        isOrganic: false,
        isFeatured: false,
        bidCount: 3,
        viewCount: 123,
        createdAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'crop_5',
        farmerId: 'farmer_5',
        farmerName: 'Anita Desai',
        farmerRating: 4.7,
        farmerLocation: 'Pune, Maharashtra',
        cropName: 'Green Chillies',
        category: 'Vegetables',
        quantity: 200,
        unit: 'kg',
        price: 65,
        qualityGrade: QualityGrade.PREMIUM,
        harvestDate: new Date(now + 2 * 24 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=400'],
        description: 'Spicy green chillies',
        isOrganic: true,
        isFeatured: false,
        bidCount: 4,
        viewCount: 167,
        createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'crop_6',
        farmerId: 'farmer_6',
        farmerName: 'Mohan Yadav',
        farmerRating: 4.4,
        farmerLocation: 'Nagpur, Maharashtra',
        cropName: 'Red Onions',
        category: 'Vegetables',
        quantity: 1000,
        unit: 'kg',
        price: 32,
        qualityGrade: QualityGrade.GRADE_A,
        harvestDate: new Date(now + 4 * 24 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400'],
        description: 'Fresh red onions from Nashik',
        isOrganic: false,
        isFeatured: false,
        bidCount: 6,
        viewCount: 289,
        createdAt: new Date(now - 6 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'crop_7',
        farmerId: 'farmer_7',
        farmerName: 'Kavita Joshi',
        farmerRating: 4.6,
        farmerLocation: 'Nashik, Maharashtra',
        cropName: 'Organic Spinach',
        category: 'Vegetables',
        quantity: 100,
        unit: 'kg',
        price: 40,
        qualityGrade: QualityGrade.PREMIUM,
        harvestDate: new Date(now + 1 * 24 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400'],
        description: 'Fresh organic spinach leaves',
        isOrganic: true,
        isFeatured: false,
        bidCount: 2,
        viewCount: 98,
        createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'crop_8',
        farmerId: 'farmer_8',
        farmerName: 'Rajesh Gupta',
        farmerRating: 4.2,
        farmerLocation: 'Indore, Madhya Pradesh',
        cropName: 'Wheat',
        category: 'Grains',
        quantity: 5000,
        unit: 'kg',
        price: 24,
        qualityGrade: QualityGrade.GRADE_B,
        harvestDate: new Date(now + 21 * 24 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400'],
        description: 'High quality wheat grains',
        isOrganic: false,
        isFeatured: false,
        bidCount: 7,
        viewCount: 345,
        createdAt: new Date(now - 8 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'crop_9',
        farmerId: 'farmer_9',
        farmerName: 'Sunita Patel',
        farmerRating: 4.8,
        farmerLocation: 'Pune, Maharashtra',
        cropName: 'Turmeric',
        category: 'Spices',
        quantity: 150,
        unit: 'kg',
        price: 120,
        qualityGrade: QualityGrade.PREMIUM,
        harvestDate: new Date(now + 10 * 24 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400'],
        description: 'Organic turmeric with high curcumin content',
        isOrganic: true,
        isFeatured: true,
        bidCount: 9,
        viewCount: 512,
        createdAt: new Date(now - 9 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'crop_10',
        farmerId: 'farmer_10',
        farmerName: 'Anil Verma',
        farmerRating: 4.1,
        farmerLocation: 'Lucknow, Uttar Pradesh',
        cropName: 'Moong Dal',
        category: 'Pulses',
        quantity: 800,
        unit: 'kg',
        price: 95,
        qualityGrade: QualityGrade.GRADE_A,
        harvestDate: new Date(now + 12 * 24 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400'],
        description: 'Premium quality moong dal',
        isOrganic: false,
        isFeatured: false,
        bidCount: 4,
        viewCount: 178,
        createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'crop_11',
        farmerId: 'farmer_11',
        farmerName: 'Deepak Sharma',
        farmerRating: 4.5,
        farmerLocation: 'Jaipur, Rajasthan',
        cropName: 'Groundnuts',
        category: 'Oilseeds',
        quantity: 600,
        unit: 'kg',
        price: 75,
        qualityGrade: QualityGrade.GRADE_A,
        harvestDate: new Date(now + 8 * 24 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1567892737950-30c4db37cd89?w=400'],
        description: 'Fresh groundnuts for oil extraction',
        isOrganic: false,
        isFeatured: false,
        bidCount: 5,
        viewCount: 234,
        createdAt: new Date(now - 11 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'crop_12',
        farmerId: 'farmer_12',
        farmerName: 'Meena Kulkarni',
        farmerRating: 4.9,
        farmerLocation: 'Nashik, Maharashtra',
        cropName: 'Organic Carrots',
        category: 'Vegetables',
        quantity: 400,
        unit: 'kg',
        price: 38,
        qualityGrade: QualityGrade.PREMIUM,
        harvestDate: new Date(now + 6 * 24 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400'],
        description: 'Sweet organic carrots',
        isOrganic: true,
        isFeatured: false,
        bidCount: 3,
        viewCount: 145,
        createdAt: new Date(now - 12 * 24 * 60 * 60 * 1000),
      },
    ];
  }
}
