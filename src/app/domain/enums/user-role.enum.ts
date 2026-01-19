/**
 * User Role Enumeration
 *
 * Defines the available user roles in the Smart Mandi Connect platform.
 */

export enum UserRole {
  /** Farmer - Can list products, manage inventory, fulfill orders */
  FARMER = 'FARMER',

  /** Buyer - Can browse marketplace, place orders, negotiate prices */
  BUYER = 'BUYER',

  /** Admin - Full platform access, user management, analytics */
  ADMIN = 'ADMIN',
}

/** Type-safe role check utilities */
export const RoleUtils = {
  isFarmer: (role: UserRole): boolean => role === UserRole.FARMER,
  isBuyer: (role: UserRole): boolean => role === UserRole.BUYER,
  isAdmin: (role: UserRole): boolean => role === UserRole.ADMIN,
  canManageProducts: (role: UserRole): boolean =>
    role === UserRole.FARMER || role === UserRole.ADMIN,
  canPlaceOrders: (role: UserRole): boolean =>
    role === UserRole.BUYER || role === UserRole.ADMIN,
} as const;

