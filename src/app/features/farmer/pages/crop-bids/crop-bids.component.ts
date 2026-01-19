/**
 * Crop Bids Component
 * ===================
 * Real-time bid management page for farmers.
 * Features live updates, accept/reject actions, and highest bid highlighting.
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  input,
} from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil, interval } from 'rxjs';

import { BidService, Bid, BidStatus } from '../../services/bid.service';
import { SocketService } from '@infrastructure/services/socket.service';
import { BidCardComponent } from '../../components/bid-card/bid-card.component';
import { AcceptBidDialogComponent } from '../../components/accept-bid-dialog/accept-bid-dialog.component';
import { RejectBidDialogComponent } from '../../components/reject-bid-dialog/reject-bid-dialog.component';
import { CounterBidDialogComponent } from '../../components/counter-bid-dialog/counter-bid-dialog.component';

@Component({
  selector: 'smc-crop-bids',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatSnackBarModule,
    MatDialogModule,
    DatePipe,
    CurrencyPipe,
    BidCardComponent,
  ],
  templateUrl: './crop-bids.component.html',
  styleUrl: './crop-bids.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropBidsComponent implements OnInit, OnDestroy {
  private readonly bidService = inject(BidService);
  private readonly socketService = inject(SocketService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  /** Route input: crop ID */
  readonly cropId = input.required<string>();

  // ============================================
  // Expose Service Signals
  // ============================================

  readonly bids = this.bidService.bids;
  readonly pendingBids = this.bidService.pendingBids;
  readonly acceptedBids = this.bidService.acceptedBids;
  readonly highestBid = this.bidService.highestBid;
  readonly cropSummary = this.bidService.cropSummary;
  readonly isLoading = this.bidService.isLoading;
  readonly isProcessing = this.bidService.isProcessing;
  readonly error = this.bidService.error;
  readonly totalBidCount = this.bidService.totalBidCount;
  readonly pendingBidCount = this.bidService.pendingBidCount;

  // Socket state
  readonly isConnected = this.socketService.isConnected;
  readonly isConnecting = this.socketService.isConnecting;

  // ============================================
  // Local State
  // ============================================

  readonly BidStatus = BidStatus;
  readonly selectedFilter = signal<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  readonly currentTime = signal(new Date());

  /** Filtered bids based on selected filter */
  readonly filteredBids = computed(() => {
    const filter = this.selectedFilter();
    const allBids = this.bids();

    switch (filter) {
      case 'pending':
        return allBids.filter((b) => b.status === BidStatus.PENDING);
      case 'accepted':
        return allBids.filter((b) => b.status === BidStatus.ACCEPTED);
      case 'rejected':
        return allBids.filter((b) => b.status === BidStatus.REJECTED);
      default:
        return allBids;
    }
  });

  /** Price difference from listed price */
  readonly priceDifference = computed(() => {
    const summary = this.cropSummary();
    const highest = this.highestBid();
    if (!summary || !highest) return null;
    return {
      amount: highest.amount - summary.listedPrice,
      percentage: ((highest.amount - summary.listedPrice) / summary.listedPrice) * 100,
    };
  });

  // ============================================
  // Lifecycle
  // ============================================

  ngOnInit(): void {
    // Load bids for this crop
    this.bidService.loadBidsForCrop(this.cropId());

    // Update time every second for countdown
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentTime.set(new Date());
      });

    // Handle success/error messages
    this.bidService.successMessage
      ? this.snackBar.open(this.bidService.successMessage() || '', 'Close', {
          duration: 4000,
          panelClass: ['snackbar-success'],
        })
      : null;
  }

  ngOnDestroy(): void {
    this.bidService.leaveBidRoom(this.cropId());
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // Filter Actions
  // ============================================

  setFilter(filter: 'all' | 'pending' | 'accepted' | 'rejected'): void {
    this.selectedFilter.set(filter);
  }

  // ============================================
  // Bid Actions
  // ============================================

  onAcceptBid(bid: Bid): void {
    const dialogRef = this.dialog.open(AcceptBidDialogComponent, {
      width: '450px',
      data: { bid },
      panelClass: 'smc-dialog',
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.bidService.acceptBid(bid.id).subscribe({
          next: () => {
            this.snackBar.open('Bid accepted successfully!', 'View Order', {
              duration: 5000,
              panelClass: ['snackbar-success'],
            });
          },
          error: () => {
            this.snackBar.open('Failed to accept bid', 'Retry', {
              duration: 5000,
              panelClass: ['snackbar-error'],
            });
          },
        });
      }
    });
  }

  onRejectBid(bid: Bid): void {
    const dialogRef = this.dialog.open(RejectBidDialogComponent, {
      width: '450px',
      data: { bid },
      panelClass: 'smc-dialog',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.confirmed) {
        this.bidService.rejectBid(bid.id, result.reason).subscribe({
          next: () => {
            this.snackBar.open('Bid rejected', 'Close', {
              duration: 4000,
            });
          },
        });
      }
    });
  }

  onCounterBid(bid: Bid): void {
    const dialogRef = this.dialog.open(CounterBidDialogComponent, {
      width: '450px',
      data: { bid, listedPrice: this.cropSummary()?.listedPrice },
      panelClass: 'smc-dialog',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.counterAmount) {
        this.bidService.counterBid(bid.id, result.counterAmount).subscribe({
          next: () => {
            this.snackBar.open('Counter offer sent!', 'Close', {
              duration: 4000,
              panelClass: ['snackbar-success'],
            });
          },
        });
      }
    });
  }

  onViewBuyerProfile(buyerId: string): void {
    this.router.navigate(['/profile', buyerId]);
  }

  // ============================================
  // Utility Methods
  // ============================================

  getTimeRemaining(expiresAt: Date): string {
    const now = this.currentTime().getTime();
    const expires = new Date(expiresAt).getTime();
    const diff = expires - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  trackByBidId(index: number, bid: Bid): string {
    return bid.id;
  }

  goBack(): void {
    this.router.navigate(['/farmer/crops']);
  }

  refreshBids(): void {
    this.bidService.loadBidsForCrop(this.cropId());
  }
}



