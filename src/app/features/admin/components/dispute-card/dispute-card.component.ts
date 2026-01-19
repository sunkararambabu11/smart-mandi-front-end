/**
 * Dispute Card Component
 * ======================
 * Displays a dispute item with status and actions.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Dispute, DisputeStatus, DisputeType } from '../../services/admin-dashboard.service';

@Component({
  selector: 'smc-dispute-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    DatePipe,
    CurrencyPipe,
  ],
  templateUrl: './dispute-card.component.html',
  styleUrl: './dispute-card.component.scss',
    .dispute-card {
      position: relative;
      background: white;
      border-radius: 12px;
      padding: 1rem;
      overflow: hidden;
      transition: box-shadow 0.2s;

      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      }

      &.critical .priority-bar { background: #c62828; }
      &.high .priority-bar { background: #f44336; }
      &.medium .priority-bar { background: #ff9800; }
      &.low .priority-bar { background: #4caf50; }
    }

    .priority-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
    }

    .dispute-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .dispute-id {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: #333;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #666;
      }
    }

    .status-badge {
      padding: 0.25rem 0.625rem;
      border-radius: 12px;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: capitalize;

      &.open { background: #fff3e0; color: #e65100; }
      &.in_progress { background: #e3f2fd; color: #1565c0; }
      &.escalated { background: #ffebee; color: #c62828; }
      &.resolved { background: #e8f5e9; color: #2e7d32; }
    }

    .dispute-content {
      margin-bottom: 0.75rem;
    }

    .dispute-description {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      color: #555;
      line-height: 1.4;
    }

    .parties {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: #f9f9f9;
      border-radius: 8px;
    }

    .party {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.125rem;

      .party-label {
        font-size: 0.6875rem;
        color: #999;
        text-transform: uppercase;
      }

      .party-name {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #333;
      }

      .party-role {
        font-size: 0.6875rem;
        color: #666;
      }
    }

    .vs-icon {
      color: #ccc;
    }

    .dispute-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid #eee;
    }

    .dispute-meta {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;

      .amount {
        font-size: 0.9375rem;
        font-weight: 700;
        color: #333;
      }

      .date {
        font-size: 0.6875rem;
        color: #999;
      }
    }

    .dispute-actions {
      display: flex;
      gap: 0.5rem;

      button {
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          margin-right: 0.25rem;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisputeCardComponent {
  readonly dispute = input.required<Dispute>();

  readonly view = output<Dispute>();
  readonly resolve = output<Dispute>();

  readonly priorityClass = computed(() => this.dispute().priority.toLowerCase());

  readonly statusClass = computed(() => this.dispute().status.toLowerCase());

  readonly typeIcon = computed(() => {
    const icons: Record<DisputeType, string> = {
      [DisputeType.QUALITY]: 'grade',
      [DisputeType.PAYMENT]: 'payment',
      [DisputeType.DELIVERY]: 'local_shipping',
      [DisputeType.FRAUD]: 'warning',
      [DisputeType.OTHER]: 'help',
    };
    return icons[this.dispute().type];
  });

  readonly canResolve = computed(() => {
    const status = this.dispute().status;
    return status === DisputeStatus.OPEN || status === DisputeStatus.IN_PROGRESS;
  });

  onView(): void {
    this.view.emit(this.dispute());
  }

  onResolve(): void {
    this.resolve.emit(this.dispute());
  }
}

