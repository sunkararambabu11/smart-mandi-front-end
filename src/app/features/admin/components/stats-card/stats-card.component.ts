/**
 * Stats Card Component
 * ====================
 * Displays a single statistic with icon, value, and trend indicator.
 */

import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule, DecimalPipe, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'smc-stats-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, DecimalPipe, CurrencyPipe],
  templateUrl: './stats-card.component.html',
  styleUrl: './stats-card.component.scss',
    .stats-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      border-radius: 16px;
      background: white;
      border-left: 4px solid transparent;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      }

      &.green {
        border-left-color: #4caf50;
        .stats-icon { background: rgba(76, 175, 80, 0.1); color: #4caf50; }
      }

      &.blue {
        border-left-color: #2196f3;
        .stats-icon { background: rgba(33, 150, 243, 0.1); color: #2196f3; }
      }

      &.orange {
        border-left-color: #ff9800;
        .stats-icon { background: rgba(255, 152, 0, 0.1); color: #ff9800; }
      }

      &.purple {
        border-left-color: #9c27b0;
        .stats-icon { background: rgba(156, 39, 176, 0.1); color: #9c27b0; }
      }

      &.red {
        border-left-color: #f44336;
        .stats-icon { background: rgba(244, 67, 54, 0.1); color: #f44336; }
      }

      &.teal {
        border-left-color: #009688;
        .stats-icon { background: rgba(0, 150, 136, 0.1); color: #009688; }
      }
    }

    .stats-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
    }

    .stats-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stats-label {
      font-size: 0.8125rem;
      color: #666;
      font-weight: 500;
    }

    .stats-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #333;
      line-height: 1.2;
    }

    .stats-sub {
      font-size: 0.75rem;
      color: #999;
    }

    .stats-trend {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &.positive {
        background: rgba(76, 175, 80, 0.1);
        color: #2e7d32;
      }

      &.negative {
        background: rgba(244, 67, 54, 0.1);
        color: #c62828;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly icon = input<string>('analytics');
  readonly color = input<'green' | 'blue' | 'orange' | 'purple' | 'red' | 'teal'>('green');
  readonly trend = input<number | null>(null);
  readonly subValue = input<string>('');
  readonly isCurrency = input<boolean>(false);

  readonly colorClass = computed(() => this.color());
}

