import { Router } from "express";
import { GetChatRooms } from "../controllers/chat.controller.js";

const router = Router();

router.get("/fetch", GetChatRooms);

export default router;
