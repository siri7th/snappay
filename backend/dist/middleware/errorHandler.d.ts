import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode: number);
}
export declare const errorHandler: (err: Error | AppError | Prisma.PrismaClientKnownRequestError, req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map