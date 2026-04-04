import { Request, Response, NextFunction } from 'express';
declare class WalletController {
    getBalance(req: Request, res: Response, next: NextFunction): Promise<void>;
    getMemberWalletBalance(req: Request, res: Response, next: NextFunction): Promise<void>;
    getAllMemberBalances(req: Request, res: Response, next: NextFunction): Promise<void>;
    addMoney(req: Request, res: Response, next: NextFunction): Promise<void>;
    withdrawMoney(req: Request, res: Response, next: NextFunction): Promise<void>;
    getTransactions(req: Request, res: Response, next: NextFunction): Promise<void>;
    getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void>;
    getWalletStats(req: Request, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: WalletController;
export default _default;
//# sourceMappingURL=walletController.d.ts.map