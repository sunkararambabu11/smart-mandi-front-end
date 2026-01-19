import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { LoadingService } from '@core/services/loading.service';

/**
 * Loading Bar Component
 * =====================
 * Global loading indicator that appears at the top of the page.
 * Uses signals for reactive state management.
 */
@Component({
  selector: 'smc-loading-bar',
  standalone: true,
  templateUrl: './loading-bar.component.html',
  styleUrl: './loading-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingBarComponent {
  private readonly loadingService = inject(LoadingService);

  readonly isLoading = this.loadingService.isLoading;
}
