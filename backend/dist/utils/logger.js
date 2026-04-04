"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logsDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};
winston_1.default.addColors(colors);
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'warn';
};
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`));
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.json());
const transports = [
    new winston_1.default.transports.Console({ format: consoleFormat }),
    new winston_1.default.transports.File({
        filename: path_1.default.join(logsDir, 'error.log'),
        level: 'error',
        format: fileFormat,
        maxsize: 5242880,
        maxFiles: 5,
    }),
    new winston_1.default.transports.File({
        filename: path_1.default.join(logsDir, 'combined.log'),
        format: fileFormat,
        maxsize: 5242880,
        maxFiles: 5,
    }),
];
if (process.env.NODE_ENV === 'development') {
    transports.push(new winston_1.default.transports.File({
        filename: path_1.default.join(logsDir, 'http.log'),
        level: 'http',
        format: fileFormat,
        maxsize: 5242880,
        maxFiles: 3,
    }));
}
const winstonLogger = winston_1.default.createLogger({
    level: level(),
    levels,
    transports,
    exitOnError: false,
});
exports.logger = {
    info: (message, meta) => {
        if (meta)
            winstonLogger.info(message, meta);
        else
            winstonLogger.info(message);
    },
    error: (message, meta) => {
        if (meta)
            winstonLogger.error(message, meta);
        else
            winstonLogger.error(message);
    },
    warn: (message, meta) => {
        if (meta)
            winstonLogger.warn(message, meta);
        else
            winstonLogger.warn(message);
    },
    debug: (message, meta) => {
        if (meta)
            winstonLogger.debug(message, meta);
        else
            winstonLogger.debug(message);
    },
    http: (message, meta) => {
        if (meta)
            winstonLogger.http(message, meta);
        else
            winstonLogger.http(message);
    },
    child: (bindings) => {
        const childLogger = winstonLogger.child(bindings);
        return {
            info: (message, meta) => childLogger.info(message, meta),
            error: (message, meta) => childLogger.error(message, meta),
            warn: (message, meta) => childLogger.warn(message, meta),
            debug: (message, meta) => childLogger.debug(message, meta),
            http: (message, meta) => childLogger.http(message, meta),
        };
    },
    getWinstonLogger: () => winstonLogger,
    stream: {
        write: (message) => {
            exports.logger.http(message.trim());
        },
    },
};
process.on('unhandledRejection', (reason, promise) => {
    exports.logger.error('Unhandled Rejection at:', promise);
    exports.logger.error('Reason:', reason);
});
process.on('uncaughtException', (error) => {
    exports.logger.error('Uncaught Exception:', error);
});
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map