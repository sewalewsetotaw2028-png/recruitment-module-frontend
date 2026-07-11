// Environment configuration
export const config = {
  apiUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
};
