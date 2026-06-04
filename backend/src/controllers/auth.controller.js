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
    console.log("=================================");
    console.log("🚀 LOGIN REQUEST RECEIVED");
    console.log("BODY:", req.body);
    console.log("=================================");

    const { email, password } = req.body;

    console.log("📧 EMAIL:", email);
    console.log("🔑 PASSWORD LENGTH:", password?.length);

    if (!email || !password) {
      console.log("❌ Missing email or password");

      return res.status(400).json({
        message: "Email and password required",
      });
    }

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

    console.log("🔍 USER FOUND:", user);

    if (!user) {
      console.log("❌ USER NOT FOUND");

      await safeAudit(req, "LOGIN_FAILED", { email });

      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    console.log("👤 USER ID:", user.id);
    console.log("👤 USER ROLE:", user.role);
    console.log("👤 USER ACTIVE:", user.is_active);
    console.log("👤 USER COMPANY:", user.company_id);

    const isMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    console.log("🔐 PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      console.log("❌ PASSWORD DOES NOT MATCH");

      await safeAudit(req, "LOGIN_FAILED", { email });

      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    console.log("✅ PASSWORD VERIFIED");

    if (user.role !== "SUPER_ADMIN") {
      const [[company]] = await db.query(
        `SELECT id, is_active
         FROM companies
         WHERE id = ?
         LIMIT 1`,
        [user.company_id]
      );

      console.log("🏢 COMPANY:", company);

      if (!company || company.is_active !== 1) {
        console.log("❌ COMPANY INACTIVE");

        return res.status(403).json({
          message: "Company is inactive",
        });
      }
    }

    let branchId = null;

    const STAFF_FIXED_BRANCH = [
      "KITCHEN",
      "WAITER",
      "CASHIER",
    ];

    if (STAFF_FIXED_BRANCH.includes(user.role)) {
      console.log("👨‍🍳 STAFF LOGIN");

      if (!user.branch_id) {
        console.log("❌ STAFF HAS NO BRANCH");

        return res.status(403).json({
          message: "Staff is not assigned to any branch",
        });
      }

      branchId = Number(user.branch_id);
    }

    console.log("🌿 BRANCH ID:", branchId);

    const accessToken = generateAccessToken({
      id: user.id,
      role: user.role,
      companyId: user.company_id,
      branchId,
    });

    console.log("🎟️ ACCESS TOKEN GENERATED");

    const refreshToken = crypto.randomUUID();

    console.log("🔄 REFRESH TOKEN:", refreshToken);

    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    await db.query(
      `DELETE FROM refresh_tokens WHERE userId = ?`,
      [user.id]
    );

    console.log("🗑️ OLD TOKENS DELETED");

    const [insertResult] = await db.query(
      `INSERT INTO refresh_tokens
       (userId, token, expiresAt, branch_id)
       VALUES (?, ?, ?, ?)`,
      [user.id, refreshToken, expiresAt, branchId]
    );

    console.log("✅ REFRESH TOKEN SAVED:", insertResult);

    await safeAudit(req, "LOGIN_SUCCESS", {
      userId: user.id,
    });

    console.log("📝 AUDIT LOG SUCCESS");

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log("🍪 COOKIE SET");

    console.log("✅ LOGIN SUCCESS");
    console.log("=================================");

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
    console.error("💥 LOGIN ERROR:", err);
    console.error("💥 MESSAGE:", err.message);
    console.error("💥 STACK:", err.stack);

    next(err);
  }
};


export const selectBranch = async (req, res, next) => {
  try {
    const { branchId } = req.body;
    const user = req.user;

    if (!branchId) {
      return res.status(400).json({
        message: "branchId is required",
      });
    }

    if (user.role !== "MANAGER") {
      return res.status(403).json({
        message: "Only managers can select branch",
      });
    }

    const [rows] = await db.query(
      `SELECT id FROM branches WHERE id = ? AND company_id = ?`,
      [branchId, user.companyId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Invalid branch",
      });
    }

    // 🔄 Remove old refresh token
    const oldRefresh = req.cookies.refreshToken;

    if (oldRefresh) {
      await db.query(
        `DELETE FROM refresh_tokens WHERE token = ?`,
        [oldRefresh]
      );
    }

    // 🆕 Generate new refresh token
    const newRefreshToken = crypto.randomUUID();

    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    await db.query(
      `INSERT INTO refresh_tokens
       (userId, token, expiresAt, branch_id)
       VALUES (?, ?, ?, ?)`,
      [user.id, newRefreshToken, expiresAt, branchId]
    );

    // 🎟️ Generate access token
    const accessToken = generateAccessToken({
      id: user.id,
      role: user.role,
      companyId: user.companyId,
      branchId,
    });

    // 🍪 Production-safe cookie
    res
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        accessToken,
      });

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

    // 🗑️ Remove token from DB
    if (refreshToken) {
      await db.query(
        `DELETE FROM refresh_tokens WHERE token = ?`,
        [refreshToken]
      );
    }

    // 🍪 Clear cookie properly for cross-origin HTTPS
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    return res.json({
      message: "Logged out successfully",
    });

  } catch (err) {
    next(err);
  }
};
export const refreshAccessToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    // ❌ No cookie found
    if (!refreshToken) {
      return res.status(401).json({
        message: "No refresh token",
      });
    }

    /* ============================================
       🔍 Find token in DB
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

    // ❌ Invalid token
    if (!row) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    /* ============================================
       🔄 Rotate refresh token
    ============================================ */
    const newRefreshToken = crypto.randomUUID();

    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    // Remove old token
    await db.query(
      `DELETE FROM refresh_tokens WHERE token = ?`,
      [refreshToken]
    );

    // Insert new token
    await db.query(
      `INSERT INTO refresh_tokens
       (userId, token, expiresAt, branch_id)
       VALUES (?, ?, ?, ?)`,
      [
        row.userId,
        newRefreshToken,
        expiresAt,
        row.branch_id,
      ]
    );

    /* ============================================
       🎟️ Generate access token
    ============================================ */
    const accessToken = generateAccessToken({
      id: row.userId,
      role: row.role,
      companyId: row.company_id,
      branchId: row.branch_id || null,
    });

    /* ============================================
       🍪 Set refresh cookie
    ============================================ */
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      accessToken,
    });

  } catch (err) {
    next(err);
  }
};