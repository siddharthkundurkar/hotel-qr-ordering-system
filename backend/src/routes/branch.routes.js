import { Router } from "express";
import { createBranch, getMyBranches } from "../controllers/branch.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";


const router = Router();

router.post(
  "/",
  authMiddleware,
  requireRole("OWNER"),
  createBranch
);


router.get(
  "/my",
  authMiddleware,
  requireRole("OWNER", "MANAGER"),
  getMyBranches
);


export default router;
