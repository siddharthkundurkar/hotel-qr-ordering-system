import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { requireBranch } from "../middlewares/requireBranch.js";
import {
  createStaff,
  getStaff,
  updateStaffStatus,
  updateStaff,getStaffById,deleteStaff
} from "../controllers/staff.controller.js";
import { checkIn,checkOut,getMyAttendance,getBranchAttendance } from "../controllers/staffAttendance.controller.js";

const router = express.Router();

// Protect all staff routes
router.use(authMiddleware, requireRole("MANAGER"), requireBranch);

// APIs
router.post("/", createStaff);
router.get("/", getStaff);
router.patch("/:id/status", updateStaffStatus);
router.put("/:id", authMiddleware, requireRole("MANAGER"), requireBranch, updateStaff);
router.get("/:id", authMiddleware, requireRole("MANAGER"), requireBranch, getStaffById);

router.post("/check-in", authMiddleware, checkIn);
router.post("/check-out", authMiddleware, checkOut);
router.get("/attendance/my", authMiddleware, getMyAttendance);
router.get("/attendance/my", authMiddleware, getBranchAttendance);
router.delete("/:id", authMiddleware, requireBranch, deleteStaff);

export default router;
