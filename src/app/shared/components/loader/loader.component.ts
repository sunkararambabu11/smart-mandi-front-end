/**
 * Loader Component
 * ================
 * Versatile loading spinner component with multiple variants and sizes.
 * Use this for content loading states, button loading, and inline loaders.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type LoaderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LoaderVariant = 'spinner' | 'dots' | 'pulse' | 'bars';
export type LoaderColor = 'primary' | 'accent' | 'white' | 'muted' | 'current';

@Component({
  selector: 'smc-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderComponent {
  // Configuration
  readonly size = input<LoaderSize>('md');
  readonly variant = input<LoaderVariant>('spinner');
  readonly color = input<LoaderColor>('primary');

  // Display options
  readonly text = input<string>('');
  readonly showText = input<boolean>(true);
  readonly ariaLabel = input<string>('Loading...');

  // Layout options
  readonly fullScreen = input<boolean>(false);
  readonly overlay = input<boolean>(false);
  readonly inline = input<boolean>(false);

  readonly sizeClass = computed(() => this.size());
  readonly textSizeClass = computed(() => `text-${this.size()}`);

  readonly containerClasses = computed(() => {
    const classes: string[] = [`color-${this.color()}`];

    if (this.fullScreen()) classes.push('full-screen');
    if (this.overlay()) classes.push('overlay');
    if (this.inline()) classes.push('inline');

    return classes.join(' ');
  });
}
