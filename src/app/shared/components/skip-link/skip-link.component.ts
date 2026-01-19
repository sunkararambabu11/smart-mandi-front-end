/**
 * Skip Link Component
 * ===================
 * Accessible skip-to-content link for keyboard navigation.
 * Allows keyboard users to bypass repetitive navigation.
 * 
 * Usage:
 * <smc-skip-link />
 * 
 * Target element should have id="main-content":
 * <main id="main-content" tabindex="-1">...</main>
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'smc-skip-link',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skip-link.component.html',
  styleUrl: './skip-link.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkipLinkComponent {
  /** ID of the target element to skip to */
  readonly targetId = input<string>('main-content');

  /** Label for the skip link */
  readonly label = input<string>('Skip to main content');

  /** Visibility state for styling */
  readonly isVisible = signal(false);

  onFocus(): void {
    this.isVisible.set(true);
  }

  onBlur(): void {
    this.isVisible.set(false);
  }

  onClick(event: Event): void {
    event.preventDefault();
    const target = document.getElementById(this.targetId());
    
    if (target) {
      // Ensure target can receive focus
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

