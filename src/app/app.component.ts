import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from '@core/services/loading.service';
import { LoadingBarComponent } from '@shared/components/loading-bar/loading-bar.component';
import { SkipLinkComponent } from '@shared/components/skip-link/skip-link.component';

/**
 * Root Application Component
 * ==========================
 * Smart container component that orchestrates the application shell.
 * Uses signals for reactive state management.
 * 
 * Accessibility features:
 * - Skip link for keyboard navigation
 * - Loading bar with ARIA announcements
 */
@Component({
  selector: 'smc-root',
  standalone: true,
  imports: [RouterOutlet, LoadingBarComponent, SkipLinkComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly loadingService = inject(LoadingService);

  /** Global loading state signal */
  readonly isLoading = this.loadingService.isLoading;
}
