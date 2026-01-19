/**
 * Earnings Component
 * ==================
 * View earnings and financial analytics.
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'smc-earnings',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './earnings.component.html',
  styleUrl: './earnings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EarningsComponent {}

