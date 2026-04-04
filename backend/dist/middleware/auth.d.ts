import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                phone: string;
                role: string;
                name?: string | null;
                email?: string | null;
            };
        }
    }
}
export declare const generateToken: (user: {
    id: string;
    phone: string;
    role: string;
}) => string;
export declare const generateRefreshToken: (id: string) => string;
export declare const verifyToken: (token: string) => any;
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requirePrimary: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireLinked: (req: Request, res: Response, next: NextFunction) => void;
export declare const optionalAuthenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const setTokenCookie: (res: Response, token: string) => void;
export declare const clearTokenCookie: (res: Response) => void;
//# sourceMappingURL=auth.d.ts.map