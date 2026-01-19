import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '@core/services/loading.service';

/**
 * Loading Interceptor
 * ===================
 * Automatically tracks HTTP request loading state.
 * Shows/hides global loading indicator.
 */
export const loadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const loadingService = inject(LoadingService);

  // Skip loading indicator for background requests
  const skipLoading = req.headers.has('X-Skip-Loading');

  if (skipLoading) {
    const cleanReq = req.clone({
      headers: req.headers.delete('X-Skip-Loading'),
    });
    return next(cleanReq);
  }

  loadingService.start();

  return next(req).pipe(
    finalize(() => {
      loadingService.stop();
    })
  );
};
