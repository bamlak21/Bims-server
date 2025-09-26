import { Router } from "express";
import { getBrokerPerformance, getInsights, getListingGrowth, getOverview, getReports, getUserGrowth, RejectListing, systemHealth } from "../controllers/admin.controller.js";
import { GetCommissions } from "../controllers/commission.controller.js";

const router = Router();

/**
 * @swagger
 * /api/admin/reject-listing:
 *   patch:
 *     summary: Reject a listing (Property or Vehicle)
 *     description: Marks a listing as rejected with a rejection reason.
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - type
 *             properties:
 *               id:
 *                 type: string
 *                 description: The ID of the listing
 *                 example: "64df1c93f4a1d34eac77e99a"
 *               type:
 *                 type: string
 *                 enum: [Vehicle, Property]
 *                 description: The type of the listing
 *                 example: "Vehicle"
 *               reason:
 *                 type: string
 *                 description: The reason for rejection
 *                 example: "Incomplete documents"
 *     responses:
 *       200:
 *         description: Listing rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Listing rejected successfully
 *                 listing:
 *                   type: object
 *                   description: The rejected listing details
 *       400:
 *         description: Missing or invalid fields
 *       404:
 *         description: Listing not found
 *       500:
 *         description: Server error
 */

router.patch("/reject-listing", RejectListing);
router.get("/overview", getOverview);
router.get("/insights", getInsights);
router.get("/reports", getReports);
router.get("/broker-performance", getBrokerPerformance);
router.get("/user-growth",getUserGrowth);
router.get("/listing-growth",getListingGrowth);
router.get('/system-health',systemHealth);

export default router;
