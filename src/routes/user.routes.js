import { Router } from "express";
import {
  getUserStats,
  getAllUsers,
  getCurrentUserProfile,
  UpdateUserProfile,
  deactivateUser,
  fetchAllUsers,
} from "../controllers/user.controller.js";
const router = Router();

// router.get("/userStats", getAllUsers);
router.get("/profile/:id", getCurrentUserProfile);

/**
 * @swagger
 * /api/user/update:
 *   patch:
 *     summary: Update user profile
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 description: The ID of the user to update
 *                 example: 64f1b9e7d8f5a123456789ab
 *               firstName:
 *                 type: string
 *                 description: User's first name
 *                 example: john
 *               lastName:
 *                 type: string
 *                 description: User's last name
 *                 example: doe
 *               email:
 *                 type: string
 *                 description: User's email address
 *                 example: john.doe@example.com
 *               phoneNumber:
 *                 type: string
 *                 description: User's phone number
 *                 example: +251911223344
 *               socialLinks:
 *                 type: object
 *                 description: User's social links (optional)
 *                 properties:
 *                   facebook:
 *                     type: string
 *                     example: https://facebook.com/johndoe
 *                   twitter:
 *                     type: string
 *                     example: https://twitter.com/johndoe
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Optional profile image file
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 user:
 *                   type: object
 *                   description: The updated user object
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server Error
 */

router.patch("/update", UpdateUserProfile);

/**
 * @swagger
 * /api/user/getall:
 *   get:
 *     summary: Fetch all users
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: A list of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: 64f1b9e7d8f5a123456789ab
 *                   firstName:
 *                     type: string
 *                     example: john
 *                   lastName:
 *                     type: string
 *                     example: doe
 *                   email:
 *                     type: string
 *                     example: john.doe@example.com
 *                   phoneNumber:
 *                     type: string
 *                     example: +251911223344
 *                   profileImage:
 *                     type: string
 *                     example: uploads/profile/john.jpg
 *                   socialLinks:
 *                     type: object
 *                     properties:
 *                       facebook:
 *                         type: string
 *                         example: https://facebook.com/johndoe
 *                       twitter:
 *                         type: string
 *                         example: https://twitter.com/johndoe
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal Server Error
 */

router.get("/getall", fetchAllUsers);

/**
 * @swagger
 * /api/user/userstats:
 *   get:
 *     summary: Get user statistics (brokers, clients, owners)
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: Successfully retrieved user statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                   example: 150
 *                 pendingBrokers:
 *                   type: integer
 *                   example: 10
 *                 verifiedBrokers:
 *                   type: integer
 *                   example: 25
 *                 totalClients:
 *                   type: integer
 *                   example: 80
 *                 totalOwners:
 *                   type: integer
 *                   example: 35
 *       500:
 *         description: Server error while fetching user statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 */

router.get("/userstats", getUserStats);

/**
 * @swagger
 * /api/user/deactivate/{id}:
 *   patch:
 *     summary: Deactivate or activate a user
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to update
 *         example: 64f1b9e7d8f5a123456789ab
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: User activation status
 *                 example: false
 *     responses:
 *       200:
 *         description: User activation status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deactivated successfully
 *                 user:
 *                   type: object
 *                   description: The updated user object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 64f1b9e7d8f5a123456789ab
 *                     firstName:
 *                       type: string
 *                       example: john
 *                     lastName:
 *                       type: string
 *                       example: doe
 *                     email:
 *                       type: string
 *                       example: john.doe@example.com
 *                     isActive:
 *                       type: boolean
 *                       example: false
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Server error while deactivating user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error while deactivating user
 */

router.patch("/deactivate/:id", deactivateUser);

export default router;
