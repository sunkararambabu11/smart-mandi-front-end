import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, delay, forkJoin } from 'rxjs';
import { environment } from '@environments/environment';

/**
 * Mandi Price Information
 */
export interface MandiPrice {
  readonly id: string;
  readonly cropName: string;
  readonly localName: string;
  readonly category: string;
  readonly currentPrice: number;
  readonly previousPrice: number;
  readonly unit: string;
  readonly change: number;
  readonly changePercent: number;
  readonly trend: 'up' | 'down' | 'stable';
  readonly mandiName: string;
  readonly updatedAt: Date;
}

/**
 * Dashboard Statistics
 */
export interface DashboardStats {
  readonly activeCrops: number;
  readonly newBids: number;
  readonly totalEarnings: number;
  readonly pendingOrders: number;
  readonly completedOrders: number;
  readonly totalProducts: number;
  readonly averageRating: number;
  readonly viewsThisWeek: number;
}

/**
 * Recent Activity Item
 */
export interface ActivityItem {
  readonly id: string;
  readonly type: 'bid' | 'order' | 'view' | 'message' | 'payment';
  readonly title: string;
  readonly description: string;
  readonly amount?: number;
  readonly timestamp: Date;
  readonly isRead: boolean;
}

/**
 * Quick Action
 */
export interface QuickAction {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly route: string;
  readonly color: string;
}

/**
 * Dashboard State
 */
