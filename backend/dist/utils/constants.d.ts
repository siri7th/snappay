export declare const USER_ROLES: {
    readonly PRIMARY: "PRIMARY";
    readonly LINKED: "LINKED";
};
export declare const USER_STATUS: {
    readonly ACTIVE: "ACTIVE";
    readonly PAUSED: "PAUSED";
    readonly BLOCKED: "BLOCKED";
    readonly PENDING: "PENDING";
};
export declare const FAMILY_MEMBER_STATUS: {
    readonly PENDING: "PENDING";
    readonly ACTIVE: "ACTIVE";
    readonly PAUSED: "PAUSED";
    readonly REMOVED: "REMOVED";
};
export declare const INVITATION_STATUS: {
    readonly PENDING: "PENDING";
    readonly ACCEPTED: "ACCEPTED";
    readonly REJECTED: "REJECTED";
    readonly EXPIRED: "EXPIRED";
    readonly CANCELLED: "CANCELLED";
};
export declare const TRANSACTION_TYPES: {
    readonly SEND: "SEND";
    readonly RECEIVE: "RECEIVE";
    readonly RECHARGE: "RECHARGE";
    readonly ADD_TO_WALLET: "ADD_TO_WALLET";
    readonly ADD_TO_LIMIT: "ADD_TO_LIMIT";
    readonly WITHDRAW: "WITHDRAW";
    readonly PAYMENT: "PAYMENT";
    readonly BALANCE_TRANSFER: "BALANCE_TRANSFER";
    readonly DISCONNECT_TRANSFER: "DISCONNECT_TRANSFER";
    readonly SEND_MONEY: "SEND_MONEY";
    readonly QR_PAYMENT: "QR_PAYMENT";
};
export declare const TRANSACTION_STATUS: {
    readonly PENDING: "PENDING";
    readonly SUCCESS: "SUCCESS";
    readonly FAILED: "FAILED";
    readonly REFUNDED: "REFUNDED";
};
export declare const PAYMENT_METHODS: {
    readonly WALLET: "wallet";
    readonly BANK: "bank";
    readonly UPI: "upi";
    readonly QR: "qr";
    readonly SYSTEM: "system";
};
export declare const RECHARGE_TYPES: {
    readonly MOBILE: "MOBILE";
    readonly ELECTRICITY: "ELECTRICITY";
    readonly FASTAG: "FASTAG";
    readonly DTH: "DTH";
    readonly GAS: "GAS";
    readonly WATER: "WATER";
};
export declare const NOTIFICATION_TYPES: {
    readonly PAYMENT_SUCCESS: "PAYMENT_SUCCESS";
    readonly PAYMENT_FAILED: "PAYMENT_FAILED";
    readonly PAYMENT_RECEIVED: "PAYMENT_RECEIVED";
    readonly PAYMENT_SENT: "PAYMENT_SENT";
    readonly BANK_TRANSFER: "BANK_TRANSFER";
    readonly QR_PAYMENT: "QR_PAYMENT";
    readonly WALLET_CREDIT: "WALLET_CREDIT";
    readonly WALLET_DEBIT: "WALLET_DEBIT";
    readonly LIMIT_REQUEST: "LIMIT_REQUEST";
    readonly LIMIT_APPROVED: "LIMIT_APPROVED";
    readonly LIMIT_DENIED: "LIMIT_DENIED";
    readonly LIMIT_UPDATED: "LIMIT_UPDATED";
    readonly LIMIT_INCREASED: "LIMIT_INCREASED";
    readonly LIMIT_ALERT: "LIMIT_ALERT";
    readonly FAMILY_JOINED: "FAMILY_JOINED";
    readonly FAMILY_INVITATION: "FAMILY_INVITATION";
    readonly FAMILY_REMOVED: "FAMILY_REMOVED";
    readonly INVITATION_REJECTED: "INVITATION_REJECTED";
    readonly INVITATION_CANCELLED: "INVITATION_CANCELLED";
    readonly CONNECTION_REQUEST: "CONNECTION_REQUEST";
    readonly CONNECTION_APPROVED: "CONNECTION_APPROVED";
    readonly LINKED_DISCONNECTED: "LINKED_DISCONNECTED";
    readonly ACCOUNT_PAUSED: "ACCOUNT_PAUSED";
    readonly ACCOUNT_RESUMED: "ACCOUNT_RESUMED";
    readonly REQUEST_APPROVED: "REQUEST_APPROVED";
    readonly REQUEST_DENIED: "REQUEST_DENIED";
    readonly RECHARGE_SUCCESS: "RECHARGE_SUCCESS";
    readonly RECHARGE_FAILED: "RECHARGE_FAILED";
    readonly SYSTEM: "SYSTEM";
    readonly WELCOME: "WELCOME";
    readonly LOW_BALANCE: "LOW_BALANCE";
};
export declare const OTP_PURPOSES: {
    readonly LOGIN: "login";
    readonly VERIFY_BANK: "verify_bank";
    readonly RESET_PIN: "reset_pin";
    readonly INVITE: "invite";
    readonly DISCONNECT: "disconnect";
    readonly REMOVE_ACCOUNT: "remove_account";
};
export declare const OTP: {
    readonly LENGTH: 6;
    readonly EXPIRY_MINUTES: 5;
    readonly RESEND_WAIT_MINUTES: 2;
};
export declare const LIMITS: {
    readonly DEFAULT_DAILY: 500;
    readonly DEFAULT_MONTHLY: 5000;
    readonly DEFAULT_PER_TXN: 200;
    readonly MAX_DAILY: 10000;
    readonly MAX_MONTHLY: 50000;
    readonly MAX_PER_TXN: 1000;
};
export declare const LIMIT_REQUEST_DURATION: {
    readonly TODAY: "today";
    readonly WEEK: "week";
    readonly MONTH: "month";
    readonly PERMANENT: "permanent";
};
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 10;
    readonly MAX_LIMIT: 100;
};
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly TOO_MANY: 429;
    readonly SERVER_ERROR: 500;
};
//# sourceMappingURL=constants.d.ts.map