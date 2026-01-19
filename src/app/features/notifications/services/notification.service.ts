/**
 * Notification Service
 * ====================
 * Signals-based service for managing notifications with real-time updates.
 */

import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, tap, catchError, throwError, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { SocketService } from '@infrastructure/services/socket.service';

// ============================================
// Enums & Types
// ============================================

export enum NotificationType {
  ORDER = 'ORDER',
  BID = 'BID',
  PAYMENT = 'PAYMENT',
  PRICE_ALERT = 'PRICE_ALERT',
  MESSAGE = 'MESSAGE',
  SYSTEM = 'SYSTEM',
  PROMOTION = 'PROMOTION',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export type NotificationFilterType = 'all' | NotificationType;

// ============================================
// Interfaces
// ============================================

export interface Notification {
  readonly id: string;
  readonly type: NotificationType;
  readonly priority: NotificationPriority;
  readonly title: string;
  readonly message: string;
  readonly icon: string;
  readonly imageUrl?: string;
  readonly actionUrl?: string;
  readonly actionLabel?: string;
  readonly metadata?: Record<string, unknown>;
  readonly isRead: boolean;
  readonly createdAt: Date;
  readonly expiresAt?: Date;
}

export interface NotificationGroup {
  readonly date: string;
  readonly label: string;
  readonly notifications: Notification[];
}

interface NotificationState {
  notifications: Notification[];
  filterType: NotificationFilterType;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
}

// ============================================
// Configuration
// ============================================

export const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  { label: string; icon: string; color: string }
> = {
  [NotificationType.ORDER]: { label: 'Orders', icon: 'shopping_bag', color: '#2196f3' },
  [NotificationType.BID]: { label: 'Bids', icon: 'gavel', color: '#ff9800' },
  [NotificationType.PAYMENT]: { label: 'Payments', icon: 'payment', color: '#4caf50' },
  [NotificationType.PRICE_ALERT]: { label: 'Price Alerts', icon: 'trending_up', color: '#9c27b0' },
  [NotificationType.MESSAGE]: { label: 'Messages', icon: 'chat', color: '#00bcd4' },
  [NotificationType.SYSTEM]: { label: 'System', icon: 'info', color: '#607d8b' },
  [NotificationType.PROMOTION]: { label: 'Promotions', icon: 'local_offer', color: '#e91e63' },
};

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly socketService = inject(SocketService);
  private readonly apiUrl = `${environment.apiUrl}/notifications`;
  private readonly destroy$ = new Subject<void>();

  // ============================================
  // State Signal
  // ============================================

  private readonly _state = signal<NotificationState>({
    notifications: [],
    filterType: 'all',
    isLoading: false,
    isUpdating: false,
    error: null,
  });

  // ============================================
  // Computed Signals
  // ============================================

  /** All notifications */
  readonly notifications = computed(() => this._state().notifications);

  /** Current filter type */
  readonly filterType = computed(() => this._state().filterType);

  /** Loading state */
  readonly isLoading = computed(() => this._state().isLoading);

  /** Updating state */
  readonly isUpdating = computed(() => this._state().isUpdating);

  /** Error message */
  readonly error = computed(() => this._state().error);

  /** Filtered notifications */
  readonly filteredNotifications = computed(() => {
    const filter = this._state().filterType;
    const all = this._state().notifications;

    if (filter === 'all') return all;
    return all.filter((n) => n.type === filter);
  });

  /** Unread count */
  readonly unreadCount = computed(() => {
    return this._state().notifications.filter((n) => !n.isRead).length;
  });

  /** Unread count by type */
  readonly unreadCountByType = computed(() => {
    const notifications = this._state().notifications;
    const counts: Partial<Record<NotificationType, number>> = {};

    Object.values(NotificationType).forEach((type) => {
      counts[type] = notifications.filter((n) => n.type === type && !n.isRead).length;
    });

    return counts;
  });

  /** Has unread notifications */
  readonly hasUnread = computed(() => this.unreadCount() > 0);

