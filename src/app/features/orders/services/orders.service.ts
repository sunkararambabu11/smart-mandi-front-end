/**
 * Orders Service
 * ==============
 * Signals-based service for managing orders.
 * Supports both Farmer and Buyer perspectives.
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, tap, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '@core/services/auth.service';
import { UserRole } from '@domain/models/user.model';

// ============================================
// Enums & Types
// ============================================

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum PaymentMethod {
  UPI = 'UPI',
  CARD = 'CARD',
  NET_BANKING = 'NET_BANKING',
  COD = 'COD',
  WALLET = 'WALLET',
}

export type OrderFilterStatus = 'all' | 'active' | 'completed' | 'cancelled';

// ============================================
// Interfaces
// ============================================

export interface OrderItem {
  readonly id: string;
  readonly cropId: string;
  readonly cropName: string;
  readonly cropImage: string;
  readonly quantity: number;
  readonly unit: string;
  readonly pricePerUnit: number;
  readonly totalPrice: number;
  readonly qualityGrade: string;
}

export interface OrderParty {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly avatar?: string;
  readonly location: string;
  readonly rating: number;
}

export interface DeliveryInfo {
  readonly address: string;
  readonly city: string;
  readonly state: string;
  readonly pincode: string;
  readonly landmark?: string;
  readonly contactPhone: string;
  readonly estimatedDelivery: Date;
  readonly actualDelivery?: Date;
  readonly trackingId?: string;
  readonly deliveryPartner?: string;
}

export interface OrderTimeline {
  readonly status: OrderStatus;
  readonly timestamp: Date;
  readonly description: string;
  readonly updatedBy?: string;
}

export interface Order {
  readonly id: string;
  readonly orderNumber: string;
  readonly items: OrderItem[];
  readonly farmer: OrderParty;
  readonly buyer: OrderParty;
  readonly orderStatus: OrderStatus;
  readonly paymentStatus: PaymentStatus;
  readonly paymentMethod: PaymentMethod;
  readonly subtotal: number;
  readonly deliveryCharge: number;
  readonly platformFee: number;
  readonly discount: number;
  readonly totalAmount: number;
  readonly deliveryInfo: DeliveryInfo;
  readonly timeline: OrderTimeline[];
  readonly notes?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

interface OrdersState {
  orders: Order[];
  selectedOrder: Order | null;
  filterStatus: OrderFilterStatus;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  successMessage: string | null;
}

// ============================================
// Status Configurations
// ============================================

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; icon: string; color: string }> = {
  [OrderStatus.PENDING]: { label: 'Pending', icon: 'schedule', color: 'warn' },
  [OrderStatus.CONFIRMED]: { label: 'Confirmed', icon: 'check_circle', color: 'primary' },
  [OrderStatus.PROCESSING]: { label: 'Processing', icon: 'autorenew', color: 'primary' },
  [OrderStatus.SHIPPED]: { label: 'Shipped', icon: 'local_shipping', color: 'accent' },
  [OrderStatus.OUT_FOR_DELIVERY]: { label: 'Out for Delivery', icon: 'directions_bike', color: 'accent' },
  [OrderStatus.DELIVERED]: { label: 'Delivered', icon: 'done_all', color: 'success' },
  [OrderStatus.CANCELLED]: { label: 'Cancelled', icon: 'cancel', color: 'error' },
  [OrderStatus.RETURNED]: { label: 'Returned', icon: 'keyboard_return', color: 'error' },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; icon: string; color: string }> = {
  [PaymentStatus.PENDING]: { label: 'Payment Pending', icon: 'hourglass_empty', color: 'warn' },
  [PaymentStatus.PAID]: { label: 'Paid', icon: 'paid', color: 'success' },
  [PaymentStatus.FAILED]: { label: 'Payment Failed', icon: 'error', color: 'error' },
  [PaymentStatus.REFUNDED]: { label: 'Refunded', icon: 'replay', color: 'primary' },
  [PaymentStatus.PARTIALLY_REFUNDED]: { label: 'Partially Refunded', icon: 'replay', color: 'warn' },
};

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  // ============================================
  // State Signal
  // ============================================

  private readonly _state = signal<OrdersState>({
    orders: [],
    selectedOrder: null,
    filterStatus: 'all',
    isLoading: false,
    isUpdating: false,
    error: null,
    successMessage: null,
  });

  // ============================================
  // Computed Signals
  // ============================================

  readonly orders = computed(() => this._state().orders);
  readonly selectedOrder = computed(() => this._state().selectedOrder);
  readonly filterStatus = computed(() => this._state().filterStatus);
  readonly isLoading = computed(() => this._state().isLoading);
  readonly isUpdating = computed(() => this._state().isUpdating);
  readonly error = computed(() => this._state().error);
  readonly successMessage = computed(() => this._state().successMessage);

  /** Current user role */
  readonly userRole = computed(() => this.authService.currentUser()?.role ?? UserRole.BUYER);

  /** Is farmer view */
  readonly isFarmerView = computed(() => this.userRole() === UserRole.FARMER);

  /** Filtered orders based on status */
  readonly filteredOrders = computed(() => {
    const filter = this._state().filterStatus;
    const allOrders = this._state().orders;

    switch (filter) {
      case 'active':
        return allOrders.filter((o) =>
          [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, 
           OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY].includes(o.orderStatus)
        );
      case 'completed':
        return allOrders.filter((o) => o.orderStatus === OrderStatus.DELIVERED);
      case 'cancelled':
        return allOrders.filter((o) =>
          [OrderStatus.CANCELLED, OrderStatus.RETURNED].includes(o.orderStatus)
        );
      default:
        return allOrders;
    }
  });

  /** Order statistics */
  readonly orderStats = computed(() => {
    const orders = this._state().orders;
    return {
      total: orders.length,
      active: orders.filter((o) =>
        [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING,
         OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY].includes(o.orderStatus)
      ).length,
      completed: orders.filter((o) => o.orderStatus === OrderStatus.DELIVERED).length,
      cancelled: orders.filter((o) =>
        [OrderStatus.CANCELLED, OrderStatus.RETURNED].includes(o.orderStatus)
      ).length,
      totalRevenue: orders
        .filter((o) => o.orderStatus === OrderStatus.DELIVERED && o.paymentStatus === PaymentStatus.PAID)
        .reduce((sum, o) => sum + o.totalAmount, 0),
    };
  });

  // ============================================
  // Public Methods
  // ============================================

  /**
   * Load all orders for current user
   */
  loadOrders(): void {
    this.updateState({ isLoading: true, error: null });

    if (!environment.production) {
      of(null)
        .pipe(delay(800))
        .subscribe(() => {
          this.updateState({
            orders: this.getMockOrders(),
            isLoading: false,
          });
        });
      return;
    }

    this.http
      .get<Order[]>(this.apiUrl)
      .pipe(
        tap((orders) => this.updateState({ orders, isLoading: false })),
        catchError((error) => {
          this.updateState({ isLoading: false, error: 'Failed to load orders' });
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  /**
   * Load single order details
   */
  loadOrderDetails(orderId: string): void {
    this.updateState({ isLoading: true, error: null, selectedOrder: null });

    if (!environment.production) {
      of(null)
        .pipe(delay(600))
        .subscribe(() => {
          const order = this.getMockOrders().find((o) => o.id === orderId) || this.getMockOrders()[0];
          this.updateState({ selectedOrder: order, isLoading: false });
        });
      return;
    }

    this.http
      .get<Order>(`${this.apiUrl}/${orderId}`)
      .pipe(
        tap((order) => this.updateState({ selectedOrder: order, isLoading: false })),
        catchError((error) => {
          this.updateState({ isLoading: false, error: 'Failed to load order details' });
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  /**
   * Set filter status
   */
  setFilterStatus(status: OrderFilterStatus): void {
    this.updateState({ filterStatus: status });
  }

  /**
   * Update order status (Farmer action)
   */
  updateOrderStatus(orderId: string, status: OrderStatus): Observable<Order> {
    this.updateState({ isUpdating: true, error: null, successMessage: null });

    if (!environment.production) {
      return of(this.updateOrderInState(orderId, { orderStatus: status })).pipe(
        delay(1000),
        tap(() => {
          this.updateState({
            isUpdating: false,
            successMessage: `Order status updated to ${ORDER_STATUS_CONFIG[status].label}`,
          });
        })
      );
    }

    return this.http.patch<Order>(`${this.apiUrl}/${orderId}/status`, { status }).pipe(
      tap((order) => {
        this.updateOrderInState(orderId, order);
        this.updateState({
          isUpdating: false,
          successMessage: `Order status updated to ${ORDER_STATUS_CONFIG[status].label}`,
        });
      }),
      catchError((error) => {
        this.updateState({ isUpdating: false, error: 'Failed to update order status' });
        return throwError(() => error);
      })
    );
  }

  /**
   * Cancel order
   */
  cancelOrder(orderId: string, reason: string): Observable<Order> {
    this.updateState({ isUpdating: true, error: null, successMessage: null });

    if (!environment.production) {
      return of(this.updateOrderInState(orderId, { orderStatus: OrderStatus.CANCELLED })).pipe(
        delay(1000),
        tap(() => {
          this.updateState({
            isUpdating: false,
            successMessage: 'Order cancelled successfully',
          });
        })
      );
    }

    return this.http.post<Order>(`${this.apiUrl}/${orderId}/cancel`, { reason }).pipe(
      tap((order) => {
        this.updateOrderInState(orderId, order);
        this.updateState({
          isUpdating: false,
          successMessage: 'Order cancelled successfully',
        });
      }),
      catchError((error) => {
        this.updateState({ isUpdating: false, error: 'Failed to cancel order' });
        return throwError(() => error);
      })
    );
  }

  /**
   * Mark order as delivered
   */
  markAsDelivered(orderId: string): Observable<Order> {
    return this.updateOrderStatus(orderId, OrderStatus.DELIVERED);
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

  private updateState(partial: Partial<OrdersState>): void {
    this._state.update((state) => ({ ...state, ...partial }));
  }

  private updateOrderInState(orderId: string, updates: Partial<Order>): Order {
    const orders = this._state().orders;
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    
    if (orderIndex === -1) {
      throw new Error('Order not found');
    }

    const updatedOrder = { ...orders[orderIndex], ...updates, updatedAt: new Date() };
    const updatedOrders = [...orders];
    updatedOrders[orderIndex] = updatedOrder as Order;

    this.updateState({ orders: updatedOrders });

    if (this._state().selectedOrder?.id === orderId) {
      this.updateState({ selectedOrder: updatedOrder as Order });
    }

    return updatedOrder as Order;
  }

  private getMockOrders(): Order[] {
    const now = Date.now();
    const isFarmer = this.isFarmerView();

    return [
      {
        id: 'order_1',
        orderNumber: 'SMC-2024-001',
        items: [
          {
            id: 'item_1',
            cropId: 'crop_1',
            cropName: 'Organic Tomatoes',
            cropImage: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200',
            quantity: 200,
            unit: 'kg',
            pricePerUnit: 48,
            totalPrice: 9600,
            qualityGrade: 'Premium',
          },
        ],
        farmer: {
          id: 'farmer_1',
          name: 'Ramesh Patil',
          phone: '+91 98765 43210',
          location: 'Nashik, Maharashtra',
          rating: 4.8,
        },
        buyer: {
          id: 'buyer_1',
          name: 'Fresh Mart Stores',
          phone: '+91 98765 12345',
          location: 'Mumbai, Maharashtra',
          rating: 4.5,
        },
        orderStatus: OrderStatus.SHIPPED,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.UPI,
        subtotal: 9600,
        deliveryCharge: 200,
        platformFee: 192,
        discount: 0,
        totalAmount: 9992,
        deliveryInfo: {
          address: '123, Market Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          contactPhone: '+91 98765 12345',
          estimatedDelivery: new Date(now + 2 * 24 * 60 * 60 * 1000),
          trackingId: 'TRK123456789',
          deliveryPartner: 'FastTrack Logistics',
        },
        timeline: [
          { status: OrderStatus.PENDING, timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000), description: 'Order placed' },
          { status: OrderStatus.CONFIRMED, timestamp: new Date(now - 2.5 * 24 * 60 * 60 * 1000), description: 'Order confirmed by farmer' },
          { status: OrderStatus.PROCESSING, timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000), description: 'Order is being prepared' },
          { status: OrderStatus.SHIPPED, timestamp: new Date(now - 1 * 24 * 60 * 60 * 1000), description: 'Order shipped via FastTrack Logistics' },
        ],
        createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'order_2',
        orderNumber: 'SMC-2024-002',
        items: [
          {
            id: 'item_2',
            cropId: 'crop_2',
            cropName: 'Basmati Rice',
            cropImage: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200',
            quantity: 500,
            unit: 'kg',
            pricePerUnit: 85,
            totalPrice: 42500,
            qualityGrade: 'Grade A',
          },
        ],
        farmer: {
          id: 'farmer_2',
          name: 'Suresh Kumar',
          phone: '+91 98765 67890',
          location: 'Indore, MP',
          rating: 4.5,
        },
        buyer: {
          id: 'buyer_2',
          name: 'Hotel Grand Palace',
          phone: '+91 98765 54321',
          location: 'Delhi',
          rating: 4.9,
        },
        orderStatus: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.NET_BANKING,
        subtotal: 42500,
        deliveryCharge: 500,
        platformFee: 850,
        discount: 500,
        totalAmount: 43350,
        deliveryInfo: {
          address: '456, Connaught Place',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110001',
          contactPhone: '+91 98765 54321',
          estimatedDelivery: new Date(now - 5 * 24 * 60 * 60 * 1000),
          actualDelivery: new Date(now - 5 * 24 * 60 * 60 * 1000),
          trackingId: 'TRK987654321',
          deliveryPartner: 'Agri Express',
        },
        timeline: [
          { status: OrderStatus.PENDING, timestamp: new Date(now - 10 * 24 * 60 * 60 * 1000), description: 'Order placed' },
          { status: OrderStatus.CONFIRMED, timestamp: new Date(now - 9 * 24 * 60 * 60 * 1000), description: 'Order confirmed' },
          { status: OrderStatus.PROCESSING, timestamp: new Date(now - 8 * 24 * 60 * 60 * 1000), description: 'Preparing order' },
          { status: OrderStatus.SHIPPED, timestamp: new Date(now - 7 * 24 * 60 * 60 * 1000), description: 'Shipped' },
          { status: OrderStatus.OUT_FOR_DELIVERY, timestamp: new Date(now - 5.5 * 24 * 60 * 60 * 1000), description: 'Out for delivery' },
          { status: OrderStatus.DELIVERED, timestamp: new Date(now - 5 * 24 * 60 * 60 * 1000), description: 'Delivered successfully' },
        ],
        createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'order_3',
        orderNumber: 'SMC-2024-003',
        items: [
          {
            id: 'item_3',
            cropId: 'crop_3',
            cropName: 'Fresh Potatoes',
            cropImage: 'https://images.unsplash.com/photo-1518977676601-b53f82abe3b2?w=200',
            quantity: 1000,
            unit: 'kg',
            pricePerUnit: 28,
            totalPrice: 28000,
            qualityGrade: 'Grade A',
          },
        ],
        farmer: {
          id: 'farmer_3',
          name: 'Vikram Singh',
          phone: '+91 98765 11111',
          location: 'Lucknow, UP',
          rating: 4.3,
        },
        buyer: {
          id: 'buyer_3',
          name: 'Quick Bites Restaurant',
          phone: '+91 98765 22222',
          location: 'Lucknow, UP',
          rating: 4.2,
        },
        orderStatus: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.COD,
        subtotal: 28000,
        deliveryCharge: 300,
        platformFee: 560,
        discount: 0,
        totalAmount: 28860,
        deliveryInfo: {
          address: '789, Hazratganj',
          city: 'Lucknow',
          state: 'Uttar Pradesh',
          pincode: '226001',
          contactPhone: '+91 98765 22222',
          estimatedDelivery: new Date(now + 5 * 24 * 60 * 60 * 1000),
        },
        timeline: [
          { status: OrderStatus.PENDING, timestamp: new Date(now - 2 * 60 * 60 * 1000), description: 'Order placed, awaiting confirmation' },
        ],
        createdAt: new Date(now - 2 * 60 * 60 * 1000),
        updatedAt: new Date(now - 2 * 60 * 60 * 1000),
      },
      {
        id: 'order_4',
        orderNumber: 'SMC-2024-004',
        items: [
          {
            id: 'item_4',
            cropId: 'crop_4',
            cropName: 'Alphonso Mangoes',
            cropImage: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=200',
            quantity: 100,
            unit: 'kg',
            pricePerUnit: 350,
            totalPrice: 35000,
            qualityGrade: 'Premium',
          },
        ],
        farmer: {
          id: 'farmer_4',
          name: 'Priya Sharma',
          phone: '+91 98765 33333',
          location: 'Ratnagiri, Maharashtra',
          rating: 4.9,
        },
        buyer: {
          id: 'buyer_4',
          name: 'Fruit Paradise',
          phone: '+91 98765 44444',
          location: 'Pune, Maharashtra',
          rating: 4.7,
        },
        orderStatus: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.REFUNDED,
        paymentMethod: PaymentMethod.UPI,
        subtotal: 35000,
        deliveryCharge: 400,
        platformFee: 700,
        discount: 1000,
        totalAmount: 35100,
        deliveryInfo: {
          address: '321, MG Road',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          contactPhone: '+91 98765 44444',
          estimatedDelivery: new Date(now - 3 * 24 * 60 * 60 * 1000),
        },
        timeline: [
          { status: OrderStatus.PENDING, timestamp: new Date(now - 7 * 24 * 60 * 60 * 1000), description: 'Order placed' },
          { status: OrderStatus.CONFIRMED, timestamp: new Date(now - 6 * 24 * 60 * 60 * 1000), description: 'Order confirmed' },
          { status: OrderStatus.CANCELLED, timestamp: new Date(now - 5 * 24 * 60 * 60 * 1000), description: 'Order cancelled by buyer' },
        ],
        notes: 'Cancelled due to change in requirements',
        createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'order_5',
        orderNumber: 'SMC-2024-005',
        items: [
          {
            id: 'item_5',
            cropId: 'crop_5',
            cropName: 'Green Chillies',
            cropImage: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=200',
            quantity: 50,
            unit: 'kg',
            pricePerUnit: 65,
            totalPrice: 3250,
            qualityGrade: 'Premium',
          },
          {
            id: 'item_6',
            cropId: 'crop_6',
            cropName: 'Red Onions',
            cropImage: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=200',
            quantity: 100,
            unit: 'kg',
            pricePerUnit: 32,
            totalPrice: 3200,
            qualityGrade: 'Grade A',
          },
        ],
        farmer: {
          id: 'farmer_5',
          name: 'Anita Desai',
          phone: '+91 98765 55555',
          location: 'Pune, Maharashtra',
          rating: 4.7,
        },
        buyer: {
          id: 'buyer_5',
          name: 'Spice Kitchen',
          phone: '+91 98765 66666',
          location: 'Mumbai, Maharashtra',
          rating: 4.4,
        },
        orderStatus: OrderStatus.OUT_FOR_DELIVERY,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.CARD,
        subtotal: 6450,
        deliveryCharge: 150,
        platformFee: 129,
        discount: 0,
        totalAmount: 6729,
        deliveryInfo: {
          address: '567, Andheri West',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400058',
          contactPhone: '+91 98765 66666',
          estimatedDelivery: new Date(now),
          trackingId: 'TRK456789123',
          deliveryPartner: 'Quick Delivery',
        },
        timeline: [
          { status: OrderStatus.PENDING, timestamp: new Date(now - 4 * 24 * 60 * 60 * 1000), description: 'Order placed' },
          { status: OrderStatus.CONFIRMED, timestamp: new Date(now - 3.5 * 24 * 60 * 60 * 1000), description: 'Confirmed' },
          { status: OrderStatus.PROCESSING, timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000), description: 'Processing' },
          { status: OrderStatus.SHIPPED, timestamp: new Date(now - 1 * 24 * 60 * 60 * 1000), description: 'Shipped' },
          { status: OrderStatus.OUT_FOR_DELIVERY, timestamp: new Date(now - 4 * 60 * 60 * 1000), description: 'Out for delivery' },
        ],
        createdAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 4 * 60 * 60 * 1000),
      },
    ];
  }
}



