// src/utils/validators.ts
import { REGEX_PATTERNS, LIMITS } from './constants';

// ============================================
// BOOLEAN VALIDATORS (return true/false)
// ============================================

/**
 * Check if phone number is valid (10 digits)
 */
export const isValidPhone = (phone: string): boolean => {
  return REGEX_PATTERNS.PHONE.test(phone);
};

/**
 * Check if email is valid
 */
export const isValidEmail = (email: string): boolean => {
  return REGEX_PATTERNS.EMAIL.test(email);
};

/**
 * Check if PIN is valid (4 digits)
 */
export const isValidPIN = (pin: string): boolean => {
  return REGEX_PATTERNS.PIN.test(pin);
};

/**
 * Check if OTP is valid (6 digits)
 */
export const isValidOTP = (otp: string): boolean => {
  return REGEX_PATTERNS.OTP.test(otp);
};

/**
 * Check if amount is valid (positive and within limits)
 */
export const isValidAmount = (amount: number): boolean => {
  return amount > 0 && amount <= LIMITS.MAX_PER_TXN;
};

/**
 * Check if IFSC code is valid
 */
export const isValidIFSC = (ifsc: string): boolean => {
  return REGEX_PATTERNS.IFSC.test(ifsc);
};

/**
 * Check if account number is valid (9-18 digits)
 */
export const isValidAccountNumber = (accNo: string): boolean => {
  return REGEX_PATTERNS.ACCOUNT_NUMBER.test(accNo);
};

/**
 * Check if UPI ID is valid
 */
export const isValidUPIId = (upiId: string): boolean => {
  return REGEX_PATTERNS.UPI_ID.test(upiId);
};

/**
 * Check if name is valid (letters and spaces only)
 */
export const isValidName = (name: string): boolean => {
  return name.length >= 2 && name.length <= 50 && REGEX_PATTERNS.NAME.test(name);
};

/**
 * Check if password is valid (at least 6 characters)
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Check if PAN is valid
 */
export const isValidPAN = (pan: string): boolean => {
  return REGEX_PATTERNS.PAN.test(pan);
};

/**
 * Check if Aadhaar is valid (12 digits)
 */
export const isValidAadhaar = (aadhaar: string): boolean => {
  return REGEX_PATTERNS.AADHAAR.test(aadhaar);
};

/**
 * Check if GST is valid
 */
export const isValidGST = (gst: string): boolean => {
  return REGEX_PATTERNS.GST.test(gst);
};

/**
 * Check if vehicle number is valid
 */
export const isValidVehicleNumber = (vehicle: string): boolean => {
  return REGEX_PATTERNS.VEHICLE.test(vehicle);
};

/**
 * Check if pincode is valid (6 digits)
 */
export const isValidPincode = (pincode: string): boolean => {
  return REGEX_PATTERNS.PINCODE.test(pincode);
};

/**
 * Check if URL is valid
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if date is valid
 */
export const isValidDate = (date: string): boolean => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Check if date is in the future
 */
export const isValidFutureDate = (date: string): boolean => {
  if (!isValidDate(date)) return false;
  return new Date(date) > new Date();
};

/**
 * Check if date is in the past
 */
export const isValidPastDate = (date: string): boolean => {
  if (!isValidDate(date)) return false;
  return new Date(date) < new Date();
};

/**
 * Check if age is at least minimum age
 */
export const isValidAge = (dateOfBirth: string, minAge: number = 18): boolean => {
  if (!isValidDate(dateOfBirth)) return false;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age >= minAge;
};

/**
 * Check if file size is within limit
 */
export const isValidFileSize = (size: number, maxSize: number): boolean => {
  return size <= maxSize;
};

/**
 * Check if file type is allowed
 */
export const isValidFileType = (type: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(type);
};

/**
 * Validate file with options
 */
export const isValidFile = (
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } => {
  const { maxSize, allowedTypes } = options;
  
  if (maxSize && !isValidFileSize(file.size, maxSize)) {
    return { valid: false, error: `File size exceeds ${maxSize / (1024 * 1024)}MB` };
  }
  
  if (allowedTypes && !isValidFileType(file.type, allowedTypes)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  return { valid: true };
};

/**
 * Check if color is valid hex or rgb
 */
export const isValidColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color) ||
         /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/.test(color);
};

/**
 * Check if string is valid JSON
 */
export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if string is valid base64
 */
export const isValidBase64 = (str: string): boolean => {
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
};

// ============================================
// ASSERTION VALIDATORS (throw AppError)
// ============================================

/**
 * Validate required field
 */
export const validateRequired = (value: any, field: string): string | null => {
  if (value === undefined || value === null || value === '') {
    return `${field} is required`;
  }
  return null;
};

/**
 * Validate minimum length
 */
export const validateMinLength = (value: string, min: number, field: string): string | null => {
  if (value.length < min) {
    return `${field} must be at least ${min} characters`;
  }
  return null;
};

/**
 * Validate maximum length
 */
export const validateMaxLength = (value: string, max: number, field: string): string | null => {
  if (value.length > max) {
    return `${field} must not exceed ${max} characters`;
  }
  return null;
};

/**
 * Validate exact length
 */
export const validateExactLength = (value: string, length: number, field: string): string | null => {
  if (value.length !== length) {
    return `${field} must be exactly ${length} characters`;
  }
  return null;
};

/**
 * Validate range
 */
