import { db } from "../config/db.js";

/* ================= CREATE CATEGORY ================= */

export const createMenuCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    const { branchId } = req.user;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const [existing] = await db.query(
      `SELECT id FROM menu_categories WHERE name = ? AND branchId = ?`,
      [name, branchId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "Category already exists" });
    }

    await db.query(
      `INSERT INTO menu_categories (name, branchId)
       VALUES (?, ?)`,
      [name, branchId]
    );

    res.status(201).json({ message: "Menu category created" });
  } catch (err) {
    next(err);
  }
};

/* ================= GET CATEGORIES ================= */

export const getMenuCategories = async (req, res, next) => {
  try {
    const { branchId } = req.user;

    const [rows] = await db.query(
      `SELECT id, name, is_active
       FROM menu_categories
       WHERE branchId = ?
       ORDER BY name`,
      [branchId]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/* ================= TOGGLE CATEGORY ================= */

export const toggleMenuCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { branchId } = req.user;

    await db.query(
      `UPDATE menu_categories
       SET is_active = NOT is_active
       WHERE id = ? AND branchId = ?`,
      [id, branchId]
    );

    res.json({ message: "Category status updated" });
  } catch (err) {
    next(err);
  }
};
