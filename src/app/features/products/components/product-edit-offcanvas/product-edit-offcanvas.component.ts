/**
 * Product Edit Off-Canvas Component
 * ==================================
 * Side panel for quick editing of products
 */

import { Component, ChangeDetectionStrategy, signal, inject, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

import { Product } from '../../pages/product-list/product-list.component';
import { environment } from '@environments/environment';

@Component({
  selector: 'smc-product-edit-offcanvas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <!-- Backdrop -->
    @if (isOpen()) {
      <div class="offcanvas-backdrop" (click)="close()"></div>
    }

    <!-- Off-Canvas Panel -->
    <div class="offcanvas-panel" [class.open]="isOpen()">
      <div class="offcanvas-header">
        <h2>Edit Product</h2>
        <button mat-icon-button (click)="close()" aria-label="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="offcanvas-content">
        @if (isLoading()) {
          <div class="loading-state">
            <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
            <p>Loading product...</p>
          </div>
        } @else {
          <form [formGroup]="editForm" class="edit-form">
            <!-- Product Name -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Product Name</mat-label>
              <input matInput formControlName="name" placeholder="e.g., Fresh Organic Tomatoes" />
              @if (editForm.get('name')?.invalid && editForm.get('name')?.touched) {
                <mat-error>Product name is required</mat-error>
              }
            </mat-form-field>

            <!-- Category -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Category</mat-label>
              <mat-select formControlName="category">
                @for (cat of categories; track cat.id) {
                  <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                }
              </mat-select>
              @if (editForm.get('category')?.invalid && editForm.get('category')?.touched) {
                <mat-error>Please select a category</mat-error>
              }
            </mat-form-field>

            <!-- Description -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="3" placeholder="Describe your product..."></textarea>
              @if (editForm.get('description')?.invalid && editForm.get('description')?.touched) {
                <mat-error>Description is required</mat-error>
              }
            </mat-form-field>

            <!-- Price -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Price (₹)</mat-label>
              <input matInput type="number" formControlName="price" placeholder="45" />
              <span matTextPrefix>₹&nbsp;</span>
              @if (editForm.get('price')?.invalid && editForm.get('price')?.touched) {
                <mat-error>Price is required</mat-error>
              }
            </mat-form-field>

            <!-- Quantity -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Quantity</mat-label>
              <input matInput type="number" formControlName="quantity" placeholder="100" />
              @if (editForm.get('quantity')?.invalid && editForm.get('quantity')?.touched) {
                <mat-error>Quantity is required</mat-error>
              }
            </mat-form-field>

            <!-- Unit -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Unit</mat-label>
              <mat-select formControlName="unit">
                @for (u of units; track u.value) {
                  <mat-option [value]="u.value">{{ u.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- Harvest Date -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Harvest Date</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="harvestDate" />
              <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>

            <!-- District -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>District</mat-label>
              <input matInput formControlName="district" placeholder="e.g., Srikakulam" />
              @if (editForm.get('district')?.invalid && editForm.get('district')?.touched) {
                <mat-error>District is required</mat-error>
              }
            </mat-form-field>

            <!-- State -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>State</mat-label>
              <mat-select formControlName="state">
                @for (s of states; track s.value) {
                  <mat-option [value]="s.value">{{ s.label }}</mat-option>
                }
              </mat-select>
              @if (editForm.get('state')?.invalid && editForm.get('state')?.touched) {
                <mat-error>State is required</mat-error>
              }
            </mat-form-field>

            <!-- Pincode -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Pincode</mat-label>
              <input matInput formControlName="pincode" placeholder="532001" maxlength="6" />
              @if (editForm.get('pincode')?.invalid && editForm.get('pincode')?.touched) {
                <mat-error>Valid 6-digit pincode is required</mat-error>
              }
            </mat-form-field>

            <!-- Status -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                @for (status of statusOptions; track status.value) {
                  <mat-option [value]="status.value">{{ status.label }}</mat-option>
                }
              </mat-select>
              @if (editForm.get('status')?.invalid && editForm.get('status')?.touched) {
                <mat-error>Status is required</mat-error>
              }
            </mat-form-field>
          </form>
        }
      </div>

      <div class="offcanvas-footer">
        <button mat-stroked-button (click)="close()">Cancel</button>
        <button 
          mat-raised-button 
          color="primary" 
          (click)="onSave()"
          [disabled]="editForm.invalid || isSaving()">
          @if (isSaving()) {
            <mat-progress-spinner mode="indeterminate" diameter="20" class="inline-spinner"></mat-progress-spinner>
            Saving...
          } @else {
            Done
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .offcanvas-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
      animation: fadeIn 0.2s ease-out;
    }

    .offcanvas-panel {
      position: fixed;
      top: 0;
      right: -100%;
      width: 100%;
      max-width: 500px;
      height: 100vh;
      background: white;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      transition: right 0.3s ease-out;
      overflow-y: auto;
    }

    .offcanvas-panel.open {
      right: 0;
    }

    .offcanvas-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid #e0e0e0;
      background: white;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .offcanvas-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .offcanvas-content {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      gap: 1rem;
    }

    .loading-state p {
      margin: 0;
      color: #666;
    }

    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .full-width {
      width: 100%;
    }

    .offcanvas-footer {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #e0e0e0;
      background: white;
      position: sticky;
      bottom: 0;
      z-index: 10;
    }

    .offcanvas-footer button {
      flex: 1;
    }

    .inline-spinner {
      display: inline-block;
      margin-right: 0.5rem;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @media (max-width: 640px) {
      .offcanvas-panel {
        max-width: 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductEditOffcanvasComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);

  /** Product to edit */
  readonly product = input<Product | null>(null);
  
  /** Is panel open */
  readonly isOpen = signal(false);
  
  /** Is loading product data */
  readonly isLoading = signal(false);
  
  /** Is saving */
  readonly isSaving = signal(false);
  
  /** Event emitted when product is updated */
  readonly productUpdated = output<Product>();
  
  /** Event emitted when panel is closed */
  readonly panelClosed = output<void>();

  readonly categories = [
    { id: 'vegetables', name: 'Vegetables' },
    { id: 'fruits', name: 'Fruits' },
    { id: 'grains', name: 'Grains & Pulses' },
    { id: 'dairy', name: 'Dairy' },
    { id: 'spices', name: 'Spices' },
    { id: 'flowers', name: 'Flowers' },
    { id: 'herbs', name: 'Herbs' },
    { id: 'other', name: 'Other' },
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

  readonly statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'draft', label: 'Draft' },
    { value: 'sold', label: 'Sold' },
    { value: 'expired', label: 'Expired' },
  ];

  readonly editForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    category: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
    price: [null, [Validators.required, Validators.min(1)]],
    quantity: [null, [Validators.required, Validators.min(1)]],
    unit: ['kg', Validators.required],
    status: ['active', Validators.required],
    harvestDate: [null],
    district: ['', Validators.required],
    state: ['', Validators.required],
    pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
  });

  private currentProductId: string | null = null;
  private isManuallyClosing = false;

  constructor() {
    // Open panel when product is set
    effect(() => {
      const product = this.product();
      console.log('[Effect] Product input changed:', product);
      console.log('[Effect] Product ID:', product?.id);
      console.log('[Effect] Current product ID:', this.currentProductId);
      console.log('[Effect] Is open:', this.isOpen());
      console.log('[Effect] Is manually closing:', this.isManuallyClosing);
      
      // If product is null, close the panel
      if (!product) {
        if (this.isOpen() && !this.isManuallyClosing) {
          console.log('[Effect] Closing panel - product is null');
          this.close();
        }
        this.currentProductId = null;
        return;
      }

      // If manually closing, skip opening but allow it to reset
      if (this.isManuallyClosing) {
        console.log('[Effect] Skipping - manually closing, but will allow next product');
        // Reset the flag after a short delay to allow next product to open
        setTimeout(() => {
          this.isManuallyClosing = false;
        }, 50);
        return;
      }

      // Validate product ID
      let productId = product.id;
      console.log('[Effect] Validating product ID:', productId);
      console.log('[Effect] Full product object:', JSON.stringify(product, null, 2));
      
      if (!productId || productId === 'undefined' || productId === 'null' || productId === undefined || productId === null) {
        console.error('[Effect] Product ID is missing or invalid:', {
          id: productId,
          product: product,
          productKeys: Object.keys(product)
        });
        this.snackBar.open('Product ID is missing', 'Close', { duration: 3000 });
        this.close();
        return;
      }

      // Ensure product object has the id property set
      const productWithId: Product = {
        ...product,
        id: productId
      };

      // Reset the manual closing flag when a valid product is set
      this.isManuallyClosing = false;
      
      // Always open if it's a different product or panel is closed
      if (this.currentProductId !== productId || !this.isOpen()) {
        console.log('[Effect] Opening edit panel for product ID:', productId);
        console.log('[Effect] Previous product ID:', this.currentProductId);
        console.log('[Effect] New product ID:', productId);
        console.log('[Effect] Panel is open:', this.isOpen());
        this.currentProductId = productId;
        this.open(productWithId);
      } else {
        console.log('[Effect] Panel already open for this product, refreshing data:', productId);
        // Even if same product, refresh the data
        this.fetchProductDetails(productId);
      }
    });
  }

  open(product: Product): void {
    console.log('[open] Called with product:', product);
    console.log('[open] Product type:', typeof product);
    console.log('[open] Product keys:', product ? Object.keys(product) : 'N/A');
    console.log('[open] Product.id:', product?.id);
    console.log('[open] Product.id type:', typeof product?.id);
    
    if (!product) {
      console.error('[open] Product is null or undefined');
      this.snackBar.open('Invalid product data: Product is missing', 'Close', { duration: 3000 });
      return;
    }
    
    if (!product.id) {
      console.error('[open] Product ID is missing. Product object:', JSON.stringify(product, null, 2));
      this.snackBar.open('Invalid product data: Product ID is missing', 'Close', { duration: 3000 });
      return;
    }
    
    if (product.id === 'undefined' || product.id === 'null' || product.id === null || product.id === undefined) {
      console.error('[open] Product ID is invalid:', product.id);
      this.snackBar.open('Invalid product data: Product ID is invalid', 'Close', { duration: 3000 });
      return;
    }
    
    console.log('[open] Opening panel and fetching product details for ID:', product.id);
    this.isOpen.set(true);
    this.fetchProductDetails(product.id);
  }

  close(): void {
    console.log('[close] Closing off-canvas panel');
    this.isManuallyClosing = true;
    this.isOpen.set(false);
    this.editForm.reset();
    this.isLoading.set(false);
    this.isSaving.set(false);
    
    // Notify parent that panel is closed
    this.panelClosed.emit();
    
    // Reset currentProductId and flag after a short delay to allow effect to process
    setTimeout(() => {
      this.currentProductId = null;
      this.isManuallyClosing = false;
      console.log('[close] Manual close flag reset, currentProductId cleared');
    }, 300);
  }

  private fetchProductDetails(productId: string): void {
    if (!productId || productId === 'undefined' || productId === 'null') {
      console.error('[fetchProductDetails] Invalid product ID:', productId);
      this.snackBar.open('Invalid product ID', 'Close', { duration: 3000 });
      this.isLoading.set(false);
      this.close();
      return;
    }

    const apiUrl = `${environment.apiUrl}/products/${productId}`;
    console.log('[fetchProductDetails] ============================================');
    console.log('[fetchProductDetails] Calling API:', apiUrl);
    console.log('[fetchProductDetails] Product ID:', productId);
    console.log('[fetchProductDetails] Environment API URL:', environment.apiUrl);
    console.log('[fetchProductDetails] ============================================');
    
    this.isLoading.set(true);
    
    this.http.get<any>(apiUrl).pipe(
      catchError((error) => {
        console.error('[fetchProductDetails] API call failed:', error);
        console.error('[fetchProductDetails] Error URL:', apiUrl);
        console.error('[fetchProductDetails] Error status:', error.status);
        console.error('[fetchProductDetails] Error message:', error.message);
        const errorMessage = error.error?.message || error.message || 'Failed to load product details';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        this.isLoading.set(false);
        this.close();
        return throwError(() => error);
      })
    ).subscribe({
      next: (response) => {
        console.log('[fetchProductDetails] API call successful!');
        console.log('[fetchProductDetails] Response:', response);
        // Handle different response structures
        const productData = response.product || response.data || response;
        console.log('[fetchProductDetails] Product data extracted:', productData);
        
        // Map category name to category id
        const categoryMap: Record<string, string> = {
          'Vegetables': 'vegetables',
          'Fruits': 'fruits',
          'Grains & Pulses': 'grains',
          'Dairy': 'dairy',
          'Spices': 'spices',
          'Flowers': 'flowers',
          'Herbs': 'herbs',
          'Other': 'other',
        };
        const categoryName = productData.category || '';
        const categoryId = categoryMap[categoryName] || categoryName.toLowerCase();

        // Map state name to state code
        const stateName = productData.location?.state || '';
        const stateInfo = this.states.find(s => s.label === stateName);
        const stateCode = stateInfo?.value || '';

        // Map API status to form status
        const statusMap: Record<string, 'active' | 'draft' | 'sold' | 'expired'> = {
          'AVAILABLE': 'active',
          'DRAFT': 'draft',
          'SOLD': 'sold',
          'EXPIRED': 'expired',
        };
        const apiStatus = productData.status || 'AVAILABLE';
        const formStatus = statusMap[apiStatus] || 'active';

        // Format harvest date
        let harvestDate: Date | null = null;
        if (productData.harvestDate) {
          harvestDate = new Date(productData.harvestDate);
        }

        // Populate form with API data
        this.editForm.patchValue({
          name: productData.name || '',
          category: categoryId,
          description: productData.description || '',
          price: productData.pricePerKg || productData.price || null,
          quantity: productData.quantity || null,
          unit: (productData.unit || 'kg').toLowerCase(),
          status: formStatus,
          harvestDate: harvestDate,
          district: productData.location?.district || '',
          state: stateCode,
          pincode: productData.location?.pincode || '',
        });
        
        this.isLoading.set(false);
      },
    });
  }

  onSave(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    const product = this.product();
    if (!product) {
      return;
    }

    this.isSaving.set(true);

    const formValue = this.editForm.value;

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

    // Map form status to API status
    const statusMap: Record<string, string> = {
      'active': 'AVAILABLE',
      'draft': 'DRAFT',
      'sold': 'SOLD',
      'expired': 'EXPIRED',
    };
    const apiStatus = statusMap[formValue.status] || 'AVAILABLE';

    // Format harvest date as YYYY-MM-DD
    let harvestDate: string | undefined;
    if (formValue.harvestDate) {
      const date = new Date(formValue.harvestDate);
      harvestDate = date.toISOString().split('T')[0];
    }

    // Prepare API payload
    const apiPayload: any = {
      name: formValue.name.trim(),
      category: categoryName,
      pricePerKg: formValue.price,
      quantity: formValue.quantity,
      unit: formValue.unit.toUpperCase(),
      description: formValue.description.trim(),
      status: apiStatus,
      location: {
        state: stateName,
        district: formValue.district.trim(),
        pincode: formValue.pincode.trim(),
      },
    };

    if (harvestDate) {
      apiPayload.harvestDate = harvestDate;
    }

    // Call PUT API
    const apiUrl = `${environment.apiUrl}/products/${product.id}`;

    this.http.put(apiUrl, apiPayload).pipe(
      catchError((error) => {
        console.error('Failed to update product:', error);
        const errorMessage = error.error?.message || error.message || 'Failed to update product';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        this.isSaving.set(false);
        return throwError(() => error);
      })
    ).subscribe({
      next: (response) => {
        this.isSaving.set(false);
        this.snackBar.open('Product updated successfully', 'Close', { duration: 3000 });
        this.productUpdated.emit(product);
        this.close();
      },
    });
  }
}
