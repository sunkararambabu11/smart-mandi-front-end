/**
 * Counter Bid Dialog Component
 * ============================
 * Dialog for making a counter offer to a bid.
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';

import { Bid } from '../../services/bid.service';

interface DialogData {
  bid: Bid;
  listedPrice: number;
}

@Component({
  selector: 'smc-counter-bid-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSliderModule,
  ],
  templateUrl: './counter-bid-dialog.component.html',
  styleUrl: './counter-bid-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterBidDialogComponent {
  readonly dialogRef = inject(MatDialogRef<CounterBidDialogComponent>);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);

  // Counter amount (default to listed price or 10% higher than bid)
  counterAmountValue =
    this.data.listedPrice || Math.round(this.data.bid.amount * 1.1);

  // Max price (2x the bid or listed price + 50%)
  readonly maxPrice = Math.max(
    this.data.bid.amount * 2,
    (this.data.listedPrice || this.data.bid.amount) * 1.5
  );

  // Computed signals
  readonly counterAmount = computed(() => this.counterAmountValue);

  readonly priceDiff = computed(
    () => this.counterAmountValue - this.data.bid.amount
  );

  readonly diffPercentage = computed(
    () => (this.priceDiff() / this.data.bid.amount) * 100
  );

  readonly totalValue = computed(
    () => this.counterAmountValue * this.data.bid.quantity
  );

  readonly isValid = computed(
    () => this.counterAmountValue >= this.data.bid.amount
  );

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    if (this.isValid()) {
      this.dialogRef.close({
        counterAmount: this.counterAmountValue,
      });
    }
  }
}
