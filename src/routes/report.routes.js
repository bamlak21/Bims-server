import { Router } from "express";
import { CreateReport, GetReports, UpdateReport } from "../controllers/report.controller.js";

const router = Router();

/**
 * @swagger
 * /api/report/create:
 *   post:
 *     summary: Report a user
 *     description: Create a report against a user by providing reporter, reported user, and reason.
 *     tags:
 *       - Reports
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportedBy
 *               - reportedUserId
 *               - reason
 *             properties:
 *               reportedBy:
 *                 type: string
 *                 description: ID of the user creating the report
 *                 example: "64fae9c1234567890abc1234"
 *               reportedUserId:
 *                 type: string
 *                 description: ID of the user being reported
 *                 example: "64fabc67890123456789def0"
 *               reason:
 *                 type: string
 *                 description: Reason for reporting the user
 *                 example: "Spam messages"
 *               details:
 *                 type: string
 *                 description: Additional details about the report
 *                 example: "User keeps sending unsolicited promotional messages"
 *     responses:
 *       201:
 *         description: Report created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User Reported Successfully
 *                 reportId:
 *                   type: string
 *                   example: "650abc12345ef67890abcd12"
 *       400:
 *         description: Missing or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Required Fields missing
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

router.post("/create", CreateReport);

/**
 * @swagger
 * /api/report/fetch-reports:
 *   get:
 *     summary: Get all reports
 *     description: Retrieve a list of all user reports. Useful for admins to review reported users.
 *     tags:
 *       - Reports
 *     responses:
 *       200:
 *         description: List of reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Success
 *                 reports:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "650abc12345ef67890abcd12"
 *                       reportedBy:
 *                         type: string
 *                         example: "64fae9c1234567890abc1234"
 *                       reportedUserId:
 *                         type: string
 *                         example: "64fabc67890123456789def0"
 *                       reason:
 *                         type: string
 *                         example: "Spam messages"
 *                       details:
 *                         type: string
 *                         example: "User keeps sending unsolicited promotional messages"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-08-26T08:45:00.000Z"
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

router.get("/fetch-reports", GetReports);
router.put("/update/:id",UpdateReport);

export default router;
