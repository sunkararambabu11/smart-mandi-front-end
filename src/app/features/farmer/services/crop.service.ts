import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, of, delay } from 'rxjs';
import { environment } from '@environments/environment';

/**
 * Quality Grade Enum
 */
export enum QualityGrade {
  PREMIUM = 'PREMIUM',
  GRADE_A = 'GRADE_A',
  GRADE_B = 'GRADE_B',
  STANDARD = 'STANDARD',
}

/**
 * Quality Grade Display Names
 */
export const QUALITY_GRADE_LABELS: Record<QualityGrade, string> = {
  [QualityGrade.PREMIUM]: 'Premium Quality',
  [QualityGrade.GRADE_A]: 'Grade A',
  [QualityGrade.GRADE_B]: 'Grade B',
  [QualityGrade.STANDARD]: 'Standard',
};

/**
 * Crop Category
 */
export interface CropCategory {
  readonly id: string;
  readonly name: string;
  readonly localName: string;
  readonly icon: string;
}

/**
 * Crop Listing
 */
export interface CropListing {
  readonly id: string;
  readonly farmerId: string;
  readonly cropName: string;
  readonly category: string;
  readonly quantity: number;
  readonly unit: string;
  readonly expectedPrice: number;
  readonly qualityGrade: QualityGrade;
  readonly harvestDate: Date;
  readonly images: string[];
  readonly description?: string;
  readonly isOrganic: boolean;
  readonly status: 'draft' | 'pending' | 'active' | 'sold' | 'expired';
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Create Crop DTO
 */
export interface CreateCropDto {
  readonly cropName: string;
  readonly category: string;
  readonly quantity: number;
  readonly unit: string;
  readonly expectedPrice: number;
  readonly qualityGrade: QualityGrade;
  readonly harvestDate: Date;
  readonly description?: string;
  readonly isOrganic: boolean;
}

/**
 * Image Upload Response
 */
export interface ImageUploadResponse {
  readonly url: string;
  readonly thumbnailUrl: string;
  readonly publicId: string;
}

/**
 * Crop Service State
 */
interface CropServiceState {
  crops: CropListing[];
  categories: CropCategory[];
  isLoading: boolean;
  isSubmitting: boolean;
  uploadProgress: number;
  error: string | null;
  successMessage: string | null;
}

/**
 * Crop Service
 * ============
 * Signals-based service for managing crop listings.
 */
@Injectable({ providedIn: 'root' })
export class CropService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/farmer/crops`;

  // ============================================
  // Private State Signal
  // ============================================

  private readonly _state = signal<CropServiceState>({
    crops: [],
    categories: this.getDefaultCategories(),
    isLoading: false,
    isSubmitting: false,
    uploadProgress: 0,
    error: null,
    successMessage: null,
  });

  // ============================================
  // Public Computed Signals
  // ============================================

  /** All crops */
  readonly crops = computed(() => this._state().crops);

  /** Active crops */
  readonly activeCrops = computed(() =>
    this._state().crops.filter((c) => c.status === 'active')
  );

  /** Crop categories */
  readonly categories = computed(() => this._state().categories);

  /** Loading state */
  readonly isLoading = computed(() => this._state().isLoading);

  /** Submitting state */
  readonly isSubmitting = computed(() => this._state().isSubmitting);

  /** Upload progress */
  readonly uploadProgress = computed(() => this._state().uploadProgress);

  /** Error message */
  readonly error = computed(() => this._state().error);

  /** Success message */
  readonly successMessage = computed(() => this._state().successMessage);

  /** Quality grades for dropdown */
  readonly qualityGrades = Object.entries(QUALITY_GRADE_LABELS).map(
    ([value, label]) => ({
      value: value as QualityGrade,
      label,
    })
  );

  /** Units for dropdown */
  readonly units = [
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'quintal', label: 'Quintal (100 kg)' },
    { value: 'ton', label: 'Ton (1000 kg)' },
    { value: 'dozen', label: 'Dozen' },
    { value: 'piece', label: 'Piece' },
    { value: 'bundle', label: 'Bundle' },
  ];

  // ============================================
  // Public Methods
  // ============================================

  /**
   * Load farmer's crops
   */
  loadCrops(): void {
    this.updateState({ isLoading: true, error: null });

    if (!environment.production) {
      of(this.getMockCrops())
        .pipe(delay(500))
        .subscribe((crops) => {
          this.updateState({ crops, isLoading: false });
        });
      return;
    }

    this.http
      .get<CropListing[]>(this.apiUrl)
      .pipe(
        tap((crops) => {
          this.updateState({ crops, isLoading: false });
        }),
        catchError((error) => {
          this.updateState({
            isLoading: false,
            error: 'Failed to load crops',
          });
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  /**
   * Create new crop listing
   */
  createCrop(data: CreateCropDto, images: File[]): Observable<CropListing> {
    this.updateState({
      isSubmitting: true,
      error: null,
      successMessage: null,
    });

    if (!environment.production) {
      // Simulate API call in development
      return of(this.createMockCrop(data)).pipe(
        delay(1500),
        tap((crop) => {
          this.updateState({
            crops: [crop, ...this._state().crops],
            isSubmitting: false,
            successMessage: 'Crop listing created successfully!',
          });
        })
      );
    }

    // In production, first upload images, then create crop
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(
          key,
          value instanceof Date ? value.toISOString() : String(value)
        );
      }
    });
    images.forEach((image) => formData.append('images', image));

    return this.http.post<CropListing>(this.apiUrl, formData).pipe(
      tap((crop) => {
        this.updateState({
          crops: [crop, ...this._state().crops],
          isSubmitting: false,
          successMessage: 'Crop listing created successfully!',
        });
      }),
      catchError((error) => {
        this.updateState({
          isSubmitting: false,
          error: error.error?.message || 'Failed to create crop listing',
        });
        return throwError(() => error);
      })
    );
  }

  /**
   * Upload image
   */
  uploadImage(file: File): Observable<ImageUploadResponse> {
    this.updateState({ uploadProgress: 0 });

    if (!environment.production) {
      // Simulate upload in development
      return of({
        url: URL.createObjectURL(file),
        thumbnailUrl: URL.createObjectURL(file),
        publicId: `mock_${Date.now()}`,
      }).pipe(
        delay(1000),
        tap(() => this.updateState({ uploadProgress: 100 }))
      );
    }

    const formData = new FormData();
    formData.append('image', file);

    return this.http
      .post<ImageUploadResponse>(`${this.apiUrl}/upload-image`, formData, {
        reportProgress: true,
      })
      .pipe(
        tap(() => this.updateState({ uploadProgress: 100 })),
        catchError((error) => {
          this.updateState({ uploadProgress: 0, error: 'Image upload failed' });
          return throwError(() => error);
        })
      );
  }

  /**
   * Clear messages
   */
  clearMessages(): void {
    this.updateState({ error: null, successMessage: null });
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

  private updateState(partial: Partial<CropServiceState>): void {
    this._state.update((state) => ({ ...state, ...partial }));
  }

  private getDefaultCategories(): CropCategory[] {
    return [
      { id: '1', name: 'Vegetables', localName: 'सब्जियां', icon: 'eco' },
      { id: '2', name: 'Fruits', localName: 'फल', icon: 'nutrition' },
      { id: '3', name: 'Grains', localName: 'अनाज', icon: 'grain' },
      { id: '4', name: 'Pulses', localName: 'दालें', icon: 'spa' },
      { id: '5', name: 'Spices', localName: 'मसाले', icon: 'local_fire_department' },
      { id: '6', name: 'Oilseeds', localName: 'तिलहन', icon: 'water_drop' },
      { id: '7', name: 'Cash Crops', localName: 'नकदी फसलें', icon: 'payments' },
      { id: '8', name: 'Other', localName: 'अन्य', icon: 'category' },
    ];
  }

  private getMockCrops(): CropListing[] {
    const now = Date.now();
    return [
      {
        id: '1',
        farmerId: 'farmer_1',
        cropName: 'Organic Tomatoes',
        category: 'Vegetables',
        quantity: 500,
        unit: 'kg',
        expectedPrice: 45,
        qualityGrade: QualityGrade.PREMIUM,
        harvestDate: new Date(now + 7 * 24 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400'],
        description: 'Fresh organic tomatoes from our farm',
        isOrganic: true,
        status: 'active',
        createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: '2',
        farmerId: 'farmer_1',
        cropName: 'Basmati Rice',
        category: 'Grains',
        quantity: 2000,
        unit: 'kg',
        expectedPrice: 85,
        qualityGrade: QualityGrade.GRADE_A,
        harvestDate: new Date(now + 14 * 24 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'],
        description: 'Premium quality basmati rice',
        isOrganic: false,
        status: 'active',
        createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: '3',
        farmerId: 'farmer_1',
        cropName: 'Fresh Potatoes',
        category: 'Vegetables',
        quantity: 1500,
        unit: 'kg',
        expectedPrice: 28,
        qualityGrade: QualityGrade.GRADE_A,
        harvestDate: new Date(now + 3 * 24 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1518977676601-b53f82ber3b2?w=400'],
        description: 'Farm fresh potatoes',
        isOrganic: false,
        status: 'pending',
        createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: '4',
        farmerId: 'farmer_1',
        cropName: 'Green Chillies',
        category: 'Vegetables',
        quantity: 200,
        unit: 'kg',
        expectedPrice: 65,
        qualityGrade: QualityGrade.PREMIUM,
        harvestDate: new Date(now - 2 * 24 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=400'],
        description: 'Spicy green chillies',
        isOrganic: true,
        status: 'sold',
        createdAt: new Date(now - 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: '5',
        farmerId: 'farmer_1',
        cropName: 'Wheat',
        category: 'Grains',
        quantity: 5000,
        unit: 'kg',
        expectedPrice: 24,
        qualityGrade: QualityGrade.GRADE_B,
        harvestDate: new Date(now + 30 * 24 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400'],
        description: 'High quality wheat grains',
        isOrganic: false,
        status: 'draft',
        createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: '6',
        farmerId: 'farmer_1',
        cropName: 'Alphonso Mangoes',
        category: 'Fruits',
        quantity: 300,
        unit: 'kg',
        expectedPrice: 350,
        qualityGrade: QualityGrade.PREMIUM,
        harvestDate: new Date(now - 30 * 24 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=400'],
        description: 'Sweet Alphonso mangoes from Ratnagiri',
        isOrganic: false,
        status: 'expired',
        createdAt: new Date(now - 60 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: '7',
        farmerId: 'farmer_1',
        cropName: 'Onions',
        category: 'Vegetables',
        quantity: 1000,
        unit: 'kg',
        expectedPrice: 32,
        qualityGrade: QualityGrade.GRADE_A,
        harvestDate: new Date(now + 5 * 24 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400'],
        description: 'Red onions from Maharashtra',
        isOrganic: false,
        status: 'active',
        createdAt: new Date(now - 8 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: '8',
        farmerId: 'farmer_1',
        cropName: 'Organic Spinach',
        category: 'Vegetables',
        quantity: 100,
        unit: 'kg',
        expectedPrice: 40,
        qualityGrade: QualityGrade.PREMIUM,
        harvestDate: new Date(now + 2 * 24 * 60 * 60 * 1000),
        images: ['https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400'],
        description: 'Fresh organic spinach leaves',
        isOrganic: true,
        status: 'active',
        createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  private createMockCrop(data: CreateCropDto): CropListing {
    return {
      id: `crop_${Date.now()}`,
      farmerId: 'farmer_1',
      ...data,
      images: [],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

