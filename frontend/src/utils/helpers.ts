// src/utils/helpers.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a unique ID with optional prefix
 */
export const generateId = (prefix: string = ''): string => {
  return `${prefix}${Date.now()}${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Generate OTP for testing
 */
export const generateOTP = (length: number = 6): string => {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
};

/**
 * Sleep for specified milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Group array by key
 */
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) result[groupKey] = [];
      result[groupKey].push(item);
      return result;
    },
    {} as Record<string, T[]>,
  );
};

/**
 * Sort array by key
 */
export const sortBy = <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Filter unique values by key
 */
export const filterUnique = <T>(array: T[], key: keyof T): T[] => {
  const seen = new Set();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

/**
 * Download file from content
 */
export const downloadFile = (content: string, filename: string, type: string = 'text/plain') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Download JSON data
 */
export const downloadJson = (data: any, filename: string) => {
  const content = JSON.stringify(data, null, 2);
  downloadFile(content, filename, 'application/json');
};

/**
 * Download CSV data
 */
export const downloadCsv = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).map(value => 
    typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
  ).join(','));
  
  const content = [headers, ...rows].join('\n');
  downloadFile(content, filename, 'text/csv');
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Get initials from name
 */
export const getInitials = (name: string, maxLength: number = 2): string => {
  if (!name) return 'U';
  
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, maxLength);
};

/**
 * Truncate text
 */
export const truncate = (text: string, length: number, suffix: string = '...'): string => {
  if (!text || text.length <= length) return text;
  return text.slice(0, length) + suffix;
};

/**
 * Pluralize word based on count
 */
export const pluralize = (count: number, singular: string, plural?: string): string => {
  return count === 1 ? singular : plural || singular + 's';
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
};

/**
 * Get time remaining until end time
 */
export const getTimeRemaining = (endTime: string | Date): string => {
  const total = new Date(endTime).getTime() - Date.now();
  if (total <= 0) return 'Expired';

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

/**
 * Safely parse JSON
 */
export const parseJSON = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

/**
 * Omit keys from object
 */
export const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
};

/**
 * Pick keys from object
 */
export const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
  return keys.reduce(
    (acc, key) => {
      if (key in obj) acc[key] = obj[key];
      return acc;
    },
    {} as Pick<T, K>,
  );
};

/**
 * Check if value is empty
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if two values are equal (simple comparison)
 */
export const isEqual = (a: any, b: any): boolean => {
  return JSON.stringify(a) === JSON.stringify(b);
};

/**
 * Format error message from error object
 */
export const formatError = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return 'An unexpected error occurred';
};

/**
 * Get query params from URL
 */
export const getQueryParams = (url: string = window.location.href): Record<string, string> => {
  const params = new URL(url).searchParams;
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
};

/**
 * Build query string from params
 */
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Scroll to top of page
 */
export const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
  window.scrollTo({ top: 0, behavior });
};

/**
 * Scroll to element by ID
 */
export const scrollToElement = (elementId: string, behavior: ScrollBehavior = 'smooth') => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior, block: 'start' });
  }
};

/**
 * Detect browser
 */
export const detectBrowser = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('MSIE') || ua.includes('Trident/')) return 'Internet Explorer';
  return 'Unknown';
};

/**
 * Detect operating system
 */
export const detectOS = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
};

/**
 * Check if device is mobile
 */
export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Check if online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Add event listener with automatic cleanup
 */
export const addEventListener = (
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
): () => void => {
  target.addEventListener(type, listener, options);
  return () => target.removeEventListener(type, listener, options);
};

/**
 * RAF throttled function
 */
export const rafThrottle = <T extends (...args: any[]) => any>(fn: T): T => {
  let rafId: number | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    if (rafId !== null) return;
    
    rafId = requestAnimationFrame(() => {
      fn.apply(this, args);
      rafId = null;
    });
  } as T;
};