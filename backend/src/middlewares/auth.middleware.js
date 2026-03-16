import { verifyAccessToken } from "../utils/token.js";
import { db } from "../config/db.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    /* =================================================
       🔐 Token presence check
    ================================================= */
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded?.id || !decoded?.role) {
      return res.status(401).json({
        message: "Invalid token payload",
      });
    }

    /* =================================================
       🔎 Fetch user
    ================================================= */
    const [[user]] = await db.query(
      `SELECT 
          id,
          role,
          company_id,
          is_active
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [decoded.id]
    );

    if (!user || user.is_active !== 1) {
      return res.status(401).json({
        message: "User inactive or not found",
      });
    }

    /* =================================================
       🏢 Company check
    ================================================= */
    if (user.role !== "SUPER_ADMIN") {
      const [[company]] = await db.query(
        `SELECT id, is_active
         FROM companies
         WHERE id = ?
         LIMIT 1`,
        [user.company_id]
      );

      if (!company || company.is_active !== 1) {
        return res.status(403).json({
          message: "Company is inactive",
        });
      }
    }

    /* =================================================
       🎯 ENTERPRISE BRANCH RULES (FINAL)
    ================================================= */

    // ⭐ ONLY strict staff must have branch
    const STAFF_FIXED_BRANCH = ["WAITER", "KITCHEN", "CASHIER"];

    const branchId = decoded.branchId
      ? Number(decoded.branchId)
      : null;

    // 🚨 block ONLY strict staff (NOT manager)
    if (STAFF_FIXED_BRANCH.includes(user.role) && !branchId) {
      return res.status(403).json({
        message: "Staff is not assigned to any branch",
      });
    }

    /* =================================================
       🧠 Attach user to request
    ================================================= */
    req.user = {
      id: user.id,
      role: user.role,
      companyId: user.company_id,
      branchId,
    };

    next();
  } catch (err) {
    console.error("❌ authMiddleware error:", err);
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};