/**
 * Reject Bid Dialog Component
 * ===========================
 * Dialog for rejecting a bid with optional reason.
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
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
import { MatRadioModule } from '@angular/material/radio';

import { Bid } from '../../services/bid.service';

interface DialogData {
  bid: Bid;
}

interface RejectReason {
  value: string;
  label: string;
}

@Component({
  selector: 'smc-reject-bid-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
  ],
  templateUrl: './reject-bid-dialog.component.html',
  styleUrl: './reject-bid-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RejectBidDialogComponent {
  readonly dialogRef = inject(MatDialogRef<RejectBidDialogComponent>);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);

  readonly rejectReasons: RejectReason[] = [
    { value: 'price_low', label: 'Price is too low' },
    { value: 'quantity_mismatch', label: "Quantity doesn't match my availability" },
    { value: 'already_sold', label: 'Crop already sold' },
    { value: 'buyer_rating', label: 'Concerned about buyer rating' },
    { value: 'other', label: 'Other reason' },
  ];

  selectedReason = '';
  customReason = '';

  onCancel(): void {
    this.dialogRef.close({ confirmed: false });
  }

  onConfirm(): void {
    const reason =
      this.selectedReason === 'other' ? this.customReason : this.selectedReason;

    this.dialogRef.close({
      confirmed: true,
      reason: reason || undefined,
    });
  }
}
