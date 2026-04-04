export declare class AuthService {
    generateToken(userId: string, phone: string, role: string): string;
    generateRefreshToken(userId: string): string;
    hashPin(pin: string): Promise<string>;
    verifyPin(pin: string, hash: string): Promise<boolean>;
    validateUserAccess(userId: string): Promise<boolean>;
    refreshToken(oldToken: string): Promise<string>;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=authService.d.ts.map