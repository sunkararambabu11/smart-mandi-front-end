/**
 * Bids Management Component
 * =========================
 * View and manage bids from buyers.
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'smc-bids',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './bids.component.html',
  styleUrl: './bids.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BidsComponent {}

