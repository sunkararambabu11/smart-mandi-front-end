/**
 * Development Environment Configuration
 * ======================================
 * Used during local development (ng serve)
 */
export const environment = {
  // Environment type
  production: false,
  
  // Application metadata
  appName: 'Smart Mandi Connect',
  appTitle: 'Smart Mandi Connect - Farmer to Buyer Marketplace',
  version: '1.0.0',
  
  // API Configuration
  apiUrl: 'http://localhost:5000/api',
  apiTimeout: 30000, // 30 seconds
  
  // Real-time Socket Configuration
  socketUrl: 'http://localhost:3000',
  socketReconnectAttempts: 5,
  socketReconnectDelay: 3000,
  
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
    enableAnalytics: false,
    enablePWA: false,
    debugMode: true,
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
    ttl: 300000, // 5 minutes
    maxItems: 100,
  },
  
  // Logging
  logging: {
    level: 'debug', // 'debug' | 'info' | 'warn' | 'error'
    enableConsole: true,
    enableRemote: false,
  },
};

/** Environment type for type safety */
export type Environment = typeof environment;
