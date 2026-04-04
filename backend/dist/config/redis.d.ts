import Redis from 'ioredis';
declare let redis: Redis | null;
export declare const getRedis: () => Redis;
export declare const checkRedisHealth: () => Promise<{
    status: "healthy" | "unhealthy";
    latency?: number;
    error?: string;
}>;
export declare const disconnectRedis: () => Promise<void>;
export default redis;
//# sourceMappingURL=redis.d.ts.map