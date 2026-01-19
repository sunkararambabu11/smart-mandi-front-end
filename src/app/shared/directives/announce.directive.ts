/**
 * Announce Directive
 * ==================
 * Announces dynamic content changes to screen readers.
 * Uses ARIA live regions for accessibility.
 * 
 * Usage:
 * <span [smcAnnounce]="dynamicMessage" politeness="polite"></span>
 * 
 * Or programmatically via the service.
 */

import {
  Directive,
  input,
  effect,
} from '@angular/core';
import { ScreenReaderService } from '../services/screen-reader.service';
import { inject } from '@angular/core';

@Directive({
  selector: '[smcAnnounce]',
  standalone: true,
})
export class AnnounceDirective {
  private readonly screenReader = inject(ScreenReaderService);

  /** Message to announce */
  readonly smcAnnounce = input<string>('');

  /** Politeness level: 'polite' or 'assertive' */
  readonly politeness = input<'polite' | 'assertive'>('polite');

  private lastMessage = '';

  constructor() {
    effect(() => {
      const message = this.smcAnnounce();
      
      // Only announce if message has changed
      if (message && message !== this.lastMessage) {
        this.lastMessage = message;
        this.screenReader.announce(message, this.politeness());
      }
    });
  }
}

