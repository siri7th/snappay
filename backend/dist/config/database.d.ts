import { PrismaClient, Prisma } from '@prisma/client';
export declare const prisma: PrismaClient<Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare const checkDatabaseHealth: () => Promise<{
    status: "healthy" | "unhealthy";
    latency?: number;
    error?: string;
}>;
export declare const getDatabaseStats: () => Promise<{
    tables?: number;
    connections?: number;
    version?: string;
}>;
export declare function withTransaction<T>(fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>, options?: {
    maxRetries?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
}): Promise<T>;
export declare const paginate: <T>(model: any, options: {
    page?: number;
    limit?: number;
    where?: any;
    orderBy?: any;
    include?: any;
    select?: any;
}) => {
    skip: number;
    take: number;
    where: any;
    orderBy: any;
    include: any;
    select: any;
};
export declare function batchProcess<T, R>(items: T[], batchSize: number, processor: (batch: T[]) => Promise<R[]>): Promise<R[]>;
export default prisma;
//# sourceMappingURL=database.d.ts.map