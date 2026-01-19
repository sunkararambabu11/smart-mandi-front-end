/**
 * Focus Trap Directive
 * ====================
 * Traps keyboard focus within a container element.
 * Essential for accessible modals, dialogs, and drawers.
 * 
 * Usage:
 * <div smcFocusTrap [trapEnabled]="isOpen">
 *   Modal content here
 * </div>
 */

import {
  Directive,
  ElementRef,
  inject,
  input,
  effect,
  OnDestroy,
} from '@angular/core';

/** Focusable element selectors */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

@Directive({
  selector: '[smcFocusTrap]',
  standalone: true,
})
export class FocusTrapDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  
  /** Whether the focus trap is enabled */
  readonly trapEnabled = input<boolean>(true);
  
  /** Whether to focus the first element when trap activates */
  readonly autoFocus = input<boolean>(true);
  
  /** Whether to restore focus when trap deactivates */
  readonly restoreFocus = input<boolean>(true);

  private previouslyFocusedElement: HTMLElement | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    effect(() => {
      if (this.trapEnabled()) {
        this.activate();
      } else {
        this.deactivate();
      }
    });
  }

  ngOnDestroy(): void {
    this.deactivate();
  }

  private activate(): void {
    // Store the currently focused element
    this.previouslyFocusedElement = document.activeElement as HTMLElement;

    // Add keydown listener for Tab key trapping
    this.keydownHandler = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this.keydownHandler);

    // Auto-focus the first focusable element
    if (this.autoFocus()) {
      requestAnimationFrame(() => {
        const firstFocusable = this.getFirstFocusable();
        firstFocusable?.focus();
      });
    }
  }

  private deactivate(): void {
    // Remove keydown listener
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }

    // Restore focus to previously focused element
    if (this.restoreFocus() && this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
      this.previouslyFocusedElement = null;
    }
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;

    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey) {
      // Shift + Tab: Move focus backwards
      if (activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab: Move focus forwards
      if (activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  private getFocusableElements(): HTMLElement[] {
    return Array.from(
      this.elementRef.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    ).filter((el) => this.isVisible(el));
  }

  private getFirstFocusable(): HTMLElement | null {
    const elements = this.getFocusableElements();
    return elements[0] || null;
  }

  private isVisible(element: HTMLElement): boolean {
    return !!(
      element.offsetWidth ||
      element.offsetHeight ||
      element.getClientRects().length
    );
  }
}

