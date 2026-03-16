import { Router } from "express";
import { createCompany } from "../controllers/company.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

/* POST /companies */
router.post(
  "/",
  authMiddleware,
  requireRole("OWNER"),
  createCompany
);




export default router;
