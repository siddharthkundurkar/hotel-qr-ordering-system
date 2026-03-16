import { db } from "../config/db.js";

export const createReservation = async (req, res, next) => {
  try {
    const { customerName, mobile, reservationTime, guests } = req.body;
    const { companyId, branchId } = req.user;

    if (!customerName || !mobile || !reservationTime || !guests) {
      return res.status(400).json({ message: "All fields required" });
    }

    await db.query(
      `INSERT INTO reservations
       (customerName, mobile, reservationTime, guests, companyId, branchId)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customerName, mobile, reservationTime, guests, companyId, branchId]
    );

    res.status(201).json({ message: "Reservation created (pending)" });
  } catch (err) {
    next(err);
  }
};


export const getReservations = async (req, res, next) => {
  try {
    const { branchId } = req.user;

    const [rows] = await db.query(
      `SELECT *
       FROM reservations
       WHERE branchId = ?
       ORDER BY reservationTime ASC`,
      [branchId]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
};
export const confirmReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tableId } = req.body;
    const { branchId } = req.user;

    await db.query(
      `UPDATE reservations
       SET status = 'confirmed', tableId = ?
       WHERE id = ? AND branchId = ?`,
      [tableId || null, id, branchId]
    );

    res.json({ message: "Reservation confirmed" });
  } catch (err) {
    next(err);
  }
};
export const seatReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [[resv]] = await db.query(
      `SELECT tableId FROM reservations WHERE id = ?`,
      [id]
    );

    if (!resv?.tableId)
      return res.status(400).json({ message: "No table assigned" });

    await db.query(
      `UPDATE tables SET status = 'occupied' WHERE id = ?`,
      [resv.tableId]
    );

    await db.query(
      `UPDATE reservations SET status = 'seated' WHERE id = ?`,
      [id]
    );

    res.json({ message: "Customer seated" });
  } catch (err) {
    next(err);
  }
};
export const cancelReservation = async (req, res, next) => {
  try {
    const reservationId = req.params.id;
    const { branchId } = req.user;

    // 1️⃣ Check reservation exists in this branch
    const [[reservation]] = await db.query(
      `SELECT id, status, tableId
       FROM reservations
       WHERE id = ? AND branchId = ?`,
      [reservationId, branchId]
    );

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // 2️⃣ Prevent cancelling completed/seated reservations
    if (["completed", "seated"].includes(reservation.status)) {
      return res.status(400).json({
        message: "Cannot cancel seated or completed reservation"
      });
    }

    // 3️⃣ Cancel reservation
    await db.query(
      `UPDATE reservations
       SET status = 'cancelled'
       WHERE id = ?`,
      [reservationId]
    );

    // 4️⃣ Free table if it was assigned
    if (reservation.tableId) {
      await db.query(
        `UPDATE tables
         SET status = 'available'
         WHERE id = ?`,
        [reservation.tableId]
      );
    }

    return res.json({
      message: "Reservation cancelled successfully"
    });

  } catch (err) {
    next(err);
  }
};


