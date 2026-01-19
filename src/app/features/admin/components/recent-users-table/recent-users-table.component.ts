/**
 * Recent Users Table Component
 * ============================
 * Displays recent user registrations in a table format.
 */

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { RecentUser, UserStatus } from '../../services/admin-dashboard.service';

@Component({
  selector: 'smc-recent-users-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    DatePipe,
    CurrencyPipe,
  ],
  templateUrl: './recent-users-table.component.html',
  styleUrl: './recent-users-table.component.scss',
    .users-table-container {
      overflow-x: auto;
    }

    .users-table {
      width: 100%;
      background: transparent;

      th {
        font-size: 0.75rem;
        font-weight: 600;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        background: #f9f9f9;
      }

      td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #eee;
      }

      tr:hover {
        background: #fafafa;
      }
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1rem;

      &.farmer { background: #e8f5e9; color: #2e7d32; }
      &.buyer { background: #e3f2fd; color: #1565c0; }
      &.admin { background: #fce4ec; color: #c2185b; }
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;

      .user-name {
        font-weight: 600;
        color: #333;
        font-size: 0.875rem;
      }

      .user-contact {
        font-size: 0.75rem;
        color: #999;
      }
    }

    .role-badge {
      padding: 0.25rem 0.625rem;
      border-radius: 12px;
      font-size: 0.6875rem;
      font-weight: 600;

      &.farmer { background: #e8f5e9; color: #2e7d32; }
      &.buyer { background: #e3f2fd; color: #1565c0; }
      &.admin { background: #fce4ec; color: #c2185b; }
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.625rem;
      border-radius: 12px;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: capitalize;

      mat-icon {
        font-size: 12px;
        width: 12px;
        height: 12px;
      }

      &.active { background: #e8f5e9; color: #2e7d32; }
      &.pending { background: #fff3e0; color: #e65100; }
      &.suspended { background: #ffebee; color: #c62828; }
      &.inactive { background: #f5f5f5; color: #666; }
    }

    .joined-date {
      font-size: 0.8125rem;
      color: #666;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentUsersTableComponent {
  readonly users = input.required<RecentUser[]>();

  readonly viewUser = output<RecentUser>();
  readonly approveUser = output<RecentUser>();
  readonly suspendUser = output<RecentUser>();
  readonly activateUser = output<RecentUser>();

  readonly displayedColumns = ['user', 'role', 'status', 'joined', 'actions'];

  getStatusIcon(status: UserStatus): string {
    const icons: Record<UserStatus, string> = {
      [UserStatus.ACTIVE]: 'check_circle',
      [UserStatus.PENDING]: 'schedule',
      [UserStatus.SUSPENDED]: 'block',
      [UserStatus.INACTIVE]: 'remove_circle',
    };
    return icons[status];
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  }

  onView(user: RecentUser): void {
    this.viewUser.emit(user);
  }

  onApprove(user: RecentUser): void {
    this.approveUser.emit(user);
  }

  onSuspend(user: RecentUser): void {
    this.suspendUser.emit(user);
  }

  onActivate(user: RecentUser): void {
    this.activateUser.emit(user);
  }
}

