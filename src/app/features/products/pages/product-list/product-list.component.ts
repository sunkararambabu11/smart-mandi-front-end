/**
 * Product List Page Component
 * ===========================
 * Farmer's product management dashboard with listing grid.
 */

import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { catchError, throwError, filter, switchMap } from 'rxjs';

import { AuthService } from '@core/services/auth.service';
import { environment } from '@environments/environment';
import { ProductEditOffcanvasComponent } from '../../components/product-edit-offcanvas/product-edit-offcanvas.component';
import { DeleteProductDialogComponent } from '../../components/delete-product-dialog/delete-product-dialog.component';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  quantity: number;
  imageUrl?: string;
  status: 'active' | 'draft' | 'sold' | 'expired';
  isOrganic: boolean;
  quality: string;
  viewCount: number;
  bidCount: number;
  createdAt: Date;
}

/** API Product Response */
interface ApiProduct {
  id?: string;
  productId?: string;
  _id?: string; // Fallback for older API versions
  name: string;
  category: string;
  pricePerKg: number;
  quantity: number;
  unit: string;
  description: string;
  harvestDate?: string;
  location: {
    state: string;
    district: string;
    pincode: string;
  };
  media: Array<{
    url: string;
    type: string;
    _id: string;
    id?: string;
  }>;
  farmerId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** API Response */
interface ApiResponse {
  products?: ApiProduct[];
  data?: ApiProduct[];
}

@Component({
  selector: 'smc-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatMenuModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    ProductEditOffcanvasComponent,
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class ProductListComponent implements OnInit {
  private readonly snackBar = inject(MatSnackBar);
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  readonly authService = inject(AuthService);

  /** Check if current user is a farmer */
  readonly isFarmer = this.authService.isFarmer;

  readonly isLoading = signal(true);
  readonly selectedTab = signal(0);
  
  readonly products = signal<Product[]>([]);

  readonly tabs = [
    { label: 'All', value: 'all', icon: 'inventory_2' },
    { label: 'Active', value: 'active', icon: 'check_circle' },
    { label: 'Drafts', value: 'draft', icon: 'edit_note' },
    { label: 'Sold', value: 'sold', icon: 'sell' },
  ];

  readonly stats = signal({
    total: 0,
    active: 0,
    drafts: 0,
    sold: 0,
  });

  /** Selected product for editing */
  readonly selectedProductForEdit = signal<Product | null>(null);

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.isLoading.set(true);
    
    const apiUrl = `${environment.apiUrl}/products`;
    
    this.http.get<ApiResponse>(apiUrl).pipe(
      catchError((error) => {
        console.error('Failed to load products:', error);
        this.snackBar.open('Failed to load products', 'Close', { duration: 3000 });
        this.isLoading.set(false);
        return throwError(() => error);
      })
    ).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        
        // Handle different response structures
        let productsArray: ApiProduct[] = [];
        if (response.products && Array.isArray(response.products)) {
          productsArray = response.products;
        } else if (Array.isArray(response)) {
          // Response might be directly an array
          productsArray = response as any;
        } else if (response.data && Array.isArray(response.data)) {
          productsArray = response.data;
        }
        
        console.log('Products array:', productsArray);
        if (productsArray.length > 0) {
          const firstProduct = productsArray[0];
          console.log('First product structure:', firstProduct);
          console.log('First product ID fields:', {
            id: firstProduct.id,
            productId: (firstProduct as any).productId,
            _id: firstProduct._id
          });
        }
        
        const mappedProducts = this.mapApiProductsToProducts(productsArray);
        console.log('Mapped products:', mappedProducts);
        console.log('Products with IDs:', mappedProducts.map(p => ({ id: p.id, name: p.name })));
        
        // Final validation - ensure no products without IDs
        const validProducts = mappedProducts.filter(p => {
          if (!p || !p.id) {
            console.error('[loadProducts] Found product without ID in mapped products:', p);
            return false;
          }
          return true;
        });
        
        console.log(`[loadProducts] Valid products: ${validProducts.length} out of ${mappedProducts.length}`);
        
        this.products.set(validProducts);
        this.stats.set({
          total: mappedProducts.length,
          active: mappedProducts.filter(p => p.status === 'active').length,
          drafts: mappedProducts.filter(p => p.status === 'draft').length,
          sold: mappedProducts.filter(p => p.status === 'sold').length,
        });
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Map API product response to component Product interface
   */
  private mapApiProductsToProducts(apiProducts: ApiProduct[]): Product[] {
    console.log('[mapApiProductsToProducts] Mapping products:', apiProducts.length);
    
    return apiProducts.map((apiProduct, index) => {
      console.log(`[mapApiProductsToProducts] Processing product ${index}:`, apiProduct);
      
      // Get product ID - try id first, then productId, then _id (for backward compatibility)
      // Also check for nested properties or string values
      let productId = apiProduct.id || apiProduct.productId || apiProduct._id;
      
      // If still no ID, check if it's a string 'undefined' or 'null'
      if (productId === 'undefined' || productId === 'null') {
        productId = undefined;
      }
      
      // Log all possible ID fields
      console.log(`[mapApiProductsToProducts] Product ${index} ID check:`, {
        id: apiProduct.id,
        productId: apiProduct.productId,
        _id: apiProduct._id,
        finalProductId: productId,
        allKeys: Object.keys(apiProduct)
      });
      
      if (!productId) {
        console.error(`[mapApiProductsToProducts] Product at index ${index} is missing ID:`, apiProduct);
        console.error('[mapApiProductsToProducts] Available ID fields:', {
          id: apiProduct.id,
          productId: apiProduct.productId,
          _id: apiProduct._id,
          allKeys: Object.keys(apiProduct)
        });
        // Skip products without IDs
        return null;
      }

      // Get first image URL from media array
      const imageUrl = apiProduct.media && apiProduct.media.length > 0 
        ? apiProduct.media[0].url 
        : undefined;

      // Map API status to component status
      const statusMap: Record<string, 'active' | 'draft' | 'sold' | 'expired'> = {
        'AVAILABLE': 'active',
        'DRAFT': 'draft',
        'SOLD': 'sold',
        'EXPIRED': 'expired',
      };
      const status = statusMap[apiProduct.status] || 'draft';

      // Double-check productId is valid before creating the product object
      if (!productId || productId === 'undefined' || productId === 'null') {
        console.error(`[mapApiProductsToProducts] Product ${index} failed final validation - productId:`, productId);
        return null;
      }
      
      const mappedProduct: Product = {
        id: productId,
        name: apiProduct.name || '',
        category: apiProduct.category || '',
        price: apiProduct.pricePerKg || 0,
        unit: (apiProduct.unit || 'kg').toLowerCase(),
        quantity: apiProduct.quantity || 0,
        imageUrl: imageUrl,
        status: status,
        isOrganic: false, // API doesn't provide this, defaulting to false
        quality: 'Grade A', // API doesn't provide this, defaulting
        viewCount: 0, // API doesn't provide this
        bidCount: 0, // API doesn't provide this
        createdAt: apiProduct.createdAt ? new Date(apiProduct.createdAt) : new Date(),
      };
      
      // Final validation - ensure the mapped product has an ID
      if (!mappedProduct.id) {
        console.error(`[mapApiProductsToProducts] Mapped product ${index} has no ID:`, mappedProduct);
        return null;
      }
      
      console.log(`[mapApiProductsToProducts] Successfully mapped product ${index}:`, { id: mappedProduct.id, name: mappedProduct.name });
      return mappedProduct;
    }).filter((product): product is Product => {
      // Extra safety check - filter out any products without IDs
      if (!product || !product.id) {
        console.warn('[mapApiProductsToProducts] Filtering out product without ID:', product);
        return false;
      }
      return true;
    });
  }

  get filteredProducts(): Product[] {
    const tab = this.tabs[this.selectedTab()].value;
    if (tab === 'all') return this.products();
    return this.products().filter(p => p.status === tab);
  }

  onTabChange(index: number): void {
    this.selectedTab.set(index);
  }

  onEditProduct(product: Product | any): void {
    console.log('[onEditProduct] ============================================');
    console.log('[onEditProduct] Called with product:', product);
    console.log('[onEditProduct] Product type:', typeof product);
    console.log('[onEditProduct] Product keys:', product ? Object.keys(product) : 'N/A');
    console.log('[onEditProduct] Product.id:', product?.id);
    console.log('[onEditProduct] Product.name:', product?.name);
    console.log('[onEditProduct] Product JSON:', JSON.stringify(product, null, 2));
    
    if (!product) {
      console.error('[onEditProduct] Product is null or undefined');
      this.snackBar.open('Invalid product data: Product is missing', 'Close', { duration: 3000 });
      return;
    }

    // Ensure product has required fields
    if (typeof product !== 'object') {
      console.error('[onEditProduct] Product is not an object:', typeof product);
      this.snackBar.open('Invalid product data: Product must be an object', 'Close', { duration: 3000 });
      return;
    }

    // Get product ID - check all possible fields
    let productId = product.id;
    console.log('[onEditProduct] Product ID from product.id:', productId);
    console.log('[onEditProduct] Product ID type:', typeof productId);
    
    // If product ID is missing, try to find it from the products list
    if (!productId || productId === 'undefined' || productId === 'null' || productId === undefined || productId === null) {
      console.warn('[onEditProduct] Product ID is missing, attempting to find product by name:', product.name);
      console.warn('[onEditProduct] Searching in products list. Total products:', this.products().length);
      console.warn('[onEditProduct] Product object keys:', Object.keys(product));
      console.warn('[onEditProduct] Full product object:', JSON.stringify(product, null, 2));
      
      // Try to find the product in the current list by name and category (fuzzy match)
      const foundProduct = this.products().find(p => {
        // Try exact match first
        const exactMatch = p.name === product.name && 
                          p.category === product.category &&
                          p.price === product.price;
        
        // Try name match only if exact match fails
        const nameMatch = p.name === product.name;
        
        if (exactMatch || nameMatch) {
          console.log('[onEditProduct] Found matching product:', { 
            found: p, 
            matchType: exactMatch ? 'exact' : 'name-only' 
          });
        }
        return exactMatch || nameMatch;
      });
      
      if (foundProduct && foundProduct.id) {
        console.log('[onEditProduct] Found product with ID:', foundProduct.id);
        productId = foundProduct.id;
        product = { ...product, id: productId };
      } else {
        console.error('[onEditProduct] Cannot find product ID. Product:', product);
        console.error('[onEditProduct] Available products:', this.products().map(p => ({ 
          id: p.id, 
          name: p.name, 
          category: p.category,
          price: p.price 
        })));
        this.snackBar.open('Product ID is missing. Please refresh the page to reload products.', 'Close', { duration: 5000 });
        // Try reloading products
        this.loadProducts();
        return;
      }
    }

    console.log('[onEditProduct] Validated product ID:', productId);
    console.log('[onEditProduct] Setting product for edit - ID:', productId, 'Name:', product.name);
    
    // Final validation - ensure productId is valid
    if (!productId || productId === 'undefined' || productId === 'null') {
      console.error('[onEditProduct] Final validation failed - productId is invalid:', productId);
      this.snackBar.open('Product ID is missing. Please refresh the page.', 'Close', { duration: 5000 });
      return;
    }
    
    // Create a completely new product object to ensure signal change detection
    const productToEdit: Product = {
      id: productId, // Ensure ID is always set
      name: product.name || '',
      category: product.category || '',
      price: product.price || 0,
      unit: product.unit || 'kg',
      quantity: product.quantity || 0,
      imageUrl: product.imageUrl,
      status: product.status || 'active',
      isOrganic: product.isOrganic || false,
      quality: product.quality || 'Grade A',
      viewCount: product.viewCount || 0,
      bidCount: product.bidCount || 0,
      createdAt: product.createdAt || new Date(),
    };
    
    // Final check - ensure the product object has an id
    if (!productToEdit.id) {
      console.error('[onEditProduct] Product object created without ID:', productToEdit);
      this.snackBar.open('Failed to create product object. Please refresh the page.', 'Close', { duration: 5000 });
      return;
    }
    
    console.log('[onEditProduct] Product object to set:', productToEdit);
    console.log('[onEditProduct] Product ID in object:', productToEdit.id);
    console.log('[onEditProduct] Product object has id property:', 'id' in productToEdit);
    console.log('[onEditProduct] ============================================');
    
    this.selectedProductForEdit.set(productToEdit);
  }

  onProductUpdated(): void {
    // Reload products after update
    this.loadProducts();
    // Reset after a short delay to allow the off-canvas to close first
    setTimeout(() => {
      this.selectedProductForEdit.set(null);
    }, 100);
  }

  onDeleteProduct(product: Product): void {
    console.log('[onDeleteProduct] Called with product:', product);
    
    if (!product) {
      console.error('[onDeleteProduct] Product is null or undefined');
      this.snackBar.open('Invalid product data', 'Close', { duration: 3000 });
      return;
    }

    // Get product ID - check if it's valid
    let productId = product.id;
    console.log('[onDeleteProduct] Product ID from product.id:', productId);
    
    // If product ID is missing, try to find it from the products list
    if (!productId || productId === 'undefined' || productId === 'null' || productId === undefined || productId === null) {
      console.warn('[onDeleteProduct] Product ID is missing, attempting to find product by name:', product.name);
      // Try to find the product in the current list by name and category
      const foundProduct = this.products().find(p => 
        p.name === product.name && 
        p.category === product.category &&
        p.price === product.price
      );
      
      if (foundProduct && foundProduct.id) {
        console.log('[onDeleteProduct] Found product with ID:', foundProduct.id);
        productId = foundProduct.id;
      } else {
        console.error('[onDeleteProduct] Cannot find product ID. Product:', product);
        console.error('[onDeleteProduct] Available products:', this.products().map(p => ({ id: p.id, name: p.name })));
        this.snackBar.open('Product ID is missing. Please refresh the page.', 'Close', { duration: 5000 });
        return;
      }
    }

    console.log('[onDeleteProduct] Opening delete dialog for product ID:', productId);
    console.log('[onDeleteProduct] Validated product ID:', productId);

    // Store productId in a const to ensure it's captured in the closure
    const validatedProductId = productId;

    const dialogRef = this.dialog.open(DeleteProductDialogComponent, {
      width: '450px',
      data: { 
        productName: product.name,
        productId: validatedProductId // Pass product ID to dialog
      },
      panelClass: 'smc-dialog',
      ariaLabel: 'Delete product confirmation dialog',
    });

    dialogRef.afterClosed().pipe(
      filter((confirmed): confirmed is boolean => confirmed === true),
      switchMap(() => {
        console.log('[onDeleteProduct] User confirmed deletion');
        console.log('[onDeleteProduct] Using product ID:', validatedProductId);
        
        if (!validatedProductId || validatedProductId === 'undefined' || validatedProductId === 'null') {
          console.error('[onDeleteProduct] Invalid product ID in switchMap:', validatedProductId);
          this.snackBar.open('Invalid product ID', 'Close', { duration: 3000 });
          return throwError(() => new Error('Invalid product ID'));
        }
        
        const apiUrl = `${environment.apiUrl}/products/${validatedProductId}`;
        console.log('[onDeleteProduct] Calling DELETE API:', apiUrl);
        console.log('[onDeleteProduct] Full URL:', apiUrl);
        
        return this.http.delete(apiUrl);
      }),
      catchError((error) => {
        console.error('[onDeleteProduct] Failed to delete product:', error);
        console.error('[onDeleteProduct] Error URL:', error.url || 'N/A');
        const errorMessage = error.error?.message || error.message || 'Failed to delete product';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        return throwError(() => error);
      })
    ).subscribe({
      next: () => {
        console.log('[onDeleteProduct] Product deleted successfully');
        // Remove product from list using the validated productId
        this.products.update(list => list.filter(p => p.id !== validatedProductId));
        
        // Update stats
        const updatedProducts = this.products();
        this.stats.set({
          total: updatedProducts.length,
          active: updatedProducts.filter(p => p.status === 'active').length,
          drafts: updatedProducts.filter(p => p.status === 'draft').length,
          sold: updatedProducts.filter(p => p.status === 'sold').length,
        });
        
        this.snackBar.open(`${product.name} deleted successfully`, 'Close', { duration: 3000 });
      },
    });
  }

  onToggleStatus(product: Product): void {
    const newStatus = product.status === 'active' ? 'draft' : 'active';
    this.products.update(list => 
      list.map(p => p.id === product.id ? { ...p, status: newStatus } : p)
    );
    this.snackBar.open(`${product.name} is now ${newStatus}`, 'Close', { duration: 3000 });
  }

  trackByProductId(_index: number, product: Product): string {
    return product.id;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      active: 'primary',
      draft: 'accent',
      sold: 'warn',
      expired: 'warn',
    };
    return colors[status] || 'primary';
  }
}
