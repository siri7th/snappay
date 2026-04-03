// src/services/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Initialize socket connection
 */
export const initializeSocket = (token: string) => {
  if (socket) return socket;
  
  socket = io(import.meta.env.VITE_SOCKET_URL || 'https://snappay-backend.onrender.com', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  
  return socket;
};

/**
 * Get socket instance
 */
export const getSocket = () => {
  if (!socket) throw new Error('Socket not initialized');
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Socket events (aligned with backend)
 */
export const socketEvents = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  ERROR: 'error',
  
  JOIN_USER: 'join-user',
  JOIN_PRIMARY: 'join-primary',
  JOIN_FAMILY: 'join-family',
  
  NOTIFICATION: 'notification',
  
  PAYMENT_RECEIVED: 'payment-received',
  PAYMENT_SUCCESS: 'payment-success',
  PAYMENT_FAILED: 'payment-failed',
  TRANSACTION_UPDATE: 'transaction:update',
  
  LIMIT_UPDATED: 'limit-updated',
  LIMIT_REQUEST: 'limit-request',
  REQUEST_APPROVED: 'request-approved',
  REQUEST_DENIED: 'request-denied',
  
  FAMILY_MEMBER_ADDED: 'family:member-added',
  FAMILY_MEMBER_REMOVED: 'family:member-removed',
  
  INVITATION_RECEIVED: 'invitation:received',
  INVITATION_ACCEPTED: 'invitation:accepted',
  
  RECHARGE_COMPLETED: 'recharge:completed',
  RECHARGE_FAILED: 'recharge:failed',
  
  TYPING: 'typing',
  MESSAGE: 'message',
} as const;

export default { initializeSocket, getSocket, disconnectSocket, socketEvents };