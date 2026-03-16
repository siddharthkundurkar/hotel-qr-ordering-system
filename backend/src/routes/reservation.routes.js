import express from "express";
import {
  createReservation,
  getReservations,
  confirmReservation,
  seatReservation,
  cancelReservation
} from "../controllers/reservation.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { requireBranch } from "../middlewares/requireBranch.js";

const router = express.Router();

/* ===============================
   CREATE RESERVATION
   Manager only
================================ */
router.post(
  "/",
  authMiddleware,
  requireRole("Manager"),
  requireBranch,
  createReservation
);

/* ===============================
   GET ALL RESERVATIONS
   Manager only
================================ */
router.get(
  "/",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  getReservations
);

/* ===============================
   CONFIRM RESERVATION
   (Optional table assign)
================================ */
router.patch(
  "/:id/confirm",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  confirmReservation
);

/* ===============================
   SEAT CUSTOMER
================================ */
router.patch(
  "/:id/seat",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  seatReservation
);

/* ===============================
   CANCEL RESERVATION
================================ */
router.patch(
  "/:id/cancel",
  authMiddleware,
  requireRole("MANAGER"),
  requireBranch,
  cancelReservation
);

export default router;
