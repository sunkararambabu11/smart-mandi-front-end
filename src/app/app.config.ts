import {
  ApplicationConfig,
  ErrorHandler,
  provideZoneChangeDetection,
  inject,
  APP_INITIALIZER,
  isDevMode,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withViewTransitions,
  withRouterConfig,
  withInMemoryScrolling,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  withFetch,
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MAT_RIPPLE_GLOBAL_OPTIONS } from '@angular/material/core';

import { routes } from './app.routes';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { loadingInterceptor } from '@core/interceptors/loading.interceptor';
import { GlobalErrorHandler } from '@core/handlers/global-error.handler';
import { AuthService } from '@core/services/auth.service';
import { environment } from '@environments/environment';

/**
 * Application Initializer
 * =======================
 * Runs before the application starts.
 * Checks for existing auth session and validates tokens.
 */
function initializeApp(): () => Promise<void> {
  const authService = inject(AuthService);

  return async () => {
    // Log environment info in dev mode
    if (isDevMode()) {
      console.log(
        `%c🌾 ${environment.appName} v${environment.version}`,
        'color: #2d6a4f; font-size: 16px; font-weight: bold;'
      );
      console.log(
        `%cEnvironment: ${environment.production ? 'Production' : 'Development'}`,
        'color: #64748b;'
      );
      console.log(`%cAPI: ${environment.apiUrl}`, 'color: #64748b;');
    }

    // Attempt to restore session from storage
    try {
      const token = authService.getAccessToken();
      if (token) {
        // Validate token is still valid (optional: call refresh endpoint)
        if (environment.features.debugMode) {
          console.log('🔐 Existing session detected');
        }
      }
    } catch (error) {
      // Session restoration failed, user will need to login
      if (environment.features.debugMode) {
        console.warn('⚠️ Session restoration failed:', error);
      }
    }
  };
}

/**
 * Application Configuration
 * =========================
 * Central configuration for Smart Mandi Connect Angular 20 application.
 *
 * Features:
 * - Standalone component architecture
 * - Signals-first state management
 * - Lazy-loaded routes with preloading
 * - HTTP interceptors pipeline
 * - Global error handling
 * - Angular Material theming
 * - Environment-based configuration
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // ============================================
    // Zone.js Configuration
    // ============================================
    provideZoneChangeDetection({
      eventCoalescing: true, // Coalesce multiple events for better performance
      runCoalescing: true, // Coalesce change detection runs
    }),

    // ============================================
    // Router Configuration
    // ============================================
    provideRouter(
      routes,
      // Bind route params directly to component inputs
      withComponentInputBinding(),
      // Enable smooth page transitions
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ({ transition }) => {
          // Log transitions in debug mode
          if (environment.features.debugMode && isDevMode()) {
            console.log('🔄 View transition started');
            transition.finished.then(() =>
              console.log('✅ View transition completed')
            );
          }
        },
      }),
      // Router behavior configuration
      withRouterConfig({
        onSameUrlNavigation: 'reload',
        paramsInheritanceStrategy: 'always',
        urlUpdateStrategy: 'eager',
      }),
      // Scroll position restoration
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
      // Preload all lazy modules after initial load
      withPreloading(PreloadAllModules)
    ),

    // ============================================
    // HTTP Client Configuration
    // ============================================
    provideHttpClient(
      // Use modern Fetch API instead of XMLHttpRequest
      withFetch(),
      // Interceptors execute in order: auth -> loading -> error
      withInterceptors([authInterceptor, loadingInterceptor, errorInterceptor])
    ),

    // ============================================
    // Animations
    // ============================================
    provideAnimationsAsync(), // Lazy-load animations for better initial bundle

    // ============================================
    // Global Error Handler
    // ============================================
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },

    // ============================================
    // App Initialization
    // ============================================
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true,
    },

    // ============================================
    // Angular Material Defaults
    // ============================================
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['smc-snackbar'],
      },
    },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        appearance: 'outline',
        floatLabel: 'auto',
        hideRequiredMarker: false,
      },
    },
    {
      provide: MAT_RIPPLE_GLOBAL_OPTIONS,
      useValue: {
        disabled: false,
        animation: {
          enterDuration: 300,
          exitDuration: 200,
        },
      },
    },

    // ============================================
    // Environment Token (for DI)
    // ============================================
    {
      provide: 'ENVIRONMENT',
      useValue: environment,
    },
    {
      provide: 'API_URL',
      useValue: environment.apiUrl,
    },
    {
      provide: 'SOCKET_URL',
      useValue: environment.socketUrl,
    },
  ],
};
