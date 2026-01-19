import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, of, delay, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { SocketService, BidEvent } from '@infrastructure/services/socket.service';

/**
 * Bid Status
 */
export enum BidStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  COUNTERED = 'COUNTERED',
}

/**
 * Bid Model
 */
export interface Bid {
  readonly id: string;
  readonly cropId: string;
  readonly cropName: string;
  readonly buyerId: string;
  readonly buyerName: string;
  readonly buyerAvatar?: string;
  readonly buyerRating: number;
  readonly buyerOrderCount: number;
  readonly amount: number;
  readonly quantity: number;
  readonly unit: string;
  readonly totalValue: number;
  readonly message?: string;
  readonly status: BidStatus;
  readonly isHighest: boolean;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly respondedAt?: Date;
}

/**
 * Crop Bid Summary
 */
export interface CropBidSummary {
  readonly cropId: string;
  readonly cropName: string;
  readonly cropImage: string;
  readonly totalBids: number;
  readonly pendingBids: number;
  readonly highestBid: number;
  readonly averageBid: number;
  readonly listedPrice: number;
  readonly quantity: number;
  readonly unit: string;
}

/**
 * Bid Service State
 */
interface BidServiceState {
  bids: Bid[];
  cropSummary: CropBidSummary | null;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  successMessage: string | null;
}

/**
 * Bid Service
 * ===========
 * Signals-based service for managing crop bids with real-time updates.
 */
