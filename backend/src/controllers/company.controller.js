import { db } from "../config/db.js";
import { generateAccessToken } from "../utils/token.js";

export const createCompany = async (req, res, next) => {
  let conn;

  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== "OWNER") {
      return res.status(403).json({
        message: "Only owner can create company",
      });
    }

    const {
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
    } = req.body;

    if (!restaurantName) {
      return res.status(400).json({
        message: "Company name is required",
      });
    }

    const ownerId = req.user.id;

    conn = await db.getConnection();
    await conn.beginTransaction();

    /* 🔒 LOCK OWNER ROW (prevents double company creation) */
    const [[owner]] = await conn.query(
      `SELECT company_id
       FROM users
       WHERE id = ?
       FOR UPDATE`,
      [ownerId]
    );

    if (!owner) {
      await conn.rollback();
      return res.status(404).json({
        message: "Owner not found",
      });
    }

    if (owner.company_id) {
      await conn.rollback();
      return res.status(409).json({
        message: "Owner already has a company",
      });
    }

    /* 1️⃣ Create company */
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
        restaurantName,
        gstNumber || null,
        foodLicenseNumber || null,
        address || null,
        country || null,
        state || null,
        city || null,
        pincode || null,
        businessStartDate || null,
        contractType || null,
        teamSize || null,
      ]
    );

    const companyId = companyResult.insertId;

    /* 2️⃣ Attach company to owner */
    const [updateResult] = await conn.query(
      `UPDATE users SET company_id = ? WHERE id = ?`,
      [companyId, ownerId]
    );

    if (updateResult.affectedRows === 0) {
      throw new Error("Failed to attach company to owner");
    }

    await conn.commit();

    /* 🔄 ISSUE NEW ACCESS TOKEN WITH UPDATED companyId */
    const accessToken = generateAccessToken({
      id: ownerId,
      role: req.user.role,
      companyId,
      branchId: null,
    });

    return res.status(201).json({
      message: "Company created successfully",
      companyId,
      accessToken,
    });
  } catch (err) {
    if (conn) await conn.rollback();
    next(err);
  } finally {
    if (conn) conn.release();
  }
};
