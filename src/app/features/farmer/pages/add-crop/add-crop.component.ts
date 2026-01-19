/**
 * Add Crop Listing Component
 * ==========================
 * Form for farmers to create new crop listings.
 * Features reactive forms, image upload with preview, and validation.
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';

import {
  CropService,
  QualityGrade,
  CreateCropDto,
} from '../../services/crop.service';

/** Image preview interface */
interface ImagePreview {
  file: File;
  url: string;
  name: string;
  size: string;
  uploading: boolean;
}

@Component({
  selector: 'smc-add-crop',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatChipsModule,
  ],
  templateUrl: './add-crop.component.html',
  styleUrl: './add-crop.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCropComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly cropService = inject(CropService);

  /** Maximum number of images allowed */
  readonly MAX_IMAGES = 5;

  /** Maximum file size in bytes (5MB) */
  readonly MAX_FILE_SIZE = 5 * 1024 * 1024;

  /** Allowed image types */
  readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  /** Crop form */
  readonly cropForm: FormGroup = this.fb.group({
    cropName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    category: ['', [Validators.required]],
    quantity: ['', [Validators.required, Validators.min(1), Validators.max(100000)]],
    unit: ['kg', [Validators.required]],
    expectedPrice: ['', [Validators.required, Validators.min(1), Validators.max(1000000)]],
    qualityGrade: [QualityGrade.GRADE_A, [Validators.required]],
    harvestDate: ['', [Validators.required]],
    description: ['', [Validators.maxLength(500)]],
    isOrganic: [false],
  });

  /** Image previews */
  readonly imagePreviews = signal<ImagePreview[]>([]);

  /** Form submitted state */
  readonly submitted = signal(false);

  /** Today's date for date picker min */
  readonly today = new Date();

  /** Max date (1 year from now) */
  readonly maxDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  /** Categories from service */
  readonly categories = this.cropService.categories;

  /** Quality grades from service */
  readonly qualityGrades = this.cropService.qualityGrades;

  /** Units from service */
  readonly units = this.cropService.units;

  /** Loading state */
  readonly isSubmitting = this.cropService.isSubmitting;

  /** Can add more images */
  readonly canAddMoreImages = computed(
    () => this.imagePreviews().length < this.MAX_IMAGES
  );

  /** Remaining images count */
  readonly remainingImages = computed(
    () => this.MAX_IMAGES - this.imagePreviews().length
  );

  ngOnInit(): void {
    this.cropService.clearMessages();
  }

  ngOnDestroy(): void {
    // Revoke object URLs to prevent memory leaks
    this.imagePreviews().forEach((preview) => {
      URL.revokeObjectURL(preview.url);
    });
  }

  /** Get form control */
  get f() {
    return this.cropForm.controls;
  }

  /** Handle file selection */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) return;

    const currentCount = this.imagePreviews().length;
    const remainingSlots = this.MAX_IMAGES - currentCount;

    if (remainingSlots <= 0) {
      this.showError(`Maximum ${this.MAX_IMAGES} images allowed`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      // Validate file type
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        this.showError(`${file.name}: Invalid file type. Use JPEG, PNG, or WebP`);
        return;
      }

      // Validate file size
      if (file.size > this.MAX_FILE_SIZE) {
        this.showError(`${file.name}: File too large. Maximum 5MB allowed`);
        return;
      }

      // Create preview
      const preview: ImagePreview = {
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        size: this.formatFileSize(file.size),
        uploading: false,
      };

      this.imagePreviews.update((previews) => [...previews, preview]);
    });

    // Reset input
    input.value = '';
  }

  /** Remove image preview */
  removeImage(index: number): void {
    const previews = this.imagePreviews();
    const preview = previews[index];

    if (preview) {
      URL.revokeObjectURL(preview.url);
      this.imagePreviews.update((p) => p.filter((_, i) => i !== index));
    }
  }

  /** Handle drag over */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  /** Handle drop */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const fakeEvent = {
        target: { files },
      } as unknown as Event;
      this.onFileSelected(fakeEvent);
    }
  }

  /** Submit form */
  onSubmit(): void {
    this.submitted.set(true);

    if (this.cropForm.invalid) {
      this.markFormAsTouched();
      this.showError('Please fill all required fields correctly');
      return;
    }

    if (this.imagePreviews().length === 0) {
      this.showError('Please upload at least one image');
      return;
    }

    const formValue = this.cropForm.value;
    const cropData: CreateCropDto = {
      cropName: formValue.cropName.trim(),
      category: formValue.category,
      quantity: Number(formValue.quantity),
      unit: formValue.unit,
      expectedPrice: Number(formValue.expectedPrice),
      qualityGrade: formValue.qualityGrade,
      harvestDate: formValue.harvestDate,
      description: formValue.description?.trim() || undefined,
      isOrganic: formValue.isOrganic,
    };

    const imageFiles = this.imagePreviews().map((p) => p.file);

    this.cropService.createCrop(cropData, imageFiles).subscribe({
      next: () => {
        this.snackBar.open('Crop listing created successfully!', 'View', {
          duration: 5000,
        });
        this.router.navigate(['/farmer/products']);
      },
      error: (err) => {
        console.error('Failed to create crop:', err);
      },
    });
  }

  /** Reset form */
  onReset(): void {
    this.cropForm.reset({
      unit: 'kg',
      qualityGrade: QualityGrade.GRADE_A,
      isOrganic: false,
    });
    this.submitted.set(false);

    // Clear image previews
    this.imagePreviews().forEach((preview) => {
      URL.revokeObjectURL(preview.url);
    });
    this.imagePreviews.set([]);

    this.cropService.clearMessages();
  }

  /** Mark all form controls as touched */
  private markFormAsTouched(): void {
    Object.keys(this.cropForm.controls).forEach((key) => {
      this.cropForm.controls[key].markAsTouched();
    });
  }

  /** Format file size for display */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /** Show error message */
  private showError(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 4000,
      panelClass: ['smc-snackbar-error'],
    });
  }

  /** Get error message for field */
  getErrorMessage(field: string): string {
    const control = this.f[field];

    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'This field is required';
    if (control.errors['minlength']) {
      return `Minimum ${control.errors['minlength'].requiredLength} characters`;
    }
    if (control.errors['maxlength']) {
      return `Maximum ${control.errors['maxlength'].requiredLength} characters`;
    }
    if (control.errors['min']) return `Minimum value is ${control.errors['min'].min}`;
    if (control.errors['max']) return `Maximum value is ${control.errors['max'].max}`;

    return 'Invalid value';
  }
}



