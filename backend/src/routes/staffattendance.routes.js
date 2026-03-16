import express from "express";
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getBranchAttendance,
} from "../controllers/staffAttendance.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireBranch } from "../middlewares/requireBranch.js";

const router = express.Router();

/* ===============================
   STAFF ATTENDANCE ROUTES
================================ */

router.post("/check-in", authMiddleware,requireBranch, checkIn);
router.post("/check-out", authMiddleware,requireBranch, checkOut);
router.get("/me", authMiddleware,requireBranch, getMyAttendance);

/* Manager / Owner */
router.get("/branch", authMiddleware,requireBranch, getBranchAttendance);

export default router;
