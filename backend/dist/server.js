"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const logger_1 = __importDefault(require("./utils/logger"));
const database_1 = __importDefault(require("./config/database"));
const socket_1 = require("./config/socket");
const redis_1 = require("./config/redis");
const PORT = parseInt(process.env.PORT || '5000', 10);
process.on('uncaughtException', (err) => {
    logger_1.default.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    logger_1.default.error(`${err.name}: ${err.message}`);
    logger_1.default.error(err.stack || '');
    process.exit(1);
});
let server;
const startServer = async () => {
    server = app_1.default.listen(PORT, "0.0.0.0", () => {
        logger_1.default.info(`🚀 SnapPay server running on port ${PORT}`);
        logger_1.default.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger_1.default.info(`🌐 Server accessible on network: http://<YOUR-IP>:${PORT}`);
        logger_1.default.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });
    const io = (0, socket_1.initializeSocket)(server);
    logger_1.default.info('✅ Socket.IO initialized');
};
startServer();
process.on('unhandledRejection', (err) => {
    logger_1.default.error('UNHANDLED REJECTION! 💥 Shutting down...');
    logger_1.default.error(`${err.name}: ${err.message}`);
    logger_1.default.error(err.stack || '');
    if (server) {
        server.close(async () => {
            await database_1.default.$disconnect();
            await (0, socket_1.closeSocket)();
            await (0, redis_1.disconnectRedis)();
            logger_1.default.info('💤 Process terminated');
            process.exit(1);
        });
    }
    else {
        process.exit(1);
    }
});
process.on('SIGTERM', () => {
    logger_1.default.info('👋 SIGTERM received. Shutting down gracefully...');
    if (server) {
        server.close(async () => {
            await database_1.default.$disconnect();
            await (0, socket_1.closeSocket)();
            await (0, redis_1.disconnectRedis)();
            logger_1.default.info('💤 Process terminated');
            process.exit(0);
        });
    }
    else {
        process.exit(0);
    }
});
process.on('SIGINT', () => {
    logger_1.default.info('👋 SIGINT received. Shutting down gracefully...');
    if (server) {
        server.close(async () => {
            await database_1.default.$disconnect();
            await (0, socket_1.closeSocket)();
            await (0, redis_1.disconnectRedis)();
            logger_1.default.info('💤 Process terminated');
            process.exit(0);
        });
    }
    else {
        process.exit(0);
    }
});
//# sourceMappingURL=server.js.map