import express from "express";
import {
  createTable,
  getTables,
  updateTableStatus,
  updateTable,
  deleteTable,
} from "../controllers/table.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { requireBranch } from "../middlewares/requireBranch.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  createTable
);

router.get(
  "/",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  getTables
);

router.patch(
  "/:id/status",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  updateTableStatus
);

router.put(
  "/:id",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  updateTable
);

router.delete(
  "/:id",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  deleteTable
);

export default router;
