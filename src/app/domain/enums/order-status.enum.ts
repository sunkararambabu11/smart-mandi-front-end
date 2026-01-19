/**
 * Order Status Enumeration
 *
 * Represents the lifecycle stages of an order in the marketplace.
 */

export enum OrderStatus {
  /** Order created, awaiting farmer confirmation */
  PENDING = 'PENDING',

  /** Farmer has confirmed the order */
  CONFIRMED = 'CONFIRMED',

  /** Order is being prepared for shipment */
  PROCESSING = 'PROCESSING',

  /** Order has been shipped */
  SHIPPED = 'SHIPPED',

  /** Order delivered to buyer */
  DELIVERED = 'DELIVERED',

  /** Order cancelled by either party */
  CANCELLED = 'CANCELLED',

  /** Order disputed, under review */
  DISPUTED = 'DISPUTED',

  /** Order completed and closed */
  COMPLETED = 'COMPLETED',
}

/** Status display configuration */
export const OrderStatusConfig: Record<
  OrderStatus,
  { label: string; color: string; icon: string }
> = {
  [OrderStatus.PENDING]: {
    label: 'Pending',
    color: 'amber',
    icon: 'schedule',
  },
  [OrderStatus.CONFIRMED]: {
    label: 'Confirmed',
    color: 'blue',
    icon: 'check_circle',
  },
  [OrderStatus.PROCESSING]: {
    label: 'Processing',
    color: 'indigo',
    icon: 'inventory',
  },
  [OrderStatus.SHIPPED]: {
    label: 'Shipped',
    color: 'purple',
    icon: 'local_shipping',
  },
  [OrderStatus.DELIVERED]: {
    label: 'Delivered',
    color: 'green',
    icon: 'done_all',
  },
  [OrderStatus.CANCELLED]: {
    label: 'Cancelled',
    color: 'red',
    icon: 'cancel',
  },
  [OrderStatus.DISPUTED]: {
    label: 'Disputed',
    color: 'orange',
    icon: 'warning',
  },
  [OrderStatus.COMPLETED]: {
    label: 'Completed',
    color: 'emerald',
    icon: 'verified',
  },
};

