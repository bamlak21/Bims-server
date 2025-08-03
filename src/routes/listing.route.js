import { Router } from "express";
import {
  CreateListing,
  fetchListing,
  fetchListingCount,
  verifyListing,
} from "../controllers/listing.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/listing/create:
 *   post:
 *     summary: Create a new listing (vehicle or property)
 *     tags:
 *       - Listings
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *               - description
 *               - category
 *               - price
 *               - condition
 *               - owner_id
 *               - status
 *               - images
 *             properties:
 *               type:
 *                 type: string
 *                 description: Listing type (vehicle or property)
 *                 enum: [vehicle, property]
 *                 example: vehicle
 *               title:
 *                 type: string
 *                 example: luxury suv for sale
 *               description:
 *                 type: string
 *                 example: a well-maintained suv with low mileage.
 *               category:
 *                 type: string
 *                 example: suv
 *               price:
 *                 type: number
 *                 example: 45000
 *               make:
 *                 type: string
 *                 example: toyota
 *               model:
 *                 type: string
 *                 example: land cruiser
 *               year:
 *                 type: integer
 *                 example: 2020
 *               mileage:
 *                 type: integer
 *                 example: 25000
 *               transmission:
 *                 type: string
 *                 example: automatic
 *               fuelType:
 *                 type: string
 *                 example: diesel
 *               condition:
 *                 type: string
 *                 example: excellent
 *               owner_id:
 *                 type: string
 *                 description: MongoDB ObjectId of the owner
 *                 example: 64f1b9e7d8f5a123456789ab
 *               status:
 *                 type: string
 *                 example: pending
 *               rejection_reason:
 *                 type: string
 *                 example: incomplete documents
 *               location:
 *                 type: object
 *                 description: Required only for property listings
 *                 properties:
 *                   city:
 *                     type: string
 *                     example: addis ababa
 *                   subcity:
 *                     type: string
 *                     example: bole
 *                   woreda:
 *                     type: string
 *                     example: 04
 *                   address:
 *                     type: string
 *                     example: behind xyz mall
 *               specifications:
 *                 type: object
 *                 description: Required only for property listings
 *                 properties:
 *                   bedrooms:
 *                     type: integer
 *                     example: 3
 *                   bathrooms:
 *                     type: integer
 *                     example: 2
 *                   area:
 *                     type: number
 *                     example: 180
 *                   yearBuilt:
 *                     type: integer
 *                     example: 2018
 *                   condition:
 *                     type: string
 *                     example: good
 *                   swimmingPool:
 *                     type: boolean
 *                     example: true
 *               images:
 *                 type: array
 *                 description: multiple image files
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Listing created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: listing created successfully
 *                 listing:
 *                   type: object
 *                   description: The created listing object
 *       400:
 *         description: bad request - missing fields or images
 *       500:
 *         description: server error
 */

router.post("/create", upload.array("images", 5), CreateListing);
router.get("/fetchlist/:id", fetchListingCount);

/**
 * @swagger
 * /api/listing/fetch:
 *   get:
 *     summary: Fetch vehicle and property listings
 *     tags:
 *       - Listings
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [vehicle, property]
 *         description: Filter listings by type (vehicle or property)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Listings fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Listings fetched successfully
 *                 vehicle:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Vehicle listing objects
 *                 property:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Property listing objects
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *       500:
 *         description: Internal Server Error
 */

router.get("/fetch", fetchListing);

/**
 * @swagger
 * /api/listing/verify:
 *   patch:
 *     summary: Verify or update the status of a listing
 *     tags:
 *       - Listings
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the listing to verify
 *         example: 64f1b9e7d8f5a123456789ab
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [approved, rejected, pending]
 *         description: The new status for the listing
 *         example: approved
 *     responses:
 *       200:
 *         description: Listing status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: 64f1b9e7d8f5a123456789ab
 *                 title:
 *                   type: string
 *                   example: luxury suv for sale
 *                 status:
 *                   type: string
 *                   example: approved
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: List not found
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
 */

router.patch("/verify", verifyListing);

export default router;
