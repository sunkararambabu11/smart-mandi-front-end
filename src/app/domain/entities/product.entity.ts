/**
 * Product Category
 */
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

/**
 * Product Quality Grade
 */
export enum QualityGrade {
  PREMIUM = 'PREMIUM',
  GRADE_A = 'GRADE_A',
  GRADE_B = 'GRADE_B',
  STANDARD = 'STANDARD',
}

/**
 * Product Status
 */
export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SOLD_OUT = 'SOLD_OUT',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Unit of Measurement
 */
export enum UnitOfMeasurement {
  KG = 'KG',
  QUINTAL = 'QUINTAL',
  TON = 'TON',
  PIECE = 'PIECE',
  DOZEN = 'DOZEN',
  LITRE = 'LITRE',
  BUNCH = 'BUNCH',
}

/**
 * Product Image
 */
export interface ProductImage {
  readonly id: string;
  readonly url: string;
  readonly thumbnailUrl: string;
  readonly isPrimary: boolean;
}

/**
 * Price History Entry
 */
export interface PriceHistoryEntry {
  readonly price: number;
  readonly date: Date;
}

/**
 * Product Entity - Core domain model
 */
export interface Product {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: ProductCategory;
  readonly qualityGrade: QualityGrade;
  readonly status: ProductStatus;

  // Pricing
  readonly pricePerUnit: number;
  readonly unit: UnitOfMeasurement;
  readonly minOrderQuantity: number;
  readonly availableQuantity: number;

  // Media
  readonly images: ProductImage[];

  // Location & Delivery
  readonly harvestDate?: Date;
  readonly expiryDate?: Date;
  readonly originLocation: string;
  readonly deliveryAvailable: boolean;
  readonly deliveryRadius?: number; // in km

  // Seller Info
  readonly sellerId: string;
  readonly sellerName: string;
  readonly sellerRating: number;

  // Timestamps
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // Analytics
  readonly viewCount: number;
  readonly inquiryCount: number;
}

/**
 * Product Filter Criteria
 */
export interface ProductFilters {
  readonly search?: string;
  readonly category?: ProductCategory;
  readonly qualityGrade?: QualityGrade;
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly location?: string;
  readonly sellerId?: string;
  readonly status?: ProductStatus;
  readonly sortBy?: 'price' | 'date' | 'rating' | 'distance';
  readonly sortOrder?: 'asc' | 'desc';
}

/**
 * Create Product DTO
 */
export interface CreateProductDto {
  readonly name: string;
  readonly description: string;
  readonly category: ProductCategory;
  readonly qualityGrade: QualityGrade;
  readonly pricePerUnit: number;
  readonly unit: UnitOfMeasurement;
  readonly minOrderQuantity: number;
  readonly availableQuantity: number;
  readonly harvestDate?: Date;
  readonly expiryDate?: Date;
  readonly originLocation: string;
  readonly deliveryAvailable: boolean;
  readonly deliveryRadius?: number;
}

