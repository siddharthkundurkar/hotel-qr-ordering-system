import { db } from "../config/db.js";

/* ADD TO QUEUE */
export const addToQueue = async (req, res, next) => {
  try {
    const { customerName, guests } = req.body;
    const { companyId, branchId } = req.user;

    if (!customerName || !guests || guests <= 0) {
      return res.status(400).json({ message: "Invalid queue data" });
    }

    await db.query(
      `INSERT INTO queue (customerName, guests, companyId, branchId)
       VALUES (?, ?, ?, ?)`,
      [customerName, guests, companyId, branchId]
    );

    res.status(201).json({ message: "Added to queue" });
  } catch (err) {
    next(err);
  }
};

/* GET QUEUE */
export const getQueue = async (req, res, next) => {
  try {
    const { branchId } = req.user;

    const [rows] = await db.query(
      `SELECT * FROM queue
       WHERE branchId = ? AND status = 'waiting'
       ORDER BY createdAt ASC`,
      [branchId]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/* SEAT FROM QUEUE */
export const seatFromQueue = async (req, res, next) => {
  try {
    const queueId = req.params.id;
    const { tableId } = req.body;
    const { branchId } = req.user;

    if (!tableId) {
      return res.status(400).json({ message: "tableId required" });
    }

    const [[table]] = await db.query(
      `SELECT status FROM tables WHERE id = ? AND branchId = ?`,
      [tableId, branchId]
    );

    if (!table || table.status !== "available") {
      return res.status(400).json({ message: "Table not available" });
    }

    await db.query(
      `UPDATE queue SET status = 'seated'
       WHERE id = ? AND branchId = ?`,
      [queueId, branchId]
    );

    await db.query(
      `UPDATE tables SET status = 'occupied'
       WHERE id = ?`,
      [tableId]
    );

    res.json({ message: "Customer seated from queue" });
  } catch (err) {
    next(err);
  }
};

/* CANCEL QUEUE */
export const cancelQueue = async (req, res, next) => {
  try {
    const queueId = req.params.id;
    const { branchId } = req.user;

    await db.query(
      `UPDATE queue SET status = 'cancelled'
       WHERE id = ? AND branchId = ?`,
      [queueId, branchId]
    );

    res.json({ message: "Queue entry cancelled" });
  } catch (err) {
    next(err);
  }
};
