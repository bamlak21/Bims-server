import { Router } from "express";
import {
  CreateListing,
  fetchListing,
  fetchListingById,
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

/**
 * @swagger
 * /api/listing/fetchlistcount/{id}:
 *   get:
 *     summary: Get total count of listings (vehicles + properties) for an owner
 *     description: Returns the total number of vehicle and property listings associated with a specific owner.
 *     tags:
 *       - Listings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Owner ID whose listing count you want to fetch.
 *         schema:
 *           type: string
 *           example: "64f2a1b9e8a7d4f1c2b12345"
 *     responses:
 *       200:
 *         description: Successfully retrieved the listing counts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 owner_id:
 *                   type: string
 *                   example: "64f2a1b9e8a7d4f1c2b12345"
 *                 vehicles:
 *                   type: integer
 *                   example: 8
 *                 properties:
 *                   type: integer
 *                   example: 6
 *                 total:
 *                   type: integer
 *                   example: 14
 *       500:
 *         description: Internal Server Error.
 */
router.get("/fetchlistcount/:id", fetchListingCount);

/**
 * @swagger
 * /api/listing/fetch:
 *   get:
 *     summary: Fetch vehicle, property, or both listings
 *     description: Fetches listings based on type (`vehicle`, `property`, or `all`), includes owner details, and supports pagination.
 *     tags:
 *       - Listings
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [vehicle, property, all]
 *           default: all
 *         description: The type of listings to fetch.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *         description: Number of items per page.
 *     responses:
 *       200:
 *         description: Listings fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Listings fetched successfully
 *                 listings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 64acb8f29b2f1a1234567890
 *                       title:
 *                         type: string
 *                         example: 2020 Toyota Corolla
 *                       price:
 *                         type: number
 *                         example: 15000
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-08-01T12:34:56.000Z
 *                       owner:
 *                         type: object
 *                         properties:
 *                           firstName:
 *                             type: string
 *                             example: John
 *                           lastName:
 *                             type: string
 *                             example: Doe
 *                       listingType:
 *                         type: string
 *                         enum: [vehicle, property]
 *                         example: vehicle
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalItems:
 *                       type: integer
 *                       example: 25
 *                     totalPages:
 *                       type: integer
 *                       example: 3
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
router.get("/fetch", fetchListing);

/**
 * @swagger
 * /api/listing/fetchListing:
 *   get:
 *     summary: Fetch a listing (vehicle or property) by ID.
 *     tags:
 *       - Listings
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the listing.
 *         example: "64acb8f29b2f1a1234567890"
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [vehicle, property]
 *         description: Type of the listing (vehicle or property).
 *         example: "vehicle"
 *     responses:
 *       200:
 *         description: Listing fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Success"
 *                 listing:
 *                   type: object
 *                   description: The listing data.
 *       400:
 *         description: Missing id or type in the query.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Id or type missing"
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */

router.get("/fetchListing", fetchListingById);
/**
 * @swagger
 * /api/listing/verify-listing:
 *   patch:
 *     summary: Verify a listing (vehicle)
 *     description: Updates the status of a vehicle listing by its ID.
 *     tags:
 *       - Listings
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the listing to verify.
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [approved, rejected, pending]
 *         description: The new status to set for the listing.
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [vehicle, property]
 *         description: The type of listing
 *     responses:
 *       200:
 *         description: Listing verified successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Item Verified
 *                 vehicle:
 *                   type: object
 *                   description: The updated vehicle listing details.
 *       404:
 *         description: Listing not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle not found
 *       500:
 *         description: Server error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 */

router.patch("/verify-listing", verifyListing);

export default router;
