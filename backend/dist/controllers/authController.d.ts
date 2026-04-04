import { Request, Response, NextFunction } from 'express';
declare class AuthController {
    sendOTP(req: Request, res: Response, next: NextFunction): Promise<void>;
    verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void>;
    getMe(req: Request, res: Response, next: NextFunction): Promise<void>;
    setPin(req: Request, res: Response, next: NextFunction): Promise<void>;
    forgotPinSendOtp(req: Request, res: Response, next: NextFunction): Promise<void>;
    forgotPinVerify(req: Request, res: Response, next: NextFunction): Promise<void>;
    logout(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
    changePin(req: Request, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: AuthController;
export default _default;
//# sourceMappingURL=authController.d.ts.map