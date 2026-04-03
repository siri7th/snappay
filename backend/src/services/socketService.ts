// socketService.ts
import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

let io: SocketServer | null = null;

export const initializeSocket = (server: HttpServer) => {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) throw new Error('Authentication required');

      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.userId;
    socket.join(`user:${userId}`);
    console.log(`User ${userId} connected`);

    if (socket.data.user.role === 'PRIMARY') {
      socket.join(`primary:${userId}`);
    }

    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
    });

    socket.on('typing', (data) => {
      socket.to(`user:${data.to}`).emit('typing', data);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

export { io };
