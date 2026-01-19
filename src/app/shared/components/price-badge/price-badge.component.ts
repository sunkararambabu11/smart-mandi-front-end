/**
 * Price Badge Component
 * =====================
 * Reusable component for displaying prices with optional discount.
 */

import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';

export type PriceBadgeSize = 'small' | 'medium' | 'large';
export type PriceBadgeVariant = 'default' | 'highlight' | 'subtle' | 'inverted';

@Component({
  selector: 'smc-price-badge',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './price-badge.component.html',
  styleUrl: './price-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceBadgeComponent {
  readonly price = input.required<number>();
  readonly originalPrice = input<number | undefined>(undefined);
  readonly unit = input<string>('');
  readonly size = input<PriceBadgeSize>('medium');
  readonly variant = input<PriceBadgeVariant>('default');

  readonly discountPercent = computed(() => {
    const original = this.originalPrice();
    const current = this.price();
    if (!original || original <= current) return 0;
    return Math.round(((original - current) / original) * 100);
  });

  readonly classes = computed(() => {
    return `${this.size()} ${this.variant()}`;
  });
}
