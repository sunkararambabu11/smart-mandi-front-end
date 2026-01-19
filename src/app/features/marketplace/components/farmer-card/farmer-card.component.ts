/**
 * Farmer Card Component
 * =====================
 * Displays farmer information with ratings and contact options.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { FarmerInfo } from '../../services/crop-details.service';

@Component({
  selector: 'smc-farmer-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    DatePipe,
  ],
  templateUrl: './farmer-card.component.html',
  styleUrl: './farmer-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmerCardComponent {
  readonly farmer = input.required<FarmerInfo>();
  readonly viewProfile = output<void>();
  readonly contact = output<void>();

  readonly initials = computed(() => {
    const name = this.farmer().name;
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  });

  readonly ratingStars = computed(() => {
    const rating = this.farmer().rating;
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return { full, half, empty };
  });

  onViewProfile(): void {
    this.viewProfile.emit();
  }

  onContact(): void {
    this.contact.emit();
  }
}
