/**
 * Status Chip Component
 * =====================
 * Reusable component for displaying status indicators.
 */

import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type StatusType =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'pending'
  | 'active'
  | 'inactive'
  | 'default';

export type StatusSize = 'small' | 'medium' | 'large';

export interface StatusConfig {
  label: string;
  type: StatusType;
  icon?: string;
}

// Predefined status configurations
export const STATUS_PRESETS: Record<string, StatusConfig> = {
  // Order statuses
  PENDING: { label: 'Pending', type: 'pending', icon: 'schedule' },
  CONFIRMED: { label: 'Confirmed', type: 'info', icon: 'check_circle' },
  PROCESSING: { label: 'Processing', type: 'info', icon: 'autorenew' },
  SHIPPED: { label: 'Shipped', type: 'info', icon: 'local_shipping' },
  DELIVERED: { label: 'Delivered', type: 'success', icon: 'done_all' },
  CANCELLED: { label: 'Cancelled', type: 'error', icon: 'cancel' },

  // Payment statuses
  PAID: { label: 'Paid', type: 'success', icon: 'payments' },
  UNPAID: { label: 'Unpaid', type: 'warning', icon: 'money_off' },
  REFUNDED: { label: 'Refunded', type: 'info', icon: 'undo' },
  FAILED: { label: 'Failed', type: 'error', icon: 'error' },

  // Listing statuses
  ACTIVE: { label: 'Active', type: 'active', icon: 'check_circle' },
  INACTIVE: { label: 'Inactive', type: 'inactive', icon: 'pause_circle' },
  SOLD: { label: 'Sold', type: 'success', icon: 'sell' },
  EXPIRED: { label: 'Expired', type: 'error', icon: 'event_busy' },
  DRAFT: { label: 'Draft', type: 'default', icon: 'edit_note' },

  // Bid statuses
  ACCEPTED: { label: 'Accepted', type: 'success', icon: 'thumb_up' },
  REJECTED: { label: 'Rejected', type: 'error', icon: 'thumb_down' },
  COUNTERED: { label: 'Countered', type: 'warning', icon: 'compare_arrows' },

  // User statuses
  VERIFIED: { label: 'Verified', type: 'success', icon: 'verified' },
  UNVERIFIED: { label: 'Unverified', type: 'warning', icon: 'help' },
  SUSPENDED: { label: 'Suspended', type: 'error', icon: 'block' },

  // Generic
  YES: { label: 'Yes', type: 'success', icon: 'check' },
  NO: { label: 'No', type: 'error', icon: 'close' },
  NEW: { label: 'New', type: 'info', icon: 'fiber_new' },
  HOT: { label: 'Hot', type: 'error', icon: 'whatshot' },
};

@Component({
  selector: 'smc-status-chip',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './status-chip.component.html',
  styleUrl: './status-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusChipComponent {
  // Use preset key or custom config
  readonly status = input<string>('');
  readonly config = input<StatusConfig | null>(null);

  // Customization
  readonly label = input<string>('');
  readonly type = input<StatusType>('default');
  readonly icon = input<string>('');
  readonly size = input<StatusSize>('medium');
  readonly showIcon = input<boolean>(true);
  readonly showDot = input<boolean>(false);
  readonly outlined = input<boolean>(false);
  readonly pulse = input<boolean>(false);

  readonly resolvedConfig = computed((): StatusConfig => {
    // Priority: custom config > preset > individual inputs
    const customConfig = this.config();
    if (customConfig) return customConfig;

    const status = this.status().toUpperCase();
    if (STATUS_PRESETS[status]) return STATUS_PRESETS[status];

    return {
      label: this.label() || this.status(),
      type: this.type(),
      icon: this.icon(),
    };
  });

  readonly displayLabel = computed(() => this.resolvedConfig().label);

  readonly iconName = computed(() => this.resolvedConfig().icon || this.icon());

  readonly classes = computed(() => {
    const config = this.resolvedConfig();
    const classList = [this.size(), config.type];

    if (this.outlined()) classList.push('outlined');
    if (this.pulse()) classList.push('pulse');

    return classList.join(' ');
  });
}
