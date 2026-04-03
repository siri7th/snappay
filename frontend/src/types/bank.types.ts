// types/bank.types.ts
export interface Bank {
  id: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolder: string;
  balance: number;
  isDefault: boolean;
  isVerified: boolean;
  upiIds?: UPIId[];
  branch?: string;
  accountType?: 'savings' | 'current' | 'salary';
  createdAt: string;
  updatedAt: string;
  dailyLimit?: number;
  monthlyLimit?: number;
  metadata?: Record<string, any>;
}

export interface UPIId {
  id: string;
  upiId: string;
  isPrimary: boolean;
  verified: boolean;
  createdAt: string;
}

export interface AddBankRequest {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolder: string;
  accountType?: 'savings' | 'current' | 'salary';
  balance?: number;
  branch?: string;
}

export interface UpdateBankRequest {
  bankName?: string;
  accountHolder?: string;
  isDefault?: boolean;
  accountType?: 'savings' | 'current' | 'salary';
  branch?: string;
}

export interface VerifyBankRequest {
  amount1: number;
  amount2: number;
}

export interface BankTransaction {
  id: string;
  bankId: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  balance: number;
  reference?: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface BankStatement {
  bankId: string;
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  transactions: BankTransaction[];
  totalCredits: number;
  totalDebits: number;
}

export interface BankVerificationStatus {
  isVerified: boolean;
  verifiedAt?: string;
  attempts: number;
  nextAttemptAt?: string;
}

export interface BankSummary {
  totalBanks: number;
  verifiedBanks: number;
  unverifiedBanks: number;
  totalBalance: number;
  defaultBank?: Bank;
  banksByType: Record<string, number>;
}