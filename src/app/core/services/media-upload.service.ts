/**
 * Media Upload Service
 * ====================
 * Centralized service for uploading product/crop media files.
 * Uses the API endpoint: /uploads/product-media
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpEventType, HttpEvent } from '@angular/common/http';
import { Observable, Subject, throwError, of, forkJoin } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';

import { environment } from '@environments/environment';

/** Upload response from server */
export interface MediaUploadResponse {
  message: string;
  url: string;
  publicId: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  thumbnailUrl?: string;
}

/** Upload progress info */
export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

/** Upload state */
interface UploadState {
  isUploading: boolean;
  progress: Map<string, UploadProgress>;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class MediaUploadService {
  private readonly http = inject(HttpClient);
  private readonly uploadUrl = `${environment.apiUrl}/uploads/product-media`;

  // ============================================
  // State Management
  // ============================================

  private readonly _state = signal<UploadState>({
    isUploading: false,
    progress: new Map(),
    error: null,
  });

  /** Is currently uploading */
  readonly isUploading = computed(() => this._state().isUploading);

  /** Current error */
  readonly error = computed(() => this._state().error);

  /** Upload progress for all files */
  readonly uploadProgress = computed(() => 
    Array.from(this._state().progress.values())
  );

  // ============================================
  // Upload Methods
  // ============================================

  /**
   * Upload a single media file
   */
  uploadFile(file: File): Observable<MediaUploadResponse> {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.error));
    }

    // Initialize progress tracking
    this.initProgress(file.name);

    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<MediaUploadResponse>(this.uploadUrl, formData, {
      reportProgress: true,
      observe: 'events',
    }).pipe(
      tap((event) => this.handleUploadEvent(event, file.name)),
      map((event) => {
        if (event.type === HttpEventType.Response) {
          return event.body as MediaUploadResponse;
        }
        return null as unknown as MediaUploadResponse;
      }),
      catchError((error) => {
        this.updateProgress(file.name, {
          status: 'error',
          error: error.message || 'Upload failed',
        });
        this.updateState({ error: `Failed to upload ${file.name}` });
        return throwError(() => error);
      }),
      finalize(() => {
        this.checkUploadComplete();
      })
    );
  }

  /**
   * Upload multiple media files
   */
  uploadFiles(files: File[]): Observable<MediaUploadResponse[]> {
    if (files.length === 0) {
      return of([]);
    }

    // Validate all files first
    for (const file of files) {
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return throwError(() => new Error(`${file.name}: ${validation.error}`));
      }
    }

    this.updateState({ isUploading: true, error: null });

    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file, file.name);
      this.initProgress(file.name);
    });

    return this.http.post<MediaUploadResponse[]>(this.uploadUrl, formData, {
      reportProgress: true,
      observe: 'events',
    }).pipe(
      tap((event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const progress = Math.round((100 * event.loaded) / event.total);
          files.forEach(file => {
            this.updateProgress(file.name, { progress, status: 'uploading' });
          });
        }
      }),
      map((event) => {
        if (event.type === HttpEventType.Response) {
          const responses = event.body as MediaUploadResponse[];
          files.forEach((file, index) => {
            this.updateProgress(file.name, {
              status: 'completed',
              progress: 100,
              url: responses[index]?.url,
            });
          });
          return responses;
        }
        return [] as MediaUploadResponse[];
      }),
      catchError((error) => {
        files.forEach(file => {
          this.updateProgress(file.name, {
            status: 'error',
            error: error.message || 'Upload failed',
          });
        });
        this.updateState({ error: 'Failed to upload files' });
        return throwError(() => error);
      }),
      finalize(() => {
        this.updateState({ isUploading: false });
      })
    );
  }

  /**
   * Upload files one by one with individual progress tracking
   */
  uploadFilesSequentially(files: File[]): Observable<MediaUploadResponse[]> {
    if (files.length === 0) {
      return of([]);
    }

    this.updateState({ isUploading: true, error: null });

    const uploads = files.map(file => this.uploadFile(file));
    
    return forkJoin(uploads).pipe(
      map(responses => responses.filter(r => r !== null)),
      finalize(() => {
        this.updateState({ isUploading: false });
      })
    );
  }

  /**
   * Clear upload state
   */
  clearState(): void {
    this._state.set({
      isUploading: false,
      progress: new Map(),
      error: null,
    });
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.updateState({ error: null });
  }

  // ============================================
  // Private Methods
  // ============================================

  private validateFile(file: File): { valid: boolean; error?: string } {
    const { maxFileSize, allowedImageTypes } = environment.upload;

    if (!allowedImageTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: ${allowedImageTypes.join(', ')}`,
      };
    }

    if (file.size > maxFileSize) {
      const maxMB = (maxFileSize / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `File too large. Maximum size: ${maxMB}MB`,
      };
    }

    return { valid: true };
  }

  private initProgress(fileName: string): void {
    const progress = new Map(this._state().progress);
    progress.set(fileName, {
      fileName,
      progress: 0,
      status: 'pending',
    });
    this.updateState({ progress, isUploading: true });
  }

  private updateProgress(fileName: string, update: Partial<UploadProgress>): void {
    const progress = new Map(this._state().progress);
    const current = progress.get(fileName);
    if (current) {
      progress.set(fileName, { ...current, ...update });
      this._state.update(state => ({ ...state, progress }));
    }
  }

  private handleUploadEvent(event: HttpEvent<any>, fileName: string): void {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        if (event.total) {
          const progress = Math.round((100 * event.loaded) / event.total);
          this.updateProgress(fileName, { progress, status: 'uploading' });
        }
        break;
      case HttpEventType.Response:
        const response = event.body as MediaUploadResponse;
        this.updateProgress(fileName, {
          status: 'completed',
          progress: 100,
          url: response?.url,
        });
        break;
    }
  }

  private checkUploadComplete(): void {
    const allComplete = Array.from(this._state().progress.values())
      .every(p => p.status === 'completed' || p.status === 'error');
    
    if (allComplete) {
      this.updateState({ isUploading: false });
    }
  }

  private updateState(partial: Partial<UploadState>): void {
    this._state.update(state => ({ ...state, ...partial }));
  }
}
