import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { branchMiddleware } from "../middlewares/branchSelection.middleware.js";

const router = Router();

router.get(
  "/check",
  authMiddleware,
  branchMiddleware,
  (req, res) => {
    res.json({
      userId: req.user.id,
      role: req.user.role,
      branchId: req.branchId,
    });
  }
);

export default router;
