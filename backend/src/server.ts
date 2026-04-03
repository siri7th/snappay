// src/server.ts
import app from './app';
import logger from './utils/logger';
import prisma from './config/database';
import { initializeSocket, closeSocket } from './config/socket';
import { disconnectRedis } from './config/redis';

const PORT = parseInt(process.env.PORT || '5000', 10);

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(`${err.name}: ${err.message}`);
  logger.error(err.stack || '');
  // Exit immediately – state is corrupted
  process.exit(1);
});

let server: any;

const startServer = async () => {
  server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(`🚀 SnapPay server running on port ${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🌐 Server accessible on network: http://<YOUR-IP>:${PORT}`);
    logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  });

  // Initialize Socket.IO
  const io = initializeSocket(server);
  logger.info('✅ Socket.IO initialized');
};

startServer();

// Handle unhandled rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(`${err.name}: ${err.message}`);
  logger.error(err.stack || '');
  // Gracefully close server then exit
  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      await closeSocket();
      await disconnectRedis();
      logger.info('💤 Process terminated');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM received. Shutting down gracefully...');
  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      await closeSocket();
      await disconnectRedis();
      logger.info('💤 Process terminated');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  logger.info('👋 SIGINT received. Shutting down gracefully...');
  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      await closeSocket();
      await disconnectRedis();
      logger.info('💤 Process terminated');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});