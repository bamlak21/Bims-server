import { Router } from "express";
import { GetChatRooms } from "../controllers/chat.controller.js";

const router = Router();

/**
 * @swagger
 * /api/chat/chat-rooms/{userId}:
 *   get:
 *     summary: Get all chat rooms for a user
 *     description: Returns a list of chat rooms the user participates in, with the most recent message from each.
 *     tags:
 *       - ChatRooms
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: Successfully fetched chat rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChatRoom'
 *       400:
 *         description: Invalid or missing userId
 *       500:
 *         description: Server error
 */

router.get("/chat-rooms/:userId", GetChatRooms);

export default router;
