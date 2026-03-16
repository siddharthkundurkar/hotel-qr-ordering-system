import express from "express";
import {
  getReadyOrders,
  markOrderAsServed,
  getMyServedOrders,
  acceptOrder,
  serveItem ,
  generateBillController,
  getServedOrdersHistory,
  getWaiterDashboard
} from "../controllers/waiter.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { requireBranch } from "../middlewares/requireBranch.js";

const router = express.Router();

/* =====================================
   READY ORDERS (FOR ALL WAITERS)
   Kitchen → Ready
===================================== */
router.get(
  "/orders/ready",
  authMiddleware,
  requireRole("WAITER"),
  requireBranch,
  getReadyOrders
);

/* =====================================
   ✅ ACCEPT ORDER (ready → out_for_delivery)
===================================== */
router.patch(
  "/orders/:id/accept",
  authMiddleware,
  requireRole("WAITER"),
  requireBranch,
  acceptOrder
);

/* =====================================
   SERVE ORDER (out_for_delivery → served)
===================================== */
router.patch(
  "/orders/:id/served",
  authMiddleware,
  requireRole("WAITER"),
  requireBranch,
  markOrderAsServed
);

/* =====================================
   MY SERVED ORDERS
===================================== */
router.get(
  "/orders/my",
  authMiddleware,
  requireRole("WAITER"),
  requireBranch,
  getMyServedOrders
);
/* =====================================
   SERVE SINGLE ITEM
===================================== */
/* =====================================
   SERVE SINGLE ITEM
===================================== */
router.patch(
  "/items/:itemId/serve", // ✅ use semantic param
  authMiddleware,
  requireRole("WAITER"),
  requireBranch, // ✅ IMPORTANT — add back for security
  serveItem
);
router.post(
  "/orders/:orderId/generate-bill",
  authMiddleware,
  requireRole("WAITER"),
  requireBranch,
  generateBillController
);
router.get("/orders/served-history", authMiddleware,requireRole("WAITER"), requireBranch, getServedOrdersHistory);
router.get("/dashboard", authMiddleware, requireRole("WAITER"), requireBranch, getWaiterDashboard);
export default router;