  /** Grouped notifications by date */
  readonly groupedNotifications = computed(() => {
    const notifications = this.filteredNotifications();
    const groups: NotificationGroup[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const groupMap = new Map<string, Notification[]>();

    notifications.forEach((notification) => {
      const notifDate = new Date(notification.createdAt);
      notifDate.setHours(0, 0, 0, 0);

      let key: string;
      let label: string;

      if (notifDate.getTime() === today.getTime()) {
        key = 'today';
        label = 'Today';
      } else if (notifDate.getTime() === yesterday.getTime()) {
        key = 'yesterday';
        label = 'Yesterday';
      } else if (notifDate >= thisWeek) {
        key = 'this_week';
        label = 'This Week';
      } else {
        key = 'older';
        label = 'Older';
      }

      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(notification);
    });

    const order = ['today', 'yesterday', 'this_week', 'older'];
    const labels: Record<string, string> = {
      today: 'Today',
      yesterday: 'Yesterday',
      this_week: 'This Week',
      older: 'Older',
    };

    order.forEach((key) => {
      if (groupMap.has(key)) {
        groups.push({
          date: key,
          label: labels[key],
          notifications: groupMap.get(key)!,
        });
      }
    });

    return groups;
  });

  /** Recent notifications (last 5) */
  readonly recentNotifications = computed(() => {
    return this._state().notifications.slice(0, 5);
  });

  // ============================================
  // Constructor
  // ============================================

  constructor() {
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // Socket Listeners
  // ============================================

  private setupSocketListeners(): void {
    // Listen for new notifications
    this.socketService
      .onAny<Notification>('notification:new')
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        this.addNotification(notification);
      });
  }

  // ============================================
  // Public Methods
  // ============================================

