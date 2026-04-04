"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const userController_1 = __importDefault(require("../controllers/userController"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', auth_1.requirePrimary, [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('role').optional().isIn(['PRIMARY', 'LINKED']),
    (0, express_validator_1.query)('status').optional().isIn(['ACTIVE', 'PAUSED', 'BLOCKED', 'PENDING']),
], validation_1.validate, userController_1.default.getAllUsers);
router.get('/stats', auth_1.requirePrimary, userController_1.default.getUserStats);
router.get('/:id', [(0, express_validator_1.param)('id').isString().notEmpty().withMessage('User ID is required')], validation_1.validate, userController_1.default.getUserById);
router.put('/:id/status', auth_1.requirePrimary, [
    (0, express_validator_1.param)('id').isString().notEmpty(),
    (0, express_validator_1.query)('status').isIn(['ACTIVE', 'PAUSED', 'BLOCKED']).withMessage('Invalid status'),
], validation_1.validate, userController_1.default.updateUserStatus);
router.delete('/:id', auth_1.requirePrimary, [(0, express_validator_1.param)('id').isString().notEmpty()], validation_1.validate, userController_1.default.deleteUser);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map