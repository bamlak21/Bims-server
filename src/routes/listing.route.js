import { Router } from "express";
import {
  AssignClientToDeal,
  countApprovedListings,
  CreateListing,
  fetchListing,
  fetchListingById,
  fetchListingByStatus,
  fetchListingCount,
  getAssignedListings,
  MyListings,
  SaveListing,
  SetListingToBroker,
  verifyListing,
  updateListing,
} from "../controllers/listing.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { AuthMiddleWare } from "../middleware/auth.middleware.js";

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
 *                 example: A well-maintained SUV with low mileage.
 *               category:
 *                 type: string
 *                 example: suv
 *               price:
 *                 type: number
 *                 example: 45000
 *               vehicleSpecs:
 *                 type: object
 *                 description: Required only for vehicle listings
 *                 properties:
 *                   make:
 *                     type: string
 *                     example: Toyota
 *                   model:
 *                     type: string
 *                     example: Land Cruiser
 *                   year:
 *                     type: integer
 *                     example: 2020
 *                   mileage:
 *                     type: integer
 *                     example: 25000
 *                   transmission:
 *                     type: string
 *                     example: automatic
 *                   fuelType:
 *                     type: string
 *                     example: diesel
 *                   condition:
 *                     type: string
 *                     example: excellent
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
 *                     example: Addis Ababa
 *                   subcity:
 *                     type: string
 *                     example: Bole
 *                   woreda:
 *                     type: string
 *                     example: 04
 *                   address:
 *                     type: string
 *                     example: Behind XYZ Mall
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
 *                     enum: [excellent, good, fair, needs_renovation]
 *                     example: good
 *                   swimmingPool:
 *                     type: boolean
 *                     example: true
 *               images:
 *                 type: array
 *                 description: Multiple image files
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
 *                   example: Listing created successfully
 *                 listing:
 *                   type: object
 *                   description: The created listing object
 *       400:
 *         description: Bad request - missing required fields or images
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Missing required property fields
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
 *                 error:
 *                   type: string
 */

router.post("/create", upload.fields([
  { name: "images", maxCount: 5 },
  { name: "proofimages", maxCount: 2 }
]), CreateListing);

/**
 * @swagger
 * /api/listing/update/{id}:
 *   put:
 *     summary: Update an existing listing
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               type: { type: string }
 *               title: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               existingImages: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Updated successfully
 */
router.put("/update/:id", AuthMiddleWare, upload.fields([
  { name: "images", maxCount: 5 },
  { name: "proofimages", maxCount: 2 }
]), updateListing);

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
router.get("/fetch", AuthMiddleWare, fetchListing);
router.get("/fetch-demo", fetchListing);

/**
 * @swagger
 * /api/listing/fetchByStatus:
 *   get:
 *     summary: Get total listings count by status
 *     description: Returns the total number of vehicles and properties that match a given status.
 *     tags:
 *       - Listings
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         required: true
 *         description: Status to filter listings (e.g., "approved", "pending", "rejected")
 *     responses:
 *       200:
 *         description: Success — total count of listings matching the given status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Success
 *                 approvedListing:
 *                   type: integer
 *                   example: 42
 *       400:
 *         description: Missing required query parameter
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

router.get("/fetchByStatus", fetchListingByStatus);

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
 *     summary: Verify or reject a listing
 *     description: Admins can approve or reject a vehicle or property listing. If rejected, a reason must be provided. A notification will be sent to the listing owner.
 *     tags:
 *       - Listings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - status
 *               - type
 *             properties:
 *               id:
 *                 type: string
 *                 description: Listing ID
 *                 example: "650abc12345ef67890abcd12"
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 description: Approval status of the listing
 *                 example: approved
 *               type:
 *                 type: string
 *                 enum: [Vehicle, Property]
 *                 description: Type of the listing
 *                 example: Vehicle
 *               reason:
 *                 type: string
 *                 description: Reason for rejection (required if status is rejected)
 *                 example: Listing contains incomplete or misleading information
 *     responses:
 *       200:
 *         description: Listing status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Listing approved successfully
 *                 verified:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Bad request due to missing/invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Rejection reason is required
 *       404:
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Listing not found
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

router.patch("/verify-listing", AuthMiddleWare, verifyListing);

/**
 * @swagger
 * /api/listing/assign-to-broker:
 *   patch:
 *     summary: Assign a listing (vehicle or property) to a broker
 *     description: >
 *       This endpoint assigns a specified listing (either a vehicle or property) to a broker by updating the listing's broker ID and marking it as broker-assigned.
 *       It requires the listing ID, broker ID, and listing type as query parameters.
 *       Used by brokers to claim or be assigned listings for negotiation or sale.
 *     tags:
 *       - Listings
 *     parameters:
 *       - in: query
 *         name: listingId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the listing to assign
 *       - in: query
 *         name: broker_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the broker to assign the listing to
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [vehicle, property]
 *         required: true
 *         description: The type of listing ("vehicle" or "property")
 *     responses:
 *       200:
 *         description: Listing assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 listing:
 *                   type: object
 *                   description: The updated listing object
 *       400:
 *         description: Bad request - missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.patch("/assign-to-broker", SetListingToBroker);

/**
 * @swagger
 * /api/listing/my-listings/{id}:
 *   get:
 *     summary: Get all listings for a specific owner
 *     tags:
 *       - Listings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the owner
 *     responses:
 *       200:
 *         description: Listings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Listings retrieved successfully
 *                 listings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       owner_id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       price:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Required field missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Required field missing
 *       404:
 *         description: No listings found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No listings found
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

router.get("/my-listings/:id", MyListings);

/**
 * @swagger
 * /api/listing/save-listing:
 *   patch:
 *     summary: Save a listing to the user's saved listings
 *     tags:
 *       - Listings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - listingId
 *               - listingType
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user
 *               listingId:
 *                 type: string
 *                 description: The ID of the listing
 *               listingType:
 *                 type: string
 *                 enum: [TypeA, TypeB]
 *                 description: The type of the listing
 *     responses:
 *       200:
 *         description: Listing added to saved listings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Invalid IDs or user not found
 *       500:
 *         description: Server error
 */

router.patch("/save-listing", SaveListing);

/**
 * @swagger
 * /api/listing/assigned:
 *   get:
 *     summary: Get assigned listings for a broker
 *     description: Fetch all assigned listings (vehicles or properties) for a specific broker.
 *     tags:
 *       - Listings
 *     parameters:
 *       - in: query
 *         name: brokerId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the broker.
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [vehicle, property]
 *         required: true
 *         description: The type of listing (vehicle or property).
 *     responses:
 *       200:
 *         description: A list of assigned listings for the broker.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 oneOf:
 *                   - $ref: '#/components/schemas/Vehicle'
 *                   - $ref: '#/components/schemas/Property'
 *       400:
 *         description: Missing brokerId or type in query parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Missing brokerId or type
 *       500:
 *         description: Server error while fetching assigned listings.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 */

router.get("/fetchassignedlisting", getAssignedListings);
router.get("/count-approved", countApprovedListings);
router.patch("/assign-client", AssignClientToDeal);

export default router;
