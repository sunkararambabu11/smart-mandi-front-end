/**
 * Base API Service
 * 
 * Generic HTTP client wrapper with type-safe methods.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface ApiRequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // ============================================
  // HTTP Methods
  // ============================================

  /**
   * HTTP GET request
   */
  get<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.get<T>(this.buildUrl(endpoint), {
      params: this.buildParams(options?.params),
      headers: this.buildHeaders(options?.headers),
    });
  }

  /**
   * HTTP POST request
   */
  post<T, B = unknown>(
    endpoint: string,
    body: B,
    options?: ApiRequestOptions
  ): Observable<T> {
    return this.http.post<T>(this.buildUrl(endpoint), body, {
      params: this.buildParams(options?.params),
      headers: this.buildHeaders(options?.headers),
    });
  }

  /**
   * HTTP PUT request
   */
  put<T, B = unknown>(
    endpoint: string,
    body: B,
    options?: ApiRequestOptions
  ): Observable<T> {
    return this.http.put<T>(this.buildUrl(endpoint), body, {
      params: this.buildParams(options?.params),
      headers: this.buildHeaders(options?.headers),
    });
  }

  /**
   * HTTP PATCH request
   */
  patch<T, B = unknown>(
    endpoint: string,
    body: B,
    options?: ApiRequestOptions
  ): Observable<T> {
    return this.http.patch<T>(this.buildUrl(endpoint), body, {
      params: this.buildParams(options?.params),
      headers: this.buildHeaders(options?.headers),
    });
  }

  /**
   * HTTP DELETE request
   */
  delete<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.delete<T>(this.buildUrl(endpoint), {
      params: this.buildParams(options?.params),
      headers: this.buildHeaders(options?.headers),
    });
  }

  /**
   * Upload file(s)
   */
  upload<T>(
    endpoint: string,
    files: File | File[],
    fieldName = 'file',
    additionalData?: Record<string, string>
  ): Observable<T> {
    const formData = new FormData();

    if (Array.isArray(files)) {
      files.forEach((file, index) => {
        formData.append(`${fieldName}[${index}]`, file, file.name);
      });
    } else {
      formData.append(fieldName, files, files.name);
    }

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.http.post<T>(this.buildUrl(endpoint), formData);
  }

  // ============================================
  // Private Methods
  // ============================================

  private buildUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${cleanEndpoint}`;
  }

  private buildParams(
    params?: Record<string, string | number | boolean | undefined>
  ): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }

    return httpParams;
  }

  private buildHeaders(headers?: Record<string, string>): HttpHeaders {
    let httpHeaders = new HttpHeaders();

    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        httpHeaders = httpHeaders.set(key, value);
      });
    }

    return httpHeaders;
  }
}

