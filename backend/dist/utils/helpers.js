"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickFields = exports.omitFields = exports.parseJSON = exports.sleep = exports.addDays = exports.getEndOfMonth = exports.getStartOfMonth = exports.getEndOfDay = exports.getStartOfDay = exports.formatDate = exports.calculatePercentage = exports.compareHash = exports.hashData = exports.generateInviteCode = exports.generateTxnId = exports.maskPhoneNumber = exports.maskAccountNumber = exports.formatCurrency = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
};
exports.formatCurrency = formatCurrency;
const maskAccountNumber = (accNo) => {
    if (!accNo)
        return '';
    if (accNo.length <= 4)
        return '****';
    return `****${accNo.slice(-4)}`;
};
exports.maskAccountNumber = maskAccountNumber;
const maskPhoneNumber = (phone) => {
    if (!phone || phone.length < 6)
        return '******';
    return `${phone.slice(0, 2)}****${phone.slice(-2)}`;
};
exports.maskPhoneNumber = maskPhoneNumber;
const generateTxnId = (prefix = 'TXN') => {
    const timestamp = Date.now().toString(36);
    const random = crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}${timestamp}${random}`;
};
exports.generateTxnId = generateTxnId;
const generateInviteCode = () => {
    return crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
};
exports.generateInviteCode = generateInviteCode;
const hashData = async (data) => {
    return bcryptjs_1.default.hash(data, 10);
};
exports.hashData = hashData;
const compareHash = async (data, hash) => {
    return bcryptjs_1.default.compare(data, hash);
};
exports.compareHash = compareHash;
const calculatePercentage = (value, total) => {
    if (total === 0)
        return 0;
    return Math.round((value / total) * 100);
};
exports.calculatePercentage = calculatePercentage;
const formatDate = (date, format = 'short') => {
    const options = format === 'long'
        ? { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
        : { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Intl.DateTimeFormat('en-IN', options).format(date);
};
exports.formatDate = formatDate;
const getStartOfDay = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};
exports.getStartOfDay = getStartOfDay;
const getEndOfDay = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};
exports.getEndOfDay = getEndOfDay;
const getStartOfMonth = (date = new Date()) => {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
};
exports.getStartOfMonth = getStartOfMonth;
const getEndOfMonth = (date = new Date()) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    d.setHours(23, 59, 59, 999);
    return d;
};
exports.getEndOfMonth = getEndOfMonth;
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};
exports.addDays = addDays;
const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
exports.sleep = sleep;
const parseJSON = (json, fallback) => {
    try {
        return JSON.parse(json);
    }
    catch {
        return fallback;
    }
};
exports.parseJSON = parseJSON;
const omitFields = (obj, keys) => {
    const result = { ...obj };
    keys.forEach((key) => delete result[key]);
    return result;
};
exports.omitFields = omitFields;
const pickFields = (obj, keys) => {
    return keys.reduce((acc, key) => {
        if (key in obj)
            acc[key] = obj[key];
        return acc;
    }, {});
};
exports.pickFields = pickFields;
//# sourceMappingURL=helpers.js.map