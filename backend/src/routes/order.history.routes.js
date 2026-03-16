import express from "express";
import { getOrderHistory } from "../controllers/orderHistory.controller.js";
import  { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/orders/history", authMiddleware, getOrderHistory);

export default router;
