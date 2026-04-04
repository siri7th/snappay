"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertUPIId = exports.assertAccountNumber = exports.assertIFSC = exports.assertAmount = exports.assertPIN = exports.assertEmail = exports.assertPhone = exports.assertLength = exports.assertRequired = exports.validateEnum = exports.validateLimitRequestDuration = exports.validateOTPPurpose = exports.validateNotificationType = exports.validateRechargeType = exports.validatePaymentMethod = exports.validateTransactionStatus = exports.validateTransactionType = exports.validateInvitationStatus = exports.validateFamilyMemberStatus = exports.validateUserStatus = exports.validateUserRole = exports.validateDateRange = exports.validateLimit = exports.validatePage = exports.validateName = exports.validateUPIId = exports.validateAccountNumber = exports.validateIFSC = exports.validateAmount = exports.validatePIN = exports.validateEmail = exports.validatePhone = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const constants_1 = require("./constants");
const validatePhone = (phone) => {
    return /^[0-9]{10}$/.test(phone);
};
exports.validatePhone = validatePhone;
const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
exports.validateEmail = validateEmail;
const validatePIN = (pin) => {
    return /^[0-9]{4}$/.test(pin);
};
exports.validatePIN = validatePIN;
const validateAmount = (amount) => {
    return amount > 0 && amount <= 1000000;
};
exports.validateAmount = validateAmount;
const validateIFSC = (ifsc) => {
    return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
};
exports.validateIFSC = validateIFSC;
const validateAccountNumber = (accNo) => {
    return /^[0-9]{9,18}$/.test(accNo);
};
exports.validateAccountNumber = validateAccountNumber;
const validateUPIId = (upiId) => {
    return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId);
};
exports.validateUPIId = validateUPIId;
const validateName = (name) => {
    return name.length >= 2 && name.length <= 50 && /^[a-zA-Z\s]+$/.test(name);
};
exports.validateName = validateName;
const validatePage = (page) => {
    const num = parseInt(page);
    return !isNaN(num) && num > 0 ? num : 1;
};
exports.validatePage = validatePage;
const validateLimit = (limit) => {
    const num = parseInt(limit);
    return !isNaN(num) && num > 0 && num <= 100 ? num : 10;
};
exports.validateLimit = validateLimit;
const validateDateRange = (startDate, endDate) => {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new errorHandler_1.AppError('Invalid date format', 400);
    }
    if (start > end) {
        throw new errorHandler_1.AppError('Start date cannot be after end date', 400);
    }
    return { start, end };
};
exports.validateDateRange = validateDateRange;
const validateUserRole = (role) => {
    return Object.values(constants_1.USER_ROLES).includes(role);
};
exports.validateUserRole = validateUserRole;
const validateUserStatus = (status) => {
    return Object.values(constants_1.USER_STATUS).includes(status);
};
exports.validateUserStatus = validateUserStatus;
const validateFamilyMemberStatus = (status) => {
    return Object.values(constants_1.FAMILY_MEMBER_STATUS).includes(status);
};
exports.validateFamilyMemberStatus = validateFamilyMemberStatus;
const validateInvitationStatus = (status) => {
    return Object.values(constants_1.INVITATION_STATUS).includes(status);
};
exports.validateInvitationStatus = validateInvitationStatus;
const validateTransactionType = (type) => {
    return Object.values(constants_1.TRANSACTION_TYPES).includes(type);
};
exports.validateTransactionType = validateTransactionType;
const validateTransactionStatus = (status) => {
    return Object.values(constants_1.TRANSACTION_STATUS).includes(status);
};
exports.validateTransactionStatus = validateTransactionStatus;
const validatePaymentMethod = (method) => {
    return Object.values(constants_1.PAYMENT_METHODS).includes(method);
};
exports.validatePaymentMethod = validatePaymentMethod;
const validateRechargeType = (type) => {
    return Object.values(constants_1.RECHARGE_TYPES).includes(type);
};
exports.validateRechargeType = validateRechargeType;
const validateNotificationType = (type) => {
    return Object.values(constants_1.NOTIFICATION_TYPES).includes(type);
};
exports.validateNotificationType = validateNotificationType;
const validateOTPPurpose = (purpose) => {
    return Object.values(constants_1.OTP_PURPOSES).includes(purpose);
};
exports.validateOTPPurpose = validateOTPPurpose;
const validateLimitRequestDuration = (duration) => {
    return Object.values(constants_1.LIMIT_REQUEST_DURATION).includes(duration);
};
exports.validateLimitRequestDuration = validateLimitRequestDuration;
const validateEnum = (value, enumObj) => {
    return Object.values(enumObj).includes(value);
};
exports.validateEnum = validateEnum;
const assertRequired = (value, field) => {
    if (value === undefined || value === null || value === '') {
        throw new errorHandler_1.AppError(`${field} is required`, 400);
    }
};
exports.assertRequired = assertRequired;
const assertLength = (value, min, max, field) => {
    if (value.length < min || value.length > max) {
        throw new errorHandler_1.AppError(`${field} must be between ${min} and ${max} characters`, 400);
    }
};
exports.assertLength = assertLength;
const assertPhone = (phone) => {
    if (!(0, exports.validatePhone)(phone)) {
        throw new errorHandler_1.AppError('Invalid phone number format. Must be 10 digits.', 400);
    }
};
exports.assertPhone = assertPhone;
const assertEmail = (email) => {
    if (!(0, exports.validateEmail)(email)) {
        throw new errorHandler_1.AppError('Invalid email format', 400);
    }
};
exports.assertEmail = assertEmail;
const assertPIN = (pin) => {
    if (!(0, exports.validatePIN)(pin)) {
        throw new errorHandler_1.AppError('PIN must be 4 digits', 400);
    }
};
exports.assertPIN = assertPIN;
const assertAmount = (amount) => {
    if (!(0, exports.validateAmount)(amount)) {
        throw new errorHandler_1.AppError('Amount must be positive and less than ₹10,00,000', 400);
    }
};
exports.assertAmount = assertAmount;
const assertIFSC = (ifsc) => {
    if (!(0, exports.validateIFSC)(ifsc)) {
        throw new errorHandler_1.AppError('Invalid IFSC code format', 400);
    }
};
exports.assertIFSC = assertIFSC;
const assertAccountNumber = (accNo) => {
    if (!(0, exports.validateAccountNumber)(accNo)) {
        throw new errorHandler_1.AppError('Account number must be 9-18 digits', 400);
    }
};
exports.assertAccountNumber = assertAccountNumber;
const assertUPIId = (upiId) => {
    if (!(0, exports.validateUPIId)(upiId)) {
        throw new errorHandler_1.AppError('Invalid UPI ID format', 400);
    }
};
exports.assertUPIId = assertUPIId;
//# sourceMappingURL=validators.js.map