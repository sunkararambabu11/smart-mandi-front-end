/**
 * Bid Card Component
 * ==================
 * Displays a single bid with buyer info and action buttons.
 * Reusable dumb component with input/output signals.
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';

import { Bid, BidStatus } from '../../services/bid.service';

@Component({
  selector: 'smc-bid-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatChipsModule,
    DatePipe,
    CurrencyPipe,
  ],
  templateUrl: './bid-card.component.html',
  styleUrl: './bid-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BidCardComponent {
  // ============================================
  // Inputs
  // ============================================

  /** Bid data */
  readonly bid = input.required<Bid>();

  /** Highlight as highest bid */
  readonly isHighlighted = input(false);

  /** Current time for countdown calculation */
  readonly currentTime = input.required<Date>();

  // ============================================
  // Outputs
  // ============================================

  /** Accept bid event */
  readonly accept = output<Bid>();

  /** Reject bid event */
  readonly reject = output<Bid>();

  /** Counter bid event */
  readonly counter = output<Bid>();

  /** View buyer profile event */
  readonly viewProfile = output<string>();

  // ============================================
  // Computed
  // ============================================

  readonly BidStatus = BidStatus;

  /** Status color class */
  readonly statusClass = computed(() => {
    const status = this.bid().status;
    return {
      pending: status === BidStatus.PENDING,
      accepted: status === BidStatus.ACCEPTED,
      rejected: status === BidStatus.REJECTED,
      expired: status === BidStatus.EXPIRED,
      countered: status === BidStatus.COUNTERED,
    };
  });

  /** Time remaining until expiry */
  readonly timeRemaining = computed(() => {
    const now = this.currentTime().getTime();
    const expires = new Date(this.bid().expiresAt).getTime();
    const diff = expires - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  });

  /** Is bid expiring soon (less than 2 hours) */
  readonly isExpiringSoon = computed(() => {
    const now = this.currentTime().getTime();
    const expires = new Date(this.bid().expiresAt).getTime();
    const diff = expires - now;
    return diff > 0 && diff < 2 * 60 * 60 * 1000;
  });

  /** Buyer initials for avatar */
  readonly buyerInitials = computed(() => {
    const name = this.bid().buyerName;
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  });

  /** Rating stars array */
  readonly ratingStars = computed(() => {
    const rating = this.bid().buyerRating;
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return { full, half, empty };
  });

  /** Is bid actionable */
  readonly isActionable = computed(() => this.bid().status === BidStatus.PENDING);

  // ============================================
  // Actions
  // ============================================

  onAccept(): void {
    this.accept.emit(this.bid());
  }

  onReject(): void {
    this.reject.emit(this.bid());
  }

  onCounter(): void {
    this.counter.emit(this.bid());
  }

  onViewProfile(): void {
    this.viewProfile.emit(this.bid().buyerId);
  }
}



