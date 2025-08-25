import { Router } from "express";
import { getDealById, getDealsByBroker } from "../controllers/deals.controller.js";


const router = Router();

router.get("/fetchdeals",getDealsByBroker)
router.get("/:id",getDealById)

export default router;