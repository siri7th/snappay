"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = exports.getDatabaseStats = exports.checkDatabaseHealth = exports.prisma = void 0;
exports.withTransaction = withTransaction;
exports.batchProcess = batchProcess;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const getPrismaLogLevels = () => {
    const env = process.env.NODE_ENV || 'development';
    if (env === 'development') {
        return ['query', 'info', 'warn', 'error'];
    }
    if (env === 'test') {
        return ['error'];
    }
    return ['warn', 'error'];
};
const prismaClientOptions = {
    log: getPrismaLogLevels(),
    errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
};
const prismaClientSingleton = () => {
    const client = new client_1.PrismaClient(prismaClientOptions);
    client.$use(async (params, next) => {
        const before = Date.now();
        const result = await next(params);
        const after = Date.now();
        const duration = after - before;
        if (duration > 100) {
            logger_1.default.warn(`Slow query detected (${duration}ms): ${params.model}.${params.action}`);
        }
        if (process.env.NODE_ENV === 'development') {
            logger_1.default.debug(`Query executed (${duration}ms): ${params.model}.${params.action}`);
        }
        return result;
    });
    client.$connect()
        .then(() => {
        logger_1.default.info('✅ Database connected successfully');
        const dbUrl = process.env.DATABASE_URL || '';
        const sanitizedUrl = dbUrl.replace(/:[^:@]*@/, ':***@');
        logger_1.default.debug(`Database URL: ${sanitizedUrl}`);
    })
        .catch((error) => {
        logger_1.default.error('❌ Database connection failed:', error);
        if (process.env.NODE_ENV === 'production') {
            logger_1.default.error('💥 Exiting process due to database connection failure');
            process.exit(1);
        }
    });
    return client;
};
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ?? prismaClientSingleton();
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
const disconnectPrisma = async () => {
    logger_1.default.info('🔄 Disconnecting database...');
    try {
        await exports.prisma.$disconnect();
        logger_1.default.info('✅ Database disconnected');
    }
    catch (error) {
        logger_1.default.error('❌ Error disconnecting database:', error);
    }
};
const checkDatabaseHealth = async () => {
    try {
        const start = Date.now();
        await exports.prisma.$queryRaw `SELECT 1`;
        const latency = Date.now() - start;
        return {
            status: 'healthy',
            latency,
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};
exports.checkDatabaseHealth = checkDatabaseHealth;
const getDatabaseStats = async () => {
    try {
        let versionResult;
        let tableResult;
        let connResult;
        if (process.env.DATABASE_URL?.includes('postgresql')) {
            versionResult = await exports.prisma.$queryRaw `SELECT version()`;
            tableResult = await exports.prisma.$queryRaw `
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
            connResult = await exports.prisma.$queryRaw `
        SELECT COUNT(*) FROM pg_stat_activity
      `;
        }
        else {
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
    }
    catch (error) {
        logger_1.default.error('Error getting database stats:', error);
        return {};
    }
};
exports.getDatabaseStats = getDatabaseStats;
async function withTransaction(fn, options) {
    const maxRetries = options?.maxRetries ?? 3;
    const isolationLevel = options?.isolationLevel;
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            if (isolationLevel) {
                return await exports.prisma.$transaction(fn, {
                    isolationLevel,
                    timeout: 10000,
                });
            }
            else {
                return await exports.prisma.$transaction(fn, {
                    timeout: 10000,
                });
            }
        }
        catch (error) {
            lastError = error;
            const isRetryable = error instanceof Error && (error.message.includes('deadlock') ||
                error.message.includes('timeout') ||
                error.message.includes('connection') ||
                error.code === '40001' ||
                error.code === '40P01');
            if (!isRetryable || attempt === maxRetries) {
                break;
            }
            const delay = Math.pow(2, attempt) * 100;
            await new Promise(resolve => setTimeout(resolve, delay));
            logger_1.default.warn(`Retrying transaction (attempt ${attempt + 1}/${maxRetries})`);
        }
    }
    throw lastError || new Error('Transaction failed');
}
const paginate = (model, options) => {
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
exports.paginate = paginate;
async function batchProcess(items, batchSize, processor) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await processor(batch);
        results.push(...batchResults);
        if (i + batchSize < items.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    return results;
}
exports.default = exports.prisma;
//# sourceMappingURL=database.js.map