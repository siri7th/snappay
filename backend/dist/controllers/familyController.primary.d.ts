import { Request, Response, NextFunction } from 'express';
declare const _default: {
    getFamilyMembers: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getMemberById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateLimits: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    addToLimit: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    pauseMember: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    resumeMember: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    removeMember: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getMemberTransactions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
export default _default;
//# sourceMappingURL=familyController.primary.d.ts.map