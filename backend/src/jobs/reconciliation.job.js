import { db } from "../config/db.js";

export const runReconciliationJob = async () => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    /* 1️⃣ Orders with bill but not marked paid */
    const [orders] = await conn.query(`
      SELECT o.id, o.tableId, b.totalAmount
      FROM bills b
      JOIN orders o ON o.id = b.orderId
      WHERE o.status != 'paid'
    `);

    for (const order of orders) {
      await conn.query(
        `
        UPDATE orders
        SET status = 'paid',
            totalAmount = ?,
            paidAt = COALESCE(paidAt, NOW())
        WHERE id = ?
        `,
        [order.totalAmount, order.id]
      );

      await conn.query(
        `UPDATE tables SET status = 'available' WHERE id = ?`,
        [order.tableId]
      );
    }

    await conn.commit();

    if (orders.length > 0) {
      console.log(`🧾 Reconciled ${orders.length} orders`);
    }
  } catch (err) {
    await conn.rollback();
    console.error("❌ Reconciliation failed:", err);
  } finally {
    conn.release();
  }
};
