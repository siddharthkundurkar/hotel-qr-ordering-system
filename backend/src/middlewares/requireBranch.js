import { db } from "../config/db.js";

export const requireBranch = async (req, res, next) => {
  try {
    const { role, branchId } = req.user;

    /* =================================================
       🌍 GLOBAL ROLES — no branch needed
    ================================================= */
    if (role === "SUPER_ADMIN") {
      return next();
    }

    /* =================================================
       👑 OWNER — optional branch context
    ================================================= */
    if (role === "OWNER") {
      return next();
    }

    /* =================================================
       👨‍💼 MANAGER — must select branch (JWT based)
    ================================================= */
    if (role === "MANAGER") {
      if (!branchId) {
        return res.status(400).json({
          message: "Please select a branch",
        });
      }
      return next();
    }

    /* =================================================
       👨‍🍳 STAFF — must have fixed branch (already validated in auth)
    ================================================= */
    const STAFF_ROLES = ["WAITER", "CASHIER", "KITCHEN"];

    if (STAFF_ROLES.includes(role)) {
      if (!branchId) {
        return res.status(403).json({
          message: "Staff branch not assigned",
        });
      }

      return next();
    }

    /* =================================================
       ❓ UNKNOWN ROLE
    ================================================= */
    return res.status(403).json({
      message: "Role not allowed for branch context",
    });
  } catch (err) {
    console.error("❌ requireBranch error:", err);
    return res.status(500).json({
      message: "Failed to validate branch context",
    });
  }
};