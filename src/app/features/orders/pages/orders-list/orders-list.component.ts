/**
 * Orders List Component
 * =====================
 * Main orders page shared by Farmer and Buyer.
 * Displays order list with role-based UI and filtering.
 * 
 * Refactored to:
 * - Use DestroyRef + takeUntilDestroyed (no manual Subject cleanup)
 * - Reduce dialog subscriptions
 * - Improve accessibility
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs';

import {
  OrdersService,
  Order,
  OrderStatus,
  OrderFilterStatus,
} from '../../services/orders.service';
import { OrderCardComponent } from '../../components/order-card/order-card.component';
import { CancelOrderDialogComponent } from '../../components/cancel-order-dialog/cancel-order-dialog.component';

@Component({
  selector: 'smc-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatBadgeModule,
    DatePipe,
    CurrencyPipe,
    OrderCardComponent,
  ],
  templateUrl: './orders-list.component.html',
  styleUrl: './orders-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'main',
    '[attr.aria-label]': '"Orders Management"',
    '[attr.aria-busy]': 'isLoading()',
  },
})
export class OrdersListComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================
  // Expose Service Signals
  // ============================================

  readonly orders = this.ordersService.orders;
  readonly filteredOrders = this.ordersService.filteredOrders;
  readonly filterStatus = this.ordersService.filterStatus;
  readonly isLoading = this.ordersService.isLoading;
  readonly isUpdating = this.ordersService.isUpdating;
  readonly error = this.ordersService.error;
  readonly isFarmerView = this.ordersService.isFarmerView;
  readonly orderStats = this.ordersService.orderStats;

  // ============================================
  // Filter Options
  // ============================================

  readonly filterOptions: { value: OrderFilterStatus; label: string; icon: string }[] = [
    { value: 'all', label: 'All Orders', icon: 'list' },
    { value: 'active', label: 'Active', icon: 'local_shipping' },
    { value: 'completed', label: 'Completed', icon: 'check_circle' },
    { value: 'cancelled', label: 'Cancelled', icon: 'cancel' },
  ];

  // ============================================
  // Lifecycle
  // ============================================

  ngOnInit(): void {
    this.ordersService.loadOrders();
  }

  // ============================================
  // Retry Action (public for template)
  // ============================================

  retryLoadOrders(): void {
    this.ordersService.loadOrders();
  }

  // ============================================
  // Filter Actions
  // ============================================

  onFilterChange(status: OrderFilterStatus): void {
    this.ordersService.setFilterStatus(status);
    this.announceToScreenReader(`Showing ${status} orders`);
  }

  // ============================================
  // Order Actions
  // ============================================

  onViewDetails(order: Order): void {
    this.router.navigate(['/orders', order.id]);
  }

  onUpdateStatus(event: { order: Order; status: OrderStatus }): void {
    this.ordersService
      .updateOrderStatus(event.order.id, event.status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Order status updated', 'Close', { 
            duration: 3000,
            politeness: 'polite',
          });
        },
        error: () => {
          this.snackBar.open('Failed to update status', 'Retry', { 
            duration: 5000,
            politeness: 'assertive',
          });
        },
      });
  }

  onCancelOrder(order: Order): void {
    const dialogRef = this.dialog.open(CancelOrderDialogComponent, {
      width: '450px',
      data: { order },
      panelClass: 'smc-dialog',
      ariaLabel: 'Cancel order confirmation dialog',
    });

    // Use RxJS operators to handle dialog result cleanly
    dialogRef
      .afterClosed()
      .pipe(
        // Only proceed if user confirmed
        filter((result): result is { confirmed: true; reason: string } => 
          result?.confirmed === true
        ),
        // Chain to cancel order API call
        switchMap((result) => 
          this.ordersService.cancelOrder(order.id, result.reason)
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Order cancelled', 'Close', { 
            duration: 3000,
            politeness: 'polite',
          });
        },
        error: () => {
          this.snackBar.open('Failed to cancel order', 'Retry', { 
            duration: 5000,
            politeness: 'assertive',
          });
        },
      });
  }

  onContactParty(partyId: string): void {
    this.router.navigate(['/chat', partyId]);
  }

  onTrackOrder(order: Order): void {
    this.router.navigate(['/orders', order.id, 'tracking']);
  }

  // ============================================
  // Tracking
  // ============================================

  trackByOrderId(_index: number, order: Order): string {
    return order.id;
  }

  // ============================================
  // Accessibility Helpers
  // ============================================

  private announceToScreenReader(message: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  }
}
