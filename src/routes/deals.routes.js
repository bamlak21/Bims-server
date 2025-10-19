import { Router } from "express";
import { getCreatedDeals, getDealById, getDealsByBroker } from "../controllers/deals.controller.js";
import { AuthMiddleWare } from "../middleware/auth.middleware.js";


const router = Router();

router.get("/fetchdeals",getDealsByBroker)
router.get("/:id",getDealById)
router.get("/",AuthMiddleWare,getCreatedDeals);

export default router;