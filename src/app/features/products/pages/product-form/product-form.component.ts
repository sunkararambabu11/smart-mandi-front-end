/**
 * Product Form Page Component
 * ===========================
 * Add/Edit product form with image upload and validation.
 */

import { Component, ChangeDetectionStrategy, input, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, throwError } from 'rxjs';

import { MediaUploadService } from '@core/services/media-upload.service';
import { environment } from '@environments/environment';

interface Category {
  id: string;
  name: string;
  icon: string;
}

/** Uploaded image info */
interface UploadedImage {
  url: string;
  publicId: string;
  isUploading: boolean;
  progress: number;
  error?: string;
}

@Component({
  selector: 'smc-product-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatStepperModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class ProductFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly mediaUploadService = inject(MediaUploadService);
  private readonly http = inject(HttpClient);

  readonly productId = input<string>();
  readonly isEditMode = computed(() => !!this.productId());

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly uploadedImages = signal<UploadedImage[]>([]);
  readonly isDragging = signal(false);

  /** Get image URLs for display */
  readonly imageUrls = computed(() => 
    this.uploadedImages().map(img => img.url)
  );

  /** Check if any image is uploading */
  readonly isUploading = computed(() => 
    this.uploadedImages().some(img => img.isUploading)
  );

  readonly categories: Category[] = [
    { id: 'vegetables', name: 'Vegetables', icon: '🥬' },
    { id: 'fruits', name: 'Fruits', icon: '🍎' },
    { id: 'grains', name: 'Grains & Pulses', icon: '🌾' },
    { id: 'dairy', name: 'Dairy', icon: '🥛' },
    { id: 'spices', name: 'Spices', icon: '🌶️' },
    { id: 'flowers', name: 'Flowers', icon: '🌸' },
    { id: 'herbs', name: 'Herbs', icon: '🌿' },
    { id: 'other', name: 'Other', icon: '📦' },
  ];

  readonly units = [
    { value: 'kg', label: 'Kilogram (kg)' },
    { value: 'gram', label: 'Gram (g)' },
    { value: 'quintal', label: 'Quintal' },
    { value: 'ton', label: 'Metric Ton' },
    { value: 'piece', label: 'Piece' },
    { value: 'dozen', label: 'Dozen' },
    { value: 'bundle', label: 'Bundle' },
  ];

  readonly qualities = [
    { value: 'premium', label: 'Premium', description: 'Top quality, best appearance' },
    { value: 'grade-a', label: 'Grade A', description: 'Excellent quality' },
    { value: 'grade-b', label: 'Grade B', description: 'Good quality, minor imperfections' },
    { value: 'grade-c', label: 'Grade C', description: 'Standard quality' },
  ];

  readonly states = [
    { value: 'AP', label: 'Andhra Pradesh' },
    { value: 'AR', label: 'Arunachal Pradesh' },
    { value: 'AS', label: 'Assam' },
    { value: 'BR', label: 'Bihar' },
    { value: 'CT', label: 'Chhattisgarh' },
    { value: 'GA', label: 'Goa' },
    { value: 'GJ', label: 'Gujarat' },
    { value: 'HR', label: 'Haryana' },
    { value: 'HP', label: 'Himachal Pradesh' },
    { value: 'JH', label: 'Jharkhand' },
    { value: 'KA', label: 'Karnataka' },
    { value: 'KL', label: 'Kerala' },
    { value: 'MP', label: 'Madhya Pradesh' },
    { value: 'MH', label: 'Maharashtra' },
    { value: 'MN', label: 'Manipur' },
    { value: 'ML', label: 'Meghalaya' },
    { value: 'MZ', label: 'Mizoram' },
    { value: 'NL', label: 'Nagaland' },
    { value: 'OR', label: 'Odisha' },
    { value: 'PB', label: 'Punjab' },
    { value: 'RJ', label: 'Rajasthan' },
    { value: 'SK', label: 'Sikkim' },
    { value: 'TN', label: 'Tamil Nadu' },
    { value: 'TG', label: 'Telangana' },
    { value: 'TR', label: 'Tripura' },
    { value: 'UP', label: 'Uttar Pradesh' },
    { value: 'UK', label: 'Uttarakhand' },
    { value: 'WB', label: 'West Bengal' },
    { value: 'DL', label: 'Delhi' },
  ];

  readonly productForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    category: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
    price: [null, [Validators.required, Validators.min(1)]],
    unit: ['kg', Validators.required],
    quantity: [null, [Validators.required, Validators.min(1)]],
    minOrderQuantity: [1, [Validators.min(1)]],
    quality: ['grade-a', Validators.required],
    isOrganic: [false],
    harvestDate: [null],
    expiryDays: [7, [Validators.min(1), Validators.max(365)]],
    village: ['', Validators.required],
    district: ['', Validators.required],
    state: ['', Validators.required],
    pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    deliveryAvailable: [true],
    negotiable: [true],
  });

  ngOnInit(): void {
    if (this.isEditMode()) {
      this.loadProduct();
    }
  }

  private loadProduct(): void {
    this.isLoading.set(true);
    
    // Simulate loading product data
    setTimeout(() => {
      this.productForm.patchValue({
        name: 'Organic Tomatoes',
        category: 'vegetables',
        description: 'Fresh organic tomatoes grown without pesticides in our family farm. These tomatoes are hand-picked at peak ripeness.',
        price: 45,
        unit: 'kg',
        quantity: 500,
        quality: 'premium',
        isOrganic: true,
        harvestDate: new Date(),
        village: 'Nashik',
        district: 'Nashik',
        state: 'MH',
        pincode: '422001',
      });
      this.uploadedImages.set([
        { 
          url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
          publicId: 'existing_1',
          isUploading: false,
          progress: 100,
        },
      ]);
      this.isLoading.set(false);
    }, 500);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    
    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(files);
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(input.files);
    }
  }

  private handleFiles(files: FileList): void {
    const { allowedImageTypes, maxFileSize } = environment.upload;

    Array.from(files).forEach(file => {
      if (!allowedImageTypes.includes(file.type)) {
        this.snackBar.open('Invalid file type. Use JPG, PNG, or WebP.', 'Close', { duration: 3000 });
        return;
      }
      
      if (file.size > maxFileSize) {
        const maxMB = (maxFileSize / (1024 * 1024)).toFixed(1);
        this.snackBar.open(`File too large. Max size is ${maxMB}MB.`, 'Close', { duration: 3000 });
        return;
      }

      // Create local preview first
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const localUrl = URL.createObjectURL(file);
      
      // Add to uploadedImages with uploading state
      this.uploadedImages.update(images => [...images, {
        url: localUrl,
        publicId: tempId,
        isUploading: true,
        progress: 0,
      }]);

      // Upload to server
      this.mediaUploadService.uploadFile(file).subscribe({
        next: (response) => {
          // Update the image with server URL
          this.uploadedImages.update(images => 
            images.map(img => 
              img.publicId === tempId 
                ? { ...img, url: response.url, publicId: response.publicId, isUploading: false, progress: 100 }
                : img
            )
          );
          // Revoke the local object URL
          URL.revokeObjectURL(localUrl);
        },
        error: (error) => {
          console.error('Upload failed:', error);
          // Mark as error
          this.uploadedImages.update(images => 
            images.map(img => 
              img.publicId === tempId 
                ? { ...img, isUploading: false, error: 'Upload failed' }
                : img
            )
          );
          this.snackBar.open(`Failed to upload ${file.name}`, 'Retry', { duration: 5000 });
        },
      });
    });
  }

  removeImage(index: number): void {
    const images = this.uploadedImages();
    const imageToRemove = images[index];
    
    // Revoke object URL if it's a local blob
    if (imageToRemove?.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    
    this.uploadedImages.update(imgs => imgs.filter((_, i) => i !== index));
  }

  onSubmit(saveAsDraft = false): void {
    if (!saveAsDraft && this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    // Check if any uploads are still in progress
    if (this.isUploading()) {
      this.snackBar.open('Please wait for images to finish uploading', 'Close', { duration: 3000 });
      return;
    }

    // Check for upload errors
    const hasErrors = this.uploadedImages().some(img => img.error);
    if (hasErrors) {
      this.snackBar.open('Some images failed to upload. Please remove or retry them.', 'Close', { duration: 3000 });
      return;
    }

    // Check if at least one image is uploaded
    const uploadedImages = this.uploadedImages()
      .filter(img => !img.error && !img.isUploading && img.url);
    
    if (uploadedImages.length === 0) {
      this.snackBar.open('Please upload at least one image', 'Close', { duration: 3000 });
      return;
    }

    this.isSaving.set(true);

    const formValue = this.productForm.value;

    // Map category id to full name
    const categoryMap: Record<string, string> = {
      'vegetables': 'Vegetables',
      'fruits': 'Fruits',
      'grains': 'Grains & Pulses',
      'dairy': 'Dairy',
      'spices': 'Spices',
      'flowers': 'Flowers',
      'herbs': 'Herbs',
      'other': 'Other',
    };
    const categoryName = categoryMap[formValue.category] || formValue.category;

    // Map state code to full name
    const stateInfo = this.states.find(s => s.value === formValue.state);
    const stateName = stateInfo?.label || formValue.state;

    // Prepare API payload
    const apiPayload: any = {
      name: formValue.name.trim(),
      category: categoryName,
      pricePerKg: formValue.price,
      quantity: formValue.quantity,
      unit: formValue.unit.toUpperCase(),
      description: formValue.description.trim(),
      location: {
        state: stateName,
        district: formValue.district.trim(),
        pincode: formValue.pincode.trim(),
      },
      media: uploadedImages.map(img => ({
        url: img.url,
        type: 'IMAGE' as const,
      })),
    };

    // Format harvest date as YYYY-MM-DD (only if provided)
    if (formValue.harvestDate) {
      const date = new Date(formValue.harvestDate);
      apiPayload.harvestDate = date.toISOString().split('T')[0];
    }

    // Make API call
    const apiUrl = `${environment.apiUrl}/products`;
    const request = this.isEditMode() && this.productId()
      ? this.http.put(`${apiUrl}/${this.productId()}`, apiPayload)
      : this.http.post(apiUrl, apiPayload);

    request.pipe(
      catchError((error) => {
        console.error('Product submission error:', error);
        const errorMessage = error.error?.message || error.message || 'Failed to save product';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        this.isSaving.set(false);
        return throwError(() => error);
      })
    ).subscribe({
      next: (response) => {
        this.isSaving.set(false);
        this.snackBar.open(
          saveAsDraft ? 'Product saved as draft' : 
          this.isEditMode() ? 'Product updated successfully' : 'Product published successfully',
          'View',
          { duration: 3000 }
        );
        this.router.navigate(['/products']);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }

  getErrorMessage(field: string): string {
    const control = this.productForm.get(field);
    if (!control) return '';
    
    if (control.hasError('required')) return 'This field is required';
    if (control.hasError('minlength')) return `Minimum ${control.errors?.['minlength'].requiredLength} characters`;
    if (control.hasError('maxlength')) return `Maximum ${control.errors?.['maxlength'].requiredLength} characters`;
    if (control.hasError('min')) return `Minimum value is ${control.errors?.['min'].min}`;
    
    return '';
  }
}
