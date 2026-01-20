/**
 * Delete Product Confirmation Dialog
 * ===================================
 * Simple confirmation dialog for deleting products
 */

import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface DeleteProductDialogData {
  productName: string;
  productId?: string; // Add product ID to dialog data
}

@Component({
  selector: 'smc-delete-product-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="delete-dialog">
      <div class="dialog-header">
        <div class="icon-wrapper">
          <mat-icon>delete_outline</mat-icon>
        </div>
        <h2>Delete Product?</h2>
        <p>Are you sure you want to delete <strong>{{ data.productName }}</strong>?</p>
      </div>

      <mat-dialog-content>
        <div class="warning">
          <mat-icon>warning</mat-icon>
          <p>This action cannot be undone. The product will be permanently deleted.</p>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-stroked-button (click)="onCancel()">No</button>
        <button mat-raised-button color="warn" (click)="onConfirm()">Yes, Delete</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .delete-dialog {
      min-width: 400px;
      max-width: 500px;
    }

    .dialog-header {
      text-align: center;
      padding: 1.5rem 1.5rem 1rem;
    }

    .icon-wrapper {
      width: 64px;
      height: 64px;
      margin: 0 auto 1rem;
      border-radius: 50%;
      background: #fee;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-wrapper mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #d32f2f;
    }

    .dialog-header h2 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
    }

    .dialog-header p {
      margin: 0;
      color: #666;
      font-size: 0.95rem;
    }

    .dialog-header strong {
      color: #333;
      font-weight: 600;
    }

    mat-dialog-content {
      padding: 1rem 1.5rem;
    }

    .warning {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: #fff3cd;
      border-radius: 8px;
      border-left: 4px solid #ffc107;
    }

    .warning mat-icon {
      color: #856404;
      margin-top: 2px;
    }

    .warning p {
      margin: 0;
      color: #856404;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    mat-dialog-actions {
      padding: 1rem 1.5rem 1.5rem;
      gap: 0.75rem;
    }

    @media (max-width: 640px) {
      .delete-dialog {
        min-width: auto;
        max-width: 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteProductDialogComponent {
  readonly dialogRef = inject(MatDialogRef<DeleteProductDialogComponent>);
  readonly data: DeleteProductDialogData = inject(MAT_DIALOG_DATA);

  onCancel(): void {
    console.log('[DeleteDialog] Cancel clicked');
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    console.log('[DeleteDialog] Confirm clicked - Yes, Delete button');
    console.log('[DeleteDialog] Product name:', this.data.productName);
    console.log('[DeleteDialog] Product ID:', this.data.productId);
    this.dialogRef.close(true);
  }
}
