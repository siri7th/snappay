// src/utils/formatters.ts

/**
 * Format currency in Indian Rupees
 */
export const formatCurrency = (amount: number): string => {
  if (amount === undefined || amount === null) return '₹0';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format currency in compact form (K, L, Cr)
 */
export const formatCompactCurrency = (amount: number): string => {
  if (amount === undefined || amount === null) return '₹0';
  
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
};

/**
 * Format date with various formats
 */
export const formatDate = (
  date: string | Date,
  format: 'short' | 'long' | 'time' | 'full' | 'relative' = 'short',
): string => {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  
  if (format === 'relative') {
    return formatRelativeTime(date);
  }
  
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };

  if (format === 'long') {
    options.day = 'numeric';
    options.month = 'long';
    options.year = 'numeric';
    options.hour = '2-digit';
    options.minute = '2-digit';
  } else if (format === 'full') {
    options.weekday = 'long';
    options.day = 'numeric';
    options.month = 'long';
    options.year = 'numeric';
    options.hour = '2-digit';
    options.minute = '2-digit';
  } else if (format === 'time') {
    return d.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  return d.toLocaleDateString('en-IN', options);
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
  
  const years = Math.floor(diffInSeconds / 31536000);
  return `${years} year${years > 1 ? 's' : ''} ago`;
};

/**
 * Format phone number to Indian format
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
};

/**
 * Mask account number (show only last 4 digits)
 */
export const maskAccountNumber = (accNo: string, showLast: number = 4): string => {
  if (!accNo) return '';
  if (accNo.length <= showLast) return accNo;
  const lastPart = accNo.slice(-showLast);
  const masked = '•'.repeat(Math.min(accNo.length - showLast, 8));
  return `${masked}${lastPart}`;
};

/**
 * Mask phone number (show first 2 and last 2 digits)
 */
export const maskPhoneNumber = (phone: string, showFirst: number = 2, showLast: number = 2): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length <= showFirst + showLast) return phone;
  
  const first = cleaned.slice(0, showFirst);
  const last = cleaned.slice(-showLast);
  const masked = '•'.repeat(cleaned.length - showFirst - showLast);
  
  return `${first}${masked}${last}`;
};

/**
 * Mask email address
 */
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) return email;
  
  const firstChar = localPart[0];
  const lastChar = localPart[localPart.length - 1];
  const maskedLocal = `${firstChar}${'•'.repeat(Math.min(localPart.length - 2, 5))}${lastChar}`;
  
  return `${maskedLocal}@${domain}`;
};

/**
 * Format file size in human-readable form
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${Math.min(percentage, 100).toFixed(1)}%`;
};

/**
 * Format duration in minutes to human-readable string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Format transaction ID (show only last few characters)
 */
export const formatTransactionId = (id: string, showLast: number = 8): string => {
  if (!id) return '';
  if (id.length <= showLast) return id;
  return `...${id.slice(-showLast)}`;
};

/**
 * Format card number with spaces every 4 digits
 */
export const formatCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(' ') : cardNumber;
};

/**
 * Format UPI ID (mask middle part)
 */
export const formatUpiId = (upiId: string): string => {
  if (!upiId || !upiId.includes('@')) return upiId;
  
  const [localPart, domain] = upiId.split('@');
  if (localPart.length <= 4) return upiId;
  
  const firstPart = localPart.slice(0, 3);
  const lastPart = localPart.slice(-3);
  const maskedLocal = `${firstPart}...${lastPart}`;
  
  return `${maskedLocal}@${domain}`;
};

/**
 * Format address from address object
 */
export const formatAddress = (address: {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}): string => {
  const parts = [];
  if (address.street) parts.push(address.street);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.pincode) parts.push(address.pincode);
  if (address.country) parts.push(address.country);
  
  return parts.join(', ');
};

/**
 * Format list with conjunction (and/or)
 */
export const formatList = (items: string[], conjunction: 'and' | 'or' = 'and'): string => {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  
  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1).join(', ');
  return `${otherItems}, ${conjunction} ${lastItem}`;
};

/**
 * Format number with Indian number formatting
 */
export const formatNumber = (num: number, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
}): string => {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    useGrouping = true,
  } = options || {};
  
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
  }).format(num);
};

/**
 * Format boolean as Yes/No
 */
export const formatYesNo = (value: boolean): string => {
  return value ? 'Yes' : 'No';
};

/**
 * Format boolean as On/Off
 */
export const formatOnOff = (value: boolean): string => {
  return value ? 'On' : 'Off';
};

/**
 * Format boolean as Enabled/Disabled
 */
export const formatEnabledDisabled = (value: boolean): string => {
  return value ? 'Enabled' : 'Disabled';
};

/**
 * Format gender code to display string
 */
export const formatGender = (gender: string): string => {
  const map: Record<string, string> = {
    male: 'Male',
    female: 'Female',
    other: 'Other',
    'prefer-not-to-say': 'Prefer not to say',
  };
  return map[gender] || gender;
};

/**
 * Format relationship code to display string
 */
export const formatRelationship = (relationship: string): string => {
  const map: Record<string, string> = {
    father: 'Father',
    mother: 'Mother',
    son: 'Son',
    daughter: 'Daughter',
    brother: 'Brother',
    sister: 'Sister',
    husband: 'Husband',
    wife: 'Wife',
    grandfather: 'Grandfather',
    grandmother: 'Grandmother',
    grandson: 'Grandson',
    granddaughter: 'Granddaughter',
    uncle: 'Uncle',
    aunt: 'Aunt',
    cousin: 'Cousin',
    nephew: 'Nephew',
    niece: 'Niece',
    friend: 'Friend',
    other: 'Other',
  };
  return map[relationship.toLowerCase()] || relationship;
};