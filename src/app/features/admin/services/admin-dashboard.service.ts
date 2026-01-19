/**
 * Admin Dashboard Service
 * =======================
 * Signals-based service for admin dashboard data and analytics.
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, delay, tap, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';

// ============================================
// Enums & Types
// ============================================

export enum DisputeStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
}

export enum DisputeType {
  QUALITY = 'QUALITY',
  PAYMENT = 'PAYMENT',
  DELIVERY = 'DELIVERY',
  FRAUD = 'FRAUD',
  OTHER = 'OTHER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

// ============================================
// Interfaces
// ============================================

export interface DashboardStats {
  readonly totalUsers: number;
  readonly newUsersToday: number;
  readonly newUsersThisWeek: number;
  readonly userGrowthPercent: number;
  readonly totalFarmers: number;
  readonly totalBuyers: number;
  readonly activeUsers: number;

  readonly totalListings: number;
  readonly activeListings: number;
  readonly pendingListings: number;
  readonly listingsGrowthPercent: number;

  readonly totalGMV: number;
  readonly gmvToday: number;
  readonly gmvThisMonth: number;
  readonly gmvGrowthPercent: number;
  readonly averageOrderValue: number;

  readonly totalOrders: number;
  readonly pendingOrders: number;
  readonly completedOrders: number;
  readonly orderCompletionRate: number;

  readonly totalDisputes: number;
  readonly openDisputes: number;
  readonly resolvedDisputes: number;
  readonly avgResolutionTime: number;
}

export interface ChartDataPoint {
  readonly label: string;
  readonly value: number;
}

export interface TimeSeriesData {
  readonly labels: string[];
  readonly datasets: {
    readonly label: string;
    readonly data: number[];
    readonly borderColor?: string;
    readonly backgroundColor?: string;
  }[];
}

export interface RecentUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly role: 'FARMER' | 'BUYER' | 'ADMIN';
  readonly status: UserStatus;
  readonly avatar?: string;
  readonly joinedAt: Date;
  readonly ordersCount: number;
  readonly totalSpent: number;
}

export interface Dispute {
  readonly id: string;
  readonly orderId: string;
  readonly type: DisputeType;
  readonly status: DisputeStatus;
  readonly description: string;
  readonly raisedBy: {
    readonly id: string;
    readonly name: string;
    readonly role: 'FARMER' | 'BUYER';
  };
  readonly against: {
    readonly id: string;
    readonly name: string;
    readonly role: 'FARMER' | 'BUYER';
  };
  readonly amount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface TopProduct {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly totalSales: number;
  readonly revenue: number;
  readonly ordersCount: number;
  readonly imageUrl?: string;
}

interface AdminDashboardState {
  stats: DashboardStats | null;
  revenueChart: TimeSeriesData | null;
  userGrowthChart: TimeSeriesData | null;
  categoryDistribution: ChartDataPoint[];
  recentUsers: RecentUser[];
  recentDisputes: Dispute[];
  topProducts: TopProduct[];
  isLoading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  // ============================================
  // State Signal
  // ============================================

  private readonly _state = signal<AdminDashboardState>({
    stats: null,
    revenueChart: null,
    userGrowthChart: null,
    categoryDistribution: [],
    recentUsers: [],
    recentDisputes: [],
    topProducts: [],
    isLoading: false,
    error: null,
  });

  // ============================================
  // Computed Signals
  // ============================================

  readonly stats = computed(() => this._state().stats);
  readonly revenueChart = computed(() => this._state().revenueChart);
  readonly userGrowthChart = computed(() => this._state().userGrowthChart);
  readonly categoryDistribution = computed(() => this._state().categoryDistribution);
  readonly recentUsers = computed(() => this._state().recentUsers);
  readonly recentDisputes = computed(() => this._state().recentDisputes);
  readonly topProducts = computed(() => this._state().topProducts);
  readonly isLoading = computed(() => this._state().isLoading);
  readonly error = computed(() => this._state().error);

  readonly openDisputesCount = computed(() => {
    return this._state().recentDisputes.filter(
      (d) => d.status === DisputeStatus.OPEN || d.status === DisputeStatus.ESCALATED
    ).length;
  });

  readonly criticalDisputes = computed(() => {
    return this._state().recentDisputes.filter(
      (d) => d.priority === 'CRITICAL' || d.priority === 'HIGH'
    );
  });

  // ============================================
  // Public Methods
  // ============================================

  loadDashboard(): void {
    this.updateState({ isLoading: true, error: null });

    if (!environment.production) {
      of(null)
        .pipe(delay(800))
        .subscribe(() => {
          this.updateState({
            stats: this.getMockStats(),
            revenueChart: this.getMockRevenueChart(),
            userGrowthChart: this.getMockUserGrowthChart(),
            categoryDistribution: this.getMockCategoryDistribution(),
            recentUsers: this.getMockRecentUsers(),
            recentDisputes: this.getMockDisputes(),
            topProducts: this.getMockTopProducts(),
            isLoading: false,
          });
        });
      return;
    }

    this.http
      .get<AdminDashboardState>(`${this.apiUrl}/dashboard`)
      .pipe(
        tap((data) => this.updateState({ ...data, isLoading: false })),
        catchError((error) => {
          this.updateState({ isLoading: false, error: 'Failed to load dashboard' });
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  refreshStats(): void {
    this.loadDashboard();
  }

  // ============================================
  // Private Methods
  // ============================================

  private updateState(partial: Partial<AdminDashboardState>): void {
    this._state.update((state) => ({ ...state, ...partial }));
  }

  private getMockStats(): DashboardStats {
    return {
      totalUsers: 12458,
      newUsersToday: 47,
      newUsersThisWeek: 312,
      userGrowthPercent: 12.5,
      totalFarmers: 4892,
      totalBuyers: 7534,
      activeUsers: 8956,

      totalListings: 8934,
      activeListings: 6721,
      pendingListings: 234,
      listingsGrowthPercent: 8.3,

      totalGMV: 45678900,
      gmvToday: 234500,
      gmvThisMonth: 5678000,
      gmvGrowthPercent: 15.7,
      averageOrderValue: 4560,

      totalOrders: 23456,
      pendingOrders: 567,
      completedOrders: 21890,
      orderCompletionRate: 93.2,

      totalDisputes: 234,
      openDisputes: 23,
      resolvedDisputes: 198,
      avgResolutionTime: 2.5,
    };
  }

  private getMockRevenueChart(): TimeSeriesData {
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Revenue (₹ Lakhs)',
          data: [32, 38, 42, 45, 48, 52, 58, 55, 62, 68, 72, 78],
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
        },
        {
          label: 'Orders',
          data: [1200, 1450, 1680, 1820, 1950, 2100, 2350, 2200, 2500, 2750, 2900, 3100],
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
        },
      ],
    };
  }

  private getMockUserGrowthChart(): TimeSeriesData {
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Farmers',
          data: [3200, 3450, 3680, 3820, 3950, 4100, 4250, 4400, 4550, 4700, 4800, 4892],
          borderColor: '#ff9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
        },
        {
          label: 'Buyers',
          data: [5100, 5400, 5700, 5950, 6200, 6450, 6700, 6900, 7100, 7300, 7450, 7534],
          borderColor: '#9c27b0',
          backgroundColor: 'rgba(156, 39, 176, 0.1)',
        },
      ],
    };
  }

  private getMockCategoryDistribution(): ChartDataPoint[] {
    return [
      { label: 'Vegetables', value: 3245 },
      { label: 'Fruits', value: 2890 },
      { label: 'Grains', value: 1876 },
      { label: 'Pulses', value: 1234 },
      { label: 'Spices', value: 892 },
      { label: 'Others', value: 456 },
    ];
  }

  private getMockRecentUsers(): RecentUser[] {
    return [
      {
        id: 'user_1',
        name: 'Ramesh Kumar',
        email: 'ramesh@example.com',
        phone: '+91 98765 43210',
        role: 'FARMER',
        status: UserStatus.ACTIVE,
        joinedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        ordersCount: 0,
        totalSpent: 0,
      },
      {
        id: 'user_2',
        name: 'Fresh Mart Stores',
        email: 'info@freshmart.com',
        phone: '+91 98765 43211',
        role: 'BUYER',
        status: UserStatus.PENDING,
        joinedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        ordersCount: 0,
        totalSpent: 0,
      },
      {
        id: 'user_3',
        name: 'Suresh Patil',
        email: 'suresh@example.com',
        phone: '+91 98765 43212',
        role: 'FARMER',
        status: UserStatus.ACTIVE,
        joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        ordersCount: 2,
        totalSpent: 0,
      },
      {
        id: 'user_4',
        name: 'Hotel Grand Palace',
        email: 'purchase@grandpalace.com',
        phone: '+91 98765 43213',
        role: 'BUYER',
        status: UserStatus.ACTIVE,
        joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        ordersCount: 5,
        totalSpent: 45600,
      },
      {
        id: 'user_5',
        name: 'Mahesh Sharma',
        email: 'mahesh@example.com',
        phone: '+91 98765 43214',
        role: 'FARMER',
        status: UserStatus.SUSPENDED,
        joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        ordersCount: 1,
        totalSpent: 0,
      },
    ];
  }

  private getMockDisputes(): Dispute[] {
    return [
      {
        id: 'dispute_1',
        orderId: 'order_123',
        type: DisputeType.QUALITY,
        status: DisputeStatus.OPEN,
        description: 'Received damaged goods, quality not as described',
        raisedBy: { id: 'buyer_1', name: 'Fresh Mart Stores', role: 'BUYER' },
        against: { id: 'farmer_1', name: 'Ramesh Kumar', role: 'FARMER' },
        amount: 12500,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        priority: 'HIGH',
      },
      {
        id: 'dispute_2',
        orderId: 'order_124',
        type: DisputeType.PAYMENT,
        status: DisputeStatus.IN_PROGRESS,
        description: 'Payment not received for delivered order',
        raisedBy: { id: 'farmer_2', name: 'Suresh Patil', role: 'FARMER' },
        against: { id: 'buyer_2', name: 'Hotel Grand Palace', role: 'BUYER' },
        amount: 8900,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        priority: 'MEDIUM',
      },
      {
        id: 'dispute_3',
        orderId: 'order_125',
        type: DisputeType.DELIVERY,
        status: DisputeStatus.ESCALATED,
        description: 'Order not delivered within promised time',
        raisedBy: { id: 'buyer_3', name: 'City Vegetables', role: 'BUYER' },
        against: { id: 'farmer_3', name: 'Mahesh Sharma', role: 'FARMER' },
        amount: 5600,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        priority: 'CRITICAL',
      },
      {
        id: 'dispute_4',
        orderId: 'order_126',
        type: DisputeType.FRAUD,
        status: DisputeStatus.OPEN,
        description: 'Suspected fraudulent listing with fake images',
        raisedBy: { id: 'buyer_4', name: 'Metro Foods', role: 'BUYER' },
        against: { id: 'farmer_4', name: 'Unknown Seller', role: 'FARMER' },
        amount: 25000,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        priority: 'CRITICAL',
      },
      {
        id: 'dispute_5',
        orderId: 'order_127',
        type: DisputeType.QUALITY,
        status: DisputeStatus.RESOLVED,
        description: 'Weight discrepancy in delivered goods',
        raisedBy: { id: 'buyer_5', name: 'Green Grocers', role: 'BUYER' },
        against: { id: 'farmer_5', name: 'Vijay Reddy', role: 'FARMER' },
        amount: 3200,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        priority: 'LOW',
      },
    ];
  }

  private getMockTopProducts(): TopProduct[] {
    return [
      {
        id: 'prod_1',
        name: 'Organic Tomatoes',
        category: 'Vegetables',
        totalSales: 15600,
        revenue: 780000,
        ordersCount: 234,
        imageUrl: 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=100',
      },
      {
        id: 'prod_2',
        name: 'Basmati Rice',
        category: 'Grains',
        totalSales: 12400,
        revenue: 1240000,
        ordersCount: 189,
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100',
      },
      {
        id: 'prod_3',
        name: 'Fresh Onions',
        category: 'Vegetables',
        totalSales: 18900,
        revenue: 567000,
        ordersCount: 312,
        imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=100',
      },
      {
        id: 'prod_4',
        name: 'Alphonso Mangoes',
        category: 'Fruits',
        totalSales: 8500,
        revenue: 850000,
        ordersCount: 156,
        imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=100',
      },
      {
        id: 'prod_5',
        name: 'Green Chillies',
        category: 'Vegetables',
        totalSales: 9200,
        revenue: 276000,
        ordersCount: 278,
        imageUrl: 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=100',
      },
    ];
  }
}



