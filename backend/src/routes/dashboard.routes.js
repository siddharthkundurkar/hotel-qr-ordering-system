import express from "express";
import {
  tableOccupancy,
  ordersToday,
  recentOrders,
  getTables,
  tableAnalytics,
  tableKpis,getOrderAnalytics,
kitchenStats,
getStaffList,
getStaffAnalytics
} from "../controllers/dashboard.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { requireBranch } from "../middlewares/requireBranch.js";

const router = express.Router();

/* ================= DASHBOARD ================= */

/* TABLE OCCUPANCY (Stats card) */
router.get(
  "/tables/occupancy",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  tableOccupancy
);

/* TABLE LIST (Table Dashboard grid) */
router.get(
  "/tables/list",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  getTables
);

/* TABLE ANALYTICS (Day / Week / Month / Year) */
router.get(
  "/tables/analytics",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  tableAnalytics
);

/* TABLE KPIs (Avg occupancy, peak hour) */
router.get(
  "/tables/kpis",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  tableKpis
);

/* ORDERS TODAY */
router.get(
  "/orders/today",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  ordersToday
);

/* RECENT ORDERS */
router.get(
  "/orders/recent",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  recentOrders
);
router.get(
  "/orders/analytics",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  getOrderAnalytics
);
router.get("/kitchen/stats", authMiddleware, kitchenStats);
router.get(
  "/staff/analytics",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  getStaffAnalytics
);

router.get(
  "/staff/list",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  getStaffList
);
export default router;
