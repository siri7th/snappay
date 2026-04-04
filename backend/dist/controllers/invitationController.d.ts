import { Request, Response, NextFunction } from 'express';
declare class InvitationController {
    createInvitation(req: Request, res: Response, next: NextFunction): Promise<void>;
    getPendingInvitations(req: Request, res: Response, next: NextFunction): Promise<void>;
    acceptInvitation(req: Request, res: Response, next: NextFunction): Promise<void>;
    rejectInvitation(req: Request, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: InvitationController;
export default _default;
//# sourceMappingURL=invitationController.d.ts.map