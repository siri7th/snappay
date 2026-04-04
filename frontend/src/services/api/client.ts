// src/services/api/client.ts
import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// ===== TYPES =====
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _timestamp?: number;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
  success?: boolean;
}

// ===== CONFIGURATION =====
const CONFIG = {
  ENABLE_USER_CONTEXT_HEADERS: false,
  ENABLE_CACHE_BUSTING: true,
  MAX_RETRY_ATTEMPTS: 1,
  TIMEOUT: 30000,
  DEFAULT_PORT: '5000',
} as const;

// ===== STORAGE KEYS (aligned with constants) =====
const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  LINKED_PRIMARY: 'linked_primary_connected',
  PRIMARY_DETAILS: 'primary_details',
} as const;

// ===== BASE URL DETECTION =====
const getBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL + "/api";
  }
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = CONFIG.DEFAULT_PORT;
  
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `${protocol}//${hostname}:${port}/api`;
  }
  
  return `${protocol}//localhost:${port}/api`;
};

const API_BASE_URL = getBaseUrl();

if (import.meta.env.DEV) {
  console.log('🌐 API Base URL:', API_BASE_URL);
}

// ===== CREATE AXIOS INSTANCE =====
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: CONFIG.TIMEOUT,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true,
});

// ===== REQUEST INTERCEPTOR =====
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (CONFIG.ENABLE_CACHE_BUSTING && config.method?.toLowerCase() === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    if (import.meta.env.DEV) {
      console.log(
        `🚀 [${config.method?.toUpperCase()}] ${config.url}`,
        {
          params: config.params,
          data: config.data,
          headers: {
            ...config.headers,
            Authorization: config.headers.Authorization ? 'Bearer [HIDDEN]' : undefined
          }
        }
      );
    }
    
    return config;
  },
  (error: AxiosError) => {
    if (import.meta.env.DEV) {
      console.error('❌ Request Error:', {
        message: error.message,
        code: error.code,
        config: error.config?.url
      });
    }
    return Promise.reject(error);
  }
);

// ===== RESPONSE INTERCEPTOR =====
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (import.meta.env.DEV) {
      console.log(
        `✅ [${response.status}] ${response.config.url}:`,
        response.data
      );
    }
    
    if (response.data && response.data.success === false) {
      return Promise.reject(new Error(response.data.message || 'Request failed'));
    }
    
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;
    
    if (import.meta.env.DEV) {
      if (error.code === 'ERR_NETWORK') {
        console.error('📡 Network error - server unreachable');
        console.error('💡 Make sure your backend server is running');
      } else if (error.response) {
        console.error(
          `❌ [${error.response.status}] ${error.config?.url}:`,
          {
            data: error.response.data,
            status: error.response.status,
            statusText: error.response.statusText
          }
        );
      } else {
        console.error('❌ Response Error:', {
          message: error.message,
          code: error.code,
          url: error.config?.url
        });
      }
    }

    // ===== HANDLE 401 UNAUTHORIZED =====
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          });
          
          if (response.data?.token) {
            localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.token);
            
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
            return apiClient(originalRequest);
          }
        }
        
        throw new Error('No refresh token or refresh failed');
      } catch (refreshError) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.LINKED_PRIMARY);
        
        if (!window.location.pathname.includes('/auth')) {
          window.location.href = '/auth?session=expired';
        }
      }
    }

    // ===== HANDLE 403 FORBIDDEN =====
    if (error.response?.status === 403) {
      console.error('⛔ Access forbidden');
    }

    // ===== HANDLE 404 NOT FOUND =====
    if (error.response?.status === 404) {
      console.error('🔍 Resource not found:', error.config?.url);
    }

    // ===== HANDLE 429 TOO MANY REQUESTS =====
    if (error.response?.status === 429) {
      console.error('⏱️ Rate limit exceeded');
      return Promise.reject(new Error('Too many requests. Please try again later.'));
    }

    // ===== HANDLE 500 INTERNAL SERVER ERROR =====
    if (error.response?.status && error.response.status >= 500) {
      console.error('🔥 Server error:', error.response.status);
    }

    // ===== HANDLE NETWORK/TIMEOUT ERRORS =====
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout. Please try again.'));
    }

    if (error.code === 'ERR_NETWORK') {
      return Promise.reject(new Error(
        'Cannot connect to server. Please check your internet connection.'
      ));
    }

    // ===== EXTRACT ERROR MESSAGE =====
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'An unexpected error occurred';

    return Promise.reject(new Error(errorMessage));
  }
);

// ===== HELPER METHODS =====
export const api = {
  get: <T>(url: string, params?: object) => 
    apiClient.get<T>(url, { params }),
    
  post: <T>(url: string, data?: object) => 
    apiClient.post<T>(url, data),
    
  put: <T>(url: string, data?: object) => 
    apiClient.put<T>(url, data),
    
  patch: <T>(url: string, data?: object) => 
    apiClient.patch<T>(url, data),
    
  delete: <T>(url: string) => 
    apiClient.delete<T>(url),
};

export default apiClient;