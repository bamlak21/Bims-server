import { Router } from "express";
import {
  GetBrokerCommissions,
  getCommissionById,
  GetCommissionByListingId,
  GetCommissions,
  handleWebhook,
  PayCommission,
  updateCommissionDecision,
  verifyCommissionPayment,
} from "../controllers/commission.controller.js";
import { AuthMiddleWare } from "../middleware/auth.middleware.js";
const router = Router();

/**
 * @swagger
 * /api/commissions/get-all-commissions:
 *   get:
 *     summary: Get all commissions
 *     tags:
 *       - Commissions
 *     responses:
 *       200:
 *         description: List of commissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Success
 *                 commission:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       broker_id:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       owner_id:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       buyer_id:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       listing_id:
 *                         type: string
 *                       listing_type:
 *                         type: string
 *                         enum: [Vehicle, Property]
 *                       sale_price:
 *                         type: number
 *                       total_commission:
 *                         type: number
 *                       owner_share:
 *                         type: number
 *                       buyer_share:
 *                         type: number
 *       404:
 *         description: No commissions found
 *       500:
 *         description: Server error
 */

router.get("/get-all-commissions", GetCommissions);
router.get("/getcommissionid", GetCommissionByListingId);

/**
 * @swagger
 * /api/commissions/broker:
 *   get:
 *     summary: Get all commissions for a specific broker
 *     tags:
 *       - Commissions
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Broker's user ID
 *     responses:
 *       200:
 *         description: List of commissions for the broker
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Success
 *                 commission:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       broker_id:
 *                         type: string
 *                       owner_id:
 *                         type: string
 *                       buyer_id:
 *                         type: string
 *                       listing_id:
 *                         type: string
 *                       listing_type:
 *                         type: string
 *                         enum: [Vehicle, Property]
 *                       sale_price:
 *                         type: number
 *                       total_commission:
 *                         type: number
 *                       owner_share:
 *                         type: number
 *                       buyer_share:
 *                         type: number
 *       400:
 *         description: Required fields missing
 *       404:
 *         description: No commissions found for broker
 *       500:
 *         description: Server error
 */

router.get("/broker", GetBrokerCommissions);
router.get("/:commissionId", getCommissionById);

/**
 * @swagger
 * /api/commissions/pay:
 *   post:
 *     summary: Initialize payment for a commission
 *     description: Creates a payment session for a given commission and returns the payment URL.
 *     tags:
 *       - Commissions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - commissionId
 *               - user_id
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 250.5
 *                 description: The amount to be paid.
 *               commissionId:
 *                 type: string
 *                 example: "68ca721592751e922b673aff"
 *                 description: The ID of the commission to be paid.
 *               user_id:
 *                 type: string
 *                 example: "68a033b95f1ef89a9f29cb14"
 *                 description: The ID of the user who owns the commission.
 *     responses:
 *       200:
 *         description: Payment initialization successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment initialization successful
 *                 url:
 *                   type: string
 *                   example: "https://checkout.example.com/pay/tx-12345"
 *                 tx_ref:
 *                   type: string
 *                   example: "tx-12345"
 *       400:
 *         description: Missing required fields.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Missing required fields
 *       404:
 *         description: Commission not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Commission not found
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal Server Error
 */

router.post("/pay", PayCommission);

/**
 * @swagger
 * /api/commissions/verify:
 *   get:
 *     summary: Verify a commission payment
 *     description: Verifies a transaction reference (tx_ref) with the payment provider and updates the commission status to "paid" if successful.
 *     tags:
 *       - Commissions
 *     parameters:
 *       - in: query
 *         name: tx_ref
 *         required: true
 *         schema:
 *           type: string
 *           example: "tx-12345"
 *         description: The unique transaction reference to verify.
 *     responses:
 *       200:
 *         description: Transaction verified successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Transaction verified successfully
 *                 tx_ref:
 *                   type: string
 *                   example: tx-12345
 *                 status:
 *                   type: string
 *                   example: paid
 *       400:
 *         description: Missing required query parameter.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Missing required fields
 *       404:
 *         description: Transaction not verified or commission not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Transaction not verified
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal Server Error
 */

router.get("/verify", verifyCommissionPayment);
router.patch(
  "/:commissionId/decision",
  AuthMiddleWare,
  updateCommissionDecision
);
router.post("/webhook", handleWebhook);
export default router;
