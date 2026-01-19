/**
 * Instant Buy Dialog Component
 * ============================
 * Dialog for instant purchase with quantity and payment selection.
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
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { MatDividerModule } from '@angular/material/divider';

import { CropDetails } from '../../services/crop-details.service';

interface DialogData {
  crop: CropDetails;
}

@Component({
  selector: 'smc-instant-buy-dialog',
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
    MatSliderModule,
    MatDividerModule,
  ],
  templateUrl: './instant-buy-dialog.component.html',
  styleUrl: './instant-buy-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstantBuyDialogComponent {
  readonly dialogRef = inject(MatDialogRef<InstantBuyDialogComponent>);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);

  quantityValue = Math.min(100, this.data.crop.availableQuantity);
  paymentMethod: 'cod' | 'online' | 'upi' = 'upi';

  readonly quantity = computed(() => this.quantityValue);

  readonly subtotal = computed(
    () => this.quantityValue * this.data.crop.instantBuyPrice
  );

  readonly platformFee = computed(() => Math.round(this.subtotal() * 0.02));

  readonly total = computed(() => this.subtotal() + this.platformFee());

  readonly isValid = computed(
    () => this.quantityValue > 0 && this.quantityValue <= this.data.crop.availableQuantity
  );

  decreaseQuantity(): void {
    if (this.quantityValue > 1) {
      this.quantityValue--;
    }
  }

  increaseQuantity(): void {
    if (this.quantityValue < this.data.crop.availableQuantity) {
      this.quantityValue++;
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    if (this.isValid()) {
      this.dialogRef.close({
        quantity: this.quantityValue,
        paymentMethod: this.paymentMethod,
      });
    }
  }
}
