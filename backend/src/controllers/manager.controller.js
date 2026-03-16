// controllers/manager.settings.controller.js

import { db } from "../config/db.js";
import bcrypt from "bcryptjs";

/* =========================================
   GET MANAGER PROFILE
========================================= */
export const getManagerProfile = async (req, res) => {
  try {
    const managerId = req.user.id;

    const [rows] = await db.query(
      `SELECT 
        id,
        full_name,
        email,
        role,
        created_at
      FROM users
      WHERE id = ? AND role = 'manager'
      LIMIT 1`,
      [managerId]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Manager not found",
      });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Manager profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================
   UPDATE MANAGER PROFILE
========================================= */
export const updateManagerProfile = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { full_name, email } = req.body;

    await db.query(
      `UPDATE users 
       SET full_name = ?, email = ?
       WHERE id = ? AND role = 'manager'`,
      [full_name, email, managerId]
    );

    res.json({
      message: "Profile updated successfully",
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================
   CHANGE PASSWORD
========================================= */
export const changeManagerPassword = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const [rows] = await db.query(
      "SELECT password FROM users WHERE id = ?",
      [managerId]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const valid = await bcrypt.compare(
      currentPassword,
      rows[0].password
    );

    if (!valid) {
      return res.status(400).json({
        message: "Current password incorrect",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashed, managerId]
    );

    res.json({
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================
   GET BRANCH INFO
========================================= */
export const getManagerBranch = async (req, res) => {
  try {
    const managerId = req.user.id;

   const [rows] = await db.query(
  `SELECT 
    b.id,
    b.name,
    b.address
  FROM branches b
  JOIN users u ON u.branch_id = b.id
  WHERE u.id = ?`,
  [managerId]
);
    res.json(rows[0] || {});
  } catch (err) {
    console.error("Branch fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};