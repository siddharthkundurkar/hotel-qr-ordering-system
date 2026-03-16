import { db } from "../config/db.js";
import bcrypt from "bcrypt";

/* ===============================
   OWNER DASHBOARD
================================ */
export const ownerDashboard = async (req, res, next) => {
  try {
    const { companyId } = req.user;

    const [[stats]] = await db.query(
      `SELECT
         (SELECT COUNT(*) FROM branches WHERE company_id = ?) AS branches,
         (SELECT COUNT(*) FROM users WHERE company_id = ? AND role = 'MANAGER') AS managers,
         (SELECT COUNT(*) FROM staff WHERE companyId = ?) AS staff`,
      [companyId, companyId, companyId]
    );

    res.json(stats);
  } catch (err) {
    next(err);
  }
};


/* ===============================
   GET OWNER BRANCHES
================================ */
export const getOwnerBranches = async (req, res, next) => {
  try {
    const { companyId } = req.user;

    const [branches] = await db.query(
      `SELECT id, name, address, is_active
       FROM branches
       WHERE company_id = ?`,
      [companyId]
    );

    res.json(branches);
  } catch (err) {
    next(err);
  }
};

/* ===============================
   CREATE MANAGER (OWNER ONLY)
================================ */


export const createManager = async (req, res, next) => {
  const conn = await db.getConnection();

  try {
    // 🔐 ROLE GUARD (CRITICAL)
    if (req.user.role !== "OWNER") {
      return res.status(403).json({
        message: "Only owner can create manager",
      });
    }

    const {
      fullName,
      email,
      password,
      branchId,
      isHeadManager = false,
    } = req.body;

    const companyId = req.user.companyId;

    if (!fullName || !email || !password || !branchId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    await conn.beginTransaction();

    // ⭐ ensure company active (SaaS ready)
    const [[company]] = await conn.query(
      `SELECT id FROM companies WHERE id = ? AND is_active = 1`,
      [companyId]
    );

    if (!company) {
      await conn.rollback();
      return res.status(403).json({
        message: "Company is inactive or not found",
      });
    }

    // 1️⃣ Check email safely
    const [existingUsers] = await conn.query(
      `SELECT id FROM users WHERE email = ?`,
      [email]
    );

    if (existingUsers.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: "Email already exists" });
    }

    // 🔥 FIXED — validate ACTIVE branch
    const [[branch]] = await conn.query(
      `SELECT id FROM branches 
       WHERE id = ? 
       AND company_id = ? 
       AND is_active = 1`,
      [branchId, companyId]
    );

    if (!branch) {
      await conn.rollback();
      return res.status(404).json({ message: "Invalid branch" });
    }

    // 3️⃣ Create manager user
    const passwordHash = await bcrypt.hash(password, 10);

    const [userResult] = await conn.query(
      `INSERT INTO users (company_id, full_name, email, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, 'MANAGER', 1)`,
      [companyId, fullName, email, passwordHash]
    );

    const managerId = userResult.insertId;

    // 4️⃣ Enforce single head manager
    if (isHeadManager) {
      await conn.query(
        `UPDATE manager_branches
         SET is_head_manager = 0
         WHERE branch_id = ?`,
        [branchId]
      );
    }

    // 5️⃣ Assign manager to branch
    await conn.query(
      `INSERT INTO manager_branches (user_id, branch_id, is_head_manager)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_head_manager = VALUES(is_head_manager)`,
      [managerId, branchId, isHeadManager ? 1 : 0]
    );

    await conn.commit();

    res.status(201).json({
      message: "Manager created successfully",
      managerId,
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

export const getManagers = async (req, res, next) => {
  try {
    const companyId = req.user.companyId; // ✅ FIXED

    const [rows] = await db.query(
      `
      SELECT
        u.id,
        u.full_name,
        u.email,
        b.name AS branchName,
        mb.is_head_manager
      FROM users u
      JOIN manager_branches mb ON mb.user_id = u.id
      JOIN branches b ON b.id = mb.branch_id
      WHERE u.company_id = ? AND u.role = 'MANAGER'
      `,
      [companyId]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET MANAGERS ERROR:", err);
    next(err);
  }
};


export const assignManagerToBranch = async (req, res, next) => {
  try {
    const { managerId } = req.params;
    const { branchId, isHeadManager = false } = req.body;
    const companyId = req.user.companyId;

    // 1️⃣ Validate manager
    const [[manager]] = await db.query(
      `SELECT id FROM users
       WHERE id = ? AND role = 'MANAGER' AND company_id = ?`,
      [managerId, companyId]
    );
    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    // 2️⃣ Validate branch
    const [[branch]] = await db.query(
      `SELECT id FROM branches
       WHERE id = ? AND company_id = ? AND is_active = 1`,
      [branchId, companyId]
    );
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    // 3️⃣ Enforce single head manager per branch
    if (isHeadManager) {
      await db.query(
        `UPDATE manager_branches
         SET is_head_manager = 0
         WHERE branch_id = ?`,
        [branchId]
      );
    }

    // 4️⃣ Assign manager
    await db.query(
      `INSERT INTO manager_branches (user_id, branch_id, is_head_manager)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         is_head_manager = VALUES(is_head_manager)`,
      [managerId, branchId, isHeadManager ? 1 : 0]
    );

    res.json({ message: "Manager assigned to branch successfully" });

  } catch (err) {
    next(err);
  }
};
export const getAuditLogs = async (req, res) => {
  try {
    const { companyId, branchId } = req.user;

    const {
      entityType,
      action,
      userId,
      limit = 200,
      offset = 0,
    } = req.query;

    let sql = `
      SELECT
        id,
        action,
        entityType,
        entityId,
        userId,
        userRole,
        meta,
        createdAt
      FROM audit_logs
      WHERE companyId = ?
    `;

    const params = [companyId];

    /* 🔍 Optional filters */
    if (branchId) {
      sql += ` AND branchId = ?`;
      params.push(branchId);
    }

    if (entityType) {
      sql += ` AND entityType = ?`;
      params.push(entityType);
    }

    if (action) {
      sql += ` AND action = ?`;
      params.push(action);
    }

    if (userId) {
      sql += ` AND userId = ?`;
      params.push(userId);
    }

    sql += `
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), Number(offset));

    const [logs] = await db.query(sql, params);

    res.json(logs);
  } catch (err) {
    console.error("AUDIT LOG FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to load audit logs" });
  }
};
// controllers/onboarding.controller.js



export const getOwnerOnboardingStatus = async (req, res, next) => {
  try {
    const { id: userId, companyId, role } = req.user;

    if (role !== "OWNER") {
      return res.status(403).json({ message: "Only owner allowed" });
    }

    // no company yet
    if (!companyId) {
      return res.json({
        hasCompany: false,
        hasBranch: false,
      });
    }

    // check branches
    const [[branch]] = await db.query(
      `SELECT id FROM branches WHERE company_id = ? LIMIT 1`,
      [companyId]
    );

    res.json({
      hasCompany: true,
      hasBranch: !!branch,
    });
  } catch (err) {
    next(err);
  }
};
/* ===============================
   GET OWNER PROFILE
================================ */
export const getOwnerProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [[owner]] = await db.query(
      `SELECT id, full_name, email
       FROM users
       WHERE id = ? AND role = 'OWNER'`,
      [userId]
    );

    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    res.json(owner);
  } catch (err) {
    next(err);
  }
};
/* ===============================
   UPDATE OWNER PROFILE
================================ */
/* ===============================
   UPDATE OWNER PROFILE
================================ */
export const updateOwnerProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, email, password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: "Password confirmation required",
      });
    }

    /* VERIFY PASSWORD */

    const [[user]] = await db.query(
      `SELECT password_hash FROM users WHERE id = ?`,
      [userId]
    );

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    /* UPDATE PROFILE */

    await db.query(
      `UPDATE users
       SET full_name = ?, email = ?
       WHERE id = ?`,
      [name, email, userId]
    );

    res.json({
      message: "Profile updated successfully",
    });

  } catch (err) {
    next(err);
  }
};;
/* ===============================
   GET COMPANY SETTINGS
================================ */
/* ===============================
   GET COMPANY SETTINGS
================================ */
/* ===============================
   GET COMPANY SETTINGS
================================ */
export const getCompanySettings = async (req, res, next) => {
  try {

    const { companyId } = req.user;

    if (!companyId) {
      return res.status(400).json({
        message: "Company not found for user"
      });
    }

    const [[company]] = await db.query(
      `SELECT id, name, address, city
       FROM companies
       WHERE id = ?`,
      [companyId]
    );

    if (!company) {
      return res.status(404).json({
        message: "Company not found"
      });
    }
   console.log("USER:", req.user);
    res.json(company);

  } catch (err) {
    next(err);
  }
};
/* ===============================
   UPDATE COMPANY SETTINGS
================================ */
/* ===============================
   UPDATE COMPANY SETTINGS
================================ */
export const updateCompanySettings = async (req, res, next) => {
  try {
    const { companyId, id: userId } = req.user;

    const { hotelName, address, city, password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: "Password confirmation required",
      });
    }

    /* VERIFY PASSWORD */

    const [[user]] = await db.query(
      `SELECT password_hash FROM users WHERE id = ?`,
      [userId]
    );

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    /* UPDATE COMPANY */

    await db.query(
      `UPDATE companies
       SET name = ?, address = ?, city = ?
       WHERE id = ?`,
      [hotelName, address, city, companyId]
    );

    res.json({
      message: "Company settings updated",
    });

  } catch (err) {
    next(err);
  }
};
/* ===============================
   CHANGE OWNER PASSWORD
================================ */
export const changeOwnerPassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Both passwords are required",
      });
    }

    const [[user]] = await db.query(
      `SELECT password_hash FROM users WHERE id = ?`,
      [userId]
    );

    const match = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!match) {
      return res.status(401).json({
        message: "Current password incorrect",
      });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE users SET password_hash = ? WHERE id = ?`,
      [hash, userId]
    );

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
};