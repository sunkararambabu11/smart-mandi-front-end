/**
 * Product Domain Models
 * =====================
 * Product entities for the marketplace
 */

/** Product categories */
export enum ProductCategory {
  VEGETABLES = 'VEGETABLES',
  FRUITS = 'FRUITS',
  GRAINS = 'GRAINS',
  PULSES = 'PULSES',
  SPICES = 'SPICES',
  DAIRY = 'DAIRY',
  ORGANIC = 'ORGANIC',
  OTHER = 'OTHER',
}

/** Unit of measurement */
export enum ProductUnit {
  KG = 'KG',
  QUINTAL = 'QUINTAL',
  TON = 'TON',
  DOZEN = 'DOZEN',
  PIECE = 'PIECE',
  LITER = 'LITER',
  BUNDLE = 'BUNDLE',
}

/** Product availability status */
export enum ProductStatus {
  AVAILABLE = 'AVAILABLE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  COMING_SOON = 'COMING_SOON',
  DISCONTINUED = 'DISCONTINUED',
}

/** Quality grade */
export enum QualityGrade {
  PREMIUM = 'PREMIUM',
  GRADE_A = 'GRADE_A',
  GRADE_B = 'GRADE_B',
  STANDARD = 'STANDARD',
}

/** Product image */
export interface ProductImage {
  readonly id: string;
  readonly url: string;
  readonly thumbnailUrl: string;
  readonly alt: string;
  readonly isPrimary: boolean;
}

/** Price information */
export interface ProductPrice {
  readonly amount: number;
  readonly currency: string;
  readonly unit: ProductUnit;
  readonly minOrderQuantity: number;
  readonly bulkDiscount?: {
    readonly quantity: number;
    readonly discountPercent: number;
  }[];
}

/** Harvest information */
export interface HarvestInfo {
  readonly harvestDate?: Date;
  readonly expectedHarvestDate?: Date;
  readonly shelfLife?: number; // in days
  readonly storageInstructions?: string;
}

/** Core Product entity */
export interface Product {
  readonly id: string;
  readonly farmerId: string;
  readonly farmerName: string;
  readonly name: string;
  readonly localName?: string;
  readonly description: string;
  readonly category: ProductCategory;
  readonly subCategory?: string;
  readonly images: ProductImage[];
  readonly price: ProductPrice;
  readonly availableQuantity: number;
  readonly status: ProductStatus;
  readonly qualityGrade: QualityGrade;
  readonly harvestInfo?: HarvestInfo;
  readonly isOrganic: boolean;
  readonly certifications?: string[];
  readonly location: {
    readonly city: string;
    readonly state: string;
    readonly pincode: string;
  };
  readonly rating: number;
  readonly reviewCount: number;
  readonly viewCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Product listing for marketplace */
export interface ProductListing {
  readonly id: string;
  readonly name: string;
  readonly localName?: string;
  readonly category: ProductCategory;
  readonly primaryImage: string;
  readonly price: number;
  readonly unit: ProductUnit;
  readonly farmerName: string;
  readonly location: string;
  readonly isOrganic: boolean;
  readonly qualityGrade: QualityGrade;
  readonly rating: number;
  readonly availableQuantity: number;
  readonly status: ProductStatus;
}

/** Create product DTO */
export interface CreateProductDto {
  readonly name: string;
  readonly localName?: string;
  readonly description: string;
  readonly category: ProductCategory;
  readonly subCategory?: string;
  readonly price: Omit<ProductPrice, 'currency'>;
  readonly availableQuantity: number;
  readonly qualityGrade: QualityGrade;
  readonly harvestInfo?: HarvestInfo;
  readonly isOrganic: boolean;
  readonly certifications?: string[];
}

/** Update product DTO */
export interface UpdateProductDto extends Partial<CreateProductDto> {
  readonly status?: ProductStatus;
}

/** Product search filters */
export interface ProductFilters {
  readonly search?: string;
  readonly category?: ProductCategory;
  readonly subCategory?: string;
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly qualityGrade?: QualityGrade[];
  readonly isOrganic?: boolean;
  readonly location?: string;
  readonly sortBy?: 'price' | 'rating' | 'newest' | 'popular';
  readonly sortOrder?: 'asc' | 'desc';
  readonly page?: number;
  readonly limit?: number;
}

/** Paginated product response */
export interface PaginatedProducts {
  readonly items: ProductListing[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrevious: boolean;
}
