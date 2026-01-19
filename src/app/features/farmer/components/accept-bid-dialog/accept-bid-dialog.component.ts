/**
 * Accept Bid Dialog Component
 * ===========================
 * Confirmation dialog for accepting a bid.
 */

import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Bid } from '../../services/bid.service';

interface DialogData {
  bid: Bid;
}

@Component({
  selector: 'smc-accept-bid-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    CurrencyPipe,
  ],
  templateUrl: './accept-bid-dialog.component.html',
  styleUrl: './accept-bid-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcceptBidDialogComponent {
  readonly dialogRef = inject(MatDialogRef<AcceptBidDialogComponent>);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
