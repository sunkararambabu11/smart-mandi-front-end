/**
 * Production Environment Configuration
 * =====================================
 * Used for production builds (ng build --configuration production)
 */
export const environment = {
  // Environment type
  production: true,

  // Application metadata
  appName: 'Smart Mandi Connect',
  appTitle: 'Smart Mandi Connect - Farmer to Buyer Marketplace',
  version: '1.0.0',

  // API Configuration
  apiUrl: 'https://api.smartmandiconnect.com/api',
  apiTimeout: 30000, // 30 seconds

  // Real-time Socket Configuration
  socketUrl: 'https://api.smartmandiconnect.com',
  socketReconnectAttempts: 10,
  socketReconnectDelay: 5000,

  // Authentication
  auth: {
    tokenRefreshThreshold: 300, // Refresh token 5 minutes before expiry
    sessionTimeout: 3600000, // 1 hour in milliseconds
    rememberMeDuration: 604800000, // 7 days in milliseconds
  },

  // Feature flags
  features: {
    enableChat: true,
    enableNotifications: true,
    enableAnalytics: true,
    enablePWA: true,
    debugMode: false,
  },

  // Pagination defaults
  pagination: {
    defaultPageSize: 12,
    pageSizeOptions: [12, 24, 48, 96],
  },

  // File upload limits
  upload: {
    maxFileSize: 5242880, // 5MB
    maxFiles: 5,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },

  // Cache configuration
  cache: {
    ttl: 600000, // 10 minutes in production
    maxItems: 200,
  },

  // Logging
  logging: {
    level: 'error', // Only log errors in production
    enableConsole: false,
    enableRemote: true, // Enable remote error reporting
  },
};

/** Environment type for type safety */
export type Environment = typeof environment;
