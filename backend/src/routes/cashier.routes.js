import express from "express";
import {
  getServedOrders,
  getPaidOrders,     // ✅ ADD
  payOrder,
  addItemToOrder,
  getCashierMenu,
} from "../controllers/cashier.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { requireBranch } from "../middlewares/requireBranch.js";

const router = express.Router();

/* ===============================
   GET SERVED ORDERS (UNPAID)
   GET /api/cashier/orders/served
================================ */
router.get(
  "/orders/served",
  authMiddleware,
  requireRole("CASHIER"),
  requireBranch,
  getServedOrders
);

/* ===============================
   GET PAID ORDERS (BILL HISTORY)
   GET /api/cashier/orders/paid
================================ */
router.get(
  "/orders/paid",
  authMiddleware,
  requireRole("CASHIER"),
  requireBranch,
  getPaidOrders
);

/* ===============================
   PAY ORDER
   PATCH /api/cashier/orders/:id/pay
================================ */
router.patch(
  "/orders/:id/pay",
  authMiddleware,
  requireRole("CASHIER"),
  requireBranch,
  payOrder
);

/* ===============================
   ADD ITEM TO ORDER
   POST /api/cashier/orders/:id/items
================================ */
router.post(
  "/orders/:id/items",
  authMiddleware,
  requireRole("CASHIER"),
  requireBranch,
  addItemToOrder
);

/* ===============================
   GET CASHIER MENU
   GET /api/cashier/menu
================================ */
router.get(
  "/menu",
  authMiddleware,
  requireRole("CASHIER"),
  requireBranch,
  getCashierMenu
);

export default router;
