/**
 * Cancel Order Dialog Component
 * =============================
 * Dialog for cancelling an order with reason selection.
 */

import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Order } from '../../services/orders.service';

interface DialogData {
  order: Order;
}

interface CancelReason {
  value: string;
  label: string;
}

@Component({
  selector: 'smc-cancel-order-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './cancel-order-dialog.component.html',
  styleUrl: './cancel-order-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CancelOrderDialogComponent {
  readonly dialogRef = inject(MatDialogRef<CancelOrderDialogComponent>);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);

  readonly cancelReasons: CancelReason[] = [
    { value: 'changed_mind', label: 'Changed my mind' },
    { value: 'found_better_price', label: 'Found a better price elsewhere' },
    { value: 'order_mistake', label: 'Ordered by mistake' },
    { value: 'delivery_too_long', label: 'Delivery time is too long' },
    { value: 'quality_concerns', label: 'Quality concerns' },
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
      reason,
    });
  }
}
