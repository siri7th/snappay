// backend/src/config/database.ts
import { PrismaClient, Prisma } from '@prisma/client';
import logger from '../utils/logger';

// Define log levels based on environment with proper Prisma type
const getPrismaLogLevels = (): Prisma.LogLevel[] => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'development') {
    return ['query', 'info', 'warn', 'error'];
  }
  
  if (env === 'test') {
    return ['error'];
  }
  
  // Production
  return ['warn', 'error'];
};

// Prisma client options with proper typing
const prismaClientOptions: Prisma.PrismaClientOptions = {
  log: getPrismaLogLevels(),
  errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
};

// Create Prisma client with enhanced configuration
const prismaClientSingleton = () => {
  const client = new PrismaClient(prismaClientOptions);

  // Middleware for query logging and monitoring
  client.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    const duration = after - before;

    // Log slow queries (over 100ms)
    if (duration > 100) {
      logger.warn(`Slow query detected (${duration}ms): ${params.model}.${params.action}`);
    }

    // Log all queries in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Query executed (${duration}ms): ${params.model}.${params.action}`);
    }

    return result;
  });

  // Handle connection events
  client.$connect()
    .then(() => {
      logger.info('✅ Database connected successfully');
      
      // Log database URL (sanitized)
      const dbUrl = process.env.DATABASE_URL || '';
      const sanitizedUrl = dbUrl.replace(/:[^:@]*@/, ':***@');
      logger.debug(`Database URL: ${sanitizedUrl}`);
    })
    .catch((error) => {
      logger.error('❌ Database connection failed:', error);
      
      // Exit in production if database connection fails
      if (process.env.NODE_ENV === 'production') {
        logger.error('💥 Exiting process due to database connection failure');
        process.exit(1);
      }
    });

  return client;
};

// Global singleton pattern to prevent multiple instances in development
type GlobalThisWithPrisma = typeof globalThis & {
  prisma?: PrismaClient;
};

const globalForPrisma = globalThis as GlobalThisWithPrisma;

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
const disconnectPrisma = async () => {
  logger.info('🔄 Disconnecting database...');
  try {
    await prisma.$disconnect();
    logger.info('✅ Database disconnected');
  } catch (error) {
    logger.error('❌ Error disconnecting database:', error);
  }
};

// Handle shutdown signals (only in main server, not here)
// These are kept but will be overridden by server.ts - that's okay

// Helper function to check database health
export const checkDatabaseHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Helper function to get database statistics
export const getDatabaseStats = async (): Promise<{
  tables?: number;
  connections?: number;
  version?: string;
}> => {
  try {
    // Get database version (works for both PostgreSQL and MySQL)
    let versionResult;
    let tableResult;
    let connResult;

    if (process.env.DATABASE_URL?.includes('postgresql')) {
      // PostgreSQL
      versionResult = await prisma.$queryRaw<[{ version: string }]>`SELECT version()`;
      tableResult = await prisma.$queryRaw<[{ count: string }]>`
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      connResult = await prisma.$queryRaw<[{ count: string }]>`
        SELECT COUNT(*) FROM pg_stat_activity
      `;
    } else {
      // MySQL / SQLite fallback
      versionResult = [{ version: 'Unknown' }];
      tableResult = [{ count: '0' }];
      connResult = [{ count: '0' }];
    }

    const version = versionResult[0]?.version;
    const tables = parseInt(tableResult[0]?.count || '0');
    const connections = parseInt(connResult[0]?.count || '0');

    return {
      version,
      tables,
      connections,
    };
  } catch (error) {
    logger.error('Error getting database stats:', error);
    return {};
  }
};

// Transaction helper with automatic retry
export async function withTransaction<T>(
  fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  options?: {
    maxRetries?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const isolationLevel = options?.isolationLevel;

  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Only pass isolationLevel if it's provided
      if (isolationLevel) {
        return await prisma.$transaction(fn, {
          isolationLevel,
          timeout: 10000, // 10 seconds
        });
      } else {
        return await prisma.$transaction(fn, {
          timeout: 10000, // 10 seconds
        });
      }
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable (deadlock, timeout, etc.)
      const isRetryable = 
        error instanceof Error && (
          error.message.includes('deadlock') ||
          error.message.includes('timeout') ||
          error.message.includes('connection') ||
          (error as any).code === '40001' || // Serialization failure
          (error as any).code === '40P01'    // Deadlock detected
        );
      
      if (!isRetryable || attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      logger.warn(`Retrying transaction (attempt ${attempt + 1}/${maxRetries})`);
    }
  }
  
  throw lastError || new Error('Transaction failed');
}

// Pagination helper
export const paginate = <T,>(
  model: any,
  options: {
    page?: number;
    limit?: number;
    where?: any;
    orderBy?: any;
    include?: any;
    select?: any;
  }
) => {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 10));
  const skip = (page - 1) * limit;

  return {
    skip,
    take: limit,
    where: options.where,
    orderBy: options.orderBy,
    include: options.include,
    select: options.select,
  };
};

// Batch processing helper
export async function batchProcess<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
    
    // Small delay between batches to prevent overwhelming
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

export default prisma;