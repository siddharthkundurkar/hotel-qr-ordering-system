import cloudinary from "../config/cloudinary.js";
import { db } from "../config/db.js";

/* ================= CREATE MENU ITEM ================= */



export const createMenuItem = async (req, res, next) => {
  try {
    const { name, price, categoryId, isVeg, description } = req.body;
    const { branchId } = req.user;

    if (!name || !categoryId || Number(price) <= 0) {
      return res.status(400).json({
        message: "Valid name, price and categoryId are required",
      });
    }

    // ✅ clean description
    const cleanDescription =
      typeof description === "string" && description.trim().length > 0
        ? description.trim().slice(0, 255) // optional limit
        : null;

    let imageUrl = null;
    let imagePublicId = null;

    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "hms/menu" }, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          })
          .end(req.file.buffer);
      });

      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }

    await db.query(
      `INSERT INTO menu_items
       (
         name,
         price,
         categoryId,
         branchId,
         imageUrl,
         imagePublicId,
         is_veg,
         description
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        price,
        categoryId,
        branchId,
        imageUrl,
        imagePublicId,
        isVeg === "false" || isVeg === false ? 0 : 1,
        cleanDescription,
      ]
    );

    res.status(201).json({
      message: "Menu item created successfully",
    });
  } catch (err) {
    console.error("CREATE MENU ITEM ERROR:", err);
    next(err);
  }
};




/* ================= GET MENU ITEMS ================= */

export const getMenuItems = async (req, res, next) => {
  try {
    const { branchId } = req.user;
    const { categoryId, search } = req.query;

    let query = `
      SELECT 
        mi.id,
        mi.name,

        -- 🔥 NORMAL ITEM PRICE OR COMBO PRICE
        IF(mi.is_combo = 1, mi.combo_price, mi.price) AS price,

        mi.combo_price,
        mi.imageUrl,
        mi.is_available,
        mi.categoryId,
        mi.is_veg,
        mi.description,
        mi.is_combo,
        mc.name AS category,

        COUNT(ci.id) AS comboCount

      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mc.id = mi.categoryId
      LEFT JOIN combo_items ci ON ci.comboId = mi.id
      WHERE mi.branchId = ?
    `;

    const params = [branchId];

    if (categoryId) {
      query += " AND mi.categoryId = ?";
      params.push(categoryId);
    }

    if (search) {
      query += " AND mi.name LIKE ?";
      params.push(`%${search}%`);
    }

    query += `
      GROUP BY mi.id
      ORDER BY mi.createdAt DESC
    `;

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};



/* ================= TOGGLE AVAILABILITY ================= */

export const toggleMenuItemAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { branchId } = req.user;

    const [result] = await db.query(
      `UPDATE menu_items
       SET is_available = NOT is_available
       WHERE id = ? AND branchId = ?`,
      [id, branchId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json({ message: "Menu availability updated" });
  } catch (err) {
    next(err);
  }
};

/* ================= UPDATE MENU ITEM ================= */

export const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, categoryId, isVeg, description } = req.body;
    const { branchId } = req.user;

    const [[item]] = await db.query(
      `SELECT imageUrl, imagePublicId, is_combo
       FROM menu_items
       WHERE id = ? AND branchId = ?`,
      [id, branchId]
    );

    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    let imageUrl = item.imageUrl;
    let imagePublicId = item.imagePublicId;

    if (req.file) {
      if (imagePublicId) {
        await cloudinary.uploader.destroy(imagePublicId);
      }

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "hms/menu" }, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          })
          .end(req.file.buffer);
      });

      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }

    /* 🔥 UPDATE NORMAL ITEM vs COMBO */
    if (item.is_combo) {
      await db.query(
        `UPDATE menu_items
         SET
           name = ?,
           categoryId = ?,
           is_veg = ?,
           description = ?,
           imageUrl = ?,
           imagePublicId = ?
         WHERE id = ? AND branchId = ?`,
        [
          name,
          categoryId,
          isVeg === "false" || isVeg === false ? 0 : 1,
          description?.trim() || null,
          imageUrl,
          imagePublicId,
          id,
          branchId,
        ]
      );
    } else {
      if (Number(price) <= 0) {
        return res.status(400).json({ message: "Invalid price" });
      }

      await db.query(
        `UPDATE menu_items
         SET
           name = ?,
           price = ?,
           categoryId = ?,
           is_veg = ?,
           description = ?,
           imageUrl = ?,
           imagePublicId = ?
         WHERE id = ? AND branchId = ?`,
        [
          name,
          price,
          categoryId,
          isVeg === "false" || isVeg === false ? 0 : 1,
          description?.trim() || null,
          imageUrl,
          imagePublicId,
          id,
          branchId,
        ]
      );
    }

    res.json({ message: "Menu item updated successfully" });
  } catch (err) {
    console.error("UPDATE MENU ITEM ERROR:", err);
    next(err);
  }
};




/* ================= DELETE MENU ITEM ================= */

export const deleteMenuItem = async (req, res, next) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;
    const { branchId } = req.user;

    await connection.beginTransaction();

    /* 1️⃣ Get item */
    const [[item]] = await connection.query(
      `SELECT imagePublicId
       FROM menu_items
       WHERE id = ? AND branchId = ?`,
      [id, branchId]
    );

    if (!item) {
      await connection.rollback();
      return res.status(404).json({
        message: "Menu item not found",
      });
    }

    /* 2️⃣ Delete image from Cloudinary (safe) */
    if (item.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(item.imagePublicId);
      } catch (cloudErr) {
        console.warn(
          "Cloudinary delete failed:",
          cloudErr.message
        );
        // ❗ Do NOT block DB delete
      }
    }

    /* 3️⃣ Delete menu item */
    await connection.query(
      `DELETE FROM menu_items
       WHERE id = ? AND branchId = ?`,
      [id, branchId]
    );

    await connection.commit();

    res.json({
      message: "Menu item deleted successfully",
    });
  } catch (err) {
    await connection.rollback();
    console.error("DELETE MENU ITEM ERROR:", err);
    next(err);
  } finally {
    connection.release();
  }
};

export const createCombo = async (req, res, next) => {
  console.log("CREATE COMBO BODY (backend):", req.body);

  const connection = await db.getConnection();

  try {
    const {
      name,
      price,        // ✅ FIXED
      categoryId,
      isVeg,
      description,
      items,        // [{ itemId, quantity }]
    } = req.body;

    const { branchId } = req.user;

    if (!name || !price || !categoryId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Invalid combo data",
      });
    }

    await connection.beginTransaction();

    /* 1️⃣ Create combo menu item */
    const [result] = await connection.query(
      `INSERT INTO menu_items
       (name, price, is_combo, categoryId, branchId, is_veg, description)
       VALUES (?, ?, 1, ?, ?, ?, ?)`,
      [
        name,
        price,
        categoryId,
        branchId,
        isVeg === "false" || isVeg === false ? 0 : 1,
        description || null,
      ]
    );

    const comboId = result.insertId;

    /* 2️⃣ Insert combo items */
    for (const i of items) {
      await connection.query(
        `INSERT INTO combo_items (comboId, itemId, quantity)
         VALUES (?, ?, ?)`,
        [comboId, i.itemId, i.quantity || 1]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Combo created successfully",
      comboId,
    });
  } catch (err) {
    await connection.rollback();
    console.error("CREATE COMBO ERROR (backend):", err);
    next(err);
  } finally {
    connection.release();
  }
};
