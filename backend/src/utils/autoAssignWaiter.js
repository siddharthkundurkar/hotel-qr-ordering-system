import { db } from "../config/db.js";

/* =====================================
   ENTERPRISE AUTO WAITER ASSIGNER (FIXED)
===================================== */
export const autoAssignWaiter = async (
  conn,
  { orderId, branchId, tableId }
) => {
  /* 🔒 Lock order */
  const [[order]] = await conn.query(
    `
    SELECT id, waiterId, isServeFast
    FROM orders
    WHERE id = ? AND branchId = ?
    FOR UPDATE
    `,
    [orderId, branchId]
  );

  if (!order) return null;

  let chosenWaiterId = null;
  const MAX_LOAD = 5;

  /* =====================================
     STEP 1 — TABLE WAITER PREFERENCE
  ===================================== */
  const [[tableWaiter]] = await conn.query(
    `
    SELECT waiterId
    FROM orders
    WHERE tableId = ?
      AND branchId = ?
      AND waiterId IS NOT NULL
    ORDER BY createdAt DESC
    LIMIT 1
    `,
    [tableId, branchId]
  );

  if (tableWaiter?.waiterId) {
    /* 🔎 Check load of preferred waiter (BRANCH SAFE) */
    const [[load]] = await conn.query(
      `
      SELECT COUNT(*) as activeOrders
      FROM orders
      WHERE waiterId = ?
        AND branchId = ?
        AND status IN ('accepted','out_for_delivery')
      `,
      [tableWaiter.waiterId, branchId]
    );

    if (load.activeOrders < MAX_LOAD) {
      chosenWaiterId = tableWaiter.waiterId;
    }
  }

  /* =====================================
     STEP 2 — LEAST BUSY WAITER
  ===================================== */
  if (!chosenWaiterId) {
    const [waiters] = await conn.query(
  `
  SELECT 
    u.id,
    COUNT(o.id) AS activeOrders
  FROM users u
  LEFT JOIN orders o
    ON o.waiterId = u.id
    AND o.branchId = ?
    AND o.status IN ('accepted','out_for_delivery')
  WHERE u.role = 'WAITER'
    AND u.branch_id = ?      -- ✅ snake_case
    AND u.is_active = 1      -- ✅ snake_case
  GROUP BY u.id
  ORDER BY 
    activeOrders ASC,
    u.id ASC
  `,
  [branchId, branchId]
);
    if (!waiters.length) return null;

    /* =====================================
       STEP 2.1 — SERVE FAST BOOST 🚀
    ===================================== */
    if (order.isServeFast) {
      // absolute least busy waiter
      chosenWaiterId = waiters[0].id;
    } else {
      // fair random among lowest load
      const lowestLoad = waiters[0].activeOrders;

      const candidates = waiters.filter(
        (w) => w.activeOrders === lowestLoad
      );

      const randomIndex = Math.floor(
        Math.random() * candidates.length
      );

      chosenWaiterId = candidates[randomIndex].id;
    }
  }

  /* =====================================
     STEP 3 — ASSIGN WAITER
  ===================================== */
  await conn.query(
    `
    UPDATE orders
    SET waiterId = ?
    WHERE id = ?
    `,
    [chosenWaiterId, orderId]
  );

  return chosenWaiterId;
};
