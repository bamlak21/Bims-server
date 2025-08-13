import { Router } from "express";
import {
  GetNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../controllers/notification.controller.js";
import { AuthMiddleWare } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/notifications/get:
 *   get:
 *     summary: Retrieve a paginated list of notifications for the authenticated user
 *     tags:
 *       - Notifications
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         required: false
 *         description: Page number for pagination (default is 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         required: false
 *         description: Number of notifications to return per page (default is 10)
 *       - in: query
 *         name: read
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         required: false
 *         description: Filter notifications by read status (true for read, false for unread)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A paginated list of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 total:
 *                   type: integer
 *                   example: 25
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 64f1b9e7d8f5a123456789ab
 *                       user_id:
 *                         type: string
 *                         example: 64f1b9e7d8f5a123456789cd
 *                       type:
 *                         type: string
 *                         example: assignment
 *                       message:
 *                         type: string
 *                         example: "Your listing has been assigned to broker John Doe."
 *                       link:
 *                         type: string
 *                         example: "/listings/64f1b9e7d8f5a123456789ab"
 *                       is_read:
 *                         type: boolean
 *                         example: false
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-08-12T10:15:30.000Z"
 *       401:
 *         description: Unauthorized — authentication required
 *       500:
 *         description: Internal server error
 */

router.get("/get", AuthMiddleWare, GetNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags:
 *       - Notifications
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the notification to mark as read
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification marked as read
 *       404:
 *         description: Notification not found for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 *                 error:
 *                   type: string
 */

router.patch("/:id/read", AuthMiddleWare, markNotificationAsRead);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read for the authenticated user
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: All notifications marked as read
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 *                 error:
 *                   type: string
 */
router.patch("/read-all", AuthMiddleWare, markAllNotificationsAsRead);

export default router;
