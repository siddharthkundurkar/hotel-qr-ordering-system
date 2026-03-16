import { db } from "../config/db.js";

/* =====================================================
   STATUS FLOW (ENTERPRISE)
===================================================== */
const STATUS_FLOW = {
  pending: ["accepted"],
  accepted: ["preparing"],
  preparing: ["ready"],
  ready: ["out_for_delivery"],
  out_for_delivery: ["served"],
  served: ["paid"],
};

const canMove = (from, to) =>
  STATUS_FLOW[from]?.includes(to);

/* =====================================================
   GET ACTIVE ORDERS (MANAGER / DASHBOARD)
   FIXED: correct statuses
===================================================== */
export const getManagerOrders = async (branchId) => {
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
      AND o.status IN (
        'pending',
        'accepted',
        'preparing',
        'ready',
        'out_for_delivery',
        'served'
      )
    ORDER BY o.createdAt ASC, o.id ASC
    `,
    [branchId]
  );

  if (!orders.length) return [];

  const map = Object.create(null);
  orders.forEach(o => {
    map[o.id] = { ...o, items: [] };
  });

  const [items] = await db.query(
    `
    SELECT 
      oi.orderId,
      mi.name,
      oi.quantity
    FROM order_items oi
    JOIN orders o ON o.id = oi.orderId
    JOIN menu_items mi ON mi.id = oi.itemId
    WHERE o.branchId = ?
    `,
    [branchId]
  );

  items.forEach(i => {
    map[i.orderId]?.items.push({
      name: i.name,
      qty: Number(i.quantity || 0),
    });
  });

  return Object.values(map);
};
/* =====================================================
   SAFE STATUS UPDATE (ALL ROLES)
===================================================== */
export const updateOrderStatus = async ({
  orderId,
  branchId,
  nextStatus,
  conn = null,
}) => {
  const executor = conn || db;

  const [[order]] = await executor.query(
    `
    SELECT id, status, tableId
    FROM orders
    WHERE id = ? AND branchId = ?
    FOR UPDATE
    `,
    [orderId, branchId]
  );

  if (!order) {
    throw new Error("Order not found");
  }

  if (!canMove(order.status, nextStatus)) {
    throw new Error(
      `Invalid transition ${order.status} → ${nextStatus}`
    );
  }

  const [result] = await executor.query(
    `
    UPDATE orders
    SET status = ?
    WHERE id = ?
      AND branchId = ?
      AND status = ?
    `,
    [nextStatus, orderId, branchId, order.status]
  );

  if (result.affectedRows === 0) {
    throw new Error("Order already updated by another process");
  }

  return {
    from: order.status,
    to: nextStatus,
    tableId: order.tableId,
  };
};

/* =====================================================
   FINALIZE ORDER (CASHIER)
===================================================== */
export const markOrderPaid = async ({
  orderId,
  branchId,
  totalAmount,
  conn,
}) => {
  const [[order]] = await conn.query(
    `
    SELECT status, tableId
    FROM orders
    WHERE id = ? AND branchId = ?
    FOR UPDATE
    `,
    [orderId, branchId]
  );

  if (!order) throw new Error("Order not found");

  if (order.status !== "served") {
    throw new Error("Only served orders can be paid");
  }

  const [result] = await conn.query(
    `
    UPDATE orders
    SET status = 'paid',
        totalAmount = ?
    WHERE id = ?
      AND branchId = ?
      AND status = 'served'
    `,
    [totalAmount, orderId, branchId]
  );

  if (result.affectedRows === 0) {
    throw new Error("Order already paid");
  }

  if (order.tableId) {
    await conn.query(
      `
      UPDATE tables
      SET status = 'available'
      WHERE id = ? AND branchId = ?
      `,
      [order.tableId, branchId]
    );
  }
};

/* =====================================================
   REST FALLBACK (REFRESH SAFE)
===================================================== */
export const getOrderStatusById = async (orderId, branchId) => {
  const [[row]] = await db.query(
    `
    SELECT status
    FROM orders
    WHERE id = ? AND branchId = ?
    `,
    [orderId, branchId]
  );

  return row?.status || null;
};
