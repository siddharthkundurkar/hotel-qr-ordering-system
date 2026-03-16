import express from "express";
import {
  getManagerOrders,
  updateOrderStatusByManager,getOrderStatus
} from "../controllers/order.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { requireBranch } from "../middlewares/requireBranch.js";

const router = express.Router();

/* ================= MANAGER ORDERS ================= */

router.get(
  "/orders",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  getManagerOrders
);

router.patch(
  "/orders/:id/status",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  updateOrderStatusByManager
);
router.get("/orders/:id/status", getOrderStatus);

export default router;
