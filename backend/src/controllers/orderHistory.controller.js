import { db } from "../config/db.js";

/* =====================================
   UNIFIED ORDER HISTORY (FINAL)
===================================== */
export const getOrderHistory = async (req, res, next) => {
  try {
    const { branchId, role, id: userId } = req.user;
    const { range = "today" } = req.query;

    /* ================= DATE FILTER ================= */
    let dateFilter = "";
    if (range === "today") {
      dateFilter = "DATE(o.createdAt) = CURDATE()";
    } else if (range === "week") {
      dateFilter = "o.createdAt >= NOW() - INTERVAL 7 DAY";
    } else if (range === "month") {
      dateFilter = `
        MONTH(o.createdAt) = MONTH(CURDATE())
        AND YEAR(o.createdAt) = YEAR(CURDATE())
      `;
    }

    /* ================= ROLE FILTER ================= */
    let roleFilter = "1=1";
    const params = [branchId];

    if (role === "KITCHEN") {
      // Orders that reached kitchen completion
      roleFilter = "o.readyAt IS NOT NULL";
    }

    if (role === "WAITER") {
      roleFilter = "o.servedAt IS NOT NULL AND o.waiterId = ?";
      params.push(userId);
    }

    if (role === "CASHIER") {
      roleFilter = "o.servedAt IS NOT NULL";
    }

    if (role === "MANAGER" || role === "OWNER") {
      roleFilter = "o.servedAt IS NOT NULL";
    }

    /* ================= QUERY ================= */
    const [orders] = await db.query(
      `
      SELECT
        o.id,
        o.status,
        o.totalAmount,
        o.createdAt,
        o.cookingStartedAt,
        o.readyAt,
        o.servedAt,
        o.paidAt,
        o.isDelayed,
        t.tableNumber
      FROM orders o
      JOIN tables t ON t.id = o.tableId
      WHERE o.branchId = ?
        ${dateFilter ? `AND ${dateFilter}` : ""}
        AND ${roleFilter}
      ORDER BY o.createdAt DESC
      `,
      params
    );

    if (!orders.length) return res.json([]);

    /* ================= ITEMS ================= */
    const orderIds = orders.map(o => o.id);

    const [items] = await db.query(
      `
      SELECT
        oi.orderId,
        mi.name,
        SUM(oi.quantity) AS qty
      FROM order_items oi
      JOIN menu_items mi ON mi.id = oi.itemId
      WHERE oi.orderId IN (?)
      GROUP BY oi.orderId, mi.name
      `,
      [orderIds]
    );

    const map = {};
    orders.forEach(o => {
      map[o.id] = { ...o, items: [] };
    });

    items.forEach(i => {
      map[i.orderId]?.items.push({
        name: i.name,
        qty: i.qty,
      });
    });

    res.json(Object.values(map));
  } catch (err) {
    next(err);
  }
};
