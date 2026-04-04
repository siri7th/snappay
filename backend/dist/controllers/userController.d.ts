import { Request, Response, NextFunction } from 'express';
declare class UserController {
    getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void>;
    getUserById(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteUser(req: Request, res: Response, next: NextFunction): Promise<void>;
    getUserStats(req: Request, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: UserController;
export default _default;
//# sourceMappingURL=userController.d.ts.map