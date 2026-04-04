"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const invitationController_1 = __importDefault(require("../controllers/invitationController"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', auth_1.requirePrimary, [
    (0, express_validator_1.body)('phone').matches(/^[0-9]{10}$/),
    (0, express_validator_1.body)('relationship').optional().isString(),
    (0, express_validator_1.body)('dailyLimit').optional().isFloat({ min: 1 }),
    (0, express_validator_1.body)('monthlyLimit').optional().isFloat({ min: 1 }),
    (0, express_validator_1.body)('perTransactionLimit').optional().isFloat({ min: 1 }),
], validation_1.validate, invitationController_1.default.createInvitation);
router.get('/pending', invitationController_1.default.getPendingInvitations);
router.post('/:invitationId/accept', [(0, express_validator_1.param)('invitationId').isString().notEmpty()], validation_1.validate, invitationController_1.default.acceptInvitation);
router.post('/:invitationId/reject', [(0, express_validator_1.param)('invitationId').isString().notEmpty()], validation_1.validate, invitationController_1.default.rejectInvitation);
exports.default = router;
//# sourceMappingURL=invitationRoutes.js.map