import bcrypt from "bcrypt";
import { db } from "../config/db.js";

/* ===============================
   CREATE STAFF
   Roles: WAITER | KITCHEN | CASHIER
================================ */
export const createStaff = async (req, res, next) => {
  const conn = await db.getConnection();

  try {
    const {
      fullName,
      email,
      mobile,     // phone number
      address,    // ✅ NEW
      password,
      role,
    } = req.body;

    const { companyId, branchId, role: userRole } = req.user;

    if (userRole !== "MANAGER") {
      return res.status(403).json({
        message: "Only managers can create staff",
      });
    }

    if (!companyId || !branchId) {
      return res.status(403).json({
        message: "Company and branch context required",
      });
    }

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const normalizedRole = role.toUpperCase();
    const allowedRoles = ["WAITER", "KITCHEN", "CASHIER"];

    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({
        message: "Invalid staff role",
      });
    }

    await conn.beginTransaction();

    /* 🔎 Email check (company scoped) */
    const [[exists]] = await conn.query(
      `SELECT id FROM users WHERE email = ? AND company_id = ?`,
      [email, companyId]
    );

    if (exists) {
      await conn.rollback();
      return res.status(409).json({
        message: "Email already exists in this company",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    /* 👤 Insert user */
    const [result] = await conn.query(
      `INSERT INTO users
       (
         company_id,
         full_name,
         email,
         mobile,
         address,        -- ✅ NEW
         password_hash,
         role,
         is_active
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        companyId,
        fullName,
        email,
        mobile || null,
        address?.trim() || null,
        passwordHash,
        normalizedRole,
      ]
    );

    const staffUserId = result.insertId;

    /* 🔗 Map staff to branch */
    await conn.query(
      `INSERT IGNORE INTO staff_branches (user_id, branch_id)
       VALUES (?, ?)`,
      [staffUserId, branchId]
    );

    await conn.commit();

    res.status(201).json({
      staffId: staffUserId,
      message: "Staff created successfully",
    });

  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};


/* ===============================
   GET STAFF (BRANCH SCOPED)
================================ */
export const getStaff = async (req, res, next) => {
  try {
    const { branchId } = req.user;
    const { search } = req.query;

    let query = `
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.mobile,
        u.address,
        u.role,
        u.is_active,
        u.created_at
      FROM users u
      JOIN staff_branches sb ON sb.user_id = u.id
      WHERE sb.branch_id = ?
        AND u.role IN ('WAITER','KITCHEN','CASHIER')
    `;

    const params = [branchId];

    if (search) {
      query += `
        AND (
          u.full_name LIKE ?
          OR u.email LIKE ?
          OR u.mobile LIKE ?
        )
      `;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += " ORDER BY u.created_at DESC";

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};


/* ===============================
   UPDATE STAFF STATUS
================================ */
export const updateStaffStatus = async (req, res, next) => {
  try {
    const staffId = req.params.id;
    const { status } = req.body;
    const { branchId } = req.user;

    if (![0, 1].includes(status)) {
      return res.status(400).json({
        message: "Status must be 0 or 1"
      });
    }

    const [result] = await db.query(
      `UPDATE users u
       JOIN staff_branches sb ON sb.user_id = u.id
       SET u.is_active = ?
       WHERE u.id = ? AND sb.branch_id = ?`,
      [status, staffId, branchId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Staff not found in this branch"
      });
    }

    res.json({ message: "Staff status updated successfully" });

  } catch (err) {
    next(err);
  }
};
export const updateStaff = async (req, res, next) => {
  try {
    const staffId = req.params.id;
    const { fullName, email, mobile, address, role } = req.body;
    const { companyId, branchId, role: userRole } = req.user;

    if (userRole !== "MANAGER") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (!fullName || !email || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [result] = await db.query(
      `UPDATE users u
       JOIN staff_branches sb ON sb.user_id = u.id
       SET 
         u.full_name = ?,
         u.email = ?,
         u.mobile = ?,
         u.address = ?,
         u.role = ?
       WHERE u.id = ?
         AND u.company_id = ?
         AND sb.branch_id = ?`,
      [
        fullName,
        email,
        mobile || null,
        address || null,
        role.toUpperCase(),
        staffId,
        companyId,
        branchId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.json({ message: "Staff updated successfully" });
  } catch (err) {
    next(err);
  }
};

export const getStaffById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { branchId } = req.user;

    const [[staff]] = await db.query(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.mobile,
         u.address,
         u.role,
         u.is_active,
         u.created_at
       FROM users u
       JOIN staff_branches sb ON sb.user_id = u.id
       WHERE u.id = ? AND sb.branch_id = ?`,
      [id, branchId]
    );

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.json(staff);
  } catch (err) {
    next(err);
  }
};
/* ===============================
   DELETE STAFF
================================ */
export const deleteStaff = async (req, res, next) => {
  try {
    const staffId = req.params.id;
    const { companyId, branchId, role } = req.user;

    if (role !== "MANAGER") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await db.query(
      `DELETE u FROM users u
       JOIN staff_branches sb ON sb.user_id = u.id
       WHERE u.id = ?
         AND u.company_id = ?
         AND sb.branch_id = ?`,
      [staffId, companyId, branchId]
    );

    res.json({ message: "Staff deleted successfully" });
  } catch (err) {
    next(err);
  }
};
