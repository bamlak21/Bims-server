import { Router } from "express";
import {
  getUserStats,
  getAllUsers,
  getCurrentUserProfile,
  UpdateUserProfile,
  deactivateUser,
} from "../controllers/user.controller.js";
const router = Router();

router.get("/numUser", getUserStats);
router.get("/userStats", getAllUsers);
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

router.patch("/deactivate/:id", deactivateUser);

export default router;