export const validateRange = (
  value: number,
  min: number,
  max: number,
  field: string
): string | null => {
  if (value < min || value > max) {
    return `${field} must be between ${min} and ${max}`;
  }
  return null;
};

/**
 * Validate minimum value
 */
export const validateMin = (value: number, min: number, field: string): string | null => {
  if (value < min) {
    return `${field} must be at least ${min}`;
  }
  return null;
};

/**
 * Validate maximum value
 */
export const validateMax = (value: number, max: number, field: string): string | null => {
  if (value > max) {
    return `${field} must not exceed ${max}`;
  }
  return null;
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): string | null => {
  if (!email) return null;
  if (!isValidEmail(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

/**
 * Validate phone number format
 */
export const validatePhone = (phone: string): string | null => {
  if (!phone) return 'Phone number is required';
  if (!isValidPhone(phone)) {
    return 'Please enter a valid 10-digit phone number';
  }
  return null;
};

/**
 * Validate PIN format
 */
export const validatePIN = (pin: string): string | null => {
  if (!pin) return 'PIN is required';
  if (!isValidPIN(pin)) {
    return 'PIN must be exactly 4 digits';
  }
  return null;
};

/**
 * Validate OTP format
 */
export const validateOTP = (otp: string): string | null => {
  if (!otp) return 'OTP is required';
  if (!isValidOTP(otp)) {
    return 'OTP must be exactly 6 digits';
  }
  return null;
};

/**
 * Validate amount
 */
export const validateAmount = (
  amount: number,
  options: {
    min?: number;
    max?: number;
    field?: string;
  } = {}
): string | null => {
  const { min = 1, max = LIMITS.MAX_PER_TXN, field = 'Amount' } = options;
  
  if (!amount || amount <= 0) {
    return `${field} must be greater than 0`;
  }
  
  if (amount < min) {
    return `${field} must be at least ${min}`;
  }
  
  if (amount > max) {
    return `${field} must not exceed ${max}`;
  }
  
  return null;
};

/**
 * Validate IFSC code
 */
export const validateIFSC = (ifsc: string): string | null => {
  if (!ifsc) return 'IFSC code is required';
  if (!isValidIFSC(ifsc)) {
    return 'Please enter a valid IFSC code';
  }
  return null;
};

/**
 * Validate account number
 */
export const validateAccountNumber = (accNo: string): string | null => {
  if (!accNo) return 'Account number is required';
  if (!isValidAccountNumber(accNo)) {
    return 'Please enter a valid account number (9-18 digits)';
  }
  return null;
};

/**
 * Validate UPI ID
 */
export const validateUPIId = (upiId: string): string | null => {
  if (!upiId) return 'UPI ID is required';
  if (!isValidUPIId(upiId)) {
    return 'Please enter a valid UPI ID (e.g., name@bank)';
  }
  return null;
};

/**
 * Validate name
 */
export const validateName = (name: string): string | null => {
  if (!name) return 'Name is required';
  if (!isValidName(name)) {
    return 'Name must be 2-50 characters and contain only letters and spaces';
  }
  return null;
};

/**
 * Validate password
 */
export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (!isValidPassword(password)) {
    return 'Password must be at least 6 characters';
  }
  return null;
};

/**
 * Validate PAN
 */
export const validatePAN = (pan: string): string | null => {
  if (!pan) return 'PAN is required';
  if (!isValidPAN(pan)) {
    return 'Please enter a valid PAN (e.g., ABCDE1234F)';
  }
  return null;
};

/**
 * Validate Aadhaar
 */
export const validateAadhaar = (aadhaar: string): string | null => {
  if (!aadhaar) return 'Aadhaar is required';
  if (!isValidAadhaar(aadhaar)) {
    return 'Please enter a valid 12-digit Aadhaar number';
  }
  return null;
};

/**
 * Validate GST
 */
export const validateGST = (gst: string): string | null => {
  if (!gst) return 'GST is required';
  if (!isValidGST(gst)) {
    return 'Please enter a valid GST number';
  }
  return null;
};

/**
 * Validate pincode
 */
export const validatePincode = (pincode: string): string | null => {
  if (!pincode) return null;
  if (!isValidPincode(pincode)) {
    return 'Please enter a valid 6-digit pincode';
  }
  return null;
};

/**
 * Validate date with options
 */
export const validateDate = (
  date: string,
  options: {
    required?: boolean;
    future?: boolean;
    past?: boolean;
    minAge?: number;
    field?: string;
  } = {}
): string | null => {
  const { required = false, future = false, past = false, minAge, field = 'Date' } = options;
  
  if (!date) {
    return required ? `${field} is required` : null;
  }
  
  if (!isValidDate(date)) {
    return `Please enter a valid ${field.toLowerCase()}`;
  }
  
  if (future && !isValidFutureDate(date)) {
    return `${field} must be in the future`;
  }
  
  if (past && !isValidPastDate(date)) {
    return `${field} must be in the past`;
  }
  
  if (minAge && !isValidAge(date, minAge)) {
    return `You must be at least ${minAge} years old`;
  }
  
  return null;
};

/**
 * Validate that two fields match
 */
export const validateMatch = (
  value1: string,
  value2: string,
  field: string
): string | null => {
  if (value1 !== value2) {
    return `${field} do not match`;
  }
  return null;
};

/**
 * Validate against regex pattern
 */
export const validatePattern = (
  value: string,
  pattern: RegExp,
  message: string
): string | null => {
  if (!value) return null;
  if (!pattern.test(value)) {
    return message;
  }
  return null;
};