  /**
   * Load all notifications
   */
  loadNotifications(): void {
    this.updateState({ isLoading: true, error: null });

    if (!environment.production) {
      of(null)
        .pipe(delay(600))
        .subscribe(() => {
          this.updateState({
            notifications: this.getMockNotifications(),
            isLoading: false,
          });
        });
      return;
    }

    this.http
      .get<Notification[]>(this.apiUrl)
      .pipe(
        tap((notifications) => this.updateState({ notifications, isLoading: false })),
        catchError((error) => {
          this.updateState({ isLoading: false, error: 'Failed to load notifications' });
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  /**
   * Set filter type
   */
  setFilterType(type: NotificationFilterType): void {
    this.updateState({ filterType: type });
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): Observable<boolean> {
    this.updateState({ isUpdating: true });

    if (!environment.production) {
      return of(true).pipe(
        delay(300),
        tap(() => {
          this.updateNotificationInState(notificationId, { isRead: true });
          this.updateState({ isUpdating: false });
        })
      );
    }

    return this.http.patch<boolean>(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap(() => {
        this.updateNotificationInState(notificationId, { isRead: true });
        this.updateState({ isUpdating: false });
      }),
      catchError((error) => {
        this.updateState({ isUpdating: false });
        return throwError(() => error);
      })
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<boolean> {
    this.updateState({ isUpdating: true });

    if (!environment.production) {
      return of(true).pipe(
        delay(500),
        tap(() => {
          const updatedNotifications = this._state().notifications.map((n) => ({
            ...n,
            isRead: true,
          }));
          this.updateState({ notifications: updatedNotifications, isUpdating: false });
        })
      );
    }

    return this.http.post<boolean>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        const updatedNotifications = this._state().notifications.map((n) => ({
          ...n,
          isRead: true,
        }));
        this.updateState({ notifications: updatedNotifications, isUpdating: false });
      }),
      catchError((error) => {
        this.updateState({ isUpdating: false });
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): Observable<boolean> {
    this.updateState({ isUpdating: true });

    if (!environment.production) {
      return of(true).pipe(
        delay(300),
        tap(() => {
          const notifications = this._state().notifications.filter(
            (n) => n.id !== notificationId
          );
          this.updateState({ notifications, isUpdating: false });
        })
      );
    }

    return this.http.delete<boolean>(`${this.apiUrl}/${notificationId}`).pipe(
      tap(() => {
        const notifications = this._state().notifications.filter(
          (n) => n.id !== notificationId
        );
        this.updateState({ notifications, isUpdating: false });
      }),
      catchError((error) => {
        this.updateState({ isUpdating: false });
        return throwError(() => error);
      })
    );
  }

  /**
   * Clear all notifications
   */
  clearAll(): Observable<boolean> {
    this.updateState({ isUpdating: true });

    if (!environment.production) {
      return of(true).pipe(
        delay(500),
        tap(() => {
          this.updateState({ notifications: [], isUpdating: false });
        })
      );
    }

    return this.http.delete<boolean>(this.apiUrl).pipe(
      tap(() => {
        this.updateState({ notifications: [], isUpdating: false });
      }),
      catchError((error) => {
        this.updateState({ isUpdating: false });
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // Private Methods
  // ============================================

  private updateState(partial: Partial<NotificationState>): void {
    this._state.update((state) => ({ ...state, ...partial }));
  }

  private addNotification(notification: Notification): void {
    this._state.update((state) => ({
      ...state,
      notifications: [notification, ...state.notifications],
    }));
  }

  private updateNotificationInState(
    notificationId: string,
    updates: Partial<Notification>
  ): void {
    const notifications = this._state().notifications.map((n) =>
      n.id === notificationId ? { ...n, ...updates } : n
    );
    this.updateState({ notifications });
  }

  private getMockNotifications(): Notification[] {
    const now = Date.now();

    return [
      {
        id: 'notif_1',
        type: NotificationType.BID,
        priority: NotificationPriority.HIGH,
        title: 'New Bid Received!',
        message: 'Fresh Mart Stores placed a bid of ₹52/kg on your Organic Tomatoes',
        icon: 'gavel',
        actionUrl: '/farmer/bids/crop_1',
        actionLabel: 'View Bid',
        metadata: { cropId: 'crop_1', bidAmount: 52 },
        isRead: false,
        createdAt: new Date(now - 15 * 60 * 1000),
      },
      {
        id: 'notif_2',
        type: NotificationType.ORDER,
        priority: NotificationPriority.MEDIUM,
        title: 'Order Shipped',
        message: 'Your order #SMC-2024-001 has been shipped and is on its way',
        icon: 'local_shipping',
        actionUrl: '/orders/order_1',
        actionLabel: 'Track Order',
        metadata: { orderId: 'order_1' },
        isRead: false,
        createdAt: new Date(now - 2 * 60 * 60 * 1000),
      },
      {
        id: 'notif_3',
        type: NotificationType.PAYMENT,
        priority: NotificationPriority.HIGH,
        title: 'Payment Received',
        message: '₹9,992 has been credited to your account for order #SMC-2024-001',
        icon: 'account_balance_wallet',
        actionUrl: '/farmer/earnings',
        actionLabel: 'View Earnings',
        metadata: { amount: 9992, orderId: 'order_1' },
        isRead: false,
        createdAt: new Date(now - 5 * 60 * 60 * 1000),
      },
      {
        id: 'notif_4',
        type: NotificationType.PRICE_ALERT,
        priority: NotificationPriority.MEDIUM,
        title: 'Price Alert: Tomatoes',
        message: 'Tomato prices increased by 12% in Nashik mandi today',
        icon: 'trending_up',
        actionUrl: '/farmer/dashboard',
        actionLabel: 'View Prices',
        metadata: { crop: 'Tomatoes', change: 12 },
        isRead: true,
        createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'notif_5',
        type: NotificationType.MESSAGE,
        priority: NotificationPriority.LOW,
        title: 'New Message',
        message: 'Hotel Grand Palace sent you a message about Basmati Rice order',
        icon: 'chat',
        actionUrl: '/chat/buyer_2',
        actionLabel: 'Reply',
        metadata: { senderId: 'buyer_2' },
        isRead: true,
        createdAt: new Date(now - 1.5 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'notif_6',
        type: NotificationType.BID,
        priority: NotificationPriority.MEDIUM,
        title: 'Bid Accepted',
        message: 'Your bid on Fresh Potatoes has been accepted by the farmer',
        icon: 'check_circle',
        actionUrl: '/orders',
        actionLabel: 'View Order',
        metadata: { cropId: 'crop_3' },
        isRead: true,
        createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'notif_7',
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.LOW,
        title: 'Profile Updated',
        message: 'Your profile information has been successfully updated',
        icon: 'person',
        isRead: true,
        createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'notif_8',
        type: NotificationType.ORDER,
        priority: NotificationPriority.MEDIUM,
        title: 'Order Delivered',
        message: 'Order #SMC-2024-002 has been delivered successfully',
        icon: 'done_all',
        actionUrl: '/orders/order_2',
        actionLabel: 'Rate Seller',
        metadata: { orderId: 'order_2' },
        isRead: true,
        createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'notif_9',
        type: NotificationType.PROMOTION,
        priority: NotificationPriority.LOW,
        title: 'Special Offer!',
        message: 'Get 10% off on your first order. Use code FIRST10',
        icon: 'local_offer',
        imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
        isRead: true,
        createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'notif_10',
        type: NotificationType.PRICE_ALERT,
        priority: NotificationPriority.MEDIUM,
        title: 'Price Drop: Onions',
        message: 'Onion prices dropped by 8% in Maharashtra mandis',
        icon: 'trending_down',
        actionUrl: '/marketplace',
        actionLabel: 'Browse',
        metadata: { crop: 'Onions', change: -8 },
        isRead: true,
        createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000),
      },
    ];
  }
}



