/**
 * Screen Reader Service
 * =====================
 * Service for announcing dynamic content to screen readers.
 * Creates ARIA live regions for accessibility announcements.
 */

import { Injectable, signal } from '@angular/core';

export type Politeness = 'off' | 'polite' | 'assertive';

interface Announcement {
  message: string;
  politeness: Politeness;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class ScreenReaderService {
  /** Current announcement for reactive binding */
  readonly currentAnnouncement = signal<string>('');

  /** Announcement history for debugging */
  private readonly _history = signal<Announcement[]>([]);
  readonly history = this._history.asReadonly();

  /** Live region elements */
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;

  constructor() {
    this.createLiveRegions();
  }

  /**
   * Announce a message to screen readers
   * @param message - The message to announce
   * @param politeness - 'polite' (default) waits for user pause, 'assertive' interrupts
   */
  announce(message: string, politeness: Politeness = 'polite'): void {
    if (!message) return;

    // Update signal
    this.currentAnnouncement.set(message);

    // Add to history
    this._history.update((history) => [
      ...history.slice(-9), // Keep last 10 announcements
      { message, politeness, timestamp: Date.now() },
    ]);

    // Announce via live region
    const region = politeness === 'assertive' 
      ? this.assertiveRegion 
      : this.politeRegion;

    if (region) {
      // Clear and set message for re-announcement capability
      region.textContent = '';
      
      // Use requestAnimationFrame to ensure DOM update
      requestAnimationFrame(() => {
        region.textContent = message;
      });
    }
  }

  /**
   * Announce after a delay
   */
  announceDelayed(message: string, delayMs: number, politeness: Politeness = 'polite'): void {
    setTimeout(() => this.announce(message, politeness), delayMs);
  }

  /**
   * Clear the current announcement
   */
  clear(): void {
    this.currentAnnouncement.set('');
    if (this.politeRegion) this.politeRegion.textContent = '';
    if (this.assertiveRegion) this.assertiveRegion.textContent = '';
  }

  /**
   * Create hidden live regions for screen reader announcements
   */
  private createLiveRegions(): void {
    // Only create in browser environment
    if (typeof document === 'undefined') return;

    // Create polite region
    this.politeRegion = this.createRegion('polite');
    
    // Create assertive region
    this.assertiveRegion = this.createRegion('assertive');
  }

  private createRegion(politeness: 'polite' | 'assertive'): HTMLElement {
    const region = document.createElement('div');
    
    // Screen reader only styles
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.setAttribute('role', 'status');
    region.className = 'sr-only';
    region.id = `smc-${politeness}-announcer`;
    
    // Visually hidden but accessible
    Object.assign(region.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    });

    document.body.appendChild(region);
    return region;
  }
}

