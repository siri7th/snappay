"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.closeSocket = exports.getIO = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../utils/logger"));
let io = null;
exports.io = io;
const initializeSocket = (server) => {
    exports.io = io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true,
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000,
    });
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.token;
            if (!token) {
                throw new Error('No token provided');
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.data.user = decoded;
            next();
        }
        catch (err) {
            logger_1.default.warn(`Socket authentication failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const user = socket.data.user;
        if (!user || !user.userId) {
            logger_1.default.warn('Socket connected without valid user data');
            socket.disconnect();
            return;
        }
        logger_1.default.info(`🔌 User ${user.userId} connected to socket`);
        socket.join(`user:${user.userId}`);
        if (user.role === 'PRIMARY') {
            socket.join(`primary:${user.userId}`);
        }
        socket.on('join-family', (familyId) => {
            if (familyId) {
                socket.join(`family:${familyId}`);
                logger_1.default.debug(`User ${user.userId} joined family room: ${familyId}`);
            }
        });
        socket.on('leave-family', (familyId) => {
            if (familyId) {
                socket.leave(`family:${familyId}`);
                logger_1.default.debug(`User ${user.userId} left family room: ${familyId}`);
            }
        });
        socket.on('typing', (data) => {
            socket.to(`user:${data.to}`).emit('typing', {
                from: user.userId,
                isTyping: data.isTyping,
            });
        });
        socket.on('disconnect', (reason) => {
            logger_1.default.info(`🔌 User ${user.userId} disconnected from socket. Reason: ${reason}`);
        });
        socket.on('error', (error) => {
            logger_1.default.error(`Socket error for user ${user.userId}:`, error);
        });
    });
    logger_1.default.info('✅ Socket.IO initialized');
    return io;
};
exports.initializeSocket = initializeSocket;
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized. Call initializeSocket first.');
    }
    return io;
};
exports.getIO = getIO;
const closeSocket = async () => {
    if (io) {
        logger_1.default.info('🔄 Closing Socket.IO server...');
        await new Promise((resolve) => {
            io?.close(() => {
                logger_1.default.info('✅ Socket.IO server closed');
                resolve();
            });
        });
    }
};
exports.closeSocket = closeSocket;
exports.default = { initializeSocket: exports.initializeSocket, getIO: exports.getIO, closeSocket: exports.closeSocket };
//# sourceMappingURL=socket.js.map