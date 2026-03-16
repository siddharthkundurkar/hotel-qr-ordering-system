import express from "express";
import {
  
  getPublicMenu,
  createOrder,
  openTableByQr,
  getCurrentCustomerOrder,
  requestBill
} from "../controllers/public.controller.js";
import { requireBranch } from "../middlewares/requireBranch.js";  
import {
  
  
  orderLimiter
} from "../middlewares/ratelimit.middleware.js";
import { verifyTableSession } from "../middlewares/tableSession.middleware.js";


const router = express.Router();
console.log("✅ Public QR routes registered");

/* QR scan (strict) */
router.get("/qr/:token",  (req, res, next) => {
  console.log("🟢 HIT /public/qr/:token");
  next();
}, openTableByQr);

/* Public table validation */


/* Menu access */
router.get(
  "/menu",
  verifyTableSession,   // ✅ ONLY this
  getPublicMenu
);

/* Order creation (VERY STRICT) */
router.post("/orders", orderLimiter,verifyTableSession, createOrder);
router.get(
  "/orders/current",
  verifyTableSession,
  getCurrentCustomerOrder
);
/* =====================================
   🧾 CUSTOMER REQUEST BILL (PUBLIC FLOW)
===================================== */
router.patch(
  "/orders/:orderId/request-bill",
  verifyTableSession, // ✅ this already validates branch + table
  requestBill
);
export default router;
