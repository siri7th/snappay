"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.getIO = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
let io = null;
exports.io = io;
const initializeSocket = (server) => {
    exports.io = io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true,
        },
    });
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token)
                throw new Error('Authentication required');
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.data.user = decoded;
            next();
        }
        catch (err) {
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
exports.initializeSocket = initializeSocket;
const getIO = () => {
    if (!io)
        throw new Error('Socket.io not initialized');
    return io;
};
exports.getIO = getIO;
//# sourceMappingURL=socketService.js.map