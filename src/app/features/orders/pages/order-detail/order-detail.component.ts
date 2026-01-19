/**
 * Order Detail Page Component
 * ============================
 * Alternative order detail view.
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'smc-order-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailComponent {
  readonly orderId = input.required<string>();
}
