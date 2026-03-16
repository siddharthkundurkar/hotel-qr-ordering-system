import express from "express";
import {
  getManagerOrders,
  updateOrderStatusByManager
} from "../controllers/order.controller.js";
import { getManagerProfile, 
  updateManagerProfile ,
  getManagerBranch,
  changeManagerPassword

} from "../controllers/manager.controller.js";
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

/* ================= MANAGER SETTINGS ================= */

router.get(
  "/profile",
  authMiddleware,
  requireRole("MANAGER"),
  getManagerProfile
);

router.put(
  "/profile",
  authMiddleware,
  requireRole("MANAGER"),
  updateManagerProfile
);
router.get(
  "/branch",
  authMiddleware,
  requireRole("MANAGER"),
  getManagerBranch
);
router.post(
  "/change-password",
  authMiddleware,
  requireRole("MANAGER"),
  changeManagerPassword
);
export default router;
