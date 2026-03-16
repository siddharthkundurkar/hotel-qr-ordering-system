import express from "express";
import {
  createMenuCategory,
  getMenuCategories,
  toggleMenuCategory,
} from "../controllers/menuCategory.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { requireBranch } from "../middlewares/requireBranch.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  createMenuCategory
);

router.get(
  "/",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  getMenuCategories
);

router.patch(
  "/:id/toggle",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  toggleMenuCategory
);

export default router;
