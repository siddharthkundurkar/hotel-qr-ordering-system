import bcrypt from "bcrypt";
import crypto from "crypto";
import { db } from "../config/db.js";
import { generateAccessToken } from "../utils/token.js";
import { auditLog } from "../utils/auditlogger.js";

/* ===============================
   LOGIN
================================ */
const safeAudit = async (req, action, meta = {}) => {
  try {
    await auditLog({
      req,
      action,
      entityType: "auth",
      entityId: meta.userId || 0, // ✅ prevents NULL crash
      meta,
    });
  } catch (err) {
    console.warn("⚠️ Audit log failed:", err.message);
  }
};

export const login = async (req, res, next) => {
  try {
    console.log("🚀 USING UPDATED LOGIN CONTROLLER FILE");

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    /* =================================================
       🔎 Get latest active user (✅ include branch_id)
    ================================================= */
    const [[user]] = await db.query(
      `SELECT 
          id,
          email,
          password_hash,
          role,
          company_id,
          branch_id,
          is_active
       FROM users
       WHERE email = ? AND is_active = 1
       ORDER BY id DESC
       LIMIT 1`,
      [email]
    );

    if (!user) {
      await safeAudit(req, "LOGIN_FAILED", { email });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    /* =================================================
       🔐 Password check
    ================================================= */
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      await safeAudit(req, "LOGIN_FAILED", { email });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("🔥 LOGIN USER FROM DB:", user);

    /* =================================================
       🏢 Company safety check (skip SUPER_ADMIN)
    ================================================= */
    if (user.role !== "SUPER_ADMIN") {
      const [[company]] = await db.query(
        `SELECT id, is_active FROM companies WHERE id = ? LIMIT 1`,
        [user.company_id]
      );

      if (!company || company.is_active !== 1) {
        return res.status(403).json({
          message: "Company is inactive",
        });
      }
    }

    /* =================================================
       🎯 ENTERPRISE BRANCH RESOLUTION
    ================================================= */
    const STAFF_FIXED_BRANCH = ["KITCHEN", "WAITER", "CASHIER"];

    let branchId = null;

    // ✅ staff → fixed branch from DB
    if (STAFF_FIXED_BRANCH.includes(user.role)) {
      if (!user.branch_id) {
        return res.status(403).json({
          message: "Staff is not assigned to any branch",
        });
      }
      branchId = Number(user.branch_id);
    }

    // ✅ manager → selects later (keep null)
    if (user.role === "MANAGER") {
      branchId = null;
    }

    /* =================================================
       🎟️ Generate access token
    ================================================= */
    const accessToken = generateAccessToken({
      id: user.id,
      role: user.role,
      companyId: user.company_id,
      branchId,
    });

    /* =================================================
       🔁 Refresh token rotation
    ================================================= */
    const refreshToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.query(`DELETE FROM refresh_tokens WHERE userId = ?`, [
      user.id,
    ]);

    await db.query(
      `INSERT INTO refresh_tokens (userId, token, expiresAt, branch_id)
       VALUES (?, ?, ?, ?)`,
      [user.id, refreshToken, expiresAt, branchId]
    );

    /* =================================================
       🧾 Safe audit
    ================================================= */
    await safeAudit(req, "LOGIN_SUCCESS", {
      userId: user.id,
    });

    /* =================================================
       🍪 Cookie
    ================================================= */
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      accessToken,
      user: {
        id: user.id,
        role: user.role,
        companyId: user.company_id,
        branchId,
      },
    });
  } catch (err) {
    next(err);
  }
};




export const selectBranch = async (req, res, next) => {
  try {
    const { branchId } = req.body;
    const user = req.user;

    if (!branchId) {
      return res.status(400).json({ message: "branchId is required" });
    }

    if (user.role !== "MANAGER") {

      return res.status(403).json({ message: "Only managers can select branch" });
    }

const [rows] = await db.query(
  `SELECT id FROM branches WHERE id = ? AND company_id = ?`,
  [branchId, user.companyId]
);


    if (rows.length === 0) {
      return res.status(404).json({ message: "Invalid branch" });
    }

    // 🔄 Rotate refresh token
    const oldRefresh = req.cookies.refreshToken;
    if (oldRefresh) {
      await db.query(`DELETE FROM refresh_tokens WHERE token = ?`, [oldRefresh]);
    }

    const newRefreshToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

   await db.query(
  `INSERT INTO refresh_tokens (userId, token, expiresAt, branch_id)
   VALUES (?, ?, ?, ?)`,
  [user.id, newRefreshToken, expiresAt, branchId]
);

    const accessToken = generateAccessToken({
      id: user.id,
      role: user.role,
      companyId: user.companyId,
      branchId
    });

    res
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      .json({ accessToken });

  } catch (err) {
    next(err);
  }
};

export const authMe = (req, res) => {
  // ❌ DO NOT reference accessToken here

  res.json({
    id: req.user.id,
    role: req.user.role,
    companyId: req.user.companyId,
    branchId: req.user.branchId,
  });
};



export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await db.query(
        `DELETE FROM refresh_tokens WHERE token = ?`,
        [refreshToken]
      );
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",   // 🔥 REQUIRED
    });

    res.json({ message: "Logged out successfully" });

  } catch (err) {
    next(err);
  }
};

export const refreshAccessToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }

    /* ============================================
       🔍 Find existing token
    ============================================ */
    const [[row]] = await db.query(
      `SELECT
         rt.userId,
         rt.branch_id,
         u.role,
         u.company_id
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.userId
       WHERE rt.token = ?
         AND rt.expiresAt > NOW()`,
      [refreshToken]
    );

    if (!row) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    /* ============================================
       🔄 HARD ROTATION (DELETE + INSERT) ✅ BEST PRACTICE
    ============================================ */
    const newRefreshToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.query(
      `DELETE FROM refresh_tokens WHERE token = ?`,
      [refreshToken]
    );

    await db.query(
      `INSERT INTO refresh_tokens (userId, token, expiresAt, branch_id)
       VALUES (?, ?, ?, ?)`,
      [row.userId, newRefreshToken, expiresAt, row.branch_id]
    );

    /* ============================================
       🎟️ NEW ACCESS TOKEN
    ============================================ */
    const accessToken = generateAccessToken({
      id: row.userId,
      role: row.role,
      companyId: row.company_id,
      branchId: row.branch_id || null, // ⭐ important
    });

    /* ============================================
       🍪 SET COOKIE
    ============================================ */
   res.cookie("refreshToken", newRefreshToken, {
  httpOnly: true,
  secure: true,        // ✅ MUST be true for HTTPS
  sameSite: "none",    // ✅ MUST be none for cross-origin
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
    return res.json({ accessToken });

  } catch (err) {
    next(err);
  }
};