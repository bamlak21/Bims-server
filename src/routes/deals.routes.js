import { Router } from "express";
import { getDealById,getDealsByBroker, getDealsByUser, updateDeal } from "../controllers/deals.controller.js";


const router = Router();
router.get("/createdDeals",getDealsByUser)
router.get("/fetchdeals",getDealsByBroker)
router.get("/:id",getDealById)
router.patch("/update/:id",updateDeal);
// router.get("/",AuthMiddleWare,getCreatedDeals);

export default router;