const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://127.0.0.1:5000'
  : 'https://homelooptest-123.onrender.com';

console.log('🌍 Environment:', window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'LOCAL' : 'PRODUCTION');
console.log('🔗 API URL:', API_BASE_URL);