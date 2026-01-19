/**
 * Order Card Component
 * ====================
 * Reusable card for displaying order information.
 * Adapts UI based on user role (Farmer vs Buyer).
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import {
  Order,
  OrderStatus,
  PaymentStatus,
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from '../../services/orders.service';

@Component({
  selector: 'smc-order-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    DatePipe,
    CurrencyPipe,
  ],
  templateUrl: './order-card.component.html',
  styleUrl: './order-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderCardComponent {
  // ============================================
  // Inputs
  // ============================================

  readonly order = input.required<Order>();
  readonly isFarmerView = input(false);
  readonly compact = input(false);

  // ============================================
  // Outputs
  // ============================================

  readonly viewDetails = output<Order>();
  readonly updateStatus = output<{ order: Order; status: OrderStatus }>();
  readonly cancelOrder = output<Order>();
  readonly contactParty = output<string>();
  readonly trackOrder = output<Order>();

  // ============================================
  // Computed
  // ============================================

  readonly OrderStatus = OrderStatus;
  readonly PaymentStatus = PaymentStatus;

  /** Other party (buyer if farmer view, farmer if buyer view) */
  readonly otherParty = computed(() => {
    return this.isFarmerView() ? this.order().buyer : this.order().farmer;
  });

  /** Party label */
  readonly partyLabel = computed(() => {
    return this.isFarmerView() ? 'Buyer' : 'Seller';
  });

  /** Order status config */
  readonly statusConfig = computed(() => {
    return ORDER_STATUS_CONFIG[this.order().orderStatus];
  });

  /** Payment status config */
  readonly paymentConfig = computed(() => {
    return PAYMENT_STATUS_CONFIG[this.order().paymentStatus];
  });

  /** Party initials */
  readonly partyInitials = computed(() => {
    const name = this.otherParty().name;
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  });

  /** First item image */
  readonly firstItemImage = computed(() => {
    const items = this.order().items;
    return items.length > 0 ? items[0].cropImage : null;
  });

  /** Items summary */
  readonly itemsSummary = computed(() => {
    const items = this.order().items;
    if (items.length === 1) {
      return items[0].cropName;
    }
    return `${items[0].cropName} +${items.length - 1} more`;
  });

  /** Total quantity */
  readonly totalQuantity = computed(() => {
    return this.order().items.reduce((sum, item) => sum + item.quantity, 0);
  });

  /** Can be cancelled */
  readonly canCancel = computed(() => {
    const status = this.order().orderStatus;
    return [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(status);
  });

  /** Can update status (farmer only) */
  readonly canUpdateStatus = computed(() => {
    if (!this.isFarmerView()) return false;
    const status = this.order().orderStatus;
    return ![OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.RETURNED].includes(status);
  });

  /** Next status options (farmer) */
  readonly nextStatusOptions = computed(() => {
    if (!this.isFarmerView()) return [];
    
    const current = this.order().orderStatus;
    const flow: Partial<Record<OrderStatus, OrderStatus[]>> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED],
      [OrderStatus.SHIPPED]: [OrderStatus.OUT_FOR_DELIVERY],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
    };

    return (flow[current] || []).map((status) => ({
      status,
      ...ORDER_STATUS_CONFIG[status],
    }));
  });

  /** Is order active */
  readonly isActive = computed(() => {
    const status = this.order().orderStatus;
    return [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.OUT_FOR_DELIVERY,
    ].includes(status);
  });

  /** Has tracking */
  readonly hasTracking = computed(() => {
    return !!this.order().deliveryInfo.trackingId;
  });

  /** Days until delivery */
  readonly daysUntilDelivery = computed(() => {
    const delivery = new Date(this.order().deliveryInfo.estimatedDelivery).getTime();
    const now = Date.now();
    const diff = delivery - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  });

  // ============================================
  // Actions
  // ============================================

  onViewDetails(): void {
    this.viewDetails.emit(this.order());
  }

  onUpdateStatus(status: OrderStatus): void {
    this.updateStatus.emit({ order: this.order(), status });
  }

  onCancelOrder(): void {
    this.cancelOrder.emit(this.order());
  }

  onContactParty(): void {
    this.contactParty.emit(this.otherParty().id);
  }

  onTrackOrder(): void {
    this.trackOrder.emit(this.order());
  }
}



