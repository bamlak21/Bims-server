import express from "express";
import { AuthMiddleWare } from "../middleware/auth.middleware.js"; // Assuming auth middleware is here
import { createRating, getBrokerRatings } from "../controllers/rating.controller.js";

const router = express.Router();

router.post("/", AuthMiddleWare, createRating);
router.get("/:brokerId", getBrokerRatings);

export default router;
