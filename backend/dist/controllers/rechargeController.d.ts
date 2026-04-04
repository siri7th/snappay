import { Request, Response, NextFunction } from 'express';
declare class RechargeController {
    private requireValidPin;
    getPlans(req: Request, res: Response, next: NextFunction): Promise<void>;
    mobileRecharge(req: Request, res: Response, next: NextFunction): Promise<void>;
    electricityBill(req: Request, res: Response, next: NextFunction): Promise<void>;
    fastagRecharge(req: Request, res: Response, next: NextFunction): Promise<void>;
    getHistory(req: Request, res: Response, next: NextFunction): Promise<void>;
    private checkAndUpdateLimits;
    private processRechargePayment;
}
declare const _default: RechargeController;
export default _default;
//# sourceMappingURL=rechargeController.d.ts.map