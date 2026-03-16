import QRCode from "qrcode";
import crypto from "crypto";
import { db } from "../config/db.js";

const Client_URL = process.env.Client_URL || "https://hotel-qr-ordering-system.vercel.app";

export const createTable = async (req, res, next) => {
  try {
    const { tableNumber, floor, tableType, capacity } = req.body;
    const { companyId, branchId } = req.user;

    /* ================= VALIDATION ================= */

    if (!tableNumber || !floor || !capacity) {
      return res.status(400).json({
        message: "tableNumber, floor and capacity are required",
      });
    }

    if (Number(capacity) <= 0) {
      return res.status(400).json({
        message: "capacity must be greater than 0",
      });
    }

    // 🔥 Must match DB ENUM exactly
    const allowedTypes = ["REGULAR", "VIP", "FAMILY", "Hall"];
    const finalTableType = tableType || "REGULAR";

    if (!allowedTypes.includes(finalTableType)) {
      return res.status(400).json({
        message: "Invalid table type",
      });
    }

    /* ================= DUPLICATE CHECK ================= */

    const [existingRows] = await db.query(
      `SELECT id 
       FROM tables 
       WHERE branchId = ? 
         AND tableNumber = ? 
         AND is_deleted = 0`,
      [branchId, tableNumber]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({
        message: "Table already exists",
      });
    }

    /* ================= GENERATE SECURE UUID TOKEN ================= */

    const publicToken = crypto.randomUUID();

    /* ================= INSERT TABLE ================= */

    const [result] = await db.query(
      `INSERT INTO tables
        (tableNumber, floor, tableType, capacity, status, companyId, branchId, qrToken)
       VALUES (?, ?, ?, ?, 'available', ?, ?, ?)`,
      [
        tableNumber,
        floor,
        finalTableType,
        capacity,
        companyId,
        branchId,
        publicToken,
      ]
    );

    const tableId = result.insertId;

    /* ================= GENERATE QR IMAGE ================= */

    const qrUrl = `${Client_URL}/qr/${publicToken}`;
    const qrCode = await QRCode.toDataURL(qrUrl);

    await db.query(
      `UPDATE tables SET qrCode = ? WHERE id = ?`,
      [qrCode, tableId]
    );

    /* ================= DEBUG LOG (REMOVE IN PROD IF NEEDED) ================= */



    return res.status(201).json({
      message: "Table created successfully",
      table: {
        id: tableId,
        tableNumber,
        floor,
        tableType: finalTableType,
        capacity,
        status: "available",
        qrCode,
      },
    });
  } catch (err) {
    console.error("CREATE TABLE ERROR:", err);
    next(err);
  }
};



/* ================= GET TABLES ================= */

export const getTables = async (req, res, next) => {
  try {
    const { branchId } = req.user;

    const [rows] = await db.query(
      `SELECT
        id,
        tableNumber,
        floor,
        tableType,
        capacity,
        status,
        qrCode,
        createdAt
       FROM tables
       WHERE branchId = ?
         AND is_deleted = 0
       ORDER BY floor, tableNumber`,
      [branchId]
    );

    return res.json(rows);
  } catch (err) {
    next(err);
  }
};



/* ================= UPDATE TABLE STATUS ================= */

export const updateTableStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { branchId, role } = req.user;

    if (status === "inactive" && role !== "MANAGER") {
      return res.status(403).json({
        message: "Only manager can inactivate table",
      });
    }

    if (["available", "occupied"].includes(status)) {
      return res.status(403).json({
        message: "Table status is system controlled",
      });
    }

    const [result] = await db.query(
      `UPDATE tables
       SET status = ?
       WHERE id = ? AND branchId = ? AND is_deleted = 0`,
      [status, id, branchId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Table not found" });
    }

    res.json({ message: "Table status updated" });
  } catch (err) {
    next(err);
  }
};



/* ================= DELETE TABLE (SOFT) ================= */

/* ================= DELETE TABLE ================= */

export const deleteTable = async (req, res, next) => {
  try {
    const tableId = req.params.id;
    const { branchId } = req.user;

    const [[table]] = await db.query(
      `SELECT status FROM tables
       WHERE id = ? AND branchId = ? AND is_deleted = 0`,
      [tableId, branchId]
    );

    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    if (table.status === "occupied") {
      return res.status(400).json({
        message: "Cannot delete an occupied table",
      });
    }

    await db.query(
      `UPDATE tables
       SET is_deleted = 1
       WHERE id = ? AND branchId = ?`,
      [tableId, branchId]
    );

    res.json({ message: "Table deleted successfully" });
  } catch (err) {
    next(err);
  }
};


/* ================= UPDATE TABLE ================= */

/* ================= UPDATE TABLE ================= */

/* ================= UPDATE TABLE ================= */

export const updateTable = async (req, res, next) => {
  try {
    const tableId = req.params.id;
    const { tableNumber, floor, tableType, capacity } = req.body;
    const { branchId } = req.user;

    if (!tableNumber || !floor || !capacity) {
      return res.status(400).json({
        message: "tableNumber, floor and capacity are required",
      });
    }

    if (capacity <= 0) {
      return res.status(400).json({
        message: "capacity must be greater than 0",
      });
    }

    const allowedTypes = ["REGULAR", "VIP", "FAMILY", "Hall"];
    const finalType = tableType || "REGULAR";

    if (!allowedTypes.includes(finalType)) {
      return res.status(400).json({ message: "Invalid table type" });
    }

    const [[exists]] = await db.query(
      `SELECT id FROM tables
       WHERE branchId = ?
         AND tableNumber = ?
         AND id != ?
         AND is_deleted = 0`,
      [branchId, tableNumber, tableId]
    );

    if (exists) {
      return res.status(409).json({
        message: "Another table with this number already exists",
      });
    }

    const [result] = await db.query(
      `UPDATE tables
       SET tableNumber = ?, floor = ?, tableType = ?, capacity = ?
       WHERE id = ? AND branchId = ? AND is_deleted = 0`,
      [tableNumber, floor, finalType, capacity, tableId, branchId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Table not found" });
    }

    res.json({ message: "Table updated successfully" });
  } catch (err) {
    next(err);
  }
};

