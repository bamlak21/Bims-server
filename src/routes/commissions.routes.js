import { Router } from "express";
import {
  GetBrokerCommissions,
  getCommissionById,
  GetCommissionByListingId,
  GetCommissions,
} from "../controllers/commission.controller.js";

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
router.get("/getcommissionid",GetCommissionByListingId)

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

export default router;
