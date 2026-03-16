import express from "express";
import {
  createMenuItem,
  createCombo,                 // ✅ USED
  getMenuItems,
  toggleMenuItemAvailability,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menuItem.controller.js";

import { uploadMenuImage } from "../middlewares/uploadMenuImage.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { requireBranch } from "../middlewares/requireBranch.js";

const router = express.Router();

/* ================= CREATE NORMAL MENU ITEM ================= */
router.post(
  "/",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  uploadMenuImage,
  createMenuItem
);

/* ================= CREATE COMBO MEAL ================= */
router.post(
  "/combos",                    // ✅ NEW ROUTE
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  uploadMenuImage,
  createCombo
);

/* ================= GET MENU ITEMS (NORMAL + COMBO) ================= */
router.get(
  "/",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  getMenuItems
);

/* ================= UPDATE ITEM / COMBO ================= */
router.put(
  "/:id",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  uploadMenuImage,
  updateMenuItem
);

/* ================= TOGGLE AVAILABILITY ================= */
router.patch(
  "/:id/toggle",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  toggleMenuItemAvailability
);

/* ================= DELETE ITEM / COMBO ================= */
router.delete(
  "/:id",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  deleteMenuItem
);
router.post(
  "/",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  uploadMenuImage,        // ✅ correct
  createMenuItem
);
export default router;
