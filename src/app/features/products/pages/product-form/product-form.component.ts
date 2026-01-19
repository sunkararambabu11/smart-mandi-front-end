/**
 * Product Form Page Component
 * ===========================
 * Add/Edit product form with image upload and validation.
 */

import { Component, ChangeDetectionStrategy, input, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

interface Category {
  id: string;
  name: string;
  icon: string;
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

  readonly productId = input<string>();
  readonly isEditMode = computed(() => !!this.productId());

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly uploadedImages = signal<string[]>([]);
  readonly isDragging = signal(false);

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
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
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
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    Array.from(files).forEach(file => {
      if (!validTypes.includes(file.type)) {
        this.snackBar.open('Invalid file type. Use JPG, PNG, or WebP.', 'Close', { duration: 3000 });
        return;
      }
      
      if (file.size > maxSize) {
        this.snackBar.open('File too large. Max size is 5MB.', 'Close', { duration: 3000 });
        return;
      }

      // Simulate upload - in reality you'd upload to server
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.uploadedImages.update(images => [...images, result]);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    this.uploadedImages.update(images => images.filter((_, i) => i !== index));
  }

  onSubmit(saveAsDraft = false): void {
    if (!saveAsDraft && this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.isSaving.set(true);

    const formData = {
      ...this.productForm.value,
      images: this.uploadedImages(),
      status: saveAsDraft ? 'draft' : 'active',
    };

    // Simulate API call
    setTimeout(() => {
      this.isSaving.set(false);
      this.snackBar.open(
        saveAsDraft ? 'Product saved as draft' : 
        this.isEditMode() ? 'Product updated successfully' : 'Product published successfully',
        'View',
        { duration: 3000 }
      );
      this.router.navigate(['/products']);
    }, 1500);
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
