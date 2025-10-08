import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API base URL - Bu URL'yi kendi API endpoint'inizle değiştirin
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5278/api';

/**
 * Bu benim staj projem. Sena Yalçın Hanım'a ve Alper Can Bey'e
 * bu projeyi geliştirmemde yaptıkları katkılardan dolayı çok teşekkür ederim.
 * EHSİM'de staj yapmanın çok zevkli ve eğitici olduğunu söylemek isterim :)
 * Umarım projem kullanılır.
 * 
 * - Yusuf Talha Alişan 
 * 2025 3. Dönem Stajyeri
 */

// Axios instance oluştur
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 saniye timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - Her request'e token eklemek için
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Token'ı localStorage'dan al
    const token = localStorage.getItem('access_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Request'i log'la (development ortamında ve sadece önemli bilgiler)
    if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_API_LOGS !== 'false') {
      console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
      });
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Response'ları işlemek için
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    
    // Response'u log'la (development ortamında ve sadece status)
    if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_API_LOGS !== 'false') {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
      });
    }    return response;
  },
  (error: AxiosError) => {
    // Hata durumlarını işle
    if (error.response) {
      const status = error.response.status;
      
      switch (status) {
        case 401:
          // Unauthorized - Token'ı temizle ve login sayfasına yönlendir
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('token_expiration');
          localStorage.removeItem('user');
          window.location.href = '/signin';
          break;
          
        case 403:
          // Forbidden
          console.error('🚫 Access forbidden');
          break;
          
        case 404:
          console.error('🔍 Resource not found');
          break;
          
        case 500:
          console.error('🔥 Internal server error');
          break;
          
        default:
          console.error(`❌ HTTP Error ${status}:`, error.response.data);
      }
    } else if (error.request) {
      // Network error
      console.error('🌐 Network Error:', error.request);
    } else {
      console.error('❌ Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
