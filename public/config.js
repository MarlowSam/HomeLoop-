// config.js - Shared API Configuration
// This file MUST be loaded FIRST in all HTML files before any other JavaScript

// Detect environment and set API base URL
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://127.0.0.1:5000'  // Local backend
  : 'https://homeloop-production.up.railway.app';  // Production backend

// Log the current environment (remove in production)
console.log('🌍 Environment:', window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'LOCAL' : 'PRODUCTION');
console.log('🔗 API URL:', API_BASE_URL);