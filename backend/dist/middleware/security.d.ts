import { Request, Response, NextFunction } from 'express';
export declare const verifyPassword: (userId: string, password: string) => Promise<boolean>;
export declare const requirePasswordVerification: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const verifyOTP: (phone: string, otp: string, purpose: string) => Promise<boolean>;
export declare const requireOTPVerification: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=security.d.ts.map