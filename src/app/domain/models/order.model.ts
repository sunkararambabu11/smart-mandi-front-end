/**
 * Order Domain Models
 * ===================
 * Order entities and DTOs for marketplace transactions
 */

import { ProductUnit } from './product.model';
import { GeoLocation } from './user.model';

/** Order status */
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

/** Payment status */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

/** Payment method */
export enum PaymentMethod {
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  UPI = 'UPI',
  CARD = 'CARD',
  NET_BANKING = 'NET_BANKING',
  WALLET = 'WALLET',
}

/** Order item */
export interface OrderItem {
  readonly id: string;
  readonly productId: string;
  readonly productName: string;
  readonly productImage: string;
  readonly farmerId: string;
  readonly farmerName: string;
  readonly quantity: number;
  readonly unit: ProductUnit;
  readonly pricePerUnit: number;
  readonly totalPrice: number;
  readonly qualityGrade: string;
}

/** Delivery address */
export interface DeliveryAddress {
  readonly fullName: string;
  readonly phoneNumber: string;
  readonly addressLine1: string;
  readonly addressLine2?: string;
  readonly city: string;
  readonly state: string;
  readonly pincode: string;
  readonly landmark?: string;
  readonly location?: GeoLocation;
}

/** Order timeline event */
export interface OrderTimelineEvent {
  readonly status: OrderStatus;
  readonly timestamp: Date;
  readonly description: string;
  readonly updatedBy?: string;
}

/** Core Order entity */
export interface Order {
  readonly id: string;
  readonly orderNumber: string;
  readonly buyerId: string;
  readonly buyerName: string;
  readonly items: OrderItem[];
  readonly status: OrderStatus;
  readonly paymentStatus: PaymentStatus;
  readonly paymentMethod: PaymentMethod;
  readonly deliveryAddress: DeliveryAddress;
  readonly subtotal: number;
  readonly deliveryFee: number;
  readonly tax: number;
  readonly discount: number;
  readonly totalAmount: number;
  readonly notes?: string;
  readonly timeline: OrderTimelineEvent[];
  readonly estimatedDelivery?: Date;
  readonly actualDelivery?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Order summary for listing */
export interface OrderSummary {
  readonly id: string;
  readonly orderNumber: string;
  readonly status: OrderStatus;
  readonly paymentStatus: PaymentStatus;
  readonly totalAmount: number;
  readonly itemCount: number;
  readonly primaryProductImage: string;
  readonly createdAt: Date;
  readonly estimatedDelivery?: Date;
}

/** Create order DTO */
export interface CreateOrderDto {
  readonly items: {
    readonly productId: string;
    readonly quantity: number;
  }[];
  readonly deliveryAddress: DeliveryAddress;
  readonly paymentMethod: PaymentMethod;
  readonly notes?: string;
}

/** Order filters */
export interface OrderFilters {
  readonly status?: OrderStatus;
  readonly paymentStatus?: PaymentStatus;
  readonly fromDate?: Date;
  readonly toDate?: Date;
  readonly search?: string;
  readonly page?: number;
  readonly limit?: number;
}

/** Paginated orders response */
export interface PaginatedOrders {
  readonly items: OrderSummary[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}
