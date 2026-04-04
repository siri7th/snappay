"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const notificationController_1 = __importDefault(require("../controllers/notificationController"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('unreadOnly').optional().isBoolean().toBoolean(),
    (0, express_validator_1.query)('type').optional().isString(),
], validation_1.validate, notificationController_1.default.getNotifications);
router.get('/unread-count', notificationController_1.default.getUnreadCount);
router.get('/stats', notificationController_1.default.getStats);
router.get('/:id', [(0, express_validator_1.param)('id').isString().notEmpty().withMessage('Notification ID is required')], validation_1.validate, notificationController_1.default.getNotificationById);
router.put('/:id/read', [(0, express_validator_1.param)('id').isString().notEmpty().withMessage('Notification ID is required')], validation_1.validate, notificationController_1.default.markAsRead);
router.put('/read-all', notificationController_1.default.markAllAsRead);
router.delete('/:id', [(0, express_validator_1.param)('id').isString().notEmpty().withMessage('Notification ID is required')], validation_1.validate, notificationController_1.default.deleteNotification);
router.delete('/', notificationController_1.default.deleteAllNotifications);
router.get('/preferences', notificationController_1.default.getPreferences);
router.put('/preferences', [
    (0, express_validator_1.body)('email').optional().isBoolean(),
    (0, express_validator_1.body)('sms').optional().isBoolean(),
    (0, express_validator_1.body)('push').optional().isBoolean(),
    (0, express_validator_1.body)('types').optional().isObject(),
], validation_1.validate, notificationController_1.default.updatePreferences);
router.post('/subscribe', [
    (0, express_validator_1.body)('endpoint').isString().notEmpty(),
    (0, express_validator_1.body)('keys').isObject(),
    (0, express_validator_1.body)('keys.auth').isString().notEmpty(),
    (0, express_validator_1.body)('keys.p256dh').isString().notEmpty(),
], validation_1.validate, notificationController_1.default.subscribeToPush);
router.post('/unsubscribe', notificationController_1.default.unsubscribeFromPush);
exports.default = router;
//# sourceMappingURL=notificationRoutes.js.map