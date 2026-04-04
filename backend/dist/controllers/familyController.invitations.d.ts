import { Request, Response, NextFunction } from 'express';
declare const _default: {
    inviteMember: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    generateInviteCode: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getPendingInvitations: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getInvitationByCode: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    acceptInvitationById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    acceptInvitationByCode: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    rejectInvitation: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    cancelInvitation: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createLimitRequest: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getRequests: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    approveRequest: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    denyRequest: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getPendingAll: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    generateQRCode: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
export default _default;
//# sourceMappingURL=familyController.invitations.d.ts.map