interface DashboardState {
  stats: DashboardStats | null;
  mandiPrices: MandiPrice[];
  activities: ActivityItem[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Farmer Dashboard Service
 * ========================
 * Signals-based state management for farmer dashboard.
 * Handles fetching mandi prices, stats, and activities.
 */
@Injectable({ providedIn: 'root' })
export class FarmerDashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/farmer/dashboard`;

  // ============================================
  // Private State Signal
  // ============================================

  private readonly _state = signal<DashboardState>({
    stats: null,
    mandiPrices: [],
    activities: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
  });

  // ============================================
  // Public Computed Signals
  // ============================================

  /** Dashboard statistics */
  readonly stats = computed(() => this._state().stats);

  /** Today's mandi prices */
  readonly mandiPrices = computed(() => this._state().mandiPrices);

  /** Top gaining crops */
  readonly topGainers = computed(() =>
    this._state()
      .mandiPrices.filter((p) => p.trend === 'up')
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5)
  );

  /** Top losing crops */
  readonly topLosers = computed(() =>
    this._state()
      .mandiPrices.filter((p) => p.trend === 'down')
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5)
  );

  /** Recent activities */
  readonly activities = computed(() => this._state().activities);

  /** Unread activities count */
  readonly unreadCount = computed(
    () => this._state().activities.filter((a) => !a.isRead).length
  );

  /** Loading state */
  readonly isLoading = computed(() => this._state().isLoading);

  /** Error state */
  readonly error = computed(() => this._state().error);

  /** Last updated time */
  readonly lastUpdated = computed(() => this._state().lastUpdated);

  /** Active crops count */
  readonly activeCrops = computed(() => this._state().stats?.activeCrops ?? 0);

  /** New bids count */
  readonly newBids = computed(() => this._state().stats?.newBids ?? 0);

  /** Total earnings */
  readonly totalEarnings = computed(
    () => this._state().stats?.totalEarnings ?? 0
  );

  /** Pending orders */
  readonly pendingOrders = computed(
    () => this._state().stats?.pendingOrders ?? 0
  );

  // ============================================
  // Quick Actions
  // ============================================

  readonly quickActions: QuickAction[] = [
    {
      id: 'add-product',
      label: 'Add Product',
      icon: 'add_circle',
      route: '/products/add',
      color: 'primary',
    },
    {
      id: 'view-bids',
      label: 'View Bids',
      icon: 'gavel',
      route: '/bids',
      color: 'accent',
    },
    {
      id: 'my-orders',
      label: 'My Orders',
      icon: 'receipt_long',
      route: '/orders',
      color: 'success',
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: 'chat',
      route: '/chat',
      color: 'info',
    },
  ];

  // ============================================
  // Public Methods
  // ============================================

  /**
   * Load all dashboard data
   */
  loadDashboard(): void {
    this.updateState({ isLoading: true, error: null });

    // In development, use mock data
    if (!environment.production) {
      this.loadMockData();
      return;
    }

    forkJoin({
      stats: this.http.get<DashboardStats>(`${this.apiUrl}/stats`),
      prices: this.http.get<MandiPrice[]>(`${this.apiUrl}/mandi-prices`),
      activities: this.http.get<ActivityItem[]>(`${this.apiUrl}/activities`),
    })
      .pipe(
        tap((data) => {
          this.updateState({
            stats: data.stats,
            mandiPrices: data.prices,
            activities: data.activities,
            isLoading: false,
            lastUpdated: new Date(),
          });
        }),
        catchError((error) => {
          this.updateState({
            isLoading: false,
            error: 'Failed to load dashboard data',
          });
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Refresh mandi prices
   */
  refreshPrices(): void {
    if (!environment.production) {
      // Simulate refresh with slightly different prices
      const currentPrices = this._state().mandiPrices;
      const updatedPrices = currentPrices.map((price) => ({
        ...price,
        currentPrice: price.currentPrice + (Math.random() - 0.5) * 10,
        updatedAt: new Date(),
      }));
      this.updateState({ mandiPrices: updatedPrices, lastUpdated: new Date() });
      return;
    }

    this.http
      .get<MandiPrice[]>(`${this.apiUrl}/mandi-prices`)
      .pipe(
        tap((prices) => {
          this.updateState({ mandiPrices: prices, lastUpdated: new Date() });
        })
      )
      .subscribe();
  }

  /**
   * Mark activity as read
   */
  markActivityRead(activityId: string): void {
    const activities = this._state().activities.map((a) =>
      a.id === activityId ? { ...a, isRead: true } : a
    );
    this.updateState({ activities });
  }

  /**
   * Mark all activities as read
   */
  markAllActivitiesRead(): void {
    const activities = this._state().activities.map((a) => ({
      ...a,
      isRead: true,
    }));
    this.updateState({ activities });
  }

  // ============================================
  // Private Methods
  // ============================================

  private updateState(partial: Partial<DashboardState>): void {
    this._state.update((state) => ({ ...state, ...partial }));
  }

  private loadMockData(): void {
    // Simulate API delay
    of(null)
      .pipe(delay(800))
      .subscribe(() => {
        this.updateState({
          stats: this.getMockStats(),
          mandiPrices: this.getMockMandiPrices(),
          activities: this.getMockActivities(),
          isLoading: false,
          lastUpdated: new Date(),
        });
      });
  }

  private getMockStats(): DashboardStats {
    return {
      activeCrops: 12,
      newBids: 8,
      totalEarnings: 245000,
      pendingOrders: 5,
      completedOrders: 47,
      totalProducts: 15,
      averageRating: 4.6,
      viewsThisWeek: 234,
    };
  }

  private getMockMandiPrices(): MandiPrice[] {
    return [
      {
        id: '1',
        cropName: 'Tomato',
        localName: 'टमाटर',
        category: 'Vegetables',
        currentPrice: 45,
        previousPrice: 42,
        unit: 'kg',
        change: 3,
        changePercent: 7.14,
        trend: 'up',
        mandiName: 'Azadpur Mandi',
        updatedAt: new Date(),
      },
      {
        id: '2',
        cropName: 'Onion',
        localName: 'प्याज',
        category: 'Vegetables',
        currentPrice: 32,
        previousPrice: 35,
        unit: 'kg',
        change: -3,
        changePercent: -8.57,
        trend: 'down',
        mandiName: 'Azadpur Mandi',
        updatedAt: new Date(),
      },
      {
        id: '3',
        cropName: 'Potato',
        localName: 'आलू',
        category: 'Vegetables',
        currentPrice: 28,
        previousPrice: 28,
        unit: 'kg',
        change: 0,
        changePercent: 0,
        trend: 'stable',
        mandiName: 'Azadpur Mandi',
        updatedAt: new Date(),
      },
      {
        id: '4',
        cropName: 'Wheat',
        localName: 'गेहूं',
        category: 'Grains',
        currentPrice: 2400,
        previousPrice: 2350,
        unit: 'quintal',
        change: 50,
        changePercent: 2.13,
        trend: 'up',
        mandiName: 'Karnal Mandi',
        updatedAt: new Date(),
      },
      {
        id: '5',
        cropName: 'Rice (Basmati)',
        localName: 'बासमती चावल',
        category: 'Grains',
        currentPrice: 4500,
        previousPrice: 4400,
        unit: 'quintal',
        change: 100,
        changePercent: 2.27,
        trend: 'up',
        mandiName: 'Karnal Mandi',
        updatedAt: new Date(),
      },
      {
        id: '6',
        cropName: 'Green Chilli',
        localName: 'हरी मिर्च',
        category: 'Vegetables',
        currentPrice: 65,
        previousPrice: 70,
        unit: 'kg',
        change: -5,
        changePercent: -7.14,
        trend: 'down',
        mandiName: 'Azadpur Mandi',
        updatedAt: new Date(),
      },
      {
        id: '7',
        cropName: 'Mango (Alphonso)',
        localName: 'आम (अल्फांसो)',
        category: 'Fruits',
        currentPrice: 350,
        previousPrice: 320,
        unit: 'kg',
        change: 30,
        changePercent: 9.38,
        trend: 'up',
        mandiName: 'Vashi Mandi',
        updatedAt: new Date(),
      },
      {
        id: '8',
        cropName: 'Cauliflower',
        localName: 'फूलगोभी',
        category: 'Vegetables',
        currentPrice: 35,
        previousPrice: 38,
        unit: 'kg',
        change: -3,
        changePercent: -7.89,
        trend: 'down',
        mandiName: 'Azadpur Mandi',
        updatedAt: new Date(),
      },
    ];
  }

  private getMockActivities(): ActivityItem[] {
    const now = Date.now();
    return [
      {
        id: '1',
        type: 'bid',
        title: 'New Bid Received',
        description: 'Fresh Mart placed a bid of ₹48/kg on Tomatoes',
        amount: 48,
        timestamp: new Date(now - 1000 * 60 * 15),
        isRead: false,
      },
      {
        id: '2',
        type: 'order',
        title: 'Order Confirmed',
        description: 'Order #1234 for 50kg Potatoes confirmed',
        amount: 1400,
        timestamp: new Date(now - 1000 * 60 * 45),
        isRead: false,
      },
      {
        id: '3',
        type: 'payment',
        title: 'Payment Received',
        description: 'Payment of ₹12,500 credited to your account',
        amount: 12500,
        timestamp: new Date(now - 1000 * 60 * 120),
        isRead: true,
      },
      {
        id: '4',
        type: 'view',
        title: 'Product Views',
        description: 'Your Organic Tomatoes got 45 views today',
        timestamp: new Date(now - 1000 * 60 * 180),
        isRead: true,
      },
      {
        id: '5',
        type: 'message',
        title: 'New Message',
        description: 'Buyer inquiry about bulk order for Rice',
        timestamp: new Date(now - 1000 * 60 * 240),
        isRead: false,
      },
    ];
  }
}



