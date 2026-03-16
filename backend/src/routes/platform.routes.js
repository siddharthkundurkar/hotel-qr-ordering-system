import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";

import {
  createCompanyWithOwner,
  getPlatformOwners,
  createOwnerBySuperAdmin,
  updateOwnerStatus,
  getPlatformCompanies,
} from "../controllers/platform.controller.js";

const router = Router();

/* =====================================================
   🔐 AUTH REQUIRED FOR ALL PLATFORM ROUTES
===================================================== */
router.use(authMiddleware);

/* =====================================================
   🏢 COMPANIES
===================================================== */

// create company + owner (tenant provisioning)
router.post("/companies", createCompanyWithOwner);

/* =====================================================
   👑 OWNERS MANAGEMENT
===================================================== */

// list owners
router.get("/owners", getPlatformOwners);

// create owner only
router.post("/owners", createOwnerBySuperAdmin);

// activate / suspend owner
router.patch("/owners/:id/status", updateOwnerStatus);
 router.get(
  "/companies",
  authMiddleware,
  getPlatformCompanies
);

export default router;
