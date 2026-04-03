// backend/src/config/redis.ts
import Redis from 'ioredis';
import logger from '../utils/logger';

let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      logger.warn(`Redis reconnecting in ${delay}ms (attempt ${times})`);
      return delay;
    },
    enableReadyCheck: true,
    lazyConnect: true,
  });

  redis.on('connect', () => logger.info('✅ Redis connected'));
  redis.on('ready', () => logger.info('✅ Redis ready'));
  redis.on('error', (err) => logger.error('❌ Redis error:', err));
  redis.on('close', () => logger.warn('⚠️ Redis connection closed'));
  redis.on('reconnecting', () => logger.info('🔄 Redis reconnecting...'));
} else {
  logger.warn('⚠️ REDIS_URL not provided, Redis cache disabled');
}

/**
 * Get Redis client instance
 * @throws Error if Redis not configured
 */
export const getRedis = () => {
  if (!redis) {
    throw new Error('Redis not configured. Please set REDIS_URL environment variable.');
  }
  return redis;
};

/**
 * Check Redis health
 */
export const checkRedisHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> => {
  if (!redis) {
    return { status: 'unhealthy', error: 'Redis not configured' };
  }

  try {
    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;
    return { status: 'healthy', latency };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Gracefully disconnect Redis
 */
export const disconnectRedis = async (): Promise<void> => {
  if (redis) {
    logger.info('🔄 Disconnecting Redis...');
    try {
      await redis.quit();
      logger.info('✅ Redis disconnected');
    } catch (error) {
      logger.error('❌ Error disconnecting Redis:', error);
    }
  }
};

// Handle shutdown signals (these will be overridden by server.ts - kept for standalone usage)
process.on('SIGINT', async () => {
  await disconnectRedis();
});
process.on('SIGTERM', async () => {
  await disconnectRedis();
});

export default redis;