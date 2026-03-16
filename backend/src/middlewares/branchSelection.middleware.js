import { db } from "../config/db.js";




export const branchMiddleware = async (req, res, next) => {
  try {
    const branchId = req.headers["x-branch-id"];

    if (!branchId) {
      return res.status(400).json({
        message: "X-Branch-Id header is required"
      });
    }

    const { id: userId, role, company_id } = req.user;

    // OWNER → only own company branches
    if (role === "OWNER") {
      const [[branch]] = await db.query(
        `SELECT id
         FROM branches
         WHERE id = ? AND company_id = ?`,
        [branchId, company_id]
      );

      if (!branch) {
        return res.status(403).json({
          message: "Branch does not belong to your company"
        });
      }

      req.branchId = branchId;
      return next();
    }

    // MANAGER → mapped branch only
    const [rows] = await db.query(
      `SELECT 1
       FROM manager_branches
       WHERE user_id = ? AND branch_id = ?`,
      [userId, branchId]
    );

    if (!rows.length) {
      return res.status(403).json({
        message: "Access denied for this branch"
      });
    }

    req.branchId = branchId;
    next();

  } catch (err) {
    next(err);
  }
};

