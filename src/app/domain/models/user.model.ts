/**
 * User Domain Models
 * ==================
 * Core user entities and value objects for Smart Mandi Connect
 */

/** User roles in the marketplace */
export enum UserRole {
  FARMER = 'FARMER',
  BUYER = 'BUYER',
  ADMIN = 'ADMIN',
}

/** User account status */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  SUSPENDED = 'SUSPENDED',
}

/** Geographic location */
export interface GeoLocation {
  readonly latitude: number;
  readonly longitude: number;
  readonly address?: string;
  readonly city?: string;
  readonly state?: string;
  readonly pincode?: string;
}

/** User profile information */
export interface UserProfile {
  readonly avatarUrl?: string;
  readonly phoneNumber: string;
  readonly alternatePhone?: string;
  readonly location?: GeoLocation;
  readonly bio?: string;
  readonly languages?: string[];
}

/** Farmer-specific profile extension */
export interface FarmerProfile extends UserProfile {
  readonly farmSize?: number; // in acres
  readonly cropTypes?: string[];
  readonly certifications?: string[];
  readonly yearsOfExperience?: number;
  readonly organicCertified?: boolean;
}

/** Buyer-specific profile extension */
export interface BuyerProfile extends UserProfile {
  readonly businessName?: string;
  readonly businessType?: 'RETAILER' | 'WHOLESALER' | 'RESTAURANT' | 'CONSUMER';
  readonly gstNumber?: string;
  readonly preferredCategories?: string[];
}

/** Core User entity */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly profile: UserProfile | FarmerProfile | BuyerProfile;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastLoginAt?: Date;
  readonly emailVerified: boolean;
  readonly phoneVerified: boolean;
}

/** User creation DTO */
export interface CreateUserDto {
  readonly email: string;
  readonly password: string;
  readonly fullName: string;
  readonly role: UserRole;
  readonly phoneNumber: string;
}

/** User update DTO */
export interface UpdateUserDto {
  readonly fullName?: string;
  readonly profile?: Partial<UserProfile>;
}

/** Authentication credentials */
export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
  readonly rememberMe?: boolean;
}

/** Authentication response */
export interface AuthResponse {
  readonly user: User;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
}

/** Registration request */
export interface RegisterRequest extends CreateUserDto {
  readonly confirmPassword: string;
  readonly acceptTerms: boolean;
}
