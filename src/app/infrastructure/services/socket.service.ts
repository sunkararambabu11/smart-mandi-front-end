import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Observable, Subject, fromEvent, BehaviorSubject } from 'rxjs';
import { takeUntil, share } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { environment } from '@environments/environment';
import { AuthService } from '@core/services/auth.service';

/**
 * Socket Connection State
 */
export type SocketState = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Socket Event Types
 */
export interface SocketEvents {
  'bid:new': BidEvent;
  'bid:updated': BidEvent;
  'bid:accepted': BidEvent;
  'bid:rejected': BidEvent;
  'bid:expired': { bidId: string; cropId: string };
  'price:update': PriceUpdateEvent;
  'notification': NotificationEvent;
}

export interface BidEvent {
  bidId: string;
  cropId: string;
  buyerId: string;
  buyerName: string;
  amount: number;
  quantity: number;
  message?: string;
  timestamp: Date;
}

export interface PriceUpdateEvent {
  cropId: string;
  cropName: string;
  oldPrice: number;
  newPrice: number;
  timestamp: Date;
}

export interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: Date;
}

/**
 * Socket Service
 * ==============
 * Manages real-time WebSocket connections using Socket.io.
 * Uses Angular signals for reactive state management.
 */
@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private readonly authService = inject(AuthService);
  private socket: Socket | null = null;
  private readonly destroy$ = new Subject<void>();

  // ============================================
  // State Signals
  // ============================================

  private readonly _connectionState = signal<SocketState>('disconnected');
  private readonly _reconnectAttempts = signal(0);
  private readonly _lastError = signal<string | null>(null);

  /** Connection state */
  readonly connectionState = this._connectionState.asReadonly();

  /** Is connected */
  readonly isConnected = computed(() => this._connectionState() === 'connected');

  /** Is connecting */
  readonly isConnecting = computed(() => this._connectionState() === 'connecting');

  /** Reconnect attempts */
  readonly reconnectAttempts = this._reconnectAttempts.asReadonly();

  /** Last error */
  readonly lastError = this._lastError.asReadonly();

  // ============================================
  // Connection Management
  // ============================================

  /**
   * Connect to socket server
   */
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      this._lastError.set('No authentication token');
      return;
    }

    this._connectionState.set('connecting');

    this.socket = io(environment.socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: environment.socketReconnectAttempts || 5,
      reconnectionDelay: environment.socketReconnectDelay || 3000,
      timeout: 10000,
    });

    this.setupEventHandlers();
  }

  /**
   * Disconnect from socket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this._connectionState.set('disconnected');
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this._connectionState.set('connected');
      this._reconnectAttempts.set(0);
      this._lastError.set(null);
      console.log('🔌 Socket connected');
    });

    this.socket.on('disconnect', (reason) => {
      this._connectionState.set('disconnected');
      console.log('🔌 Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      this._connectionState.set('error');
      this._lastError.set(error.message);
      console.error('🔌 Socket connection error:', error);
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      this._connectionState.set('connecting');
      this._reconnectAttempts.set(attempt);
    });

    this.socket.on('reconnect', () => {
      this._connectionState.set('connected');
      this._reconnectAttempts.set(0);
    });

    this.socket.on('reconnect_failed', () => {
      this._connectionState.set('error');
      this._lastError.set('Reconnection failed');
    });
  }

  // ============================================
  // Event Subscription
  // ============================================

  /**
   * Listen to a socket event
   */
  on<K extends keyof SocketEvents>(event: K): Observable<SocketEvents[K]> {
    if (!this.socket) {
      return new Observable((observer) => {
        observer.error(new Error('Socket not connected'));
      });
    }

    return new Observable<SocketEvents[K]>((observer) => {
      const handler = (data: SocketEvents[K]) => {
        observer.next(data);
      };

      // Use type assertion for socket.io compatibility
      this.socket!.on(event, handler as any);

      return () => {
        this.socket?.off(event, handler as any);
      };
    }).pipe(share());
  }

  /**
   * Listen to any custom event
   */
  onAny<T = unknown>(event: string): Observable<T> {
    if (!this.socket) {
      return new Observable((observer) => {
        observer.error(new Error('Socket not connected'));
      });
    }

    return new Observable<T>((observer) => {
      const handler = (data: T) => {
        observer.next(data);
      };

      this.socket!.on(event, handler);

      return () => {
        this.socket?.off(event, handler);
      };
    }).pipe(share());
  }

  // ============================================
  // Event Emission
  // ============================================

  /**
   * Emit an event to the server
   */
  emit<T = unknown>(event: string, data?: T): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot emit:', event);
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Emit and wait for acknowledgement
   */
  emitWithAck<T = unknown, R = unknown>(event: string, data?: T): Promise<R> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit(event, data, (response: R) => {
        resolve(response);
      });
    });
  }

  // ============================================
  // Room Management
  // ============================================

  /**
   * Join a room
   */
  joinRoom(room: string): void {
    this.emit('room:join', { room });
  }

  /**
   * Leave a room
   */
  leaveRoom(room: string): void {
    this.emit('room:leave', { room });
  }

  /**
   * Join crop bids room
   */
  joinCropBidsRoom(cropId: string): void {
    this.joinRoom(`crop:${cropId}:bids`);
  }

  /**
   * Leave crop bids room
   */
  leaveCropBidsRoom(cropId: string): void {
    this.leaveRoom(`crop:${cropId}:bids`);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}
