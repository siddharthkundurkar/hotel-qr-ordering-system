import express from "express";
import { setTaxConfig } from "../controllers/tax.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { requireBranch } from "../middlewares/requireBranch.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  requireRole("OWNER", "MANAGER"),
  requireBranch,
  setTaxConfig
);

export default router;
