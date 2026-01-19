/**
 * Crop Detail Component
 * =====================
 * View detailed information about a crop listing.
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'smc-crop-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './crop-detail.component.html',
  styleUrl: './crop-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropDetailComponent {
  /** Crop ID from route */
  readonly id = input.required<string>();
}
