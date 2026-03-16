import express from "express";
import {
  getKitchenOrders,
  updateKitchenOrderStatus,
  getKitchenOrderHistory,
  getKitchenSummary,
  updateKitchenItemStatus,
  batchBumpOrders,
  markItemPriority,
} from "../controllers/kitchen.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { requireBranch } from "../middlewares/requireBranch.js";
// import { rateLimitKitchen } from "../middlewares/rateLimit.js"; // ⭐ optional future

const router = express.Router();

/* =====================================
   🔒 BASE GUARDS
===================================== */

const baseAuth = [authMiddleware, requireBranch];

/* 🔥 Kitchen write access */
const kitchenOnly = [
  ...baseAuth,
  requireRole("KITCHEN"),
  // rateLimitKitchen, // ⭐ enable later for peak protection
];

/* 👀 Read access */
const kitchenRead = [
  ...baseAuth,
  requireRole("KITCHEN", "MANAGER", "OWNER"),
];

/* 🚀 Expo access (intentionally broader) */
const expoOnly = [
  ...baseAuth,
  requireRole("KITCHEN", "MANAGER", "OWNER"),
];

/* =====================================
   ACTIVE KITCHEN ORDERS
===================================== */
router.get("/orders", kitchenRead, getKitchenOrders);

/* =====================================
   UPDATE ORDER STATUS
===================================== */
router.patch(
  "/orders/:id/status",
  kitchenOnly,
  updateKitchenOrderStatus
);

/* =====================================
   UPDATE ITEM STATUS
===================================== */
router.patch(
  "/items/:itemId/status",
  kitchenOnly,
  updateKitchenItemStatus
);

/* =====================================
   ⭐ MARK ITEM PRIORITY (YOU BUILT THIS!)
===================================== */
router.patch(
  "/items/:itemId/priority",
  kitchenOnly,
  markItemPriority
);

/* =====================================
   🚀 EXPO — BATCH BUMP
===================================== */
router.post(
  "/expo/batch-bump",
  expoOnly,
  batchBumpOrders
);

/* =====================================
   ORDER HISTORY
===================================== */
router.get(
  "/orders/history",
  kitchenRead,
  getKitchenOrderHistory
);

/* =====================================
   KITCHEN SUMMARY
===================================== */
router.get("/summary", kitchenRead, getKitchenSummary);

export default router;