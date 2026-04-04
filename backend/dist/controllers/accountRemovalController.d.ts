import { Request, Response, NextFunction } from 'express';
declare class AccountRemovalController {
    removeFamilyMember(req: Request, res: Response, next: NextFunction): Promise<void>;
    disconnectFromPrimary(req: Request, res: Response, next: NextFunction): Promise<void>;
    getRemovalSummary(req: Request, res: Response, next: NextFunction): Promise<void>;
    requestDisconnectOTP(req: Request, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: AccountRemovalController;
export default _default;
//# sourceMappingURL=accountRemovalController.d.ts.map