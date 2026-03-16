import bcrypt from "bcrypt";
import { db } from "../config/db.js";
import { auditLog } from "../utils/auditlogger.js";


export const createCompanyWithOwner = async (req, res, next) => {
  let conn;

  try {
    /* ===============================
       🔐 SUPER ADMIN GUARD
    =============================== */
    if (!req.user || req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        message: "Only super admin can create company",
      });
    }

    const {
      // company
      restaurantName,
      gstNumber,
      foodLicenseNumber,
      address,
      country,
      state,
      city,
      pincode,
      businessStartDate,
      contractType,
      teamSize,

      // owner
      ownerName,
      ownerEmail,
      ownerMobile,
      ownerPassword,
    } = req.body;

    /* ===============================
       ✅ VALIDATION
    =============================== */
    if (!restaurantName || !ownerName || !ownerEmail || !ownerPassword) {
      return res.status(400).json({
        message:
          "restaurantName, ownerName, ownerEmail and ownerPassword are required",
      });
    }

    const normalizedEmail = ownerEmail.trim().toLowerCase();
    const cleanRestaurantName = restaurantName.trim();

    conn = await db.getConnection();
    await conn.beginTransaction();

    /* ===============================
       🔍 OWNER EMAIL UNIQUE
    =============================== */
    const [[existingOwner]] = await conn.query(
      `SELECT id FROM users WHERE email = ?`,
      [normalizedEmail]
    );

    if (existingOwner) {
      await conn.rollback();
      return res.status(409).json({
        message: "Owner email already exists",
      });
    }

    /* ===============================
       🔐 HASH PASSWORD
    =============================== */
    const passwordHash = await bcrypt.hash(ownerPassword, 10);

    /* ===============================
       🏢 CREATE COMPANY
    =============================== */
    const [companyResult] = await conn.query(
      `INSERT INTO companies (
        name,
        gst_number,
        food_license_number,
        address,
        country,
        state,
        city,
        pincode,
        business_start_date,
        contract_type,
        team_size,
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        cleanRestaurantName,
        gstNumber?.trim() || null,
        foodLicenseNumber?.trim() || null,
        address?.trim() || null,
        country?.trim() || null,
        state?.trim() || null,
        city?.trim() || null,
        pincode?.trim() || null,
        businessStartDate || null,
        contractType || null,
        teamSize || null,
      ]
    );

    const companyId = companyResult.insertId;

    /* ===============================
       👑 CREATE OWNER
    =============================== */
    const [ownerResult] = await conn.query(
      `INSERT INTO users
       (company_id, full_name, email, mobile, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, ?, 'OWNER', 1)`,
      [
        companyId,
        ownerName.trim(),
        normalizedEmail,
        ownerMobile?.trim() || null,
        passwordHash,
      ]
    );

    /* ===============================
       🧾 AUDIT LOG (ENTERPRISE)
    =============================== */
    await auditLog({
      req,
      action: "CREATE_COMPANY_WITH_OWNER",
      entityType: "company",
      entityId: companyId,
      meta: {
        ownerId: ownerResult.insertId,
        ownerEmail: normalizedEmail,
      },
    });

    await conn.commit();

    return res.status(201).json({
      message: "Company and owner created successfully",
      data: {
        companyId,
        ownerId: ownerResult.insertId,
      },
    });
  } catch (err) {
    if (conn) await conn.rollback();
    next(err);
  } finally {
    if (conn) conn.release();
  }
};


/* =====================================================
   GET ALL OWNERS (SUPER ADMIN)
===================================================== */
export const getPlatformOwners = async (req, res, next) => {
  try {
    /* 🔐 DEFENSE IN DEPTH */
    if (!req.user || req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        message: "Only super admin allowed",
      });
    }

    let { search = "", limit = 20, offset = 0 } = req.query;

    // 🛡️ hard cap
    limit = Math.min(Number(limit) || 20, 100);
    offset = Number(offset) || 0;

    let sql = `
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.mobile,
        u.is_active,
        u.created_at,
        c.name AS companyName
      FROM users u
      LEFT JOIN companies c ON c.id = u.company_id
      WHERE u.role = 'OWNER'
    `;

    const params = [];

    if (search) {
      sql += `
        AND (
          u.full_name LIKE ?
          OR u.email LIKE ?
        )
      `;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += `
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const [rows] = await db.query(sql, params);

    res.json(rows);
  } catch (err) {
    next(err);
  }
};


/* =====================================================
   CREATE OWNER (SUPER ADMIN ONLY)
===================================================== */
export const createOwnerBySuperAdmin = async (req, res, next) => {
  try {
    /* 🔐 DEFENSE IN DEPTH */
    if (!req.user || req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        message: "Only super admin allowed",
      });
    }

    const { fullName, email, mobile, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "fullName, email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    /* 🔍 check existing email */
    const [[exists]] = await db.query(
      `SELECT id FROM users WHERE email = ?`,
      [normalizedEmail]
    );

    if (exists) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users
       (company_id, full_name, email, mobile, password_hash, role, is_active)
       VALUES (NULL, ?, ?, ?, ?, 'OWNER', 1)`,
      [
        fullName.trim(),
        normalizedEmail,
        mobile?.trim() || null,
        passwordHash,
      ]
    );

    /* 🧾 AUDIT */
    await auditLog({
      req,
      action: "CREATE_OWNER",
      entityType: "user",
      entityId: result.insertId,
      meta: { email: normalizedEmail },
    });

    res.status(201).json({
      message: "Owner created successfully",
      ownerId: result.insertId,
    });
  } catch (err) {
    next(err);
  }
};


/* =====================================================
   UPDATE OWNER STATUS (ACTIVATE / SUSPEND)
===================================================== */
export const updateOwnerStatus = async (req, res, next) => {
  try {
    /* 🔐 DEFENSE IN DEPTH */
    if (!req.user || req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        message: "Only super admin allowed",
      });
    }

    const ownerId = req.params.id;
    const { status } = req.body;

    if (![0, 1].includes(status)) {
      return res.status(400).json({
        message: "Status must be 0 or 1",
      });
    }

    const [result] = await db.query(
      `UPDATE users
       SET is_active = ?
       WHERE id = ? AND role = 'OWNER'`,
      [status, ownerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Owner not found",
      });
    }

    /* 🧾 AUDIT */
    await auditLog({
      req,
      action: "UPDATE_OWNER_STATUS",
      entityType: "user",
      entityId: ownerId,
      meta: { status },
    });

    res.json({
      message: "Owner status updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const getPlatformCompanies = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        message: "Only super admin allowed",
      });
    }

    let { search = "", limit = 10, offset = 0 } = req.query;

    limit = Math.min(Number(limit) || 10, 100);
    offset = Number(offset) || 0;

    const searchTerm = `%${search}%`;

    /* ================= MAIN QUERY ================= */
    const [rows] = await db.query(
      `
      SELECT
        id,
        name,
        gst_number,
        city,
        contract_type,
        is_active,
        created_at
      FROM companies
      WHERE name LIKE ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
      `,
      [searchTerm, limit, offset]
    );

    /* ================= COUNT QUERY ================= */
    const [[countRow]] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM companies
      WHERE name LIKE ?
      `,
      [searchTerm]
    );

    res.json({
      data: rows,
      total: countRow.total,
    });
  } catch (err) {
    next(err);
  }
};
