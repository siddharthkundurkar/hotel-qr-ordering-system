import express from "express";
import { getDailySales } from "../controllers/report.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { getBranchRevenue } from "../controllers/report.controller.js"
import { getTopItems } from "../controllers/report.controller.js"
import { staffPerformanceReport } from "../controllers/report.controller.js";

const router = express.Router();

router.get(
  "/daily-sales",
  authMiddleware,
  requireRole("OWNER", "MANAGER"),
  getDailySales
);
router.get(
  "/branch-revenue",
  authMiddleware,
  requireRole("OWNER", "MANAGER"),
  getBranchRevenue
);
router.get(
  "/top-items",
  authMiddleware,
  requireRole("OWNER", "MANAGER"),
  getTopItems
);
router.get("/staff-performance", authMiddleware,
  requireRole("OWNER", "MANAGER"),staffPerformanceReport);
export default router;
