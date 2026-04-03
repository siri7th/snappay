-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "dateOfBirth" DATETIME,
    "gender" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "country" TEXT DEFAULT 'IN',
    "aadharNumber" TEXT,
    "panNumber" TEXT,
    "isKycVerified" BOOLEAN NOT NULL DEFAULT false,
    "kycVerifiedAt" DATETIME,
    "kycRejectionReason" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT true,
    "emailVerifiedAt" DATETIME,
    "phoneVerifiedAt" DATETIME,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "familyRole" TEXT,
    "joinedFamilyAt" DATETIME,
    "pin" TEXT,
    "avatar" TEXT,
    "lastLoginAt" DATETIME,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "lastPasswordChange" DATETIME,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "lastLoginIp" TEXT,
    "lastLoginDevice" TEXT,
    "riskScore" REAL,
    "isFraudulent" BOOLEAN NOT NULL DEFAULT false,
    "fraudReason" TEXT,
    "fraudReportedAt" DATETIME,
    "language" TEXT DEFAULT 'en',
    "profileComplete" BOOLEAN NOT NULL DEFAULT false,
    "preferences" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "balance" REAL NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bank_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "family_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "primaryId" TEXT NOT NULL,
    "linkedId" TEXT NOT NULL,
    "relationship" TEXT,
    "dailyLimit" REAL NOT NULL DEFAULT 500,
    "monthlyLimit" REAL NOT NULL DEFAULT 5000,
    "perTransactionLimit" REAL NOT NULL DEFAULT 200,
    "dailySpent" REAL NOT NULL DEFAULT 0,
    "monthlySpent" REAL NOT NULL DEFAULT 0,
    "lastResetDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "permissions" TEXT NOT NULL DEFAULT '{"sendMoney":true,"scanPay":true,"recharge":true,"viewHistory":true}',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "family_members_primaryId_fkey" FOREIGN KEY ("primaryId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "family_members_linkedId_fkey" FOREIGN KEY ("linkedId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inviteCode" TEXT NOT NULL,
    "primaryId" TEXT NOT NULL,
    "invitedPhone" TEXT NOT NULL,
    "invitedUserId" TEXT,
    "relationship" TEXT,
    "dailyLimit" REAL NOT NULL DEFAULT 500,
    "monthlyLimit" REAL NOT NULL DEFAULT 5000,
    "perTransactionLimit" REAL NOT NULL DEFAULT 200,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "acceptedAt" DATETIME,
    CONSTRAINT "invitations_primaryId_fkey" FOREIGN KEY ("primaryId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invitations_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "limit_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyMemberId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "reason" TEXT,
    "duration" TEXT NOT NULL DEFAULT 'today',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "respondedAt" DATETIME,
    CONSTRAINT "limit_requests_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "family_members" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "limit_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "limit_requests_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "senderId" TEXT,
    "receiverId" TEXT,
    "walletId" TEXT,
    "bankId" TEXT,
    "familyMemberId" TEXT,
    "description" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'wallet',
    "reference" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "transactions_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "bank_accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "family_members" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recharges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "operator" TEXT,
    "accountNumber" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "recharges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" DATETIME,
    CONSTRAINT "otps_phone_fkey" FOREIGN KEY ("phone") REFERENCES "users" ("phone") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_aadharNumber_key" ON "users"("aadharNumber");

-- CreateIndex
CREATE UNIQUE INDEX "users_panNumber_key" ON "users"("panNumber");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_aadharNumber_idx" ON "users"("aadharNumber");

-- CreateIndex
CREATE INDEX "users_panNumber_idx" ON "users"("panNumber");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_isKycVerified_idx" ON "users"("isKycVerified");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_accountNumber_key" ON "bank_accounts"("accountNumber");

-- CreateIndex
CREATE INDEX "bank_accounts_userId_idx" ON "bank_accounts"("userId");

-- CreateIndex
CREATE INDEX "bank_accounts_isDefault_idx" ON "bank_accounts"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_accountNumber_ifscCode_key" ON "bank_accounts"("accountNumber", "ifscCode");

-- CreateIndex
CREATE UNIQUE INDEX "family_members_linkedId_key" ON "family_members"("linkedId");

-- CreateIndex
CREATE INDEX "family_members_primaryId_idx" ON "family_members"("primaryId");

-- CreateIndex
CREATE INDEX "family_members_linkedId_idx" ON "family_members"("linkedId");

-- CreateIndex
CREATE INDEX "family_members_status_idx" ON "family_members"("status");

-- CreateIndex
CREATE UNIQUE INDEX "family_members_primaryId_linkedId_key" ON "family_members"("primaryId", "linkedId");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_inviteCode_key" ON "invitations"("inviteCode");

-- CreateIndex
CREATE INDEX "invitations_inviteCode_idx" ON "invitations"("inviteCode");

-- CreateIndex
CREATE INDEX "invitations_invitedPhone_idx" ON "invitations"("invitedPhone");

-- CreateIndex
CREATE INDEX "invitations_status_idx" ON "invitations"("status");

-- CreateIndex
CREATE INDEX "invitations_expiresAt_idx" ON "invitations"("expiresAt");

-- CreateIndex
CREATE INDEX "invitations_createdAt_idx" ON "invitations"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_primaryId_invitedPhone_key" ON "invitations"("primaryId", "invitedPhone");

-- CreateIndex
CREATE INDEX "limit_requests_familyMemberId_idx" ON "limit_requests"("familyMemberId");

-- CreateIndex
CREATE INDEX "limit_requests_status_idx" ON "limit_requests"("status");

-- CreateIndex
CREATE INDEX "limit_requests_createdAt_idx" ON "limit_requests"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transactionId_key" ON "transactions"("transactionId");

-- CreateIndex
CREATE INDEX "transactions_senderId_idx" ON "transactions"("senderId");

-- CreateIndex
CREATE INDEX "transactions_receiverId_idx" ON "transactions"("receiverId");

-- CreateIndex
CREATE INDEX "transactions_transactionId_idx" ON "transactions"("transactionId");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_createdAt_idx" ON "transactions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "recharges_transactionId_key" ON "recharges"("transactionId");

-- CreateIndex
CREATE INDEX "recharges_userId_idx" ON "recharges"("userId");

-- CreateIndex
CREATE INDEX "recharges_type_idx" ON "recharges"("type");

-- CreateIndex
CREATE INDEX "recharges_status_idx" ON "recharges"("status");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "otps_phone_idx" ON "otps"("phone");

-- CreateIndex
CREATE INDEX "otps_code_idx" ON "otps"("code");

-- CreateIndex
CREATE INDEX "otps_expiresAt_idx" ON "otps"("expiresAt");

-- CreateIndex
CREATE INDEX "otps_isUsed_idx" ON "otps"("isUsed");
