/**
 * Crop Details Component
 * ======================
 * Displays comprehensive crop information with image gallery,
 * farmer info, bid form, and instant buy option.
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  input,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil, interval } from 'rxjs';

import {
  CropDetailsService,
  CropDetails,
  CropImage,
  PlaceBidDto,
  InstantBuyDto,
} from '../../services/crop-details.service';
import { QualityGrade } from '../../services/marketplace.service';
import { ImageGalleryComponent } from '../../components/image-gallery/image-gallery.component';
import { FarmerCardComponent } from '../../components/farmer-card/farmer-card.component';
import { InstantBuyDialogComponent } from '../../components/instant-buy-dialog/instant-buy-dialog.component';

@Component({
  selector: 'smc-crop-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatBadgeModule,
    MatSnackBarModule,
    MatDialogModule,
    DatePipe,
    CurrencyPipe,
    ImageGalleryComponent,
    FarmerCardComponent,
  ],
  templateUrl: './crop-details.component.html',
  styleUrl: './crop-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropDetailsComponent implements OnInit, OnDestroy {
  private readonly cropDetailsService = inject(CropDetailsService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  /** Route parameter: crop ID */
  readonly id = input.required<string>();

  // ============================================
  // Expose Service Signals
  // ============================================

  readonly crop = this.cropDetailsService.crop;
  readonly farmer = this.cropDetailsService.farmer;
  readonly images = this.cropDetailsService.images;
  readonly bidInfo = this.cropDetailsService.bidInfo;
  readonly isLoading = this.cropDetailsService.isLoading;
  readonly isSubmitting = this.cropDetailsService.isSubmitting;
  readonly error = this.cropDetailsService.error;
  readonly isBiddingOpen = this.cropDetailsService.isBiddingOpen;
  readonly biddingTimeRemaining = this.cropDetailsService.biddingTimeRemaining;

  // ============================================
  // Local State
  // ============================================

  readonly QualityGrade = QualityGrade;
  readonly selectedImageIndex = signal(0);
  readonly isWishlisted = signal(false);
  readonly currentTime = signal(new Date());
  readonly showBidForm = signal(false);

  // Bid Form
  readonly bidForm = this.fb.group({
    amount: [0, [Validators.required, Validators.min(1)]],
    quantity: [0, [Validators.required, Validators.min(1)]],
    message: ['', [Validators.maxLength(500)]],
  });

  // ============================================
  // Computed
  // ============================================

  /** Quality badge class */
  readonly qualityClass = computed(() => {
    const crop = this.crop();
    if (!crop) return {};
    return {
      premium: crop.qualityGrade === QualityGrade.PREMIUM,
      'grade-a': crop.qualityGrade === QualityGrade.GRADE_A,
      'grade-b': crop.qualityGrade === QualityGrade.GRADE_B,
      standard: crop.qualityGrade === QualityGrade.STANDARD,
    };
  });

  /** Quality label */
  readonly qualityLabel = computed(() => {
    const crop = this.crop();
    if (!crop) return '';
    const labels: Record<QualityGrade, string> = {
      [QualityGrade.PREMIUM]: 'Premium Quality',
      [QualityGrade.GRADE_A]: 'Grade A',
      [QualityGrade.GRADE_B]: 'Grade B',
      [QualityGrade.STANDARD]: 'Standard Quality',
    };
    return labels[crop.qualityGrade];
  });

  /** Farmer initials */
  readonly farmerInitials = computed(() => {
    const farmer = this.farmer();
    if (!farmer) return '';
    return farmer.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  });

  /** Days until harvest */
  readonly daysUntilHarvest = computed(() => {
    const crop = this.crop();
    if (!crop) return 0;
    const harvest = new Date(crop.harvestDate).getTime();
    const now = this.currentTime().getTime();
    return Math.ceil((harvest - now) / (1000 * 60 * 60 * 24));
  });

  /** Bid total */
  readonly bidTotal = computed(() => {
    const amount = this.bidForm.get('amount')?.value || 0;
    const quantity = this.bidForm.get('quantity')?.value || 0;
    return amount * quantity;
  });

  // ============================================
  // Lifecycle
  // ============================================

  ngOnInit(): void {
    this.cropDetailsService.loadCropDetails(this.id());

    // Update time every second
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentTime.set(new Date());
      });

    // Set default form values when crop loads
    this.cropDetailsService.crop
    // We'll watch for changes in the crop signal
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cropDetailsService.clearMessages();
  }

  // ============================================
  // Image Gallery
  // ============================================

  onImageSelect(index: number): void {
    this.selectedImageIndex.set(index);
  }

  // ============================================
  // Wishlist
  // ============================================

  toggleWishlist(): void {
    const crop = this.crop();
    if (!crop) return;

    this.isWishlisted.update((v) => !v);
    this.cropDetailsService.addToWishlist(crop.id).subscribe({
      next: () => {
        this.snackBar.open(
          this.isWishlisted() ? 'Added to wishlist' : 'Removed from wishlist',
          'Close',
          { duration: 3000 }
        );
      },
    });
  }

  // ============================================
  // Bid Actions
  // ============================================

  openBidForm(): void {
    const crop = this.crop();
    if (!crop) return;

    this.bidForm.patchValue({
      amount: crop.bidInfo.highestBid + 1,
      quantity: Math.min(100, crop.availableQuantity),
    });
    this.showBidForm.set(true);
  }

  closeBidForm(): void {
    this.showBidForm.set(false);
    this.bidForm.reset();
  }

  onSubmitBid(): void {
    if (this.bidForm.invalid) {
      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000,
      });
      return;
    }

    const crop = this.crop();
    if (!crop) return;

    const dto: PlaceBidDto = {
      cropId: crop.id,
      amount: this.bidForm.value.amount!,
      quantity: this.bidForm.value.quantity!,
      message: this.bidForm.value.message || undefined,
    };

    this.cropDetailsService.placeBid(dto).subscribe({
      next: () => {
        this.snackBar.open('Bid placed successfully!', 'View Bids', {
          duration: 5000,
        });
        this.closeBidForm();
      },
      error: () => {
        this.snackBar.open('Failed to place bid', 'Retry', { duration: 5000 });
      },
    });
  }

  // ============================================
  // Instant Buy
  // ============================================

  openInstantBuy(): void {
    const crop = this.crop();
    if (!crop) return;

    const dialogRef = this.dialog.open(InstantBuyDialogComponent, {
      width: '500px',
      data: { crop },
      panelClass: 'smc-dialog',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.processInstantBuy(result);
      }
    });
  }

  private processInstantBuy(data: {
    quantity: number;
    paymentMethod: 'cod' | 'online' | 'upi';
  }): void {
    const crop = this.crop();
    if (!crop) return;

    const dto: InstantBuyDto = {
      cropId: crop.id,
      quantity: data.quantity,
      paymentMethod: data.paymentMethod,
    };

    this.cropDetailsService.instantBuy(dto).subscribe({
      next: (response) => {
        this.snackBar.open('Order placed successfully!', 'View Order', {
          duration: 5000,
        });
        this.router.navigate(['/orders', response.orderId]);
      },
      error: () => {
        this.snackBar.open('Failed to place order', 'Retry', { duration: 5000 });
      },
    });
  }

  // ============================================
  // Share
  // ============================================

  shareCrop(): void {
    const crop = this.crop();
    if (!crop) return;

    const url = window.location.href;
    const text = `Check out ${crop.cropName} on Smart Mandi Connect!`;

    if (navigator.share) {
      navigator.share({ title: crop.cropName, text, url });
    } else {
      navigator.clipboard.writeText(url);
      this.snackBar.open('Link copied to clipboard!', 'Close', {
        duration: 3000,
      });
    }
  }

  // ============================================
  // Navigation
  // ============================================

  goBack(): void {
    this.router.navigate(['/marketplace']);
  }

  viewFarmerProfile(): void {
    const farmer = this.farmer();
    if (farmer) {
      this.router.navigate(['/profile', farmer.id]);
    }
  }

  contactFarmer(): void {
    const farmer = this.farmer();
    if (farmer) {
      this.router.navigate(['/chat', farmer.id]);
    }
  }
}
