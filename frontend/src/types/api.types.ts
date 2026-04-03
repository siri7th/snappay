// types/api.types.ts
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  metadata?: {
    timestamp?: string;
    version?: string;
    [key: string]: any;
  };
  errors?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  message: string;
  statusCode?: number;
  code?: string;
  errors?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
  timestamp?: string;
  path?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface SearchParams extends PaginationParams, DateRangeParams {
  search?: string;
  type?: string;
  status?: string;
}

export interface FamilyMemberParams extends SearchParams {
  relationship?: string;
  status?: 'ACTIVE' | 'PAUSED' | 'PENDING' | 'REMOVED';
  minDailySpent?: number;
  maxDailySpent?: number;
  minMonthlySpent?: number;
  maxMonthlySpent?: number;
}

export interface TransactionParams extends SearchParams {
  minAmount?: number;
  maxAmount?: number;
  type?: 'SEND' | 'RECEIVE' | 'RECHARGE' | 'ADD_TO_WALLET' | 'ADD_TO_LIMIT' | 'WITHDRAW' | 'PAYMENT';
  status?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  userId?: string;
  memberId?: string;
}

export interface BankTransactionParams extends SearchParams {
  bankId?: string;
  type?: 'credit' | 'debit';
  minAmount?: number;
  maxAmount?: number;
}

export interface NotificationParams extends SearchParams {
  isRead?: boolean;
  type?: string;
}

export interface RechargeParams extends SearchParams {
  type?: 'MOBILE' | 'ELECTRICITY' | 'FASTAG' | 'DTH';
  operator?: string;
  status?: 'PENDING' | 'SUCCESS' | 'FAILED';
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ApiRequestConfig {
  params?: PaginationParams & FilterParams;
  headers?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
}

export interface BulkOperationResponse {
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
  errors?: Array<{
    id: string;
    error: string;
  }>;
}

export interface IdResponse {
  id: string;
  success: boolean;
}

export interface StatusResponse {
  status: string;
  message?: string;
}

export interface VersionResponse {
  version: string;
  buildNumber?: string;
  environment: 'development' | 'staging' | 'production';
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  services: Record<string, {
    status: 'up' | 'down';
    latency?: number;
    message?: string;
  }>;
  timestamp: string;
}