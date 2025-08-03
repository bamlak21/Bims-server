import { Router } from "express";
import {
  Login,
  Register,
  AdminLogin,
  getUserStats,
  //   fetchListing,
  //   fetchDetailListing,
  getAllUsers,
  verifyUser,
  //   fetchAllUsers,
  //   getCurrentUserProfile,
  //   getVerifiedBrokers,
  //   submitListing,
  //   updateUserProfile,
  deactivateUser,
} from "../controllers/auth.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - userType
 *               - phoneNumber
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: johndoe@example.com
 *               userType:
 *                 type: string
 *                 enum: [user, broker]
 *                 example: broker
 *               phoneNumber:
 *                 type: string
 *                 example: +251911223344
 *               password:
 *                 type: string
 *                 format: password
 *                 example: yourStrongPassword123
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Required only if userType is 'broker'
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Document file required for brokers
 *       403:
 *         description: Missing required fields
 *       405:
 *         description: Email or phone number already in use
 *       500:
 *         description: Server error
 */

router.post("/register", upload.single("avatar"), Register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login an existing user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber or email
 *               - password
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: +251911223344
 *               password:
 *                 type: string
 *                 format: password
 *                 example: yourStrongPassword123
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: user logged in
 *                 phoneNumber:
 *                   type: string
 *                   example: +251911223344
 *                 token:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

router.post("/login", Login);
router.post("/admin-login", AdminLogin);
router.get("/admin-dashboard", getUserStats);
// router.get('/listing',fetchListing)
// router.get('/listingdetail/:id',fetchDetailListing)
router.get("/numUser", getUserStats);
router.get("/user", getAllUsers);
router.patch("/:id/verify", verifyUser);
// router.get('/profile/:id',getCurrentUserProfile)
// router.get('/doc',fetchAllUsers)
// router.get('/brokers/verified', getVerifiedBrokers);
// router.post('/listings/submit', submitListing);
// router.put('/user/:id',updateUserProfile);
// router.get("/listings", GetListings)
// router.get('/user-profile', GetUserProfile);
export default router;
