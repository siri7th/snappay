// src/services/api/family.ts
import apiClient from './client';

export interface InviteMemberRequest {
  phone: string;
  relationship?: string;
  dailyLimit?: number;
  monthlyLimit?: number;
  perTransactionLimit?: number;
}

export interface UpdateLimitsRequest {
  dailyLimit?: number;
  monthlyLimit?: number;
  perTransactionLimit?: number;
  permissions?: any;
}

export interface AddToLimitRequest {
  amount: number;
}

export interface ConnectToPrimaryRequest {
  method: 'code' | 'manual' | 'qr';
  code?: string;
  phone?: string;
  qrData?: string;
}

export interface AcceptInviteRequest {
  inviteCode: string;
  phone: string;
}

export interface AcceptInvitationByCodeRequest {
  inviteCode: string;
}

export interface DisconnectFromPrimaryRequest {
  password: string;
  otp: string;
  transferBalance: boolean;
}

export interface CreateLimitRequest {
  amount: number;
  reason?: string;
  duration?: 'today' | 'week' | 'permanent' | 'month';
}

export const familyAPI = {
  // ========== PRIMARY USER ROUTES ==========
  
  /**
   * Get all family members for primary user
   */
  getFamilyMembers: () => apiClient.get('/family'),
  
  /**
   * Get specific family member by ID
   */
  getMemberById: (id: string) => apiClient.get(`/family/${id}`),
  
  /**
   * Invite a new family member via phone
   */
  inviteMember: (data: InviteMemberRequest) => apiClient.post('/family/invite', data),
  
  /**
   * Generate QR code for family linking
   */
  generateQR: () => apiClient.get('/family/qr'),
  
  /**
   * Generate invite code for family linking
   */
  generateInviteCode: () => apiClient.post('/family/generate-invite'),
  
  /**
   * Update member limits
   */
  updateLimits: (memberId: string, data: UpdateLimitsRequest) =>
    apiClient.put(`/family/${memberId}/limits`, data),
  
  /**
   * Add money to member's daily limit
   */
  addToLimit: (memberId: string, data: AddToLimitRequest) =>
    apiClient.post(`/family/${memberId}/add-limit`, data),
  
  /**
   * Update member status (ACTIVE, PAUSED, etc.)
   */
  updateMemberStatus: (memberId: string, status: string) =>
    apiClient.put(`/family/${memberId}/status`, { status }),
  
  /**
   * Pause a family member
   */
  pauseMember: (memberId: string) => apiClient.post(`/family/${memberId}/pause`),
  
  /**
   * Resume a paused family member
   */
  resumeMember: (memberId: string) => apiClient.post(`/family/${memberId}/resume`),
  
  /**
   * Remove a family member
   */
  removeMember: (memberId: string) => apiClient.delete(`/family/${memberId}`),

  /**
   * Get member's transaction history
   */
  getMemberTransactions: (memberId: string, params?: { page?: number; limit?: number; from?: string; to?: string; type?: string }) =>
    apiClient.get(`/family/${memberId}/transactions`, { params }),

  // ========== INVITATION ROUTES ==========
  
  /**
   * Get all pending invitations for the current user
   */
  getPendingInvitations: () => apiClient.get('/family/invitations/pending'),
  
  /**
   * Get invitation details by code
   */
  getInvitationByCode: (code: string) => apiClient.get(`/family/invitations/code/${code}`),

  /**
   * Get invitation by ID
   */
  getInvitationById: (invitationId: string) => apiClient.get(`/family/invitations/${invitationId}`),

  /**
   * Accept connection request (primary user accepts linked user's request)
   */
  acceptConnectionRequest: (invitationId: string) => 
    apiClient.post(`/family/requests/${invitationId}/accept`),

  /**
   * Accept an invitation by ID (for linked user)
   */
  acceptInvitation: (invitationId: string) => 
    apiClient.post(`/family/invitations/${invitationId}/accept`),
  
  /**
   * Accept an invitation by code (for linked user)
   */
  acceptInvitationByCode: (data: AcceptInvitationByCodeRequest) => 
    apiClient.post('/family/invitations/accept', data),
  
  /**
   * Reject an invitation by ID (for invited user)
   */
  rejectInvitation: (invitationId: string) => 
    apiClient.post(`/family/invitations/${invitationId}/reject`),
  
  /**
   * Cancel an invitation (primary only - cancels sent invitation)
   */
  cancelInvitation: (invitationId: string) => 
    apiClient.post(`/family/invitations/${invitationId}/cancel`),

  // ========== LINKED USER ROUTES ==========
  
  /**
   * Accept a family invitation (legacy method - uses invite code and phone)
   */
  acceptInvite: (data: AcceptInviteRequest) => apiClient.post('/family/accept', data),
  
  /**
   * Connect to a primary account (for linked users)
   */
  connectToPrimary: (data: ConnectToPrimaryRequest) => apiClient.post('/family/connect', data),

  /**
   * Disconnect from primary account (linked user)
   * Requires password and OTP verification
   */
  disconnectFromPrimary: (data: DisconnectFromPrimaryRequest) => 
    apiClient.post('/account/disconnect', data),

  /**
   * Request OTP for disconnection (linked user)
   */
  requestDisconnectOTP: () => apiClient.post('/account/request-otp'),

  /**
   * Get removal summary (preview of what will happen)
   */
  getRemovalSummary: (memberId?: string) => 
    apiClient.get(`/account/summary${memberId ? `/${memberId}` : ''}`),

  /**
   * Get primary account details for linked user
   */
  getMyPrimaryDetails: () => apiClient.get('/family/my-primary'),
  
  /**
   * Get spending limits for linked user
   */
  getMyLimits: () => apiClient.get('/family/me/limits'),
  
  // ========== LIMIT REQUEST ROUTES ==========
  
  /**
   * Create a limit increase request (linked user)
   */
  createLimitRequest: (data: CreateLimitRequest) => apiClient.post('/family/requests', data),
  
  /**
   * Get all limit requests
   */
  getRequests: (params?: { status?: 'PENDING' | 'APPROVED' | 'DENIED' }) => 
    apiClient.get('/family/requests', { params }),
  
  /**
   * Approve a limit request (primary only)
   */
  approveRequest: (requestId: string) => 
    apiClient.put(`/family/requests/${requestId}/approve`),
  
  /**
   * Deny a limit request (primary only)
   */
  denyRequest: (requestId: string) => 
    apiClient.put(`/family/requests/${requestId}/deny`),
  
  // ========== BULK OPERATIONS ==========
  
  /**
   * Get all pending items (invitations and limit requests) in one call
   */
  getPendingAll: () => apiClient.get('/family/pending-all'),
};

export default familyAPI;