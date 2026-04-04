import { Request, Response, NextFunction } from 'express';
declare class PaymentController {
    private static requireValidPin;
    sendToMobile(req: Request, res: Response, next: NextFunction): Promise<void>;
    sendToBank(req: Request, res: Response, next: NextFunction): Promise<void>;
    processQRPayment(req: Request, res: Response, next: NextFunction): Promise<void>;
    getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void>;
    requestMoney(req: Request, res: Response, next: NextFunction): Promise<void>;
    static checkAndUpdateLimitsTx(tx: any, linkedUserId: string, amount: number): Promise<void>;
}
declare const _default: PaymentController;
export default _default;
//# sourceMappingURL=paymentController.d.ts.map