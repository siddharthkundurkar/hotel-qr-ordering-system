import { Router } from "express";
import {
  login,
  authMe,
  logout,
  refreshAccessToken,
  selectBranch,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { staffLogin } from "../controllers/staffAuth.controller.js";

const router = Router();

router.post("/login", login);
router.post("/staff/login", staffLogin);
router.post("/select-branch", authMiddleware, selectBranch);
router.get("/me", authMiddleware, authMe);
router.post("/logout", logout);
router.post("/refresh", refreshAccessToken);

export default router;