@Injectable({ providedIn: 'root' })
export class BidService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly socketService = inject(SocketService);
  private readonly apiUrl = `${environment.apiUrl}/farmer/bids`;
  private readonly destroy$ = new Subject<void>();

  // ============================================
  // Private State Signal
  // ============================================

  private readonly _state = signal<BidServiceState>({
    bids: [],
    cropSummary: null,
    isLoading: false,
    isProcessing: false,
    error: null,
    successMessage: null,
  });

  // ============================================
  // Public Computed Signals
  // ============================================

  /** All bids for current crop */
  readonly bids = computed(() => this._state().bids);

  /** Pending bids only */
  readonly pendingBids = computed(() =>
    this._state().bids.filter((b) => b.status === BidStatus.PENDING)
  );

  /** Accepted bids */
  readonly acceptedBids = computed(() =>
    this._state().bids.filter((b) => b.status === BidStatus.ACCEPTED)
  );

  /** Highest bid */
  readonly highestBid = computed(() => {
    const pending = this.pendingBids();
    if (pending.length === 0) return null;
    return pending.reduce((max, bid) => (bid.amount > max.amount ? bid : max));
  });

  /** Crop summary */
  readonly cropSummary = computed(() => this._state().cropSummary);

  /** Loading state */
  readonly isLoading = computed(() => this._state().isLoading);

  /** Processing state (accepting/rejecting) */
  readonly isProcessing = computed(() => this._state().isProcessing);

  /** Error message */
  readonly error = computed(() => this._state().error);

  /** Success message */
  readonly successMessage = computed(() => this._state().successMessage);

  /** Total bid count */
  readonly totalBidCount = computed(() => this._state().bids.length);

  /** Pending bid count */
  readonly pendingBidCount = computed(() => this.pendingBids().length);

  // ============================================
  // Lifecycle
  // ============================================

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // Public Methods
  // ============================================

  /**
   * Load bids for a crop
   */
  loadBidsForCrop(cropId: string): void {
    this.updateState({ isLoading: true, error: null });

    // Connect socket and join room
    this.socketService.connect();
    this.socketService.joinCropBidsRoom(cropId);
    this.setupSocketListeners(cropId);

    if (!environment.production) {
      // Use mock data in development
      of(null)
        .pipe(delay(800))
        .subscribe(() => {
          this.updateState({
            bids: this.getMockBids(cropId),
            cropSummary: this.getMockCropSummary(cropId),
            isLoading: false,
          });
        });
      return;
    }

    this.http
      .get<{ bids: Bid[]; summary: CropBidSummary }>(`${this.apiUrl}/crop/${cropId}`)
      .pipe(
        tap((response) => {
          this.updateState({
            bids: response.bids,
            cropSummary: response.summary,
            isLoading: false,
          });
        }),
        catchError((error) => {
          this.updateState({
            isLoading: false,
            error: 'Failed to load bids',
          });
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  /**
   * Leave bid room
   */
  leaveBidRoom(cropId: string): void {
    this.socketService.leaveCropBidsRoom(cropId);
  }

  /**
   * Accept a bid
   */
  acceptBid(bidId: string): Observable<Bid> {
    this.updateState({ isProcessing: true, error: null, successMessage: null });

    if (!environment.production) {
      return of(this.updateBidStatus(bidId, BidStatus.ACCEPTED)).pipe(
        delay(1000),
        tap((bid) => {
          this.updateState({
            isProcessing: false,
            successMessage: `Bid from ${bid.buyerName} accepted!`,
          });
        })
      );
    }

    return this.http.post<Bid>(`${this.apiUrl}/${bidId}/accept`, {}).pipe(
      tap((bid) => {
        this.updateBidInState(bid);
        this.updateState({
          isProcessing: false,
          successMessage: `Bid from ${bid.buyerName} accepted!`,
        });
      }),
      catchError((error) => {
        this.updateState({
          isProcessing: false,
          error: 'Failed to accept bid',
        });
        return throwError(() => error);
      })
    );
  }

  /**
   * Reject a bid
   */
  rejectBid(bidId: string, reason?: string): Observable<Bid> {
    this.updateState({ isProcessing: true, error: null, successMessage: null });

    if (!environment.production) {
      return of(this.updateBidStatus(bidId, BidStatus.REJECTED)).pipe(
        delay(1000),
        tap((bid) => {
          this.updateState({
            isProcessing: false,
            successMessage: `Bid rejected`,
          });
        })
      );
    }

    return this.http.post<Bid>(`${this.apiUrl}/${bidId}/reject`, { reason }).pipe(
      tap((bid) => {
        this.updateBidInState(bid);
        this.updateState({
          isProcessing: false,
          successMessage: 'Bid rejected',
        });
      }),
      catchError((error) => {
        this.updateState({
          isProcessing: false,
          error: 'Failed to reject bid',
        });
        return throwError(() => error);
      })
    );
  }

  /**
   * Counter a bid with new price
   */
  counterBid(bidId: string, counterAmount: number): Observable<Bid> {
    this.updateState({ isProcessing: true, error: null, successMessage: null });

    if (!environment.production) {
      return of(this.updateBidStatus(bidId, BidStatus.COUNTERED)).pipe(
        delay(1000),
        tap(() => {
          this.updateState({
            isProcessing: false,
            successMessage: `Counter offer of ₹${counterAmount} sent`,
          });
        })
      );
    }

    return this.http
      .post<Bid>(`${this.apiUrl}/${bidId}/counter`, { counterAmount })
      .pipe(
        tap((bid) => {
          this.updateBidInState(bid);
          this.updateState({
            isProcessing: false,
            successMessage: `Counter offer of ₹${counterAmount} sent`,
          });
        }),
        catchError((error) => {
          this.updateState({
            isProcessing: false,
            error: 'Failed to send counter offer',
          });
          return throwError(() => error);
        })
      );
  }

  /**
   * Clear messages
   */
  clearMessages(): void {
    this.updateState({ error: null, successMessage: null });
  }

  // ============================================
  // Socket Event Handlers
  // ============================================

  private setupSocketListeners(cropId: string): void {
    // New bid received
    this.socketService
      .on('bid:new')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (event.cropId === cropId) {
          this.handleNewBid(event);
        }
      });

    // Bid updated
    this.socketService
      .on('bid:updated')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (event.cropId === cropId) {
          this.handleBidUpdated(event);
        }
      });
  }

  private handleNewBid(event: BidEvent): void {
    const newBid: Bid = {
      id: event.bidId,
      cropId: event.cropId,
      cropName: this._state().cropSummary?.cropName || '',
      buyerId: event.buyerId,
      buyerName: event.buyerName,
      buyerRating: 4.5,
      buyerOrderCount: 12,
      amount: event.amount,
      quantity: event.quantity,
      unit: 'kg',
      totalValue: event.amount * event.quantity,
      message: event.message,
      status: BidStatus.PENDING,
      isHighest: false,
      createdAt: new Date(event.timestamp),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    this.updateState({
      bids: [newBid, ...this._state().bids],
    });

    this.recalculateHighestBid();
  }

  private handleBidUpdated(event: BidEvent): void {
    // Update bid in state
    const bids = this._state().bids.map((bid) =>
      bid.id === event.bidId
        ? { ...bid, amount: event.amount, quantity: event.quantity }
        : bid
    );
    this.updateState({ bids });
    this.recalculateHighestBid();
  }

  // ============================================
  // Private Methods
  // ============================================

  private updateState(partial: Partial<BidServiceState>): void {
    this._state.update((state) => ({ ...state, ...partial }));
  }

  private updateBidInState(updatedBid: Bid): void {
    const bids = this._state().bids.map((bid) =>
      bid.id === updatedBid.id ? updatedBid : bid
    );
    this.updateState({ bids });
    this.recalculateHighestBid();
  }

  private updateBidStatus(bidId: string, status: BidStatus): Bid {
    const bid = this._state().bids.find((b) => b.id === bidId);
    if (!bid) throw new Error('Bid not found');

    const updatedBid: Bid = {
      ...bid,
      status,
      respondedAt: new Date(),
    };

    this.updateBidInState(updatedBid);
    return updatedBid;
  }

  private recalculateHighestBid(): void {
    const pending = this._state().bids.filter(
      (b) => b.status === BidStatus.PENDING
    );
    if (pending.length === 0) return;

    const maxAmount = Math.max(...pending.map((b) => b.amount));
    const bids = this._state().bids.map((bid) => ({
      ...bid,
      isHighest: bid.status === BidStatus.PENDING && bid.amount === maxAmount,
    }));

    this.updateState({ bids });
  }

  private getMockBids(cropId: string): Bid[] {
    const now = Date.now();
    return [
      {
        id: 'bid_1',
        cropId,
        cropName: 'Organic Tomatoes',
        buyerId: 'buyer_1',
        buyerName: 'Fresh Mart Stores',
        buyerAvatar: undefined,
        buyerRating: 4.8,
        buyerOrderCount: 45,
        amount: 52,
        quantity: 200,
        unit: 'kg',
        totalValue: 10400,
        message: 'Interested in bulk purchase. Can pickup tomorrow.',
        status: BidStatus.PENDING,
        isHighest: true,
        createdAt: new Date(now - 15 * 60 * 1000),
        expiresAt: new Date(now + 23 * 60 * 60 * 1000),
      },
      {
        id: 'bid_2',
        cropId,
        cropName: 'Organic Tomatoes',
        buyerId: 'buyer_2',
        buyerName: 'Green Grocers Ltd',
        buyerRating: 4.5,
        buyerOrderCount: 28,
        amount: 48,
        quantity: 150,
        unit: 'kg',
        totalValue: 7200,
        message: 'Regular supplier needed',
        status: BidStatus.PENDING,
        isHighest: false,
        createdAt: new Date(now - 45 * 60 * 1000),
        expiresAt: new Date(now + 22 * 60 * 60 * 1000),
      },
      {
        id: 'bid_3',
        cropId,
        cropName: 'Organic Tomatoes',
        buyerId: 'buyer_3',
        buyerName: 'Hotel Grand Palace',
        buyerRating: 4.9,
        buyerOrderCount: 67,
        amount: 50,
        quantity: 100,
        unit: 'kg',
        totalValue: 5000,
        status: BidStatus.PENDING,
        isHighest: false,
        createdAt: new Date(now - 2 * 60 * 60 * 1000),
        expiresAt: new Date(now + 20 * 60 * 60 * 1000),
      },
      {
        id: 'bid_4',
        cropId,
        cropName: 'Organic Tomatoes',
        buyerId: 'buyer_4',
        buyerName: 'Veggie Express',
        buyerRating: 4.2,
        buyerOrderCount: 15,
        amount: 46,
        quantity: 300,
        unit: 'kg',
        totalValue: 13800,
        message: 'Can wait for harvest',
        status: BidStatus.ACCEPTED,
        isHighest: false,
        createdAt: new Date(now - 5 * 60 * 60 * 1000),
        expiresAt: new Date(now + 18 * 60 * 60 * 1000),
        respondedAt: new Date(now - 3 * 60 * 60 * 1000),
      },
      {
        id: 'bid_5',
        cropId,
        cropName: 'Organic Tomatoes',
        buyerId: 'buyer_5',
        buyerName: 'Local Market Traders',
        buyerRating: 3.8,
        buyerOrderCount: 8,
        amount: 42,
        quantity: 50,
        unit: 'kg',
        totalValue: 2100,
        status: BidStatus.REJECTED,
        isHighest: false,
        createdAt: new Date(now - 8 * 60 * 60 * 1000),
        expiresAt: new Date(now + 15 * 60 * 60 * 1000),
        respondedAt: new Date(now - 6 * 60 * 60 * 1000),
      },
    ];
  }

  private getMockCropSummary(cropId: string): CropBidSummary {
    return {
      cropId,
      cropName: 'Organic Tomatoes',
      cropImage: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
      totalBids: 5,
      pendingBids: 3,
      highestBid: 52,
      averageBid: 47.6,
      listedPrice: 45,
      quantity: 500,
      unit: 'kg',
    };
  }
}



