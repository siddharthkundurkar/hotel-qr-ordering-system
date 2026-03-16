import express from "express";
import {
  addToQueue,
  getQueue,
  seatFromQueue,
  cancelQueue
} from "../controllers/queue.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { requireBranch } from "../middlewares/requireBranch.js";

const router = express.Router();

router.post("/", authMiddleware, requireRole("MANAGER"), requireBranch, addToQueue);
router.get("/", authMiddleware, requireRole("MANAGER"), requireBranch, getQueue);
router.patch("/:id/seat", authMiddleware, requireRole("MANAGER"), requireBranch, seatFromQueue);
router.patch("/:id/cancel", authMiddleware, requireRole("MANAGER"), requireBranch, cancelQueue);

export default router;
