import { db } from "../config/db.js";

export const createBranch = async (req, res, next) => {
  try {
    const { name, address } = req.body;
    const { companyId, role } = req.user;

    // 🔐 Only owner can create branch
    if (role !== "OWNER") {
      return res.status(403).json({
        message: "Only owner can create branch",
      });
    }

    if (!companyId) {
      return res.status(403).json({
        message: "Owner is not linked to any company",
      });
    }

    if (!name) {
      return res.status(400).json({
        message: "Branch name is required",
      });
    }

    // ⭐ ensure company is active (future SaaS billing ready)
    const [[company]] = await db.query(
      `SELECT id FROM companies WHERE id = ? AND is_active = 1`,
      [companyId]
    );

    if (!company) {
      return res.status(403).json({
        message: "Company is inactive or not found",
      });
    }

    const [result] = await db.query(
      `INSERT INTO branches (company_id, name, address, is_active)
       VALUES (?, ?, ?, 1)`,
      [companyId, name, address || null]
    );

    res.status(201).json({
      branchId: result.insertId,
      message: "Branch created successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const getMyBranches = async (req, res, next) => {
  try {
    const { id: userId, role, companyId } = req.user;
        console.log("🔍 getMyBranches user:", {
  userId,
  role,
  companyId,
});
    if (!companyId) {
      return res.status(403).json({
        message: "User is not linked to any company",
      });
    }

    /* ========================================
       👑 OWNER → ALL COMPANY BRANCHES
    ======================================== */
    if (role === "OWNER") {
      const [rows] = await db.query(
        `
        SELECT id, name, address
        FROM branches
        WHERE company_id = ?
          AND is_active = 1
        ORDER BY name
        `,
        [companyId]
      );
      return res.json(rows);
    }

    /* ========================================
       👔 MANAGER → mapped OR fallback ALL
    ======================================== */
    if (role === "MANAGER") {
      const [mapped] = await db.query(
        `
        SELECT b.id, b.name, b.address
        FROM branches b
        JOIN manager_branches mb ON mb.branch_id = b.id
        WHERE mb.user_id = ?
          AND b.company_id = ?
          AND b.is_active = 1
        `,
        [userId, companyId]
      );

      // ✅ if mapping exists → use it
      if (mapped.length > 0) {
        return res.json(mapped);
      }

      // 🔥 ENTERPRISE FALLBACK (THIS FIXES YOUR CASE)
      const [all] = await db.query(
        `
        SELECT id, name, address
        FROM branches
        WHERE company_id = ?
          AND is_active = 1
        ORDER BY name
        `,
        [companyId]
      );

      return res.json(all);
    }

    /* ========================================
       👨‍🍳 STAFF → strict branch
    ======================================== */
    const [staff] = await db.query(
      `
      SELECT b.id, b.name, b.address
      FROM branches b
      JOIN staff_branches sb ON sb.branch_id = b.id
      WHERE sb.user_id = ?
        AND b.company_id = ?
        AND b.is_active = 1
      LIMIT 1
      `,
      [userId, companyId]
    );
    

    return res.json(staff);
  } catch (err) {
    console.error("❌ getMyBranches error:", err);
    next(err);
  }
};