import bcrypt from "bcrypt";
import crypto from "crypto";
import { db } from "../config/db.js";
import { generateAccessToken } from "../utils/token.js";

/* ===============================
   STAFF LOGIN (SINGLE AUTH SYSTEM)
   Roles: WAITER | KITCHEN | CASHIER
================================ */

export const staffLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    /* 1️⃣ Fetch staff user */
    const [[user]] = await db.query(
      `SELECT 
         id,
         password_hash,
         role,
         is_active,
         company_id
       FROM users
       WHERE email = ?
         AND role IN ('WAITER','KITCHEN','CASHIER')`,
      [email]
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    /* 2️⃣ Check active status */
    if (!user.is_active) {
      return res.status(403).json({
        message: "Staff account is inactive"
      });
    }

    /* 3️⃣ Verify password */
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    /* 4️⃣ Fetch staff branch (single-branch staff) */
    const [[branchRow]] = await db.query(
      `SELECT branch_id
       FROM staff_branches
       WHERE user_id = ?`,
      [user.id]
    );

    if (!branchRow) {
      return res.status(403).json({
        message: "Staff is not assigned to any branch"
      });
    }

    const branchId = branchRow.branch_id;

    /* 5️⃣ Generate tokens */
    const accessToken = generateAccessToken({
      id: user.id,
      role: user.role,
      companyId: user.company_id,
      branchId
    });

    const refreshToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

   // 🔥 Remove old refresh tokens first
await db.query(
  `DELETE FROM refresh_tokens WHERE userId = ?`,
  [user.id]
);

await db.query(
  `INSERT INTO refresh_tokens (userId, token, expiresAt, branch_id)
   VALUES (?, ?, ?, ?)`,
  [user.id, refreshToken, expiresAt, branchId]
);


    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      accessToken,
      role: user.role
    });

  } catch (err) {
    next(err);
  }
};
