import { db } from "../config/db.js";

/* ===============================
   GET ORDERS FOR MANAGER
================================ */
export const getManagerOrdersService = async (branchId) => {
  const [orders] = await db.query(
    `
    SELECT 
      o.id,
      o.status,
      o.totalAmount,
      o.createdAt,
      t.tableNumber
    FROM orders o
    JOIN tables t ON t.id = o.tableId
    WHERE o.branchId = ?
    ORDER BY o.createdAt DESC
    `,
    [branchId]
  );

  return orders;
};

/* ===============================
   UPDATE ORDER STATUS
================================ */
export const updateOrderStatusService = async (orderId, branchId, status) => {
  const [result] = await db.query(
    `
    UPDATE orders
    SET status = ?
    WHERE id = ? AND branchId = ?
    `,
    [status, orderId, branchId]
  );

  if (result.affectedRows === 0) {
    throw new Error("Order not found");
  }
};
