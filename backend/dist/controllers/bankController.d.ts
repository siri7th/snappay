import { Request, Response, NextFunction } from 'express';
declare class BankController {
    getUserBanks(req: Request, res: Response, next: NextFunction): Promise<void>;
    getBankById(req: Request, res: Response, next: NextFunction): Promise<void>;
    addBankAccount(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateBankAccount(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteBankAccount(req: Request, res: Response, next: NextFunction): Promise<void>;
    verifyBankAccount(req: Request, res: Response, next: NextFunction): Promise<void>;
    getBankTransactions(req: Request, res: Response, next: NextFunction): Promise<void>;
    setDefaultBank(req: Request, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: BankController;
export default _default;
//# sourceMappingURL=bankController.d.ts.map