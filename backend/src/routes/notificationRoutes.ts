// routes/notificationRoutes.ts
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import notificationController from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

/**
 * GET /notifications
 * Get all notifications for current user
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('unreadOnly').optional().isBoolean().toBoolean(),
    query('type').optional().isString(),
  ],
  validate,
  notificationController.getNotifications
);

/**
 * GET /notifications/unread-count
 * Get unread notifications count
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * GET /notifications/stats
 * Get notification statistics
 */
router.get('/stats', notificationController.getStats);

/**
 * GET /notifications/:id
 * Get notification by ID
 */
router.get(
  '/:id',
  [param('id').isString().notEmpty().withMessage('Notification ID is required')],
  validate,
  notificationController.getNotificationById
);

/**
 * PUT /notifications/:id/read
 * Mark notification as read
 */
router.put(
  '/:id/read',
  [param('id').isString().notEmpty().withMessage('Notification ID is required')],
  validate,
  notificationController.markAsRead
);

/**
 * PUT /notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', notificationController.markAllAsRead);

/**
 * DELETE /notifications/:id
 * Delete a single notification
 */
router.delete(
  '/:id',
  [param('id').isString().notEmpty().withMessage('Notification ID is required')],
  validate,
  notificationController.deleteNotification
);

/**
 * DELETE /notifications
 * Delete all notifications
 */
router.delete('/', notificationController.deleteAllNotifications);

/**
 * GET /notifications/preferences
 * Get user notification preferences
 */
router.get('/preferences', notificationController.getPreferences);

/**
 * PUT /notifications/preferences
 * Update user notification preferences
 */
router.put(
  '/preferences',
  [
    body('email').optional().isBoolean(),
    body('sms').optional().isBoolean(),
    body('push').optional().isBoolean(),
    body('types').optional().isObject(),
  ],
  validate,
  notificationController.updatePreferences
);

/**
 * POST /notifications/subscribe
 * Subscribe to push notifications
 */
router.post(
  '/subscribe',
  [
    body('endpoint').isString().notEmpty(),
    body('keys').isObject(),
    body('keys.auth').isString().notEmpty(),
    body('keys.p256dh').isString().notEmpty(),
  ],
  validate,
  notificationController.subscribeToPush
);

/**
 * POST /notifications/unsubscribe
 * Unsubscribe from push notifications
 */
router.post('/unsubscribe', notificationController.unsubscribeFromPush);

export default router;