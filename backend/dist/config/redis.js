"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectRedis = exports.checkRedisHealth = exports.getRedis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = __importDefault(require("../utils/logger"));
let redis = null;
if (process.env.REDIS_URL) {
    redis = new ioredis_1.default(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            logger_1.default.warn(`Redis reconnecting in ${delay}ms (attempt ${times})`);
            return delay;
        },
        enableReadyCheck: true,
        lazyConnect: true,
    });
    redis.on('connect', () => logger_1.default.info('✅ Redis connected'));
    redis.on('ready', () => logger_1.default.info('✅ Redis ready'));
    redis.on('error', (err) => logger_1.default.error('❌ Redis error:', err));
    redis.on('close', () => logger_1.default.warn('⚠️ Redis connection closed'));
    redis.on('reconnecting', () => logger_1.default.info('🔄 Redis reconnecting...'));
}
else {
    logger_1.default.warn('⚠️ REDIS_URL not provided, Redis cache disabled');
}
const getRedis = () => {
    if (!redis) {
        throw new Error('Redis not configured. Please set REDIS_URL environment variable.');
    }
    return redis;
};
exports.getRedis = getRedis;
const checkRedisHealth = async () => {
    if (!redis) {
        return { status: 'unhealthy', error: 'Redis not configured' };
    }
    try {
        const start = Date.now();
        await redis.ping();
        const latency = Date.now() - start;
        return { status: 'healthy', latency };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};
exports.checkRedisHealth = checkRedisHealth;
const disconnectRedis = async () => {
    if (redis) {
        logger_1.default.info('🔄 Disconnecting Redis...');
        try {
            await redis.quit();
            logger_1.default.info('✅ Redis disconnected');
        }
        catch (error) {
            logger_1.default.error('❌ Error disconnecting Redis:', error);
        }
    }
};
exports.disconnectRedis = disconnectRedis;
process.on('SIGINT', async () => {
    await (0, exports.disconnectRedis)();
});
process.on('SIGTERM', async () => {
    await (0, exports.disconnectRedis)();
});
exports.default = redis;
//# sourceMappingURL=redis.js.map