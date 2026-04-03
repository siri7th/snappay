// backend/src/config/socket.ts
import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

let io: SocketServer | null = null;

/**
 * Initialize Socket.IO server
 */
export const initializeSocket = (server: HttpServer) => {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.token;
      if (!token) {
        throw new Error('No token provided');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      socket.data.user = decoded;
      next();
    } catch (err) {
      logger.warn(`Socket authentication failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    
    if (!user || !user.userId) {
      logger.warn('Socket connected without valid user data');
      socket.disconnect();
      return;
    }

    logger.info(`🔌 User ${user.userId} connected to socket`);

    // Join user's personal room
    socket.join(`user:${user.userId}`);

    // Join primary's room if applicable
    if (user.role === 'PRIMARY') {
      socket.join(`primary:${user.userId}`);
    }

    // Join family room (dynamic)
    socket.on('join-family', (familyId: string) => {
      if (familyId) {
        socket.join(`family:${familyId}`);
        logger.debug(`User ${user.userId} joined family room: ${familyId}`);
      }
    });

    // Leave family room
    socket.on('leave-family', (familyId: string) => {
      if (familyId) {
        socket.leave(`family:${familyId}`);
        logger.debug(`User ${user.userId} left family room: ${familyId}`);
      }
    });

    // Typing indicator (for chat)
    socket.on('typing', (data: { to: string; isTyping: boolean }) => {
      socket.to(`user:${data.to}`).emit('typing', {
        from: user.userId,
        isTyping: data.isTyping,
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`🔌 User ${user.userId} disconnected from socket. Reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${user.userId}:`, error);
    });
  });

  logger.info('✅ Socket.IO initialized');
  return io;
};

/**
 * Get Socket.IO instance
 * @throws Error if socket not initialized
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
};

/**
 * Gracefully close Socket.IO server
 */
export const closeSocket = async (): Promise<void> => {
  if (io) {
    logger.info('🔄 Closing Socket.IO server...');
    await new Promise<void>((resolve) => {
      io?.close(() => {
        logger.info('✅ Socket.IO server closed');
        resolve();
      });
    });
  }
};

// Export for use in other files
export { io };

export default { initializeSocket, getIO, closeSocket };