/**
 * Place Bid Component
 * ===================
 * Form for placing a bid on a crop listing.
 * Includes bid amount, quantity, delivery preferences, and messaging.
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  input,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of, delay } from 'rxjs';

import { MarketplaceService, MarketplaceCrop } from '../../services/marketplace.service';

@Component({
  selector: 'smc-place-bid',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSliderModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
  ],
  templateUrl: './place-bid.component.html',
  styleUrl: './place-bid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceBidComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly marketplaceService = inject(MarketplaceService);

  /** Crop ID from route */
  readonly id = input.required<string>();

  /** Crop details */
  readonly crop = signal<MarketplaceCrop | null>(null);

  /** Loading state */
  readonly isLoading = signal(true);

  /** Submitting state */
  readonly isSubmitting = signal(false);

  /** Bid form */
  readonly bidForm = this.fb.nonNullable.group({
    bidPrice: [0, [Validators.required, Validators.min(1)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    deliveryDate: [new Date(), [Validators.required]],
    deliveryLocation: ['', [Validators.required]],
    message: [''],
    acceptTerms: [false, [Validators.requiredTrue]],
  });

  /** Minimum delivery date (tomorrow) */
  readonly minDeliveryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

  /** Maximum quantity based on crop availability */
  readonly maxQuantity = computed(() => this.crop()?.quantity ?? 1000);

  /** Total bid amount */
  readonly totalAmount = computed(() => {
    const price = this.bidForm.get('bidPrice')?.value ?? 0;
    const qty = this.bidForm.get('quantity')?.value ?? 0;
    return price * qty;
  });

  /** Delivery location options */
  readonly deliveryLocations = [
    'Pickup from Farm',
    'Nashik, Maharashtra',
    'Pune, Maharashtra',
    'Mumbai, Maharashtra',
    'Indore, Madhya Pradesh',
    'Jaipur, Rajasthan',
    'Delhi NCR',
    'Other (specify in message)',
  ];

  ngOnInit(): void {
    this.loadCropDetails();
  }

  /** Load crop details */
  private loadCropDetails(): void {
    this.isLoading.set(true);

    // Find crop from marketplace service
    const crops = this.marketplaceService.crops();
    const crop = crops.find((c) => c.id === this.id());

    if (crop) {
      this.crop.set(crop);
      // Pre-fill with market price
      this.bidForm.patchValue({
        bidPrice: crop.price,
        quantity: Math.min(10, crop.quantity),
      });
      this.isLoading.set(false);
    } else {
      // Simulate API call for crop details
      of(this.getMockCrop())
        .pipe(delay(500), takeUntilDestroyed(this.destroyRef))
        .subscribe((mockCrop) => {
          this.crop.set(mockCrop);
          this.bidForm.patchValue({
            bidPrice: mockCrop.price,
            quantity: Math.min(10, mockCrop.quantity),
          });
          this.isLoading.set(false);
        });
    }
  }

  /** Get price difference from market price */
  getPriceDifference(): number {
    const bidPrice = this.bidForm.get('bidPrice')?.value ?? 0;
    const marketPrice = this.crop()?.price ?? 0;
    return bidPrice - marketPrice;
  }

  /** Get price difference percentage */
  getPriceDifferencePercent(): number {
    const marketPrice = this.crop()?.price ?? 1;
    const diff = this.getPriceDifference();
    return (diff / marketPrice) * 100;
  }

  /** Format currency */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  /** Submit bid */
  onSubmit(): void {
    if (this.bidForm.invalid) {
      this.bidForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const bidData = {
      cropId: this.id(),
      ...this.bidForm.getRawValue(),
      totalAmount: this.totalAmount(),
    };

    // Simulate API call
    of(bidData)
      .pipe(delay(1500), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.snackBar.open(
            '🎉 Bid placed successfully! The farmer will respond soon.',
            'View Bids',
            { duration: 5000 }
          );
          this.router.navigate(['/marketplace']);
        },
        error: () => {
          this.isSubmitting.set(false);
          this.snackBar.open('Failed to place bid. Please try again.', 'OK', {
            duration: 3000,
          });
        },
      });
  }

  /** Go back */
  goBack(): void {
    this.router.navigate(['/marketplace/crop', this.id()]);
  }

  /** Mock crop data */
  private getMockCrop(): MarketplaceCrop {
    return {
      id: this.id(),
      farmerId: 'farmer_1',
      farmerName: 'Ramesh Patil',
      farmerRating: 4.8,
      farmerLocation: 'Nashik, Maharashtra',
      cropName: 'Organic Tomatoes',
      category: 'Vegetables',
      quantity: 500,
      unit: 'kg',
      price: 45,
      qualityGrade: 'PREMIUM' as any,
      harvestDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400'],
      description: 'Fresh organic tomatoes grown without pesticides',
      isOrganic: true,
      isFeatured: true,
      bidCount: 5,
      viewCount: 234,
      createdAt: new Date(),
    };
  }
}
