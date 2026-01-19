/**
 * User Role Enumeration
 */
export enum UserRole {
  FARMER = 'FARMER',
  BUYER = 'BUYER',
  ADMIN = 'ADMIN',
}

/**
 * User Status
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

/**
 * Location Entity
 */
export interface Location {
  readonly address: string;
  readonly city: string;
  readonly state: string;
  readonly pincode: string;
  readonly latitude?: number;
  readonly longitude?: number;
}

/**
 * User Entity - Core domain model
 */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly phone: string;
  readonly name: string;
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly avatarUrl?: string;
  readonly location?: Location;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Farmer Profile - Extended user profile for farmers
 */
export interface FarmerProfile extends User {
  readonly role: UserRole.FARMER;
  readonly farmName?: string;
  readonly farmSize?: string;
  readonly crops?: string[];
  readonly bankDetails?: BankDetails;
  readonly rating: number;
  readonly totalSales: number;
  readonly verified: boolean;
}

/**
 * Buyer Profile - Extended user profile for buyers
 */
export interface BuyerProfile extends User {
  readonly role: UserRole.BUYER;
  readonly businessName?: string;
  readonly businessType?: string;
  readonly gstNumber?: string;
  readonly totalPurchases: number;
  readonly verified: boolean;
}

/**
 * Bank Details
 */
export interface BankDetails {
  readonly accountNumber: string;
  readonly ifscCode: string;
  readonly bankName: string;
  readonly accountHolderName: string;
}

/**
 * Authentication Token Response
 */
export interface AuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
}

/**
 * Login Credentials
 */
export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

/**
 * Registration Data
 */
export interface RegistrationData {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly password: string;
  readonly role: UserRole;
  readonly location?: Location;
}

