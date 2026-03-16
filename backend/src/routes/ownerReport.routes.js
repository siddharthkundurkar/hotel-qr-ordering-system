import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

import {
  getSalesReport,
  getTopItemsReport,
  getBranchPerformance,
  getHourlySales,
  getCategoryPerformance,
  getWaiterPerformance,
  getTableTurnover,
  getPaymentMethodReport
} from "../controllers/ownerReport.controller.js";

const router = express.Router();

/* OWNER REPORTS */

router.get(
  "/sales",
  authMiddleware,
  requireRole("OWNER"),
  getSalesReport
);

router.get(
  "/top-items",
  authMiddleware,
  requireRole("OWNER"),
  getTopItemsReport
);

router.get(
  "/branches",
  authMiddleware,
  requireRole("OWNER"),
  getBranchPerformance
);

router.get(
  "/hourly-sales",
  authMiddleware,
  requireRole("OWNER"),
  getHourlySales
);

router.get(
  "/category-performance",
  authMiddleware,
  requireRole("OWNER"),
  getCategoryPerformance
);

router.get(
  "/waiter-performance",
  authMiddleware,
  requireRole("OWNER"),
  getWaiterPerformance
);

router.get(
  "/table-turnover",
  authMiddleware,
  requireRole("OWNER"),
  getTableTurnover
);

router.get(
  "/payment-method",
  authMiddleware,
  requireRole("OWNER"),
  getPaymentMethodReport
);

export default router;