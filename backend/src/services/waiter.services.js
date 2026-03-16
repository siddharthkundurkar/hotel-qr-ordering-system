import { db } from "../config/db.js";

export const generateBillService = async ({ orderId, user }) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const { branchId } = user;

    /* ================= LOCK ORDER ================= */

    const [[order]] = await conn.query(
      `
      SELECT 
        o.id,
        o.status,
        o.tableId,
        t.tableNumber
      FROM orders o
      JOIN tables t ON t.id = o.tableId
      WHERE o.id = ?
        AND o.branchId = ?
      FOR UPDATE
      `,
      [orderId, branchId]
    );

    if (!order) {
      throw new Error("Order not found");
    }

    /* allow re-billing safely */
    if (order.status !== "served" && order.status !== "bill_generated") {
      throw new Error("Order not ready for billing");
    }

    /* ================= IDEMPOTENCY ================= */

    const [[existingBill]] = await conn.query(
      `
      SELECT id, totalAmount
      FROM bills
      WHERE orderId = ?
      LIMIT 1
      `,
      [orderId]
    );

    if (existingBill) {
      await conn.rollback();

      return {
        billId: existingBill.id,
        orderId,
        tableNumber: order.tableNumber,
        total: existingBill.totalAmount,
        alreadyGenerated: true,
      };
    }

    /* ================= GET ORDER ITEMS ================= */

    const [items] = await conn.query(
      `
      SELECT
        oi.id,
        oi.quantity,
        oi.price,
        mi.name
      FROM order_items oi
      JOIN menu_items mi ON mi.id = oi.itemId
      WHERE oi.orderId = ?
      `,
      [orderId]
    );

    if (!items.length) {
      throw new Error("No items found for order");
    }

    /* ================= CALCULATE TOTAL ================= */

    let subtotal = 0;

    for (const item of items) {
      subtotal += Number(item.price) * Number(item.quantity);
    }

    const gst = subtotal * 0.05;
    const total = subtotal + gst;

    /* ================= CREATE BILL ================= */

    const [billResult] = await conn.query(
      `
      INSERT INTO bills
      (orderId, subTotal, gstAmount, totalAmount)
      VALUES (?, ?, ?, ?)
      `,
      [orderId, subtotal, gst, total]
    );

    const billId = billResult.insertId;

    /* ================= BULK INSERT BILL ITEMS ================= */

    const billItems = items.map((item) => [
      billId,
      item.name,
      item.quantity,
      item.price,
    ]);

    await conn.query(
      `
      INSERT INTO bill_items
      (billId, itemName, quantity, price)
      VALUES ?
      `,
      [billItems]
    );

    /* ================= OPTIONAL STATUS UPDATE ================= */

    await conn.query(
      `
      UPDATE orders
      SET status = 'bill_generated'
      WHERE id = ?
        AND status = 'served'
      `,
      [orderId]
    );

    await conn.commit();

    return {
      billId,
      orderId,
      tableNumber: order.tableNumber,
      subtotal,
      gst,
      total,
      items,
    };

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};