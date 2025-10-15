import { Router } from "express";
import {
  GetChatRooms,
  GetMessagesForChat,
} from "../controllers/chat.controller.js";

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

/**
 * @swagger
 * /api/chat/chat-rooms/messages/{roomId}:
 *   get:
 *     summary: Get all messages in a chat room
 *     description: Retrieves all messages for a given chat room by its room ID.
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         description: The unique ID of the chat room.
 *         schema:
 *           type: string
 *           example: "68b17d7f3143238c63aec58b"
 *     responses:
 *       200:
 *         description: Successfully fetched messages for the given room.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Success"
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "68f33d7b31a1238c63aec58a"
 *                       roomId:
 *                         type: string
 *                         example: "68b17d7f3143238c63aec58b"
 *                       senderId:
 *                         type: string
 *                         example: "68a033b95f1ef89a9f29cb14"
 *                       message:
 *                         type: string
 *                         example: "Hi, is the property still available?"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-15T09:45:00.000Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-15T09:46:00.000Z"
 *       400:
 *         description: Missing required fields (roomId not provided)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing required fields"
 *       500:
 *         description: Internal server error when fetching messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server Error"
 */

router.get("/chat-rooms/messages/:roomId", GetMessagesForChat);

export default router;
