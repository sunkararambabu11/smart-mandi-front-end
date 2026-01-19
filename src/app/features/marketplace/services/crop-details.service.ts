/**
 * Crop Details Service
 * ====================
 * Signals-based service for fetching and managing crop details.
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, tap, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { QualityGrade } from './marketplace.service';

// ============================================
// Types & Interfaces
// ============================================

export interface CropImage {
  readonly id: string;
  readonly url: string;
  readonly thumbnailUrl: string;
  readonly isPrimary: boolean;
}

export interface FarmerInfo {
  readonly id: string;
  readonly name: string;
  readonly avatar?: string;
  readonly phone: string;
  readonly location: string;
  readonly district: string;
  readonly state: string;
  readonly rating: number;
  readonly totalOrders: number;
  readonly successRate: number;
  readonly memberSince: Date;
  readonly isVerified: boolean;
  readonly responseTime: string;
  readonly languages: string[];
}

export interface BidInfo {
  readonly totalBids: number;
  readonly highestBid: number;
  readonly averageBid: number;
  readonly yourBid?: number;
  readonly bidDeadline: Date;
}

export interface CropDetails {
  readonly id: string;
  readonly cropName: string;
  readonly category: string;
  readonly description: string;
  readonly quantity: number;
  readonly availableQuantity: number;
  readonly unit: string;
  readonly price: number;
  readonly minBidPrice: number;
  readonly instantBuyPrice: number;
  readonly qualityGrade: QualityGrade;
  readonly harvestDate: Date;
  readonly expiresAt: Date;
  readonly images: CropImage[];
  readonly farmer: FarmerInfo;
  readonly bidInfo: BidInfo;
  readonly isOrganic: boolean;
  readonly isFeatured: boolean;
  readonly certifications: string[];
  readonly specifications: Record<string, string>;
  readonly shippingInfo: {
    readonly availableForPickup: boolean;
    readonly availableForDelivery: boolean;
    readonly deliveryRadius: number;
    readonly estimatedDeliveryDays: number;
  };
  readonly viewCount: number;
  readonly wishlistCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PlaceBidDto {
  cropId: string;
  amount: number;
  quantity: number;
  message?: string;
}

export interface InstantBuyDto {
  cropId: string;
  quantity: number;
  deliveryAddress?: string;
  paymentMethod: 'cod' | 'online' | 'upi';
}

interface CropDetailsState {
  crop: CropDetails | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  successMessage: string | null;
}

@Injectable({ providedIn: 'root' })
export class CropDetailsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/marketplace`;

  // ============================================
  // State Signal
  // ============================================

  private readonly _state = signal<CropDetailsState>({
    crop: null,
    isLoading: false,
    isSubmitting: false,
    error: null,
    successMessage: null,
  });

  // ============================================
  // Computed Signals
  // ============================================

  readonly crop = computed(() => this._state().crop);
  readonly farmer = computed(() => this._state().crop?.farmer ?? null);
  readonly images = computed(() => this._state().crop?.images ?? []);
  readonly bidInfo = computed(() => this._state().crop?.bidInfo ?? null);
  readonly isLoading = computed(() => this._state().isLoading);
  readonly isSubmitting = computed(() => this._state().isSubmitting);
  readonly error = computed(() => this._state().error);
  readonly successMessage = computed(() => this._state().successMessage);

  /** Primary image */
  readonly primaryImage = computed(() => {
    const imgs = this.images();
    return imgs.find((i) => i.isPrimary) || imgs[0] || null;
  });

  /** Is bidding open */
  readonly isBiddingOpen = computed(() => {
    const crop = this._state().crop;
    if (!crop) return false;
    return new Date(crop.bidInfo.bidDeadline).getTime() > Date.now();
  });

  /** Time remaining for bidding */
  readonly biddingTimeRemaining = computed(() => {
    const crop = this._state().crop;
    if (!crop) return null;
    const deadline = new Date(crop.bidInfo.bidDeadline).getTime();
    const now = Date.now();
    const diff = deadline - now;
    if (diff <= 0) return 'Closed';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  });

  // ============================================
  // Public Methods
  // ============================================

  /**
   * Load crop details by ID
   */
  loadCropDetails(cropId: string): void {
    this.updateState({ isLoading: true, error: null, crop: null });

    if (!environment.production) {
      of(null)
        .pipe(delay(800))
        .subscribe(() => {
          this.updateState({
            crop: this.getMockCropDetails(cropId),
            isLoading: false,
          });
        });
      return;
    }

    this.http
      .get<CropDetails>(`${this.apiUrl}/crops/${cropId}`)
      .pipe(
        tap((crop) => this.updateState({ crop, isLoading: false })),
        catchError((error) => {
          this.updateState({ isLoading: false, error: 'Failed to load crop details' });
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  /**
   * Place a bid on the crop
   */
  placeBid(dto: PlaceBidDto): Observable<{ success: boolean; bidId: string }> {
    this.updateState({ isSubmitting: true, error: null, successMessage: null });

    if (!environment.production) {
      return of({ success: true, bidId: `bid_${Date.now()}` }).pipe(
        delay(1500),
        tap(() => {
          this.updateState({
            isSubmitting: false,
            successMessage: 'Your bid has been placed successfully!',
          });
        })
      );
    }

    return this.http.post<{ success: boolean; bidId: string }>(`${this.apiUrl}/bids`, dto).pipe(
      tap((response) => {
        this.updateState({
          isSubmitting: false,
          successMessage: 'Your bid has been placed successfully!',
        });
      }),
      catchError((error) => {
        this.updateState({ isSubmitting: false, error: 'Failed to place bid' });
        return throwError(() => error);
      })
    );
  }

  /**
   * Instant buy
   */
  instantBuy(dto: InstantBuyDto): Observable<{ success: boolean; orderId: string }> {
    this.updateState({ isSubmitting: true, error: null, successMessage: null });

    if (!environment.production) {
      return of({ success: true, orderId: `order_${Date.now()}` }).pipe(
        delay(2000),
        tap(() => {
          this.updateState({
            isSubmitting: false,
            successMessage: 'Order placed successfully! Redirecting to payment...',
          });
        })
      );
    }

    return this.http
      .post<{ success: boolean; orderId: string }>(`${this.apiUrl}/orders`, dto)
      .pipe(
        tap((response) => {
          this.updateState({
            isSubmitting: false,
            successMessage: 'Order placed successfully!',
          });
        }),
        catchError((error) => {
          this.updateState({ isSubmitting: false, error: 'Failed to place order' });
          return throwError(() => error);
        })
      );
  }

  /**
   * Add to wishlist
   */
  addToWishlist(cropId: string): Observable<boolean> {
    if (!environment.production) {
      return of(true).pipe(delay(500));
    }

    return this.http.post<boolean>(`${this.apiUrl}/wishlist`, { cropId });
  }

  /**
   * Clear messages
   */
  clearMessages(): void {
    this.updateState({ error: null, successMessage: null });
  }

  // ============================================
  // Private Methods
  // ============================================

  private updateState(partial: Partial<CropDetailsState>): void {
    this._state.update((state) => ({ ...state, ...partial }));
  }

  private getMockCropDetails(cropId: string): CropDetails {
    const now = Date.now();
    return {
      id: cropId,
      cropName: 'Organic Tomatoes',
      category: 'Vegetables',
      description: `Fresh organic tomatoes grown using sustainable farming practices. 
        These tomatoes are harvested at peak ripeness to ensure maximum flavor and nutrition. 
        Perfect for salads, cooking, or making fresh sauce. 
        
        Our farm follows strict organic guidelines with no pesticides or chemical fertilizers. 
        The tomatoes are hand-picked and sorted for quality before packaging.`,
      quantity: 500,
      availableQuantity: 450,
      unit: 'kg',
      price: 45,
      minBidPrice: 40,
      instantBuyPrice: 50,
      qualityGrade: QualityGrade.PREMIUM,
      harvestDate: new Date(now + 5 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(now + 14 * 24 * 60 * 60 * 1000),
      images: [
        {
          id: 'img_1',
          url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800',
          thumbnailUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200',
          isPrimary: true,
        },
        {
          id: 'img_2',
          url: 'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=800',
          thumbnailUrl: 'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=200',
          isPrimary: false,
        },
        {
          id: 'img_3',
          url: 'https://images.unsplash.com/photo-1561136594-7f68413baa99?w=800',
          thumbnailUrl: 'https://images.unsplash.com/photo-1561136594-7f68413baa99?w=200',
          isPrimary: false,
        },
        {
          id: 'img_4',
          url: 'https://images.unsplash.com/photo-1546470427-227c7d3c5d82?w=800',
          thumbnailUrl: 'https://images.unsplash.com/photo-1546470427-227c7d3c5d82?w=200',
          isPrimary: false,
        },
      ],
      farmer: {
        id: 'farmer_1',
        name: 'Ramesh Patil',
        avatar: undefined,
        phone: '+91 98765 43210',
        location: 'Nashik',
        district: 'Nashik',
        state: 'Maharashtra',
        rating: 4.8,
        totalOrders: 156,
        successRate: 98,
        memberSince: new Date('2020-03-15'),
        isVerified: true,
        responseTime: 'Within 2 hours',
        languages: ['Hindi', 'Marathi', 'English'],
      },
      bidInfo: {
        totalBids: 8,
        highestBid: 48,
        averageBid: 44,
        yourBid: undefined,
        bidDeadline: new Date(now + 3 * 24 * 60 * 60 * 1000),
      },
      isOrganic: true,
      isFeatured: true,
      certifications: ['FSSAI Certified', 'Organic India', 'APEDA'],
      specifications: {
        'Variety': 'Hybrid Roma',
        'Color': 'Red',
        'Size': 'Medium to Large',
        'Shelf Life': '7-10 days',
        'Storage': 'Cool, dry place',
        'Packaging': 'Crates / Boxes',
      },
      shippingInfo: {
        availableForPickup: true,
        availableForDelivery: true,
        deliveryRadius: 100,
        estimatedDeliveryDays: 2,
      },
      viewCount: 342,
      wishlistCount: 28,
      createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
    };
  }
}



