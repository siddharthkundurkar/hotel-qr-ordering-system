import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { requireCompany } from "../middlewares/requireCompany.middleware.js";
import { getAuditLogs } from "../controllers/owner.controller.js";
import {
  ownerDashboard,
  getOwnerBranches,
  createManager,
  getManagers,
  assignManagerToBranch,
  getOwnerOnboardingStatus,
  getOwnerProfile,
  updateOwnerProfile,
  getCompanySettings,
  updateCompanySettings,  
  changeOwnerPassword
} from "../controllers/owner.controller.js";

const router = express.Router();

/* ================= OWNER DASHBOARD ================= */
router.get(
  "/dashboard",
  authMiddleware,
  requireRole("OWNER"),
  requireCompany,
  ownerDashboard
);

/* ================= BRANCHES ================= */
router.get(
  "/branches",
  authMiddleware,
  requireRole("OWNER"),
  requireCompany,
  getOwnerBranches
);

/* ================= MANAGER ================= */
router.post(
  "/managers",
  authMiddleware,
  requireRole("OWNER"),
  requireCompany,      // ✅ MOVE BEFORE CONTROLLER
  createManager
);

router.get(
  "/managers",
  authMiddleware,
  requireRole("OWNER"),
  requireCompany,
  getManagers
);

router.get(
  "/managers",
  authMiddleware,
  requireRole("OWNER"),
  requireCompany,
  getManagers
);
router.post(
  "/:managerId/branches",
  authMiddleware,
  requireRole("OWNER"),
  requireCompany,
  assignManagerToBranch
);
router.get(
  "/audit-logs",
  authMiddleware,
  requireRole("OWNER"),
  getAuditLogs
);
// routes

router.get(
  "/owner/onboarding-status",
  authMiddleware,
  requireRole("OWNER"),
  getOwnerOnboardingStatus
);

router.get("/profile", authMiddleware, requireRole("OWNER"), getOwnerProfile);

router.put("/profile", authMiddleware, requireRole("OWNER"), updateOwnerProfile);

router.get("/company", authMiddleware, requireRole("OWNER"), getCompanySettings);

router.put("/company", authMiddleware, requireRole("OWNER"), updateCompanySettings);

router.post("/change-password", authMiddleware, requireRole("OWNER"), changeOwnerPassword);

router.get("/onboarding-status", authMiddleware, requireRole("OWNER"), getOwnerOnboardingStatus);
export default router;
