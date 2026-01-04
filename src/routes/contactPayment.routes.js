import { Router } from "express";
import { AuthMiddleWare } from "../middleware/auth.middleware.js";
import {
  initiateContactPayment,
  verifyContactPayment,
  getContactPaymentStatus,
  getUserContactPayments
} from "../controllers/contactPayment.controller.js";

const router = Router();

// Initiate contact payment
router.post('/initiate', AuthMiddleWare, initiateContactPayment);

// Verify contact payment (Chapa webhook & frontend polling)
router.get('/verify', AuthMiddleWare, verifyContactPayment);
router.post('/verify', verifyContactPayment);

// Get payment status for specific listing
router.get('/status/:listing_id', AuthMiddleWare, getContactPaymentStatus);

// Get user's all contact payments
router.get('/user/payments', AuthMiddleWare, getUserContactPayments);

export default router;