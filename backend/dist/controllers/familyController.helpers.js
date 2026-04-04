"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetMemberLimits = resetMemberLimits;
const database_1 = __importDefault(require("../config/database"));
async function resetMemberLimits(primaryId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    await database_1.default.$transaction(async (tx) => {
        await tx.familyMember.updateMany({
            where: {
                primaryId,
                lastResetDate: { lt: today },
            },
            data: {
                dailySpent: 0,
                lastResetDate: today,
            },
        });
        await tx.familyMember.updateMany({
            where: {
                primaryId,
                lastResetDate: { lt: firstDayOfMonth },
            },
            data: {
                monthlySpent: 0,
                lastResetDate: today,
            },
        });
    });
}
//# sourceMappingURL=familyController.helpers.js.map