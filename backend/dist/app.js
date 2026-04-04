"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const os_1 = __importDefault(require("os"));
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const logger_1 = __importDefault(require("./utils/logger"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const bankRoutes_1 = __importDefault(require("./routes/bankRoutes"));
const walletRoutes_1 = __importDefault(require("./routes/walletRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const familyRoutes_1 = __importDefault(require("./routes/familyRoutes"));
const rechargeRoutes_1 = __importDefault(require("./routes/rechargeRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const invitationRoutes_1 = __importDefault(require("./routes/invitationRoutes"));
const accountRemovalRoutes_1 = __importDefault(require("./routes/accountRemovalRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.get("/", (req, res) => {
    res.send("SnapPay Backend Running 🚀");
});
const getLocalIPs = () => {
    const interfaces = os_1.default.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name] || []) {
            if (net.family === 'IPv4' && !net.internal) {
                ips.push(net.address);
            }
        }
    }
    return ips;
};
const localIPs = getLocalIPs();
logger_1.default.info(`🌐 Local IP addresses: ${localIPs.join(', ') || 'None found'}`);
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
}));
const buildAllowedOrigins = () => {
    const origins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://snappay-three.vercel.app',
        process.env.FRONTEND_URL,
    ].filter(Boolean);
    localIPs.forEach((ip) => {
        origins.push(`http://${ip}:5173`);
        origins.push(`http://${ip}:3000`);
    });
    if (process.env.ALLOWED_ORIGINS) {
        const extraOrigins = process.env.ALLOWED_ORIGINS.split(',');
        origins.push(...extraOrigins);
    }
    return [...new Set(origins)];
};
const allowedOrigins = buildAllowedOrigins();
logger_1.default.info(`🔓 Allowed CORS origins: ${allowedOrigins.join(', ')}`);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        const localIPRegex = /^http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+$/;
        if (localIPRegex.test(origin)) {
            logger_1.default.info(`✅ Allowed network origin: ${origin}`);
            return callback(null, true);
        }
        if (/^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
            return callback(null, true);
        }
        logger_1.default.warn(`🚫 CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'x-user-id',
        'x-device-id',
        'x-session-id',
        'x-client-version',
        'x-platform',
    ],
    exposedHeaders: ['Set-Cookie', 'Authorization'],
    optionsSuccessStatus: 200,
    maxAge: 86400,
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
app.use((0, morgan_1.default)('combined', {
    stream: logger_1.default.stream,
    skip: (req) => req.path === '/health' || req.path === '/api/routes',
}));
app.use('/api', rateLimiter_1.apiLimiter);
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'SnapPay API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        uptime: process.uptime(),
        ip: req.ip,
        hostname: req.hostname,
        localIPs,
    });
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/banks', bankRoutes_1.default);
app.use('/api/wallet', walletRoutes_1.default);
app.use('/api/payments', paymentRoutes_1.default);
app.use('/api/family', familyRoutes_1.default);
app.use('/api/recharge', rechargeRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/invitations', invitationRoutes_1.default);
app.use('/api/account', accountRemovalRoutes_1.default);
if (process.env.NODE_ENV === 'development') {
    app.get('/api/routes', (req, res) => {
        const routes = [];
        const extractRoutes = (stack, basePath = '') => {
            stack.forEach((layer) => {
                if (layer.route) {
                    const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
                    routes.push({ method: methods, path: basePath + layer.route.path });
                }
                else if (layer.name === 'router' && layer.handle.stack) {
                    extractRoutes(layer.handle.stack, basePath + layer.regexp.source.replace('\\/?(?=\\/|$)', '').replace(/\\\//g, '/'));
                }
            });
        };
        extractRoutes(app._router.stack);
        res.status(200).json({
            success: true,
            total: routes.length,
            routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
        });
    });
}
app.all('*', (req, res, next) => {
    next(new errorHandler_1.AppError(`Cannot find ${req.method} ${req.originalUrl} on this server`, 404));
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map