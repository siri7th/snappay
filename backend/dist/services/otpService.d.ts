declare class OTPService {
    private generateOTP;
    private sendSMS;
    sendOTP(phone: string, purpose?: string, userType?: string): Promise<void>;
    verifyOTP(phone: string, code: string, purpose?: string): Promise<boolean>;
    cleanup(): Promise<void>;
}
declare const _default: OTPService;
export default _default;
//# sourceMappingURL=otpService.d.ts.map