// src/app.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import os from 'os';

// Import middleware
import { errorHandler, AppError } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import logger from './utils/logger';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import bankRoutes from './routes/bankRoutes';
import walletRoutes from './routes/walletRoutes';
import paymentRoutes from './routes/paymentRoutes';
import familyRoutes from './routes/familyRoutes';
import rechargeRoutes from './routes/rechargeRoutes';
import notificationRoutes from './routes/notificationRoutes';
import invitationRoutes from './routes/invitationRoutes';
import accountRemovalRoutes from './routes/accountRemovalRoutes';

dotenv.config();

const app: Application = express();

app.get("/", (req, res) => {
  res.send("SnapPay Backend Running 🚀");
});

// Get local network IP addresses
const getLocalIPs = (): string[] => {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
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
logger.info(`🌐 Local IP addresses: ${localIPs.join(', ') || 'None found'}`);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// Build allowed origins
const buildAllowedOrigins = (): string[] => {
  const origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

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
logger.info(`🔓 Allowed CORS origins: ${allowedOrigins.join(', ')}`);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow local network IPs with any port
      const localIPRegex = /^http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+$/;
      if (localIPRegex.test(origin)) {
        logger.info(`✅ Allowed network origin: ${origin}`);
        return callback(null, true);
      }
      if (/^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
        return callback(null, true);
      }
      logger.warn(`🚫 CORS blocked origin: ${origin}`);
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
  })
);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
app.use(
  morgan('combined', {
    stream: logger.stream,
    skip: (req) => req.path === '/health' || req.path === '/api/routes',
  })
);

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/recharge', rechargeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/account', accountRemovalRoutes);

// Debug route (development only)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/routes', (req: Request, res: Response) => {
    const routes: Array<{ method: string; path: string }> = [];
    const extractRoutes = (stack: any, basePath = '') => {
      stack.forEach((layer: any) => {
        if (layer.route) {
          const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
          routes.push({ method: methods, path: basePath + layer.route.path });
        } else if (layer.name === 'router' && layer.handle.stack) {
          extractRoutes(
            layer.handle.stack,
            basePath + layer.regexp.source.replace('\\/?(?=\\/|$)', '').replace(/\\\//g, '/')
          );
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

// 404 handler
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server`, 404));
});

// Global error handler
app.use(errorHandler);

export default app;