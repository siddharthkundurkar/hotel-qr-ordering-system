import { db } from "../config/db.js";

export const assignTableFromQueue = async (branchId) => {
  // 1️⃣ Get oldest waiting queue entry
  const [[queueItem]] = await db.query(
    `SELECT id FROM queue
     WHERE branchId = ? AND status = 'waiting'
     ORDER BY createdAt ASC
     LIMIT 1`,
    [branchId]
  );

  if (!queueItem) return false;

  // 2️⃣ Get available table
  const [[table]] = await db.query(
    `SELECT id FROM tables
     WHERE branchId = ? AND status = 'available'
     ORDER BY id ASC
     LIMIT 1`,
    [branchId]
  );

  if (!table) return false;

  // 3️⃣ Seat queue entry (safe update)
  const [queueUpdate] = await db.query(
    `UPDATE queue
     SET status = 'seated', tableId = ?
     WHERE id = ? AND status = 'waiting'`,
    [table.id, queueItem.id]
  );

  if (queueUpdate.affectedRows === 0) return false;

  // 4️⃣ Occupy table (safe update)
  const [tableUpdate] = await db.query(
    `UPDATE tables
     SET status = 'occupied'
     WHERE id = ? AND status = 'available'`,
    [table.id]
  );

  if (tableUpdate.affectedRows === 0) return false;

  return true;
};
