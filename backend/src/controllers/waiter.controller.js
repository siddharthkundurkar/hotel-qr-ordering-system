import { db } from "../config/db.js";
import { logAudit } from "../utils/auditlogger.js";
import { generateBillService } from "../services/waiter.services.js";
export const getReadyOrders = async (req, res, next) => {
  try {
    const { branchId, id: waiterId } = req.user;

    /* =================================================
       1️⃣ FETCH READY + MY ACTIVE ORDERS
    ================================================= */

    const [orders] = await db.query(
      `
      SELECT 
        o.id,
        o.readyAt,
        o.waiterId,
        o.status,
        t.tableNumber
      FROM orders o
      JOIN tables t ON t.id = o.tableId
      WHERE o.branchId = ?
        AND (
          o.status = 'ready'
          OR (o.status = 'out_for_delivery' AND o.waiterId = ?)
        )
      ORDER BY 
        CASE 
          WHEN o.status = 'ready' THEN 0
          ELSE 1
        END,
        COALESCE(o.readyAt, o.createdAt) ASC,
        o.id ASC
      `,
      [branchId, waiterId]
    );

    if (!orders.length) return res.json([]);

    const orderIds = orders.map((o) => o.id);

    /* =================================================
       2️⃣ FETCH READY ITEMS
    ================================================= */

    const [items] = await db.query(
      `
      SELECT 
        oi.id AS orderItemId,
        oi.orderId,
        oi.quantity,
        oi.isPriority,
        mi.name
      FROM order_items oi
      JOIN menu_items mi ON mi.id = oi.itemId
      WHERE oi.orderId IN (?)
        AND oi.status = 'ready'
      ORDER BY 
        oi.isPriority DESC,
        oi.createdAt ASC,
        oi.id ASC
      `,
      [orderIds]
    );

    /* =================================================
       3️⃣ BUILD RESPONSE MAP
    ================================================= */

    const map = Object.create(null);

    for (const o of orders) {
      map[o.id] = {
        id: Number(o.id),
        readyAt: o.readyAt,
        waiterId: o.waiterId ? Number(o.waiterId) : null,
        status: o.status,
        tableNumber: o.tableNumber,
        items: [],
        readyItemsCount: 0,
      };
    }

    for (const i of items) {
      const order = map[i.orderId];
      if (!order) continue;

      order.items.push({
        id: Number(i.orderItemId),   // ✅ correct id for serving
        name: i.name,
        qty: Number(i.quantity || 0),
        isPriority: Boolean(i.isPriority),
      });

      order.readyItemsCount++;
    }

    /* =================================================
       ✅ FINAL RESPONSE
    ================================================= */

    return res.json(Object.values(map));

  } catch (err) {
    console.error("GET READY ORDERS ERROR:", err);
    next(err);
  }
};





export const acceptOrder = async (req, res, next) => {
  const conn = await db.getConnection();

  try {
    const orderId = Number(req.params.id);
    const { id: rawWaiterId, branchId, role } = req.user;
    const waiterId = Number(rawWaiterId);

    if (role !== "WAITER") {
      return res.status(403).json({ message: "Only waiter allowed" });
    }

    if (!orderId || Number.isNaN(orderId)) {
      return res.status(400).json({ message: "Valid order ID required" });
    }

    await conn.beginTransaction();

    /* =================================================
       🔒 LOCK ORDER
    ================================================= */

    const [[order]] = await conn.query(
      `
      SELECT id, status, waiterId
      FROM orders
      WHERE id = ?
        AND branchId = ?
      FOR UPDATE
      `,
      [orderId, branchId]
    );

    if (!order) {
      await conn.rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    /* =================================================
       ✅ IDEMPOTENT GUARD (FIX)
    ================================================= */

    if (order.status === "out_for_delivery") {

      if (Number(order.waiterId) === waiterId) {
        await conn.rollback();

        return res.json({
          message: "Order already picked",
          orderId,
          waiterId,
          status: "out_for_delivery",
        });
      }

      await conn.rollback();

      return res.status(409).json({
        message: "Order already picked by another waiter",
      });
    }

    /* =================================================
       🚨 MUST BE READY
    ================================================= */

    if (order.status !== "ready") {
      await conn.rollback();

      return res.status(409).json({
        message: `Order not ready (current: ${order.status})`,
      });
    }

    /* =================================================
       🛡️ ENSURE READY ITEMS EXIST
    ================================================= */

    const [[readyCheck]] = await conn.query(
      `
      SELECT COUNT(*) AS readyCount
      FROM order_items
      WHERE orderId = ?
        AND status = 'ready'
      `,
      [orderId]
    );

    if (readyCheck.readyCount === 0) {
      await conn.rollback();
      return res.status(409).json({
        message: "Order has no ready items",
      });
    }

    /* =================================================
       ✅ UPDATE ORDER
    ================================================= */

    await conn.query(
      `
      UPDATE orders
      SET status = 'out_for_delivery',
          waiterId = ?,
          pickedAt = NOW()
      WHERE id = ?
        AND branchId = ?
      `,
      [waiterId, orderId, branchId]
    );

    /* =================================================
       🧾 AUDIT
    ================================================= */

    await logAudit({
      action: "ORDER_PICKED_BY_WAITER",
      entityType: "ORDER",
      entityId: orderId,
      user: req.user,
      meta: { pickedAt: new Date(), waiterId },
      conn,
    });

    await conn.commit();

    /* =================================================
       📡 SOCKET EVENTS
    ================================================= */

    const io = req.app.get("io");

    const payload = {
      orderId,
      waiterId,
      status: "out_for_delivery",
      pickedAt: new Date(),
    };

    io?.to(`order:${orderId}`).emit("order:status", payload);
    io?.to(`branch:${branchId}`).emit("order:status", payload);
    io?.to(`waiter:${waiterId}`).emit("order:picked", payload);

    return res.json({
      message: "Order picked successfully",
      ...payload,
    });

  } catch (err) {
    await conn.rollback();
    console.error("ACCEPT ORDER ERROR:", err);
    next(err);
  } finally {
    conn.release();
  }
};
export const markOrderAsServed = async (req, res, next) => {
  const conn = await db.getConnection();
  const io = req.app.get("io");

  try {
    const orderId = Number(req.params.id);
    const { id: rawWaiterId, branchId, role } = req.user;
    const waiterId = Number(rawWaiterId);

    /* 🔒 role guard */
    if (role !== "WAITER") {
      return res.status(403).json({ message: "Only waiter allowed" });
    }

    if (!orderId || Number.isNaN(orderId)) {
      return res.status(400).json({ message: "Valid order ID required" });
    }

    await conn.beginTransaction();

    /* =================================================
       🔒 LOCK ORDER
    ================================================= */
    const [[order]] = await conn.query(
      `
      SELECT id, status, waiterId
      FROM orders
      WHERE id = ?
        AND branchId = ?
      FOR UPDATE
      `,
      [orderId, branchId]
    );

    if (!order) {
      await conn.rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    /* =================================================
       ✅ IDEMPOTENT GUARD
    ================================================= */
    if (
      order.status === "served" &&
      Number(order.waiterId) === waiterId
    ) {
      await conn.rollback();

      return res.json({
        message: "Order already served",
        orderId,
        waiterId,
        status: "served",
      });
    }

    if (order.status !== "out_for_delivery") {
      await conn.rollback();
      return res.status(409).json({
        message: "Order not in serving stage",
      });
    }

    if (Number(order.waiterId) !== waiterId) {
      await conn.rollback();
      return res.status(403).json({
        message: "This order is assigned to another waiter",
      });
    }

    /* =================================================
       🔍 ENSURE ALL ITEMS SERVED
    ================================================= */
    const [[remaining]] = await conn.query(
      `
      SELECT COUNT(*) AS remaining
      FROM order_items oi
      JOIN orders o ON o.id = oi.orderId
      WHERE oi.orderId = ?
        AND o.branchId = ?
        AND oi.status != 'served'
      FOR UPDATE
      `,
      [orderId, branchId]
    );

    if (remaining.remaining > 0) {
      await conn.rollback();
      return res.status(409).json({
        message: "All items must be served first",
        remainingItems: remaining.remaining,
      });
    }

    /* =================================================
       ✅ UPDATE ORDER
    ================================================= */
    const [updateResult] = await conn.query(
      `
      UPDATE orders
      SET status = 'served',
          servedAt = NOW()
      WHERE id = ?
        AND branchId = ?
        AND status = 'out_for_delivery'
      `,
      [orderId, branchId]
    );

    if (updateResult.affectedRows === 0) {
      await conn.rollback();
      return res.status(409).json({
        message: "Order already served",
      });
    }

    /* 🧾 AUDIT */
    await logAudit({
      action: "ORDER_SERVED",
      entityType: "ORDER",
      entityId: orderId,
      user: req.user,
      meta: {
        servedAt: new Date(),
        waiterId,
      },
      conn,
    });

    await conn.commit();

    /* =================================================
       📡 SOCKET EVENTS (STANDARDIZED)
    ================================================= */
    const payload = {
      orderId,
      waiterId,
      status: "served",
      servedAt: new Date(),
    };

    /* 🔔 notify customer live page */
    io?.to(`order:${orderId}`).emit("order:status", payload);

    /* 🔔 notify branch dashboards */
    io?.to(`branch:${branchId}`).emit("order:status", payload);

    /* 🔔 waiter personal updates */
    io?.to(`waiter:${waiterId}`).emit("order:completed", payload);

    return res.json({
      message: "Order served successfully",
      ...payload,
    });

  } catch (err) {
    await conn.rollback();
    console.error("MARK SERVED ERROR:", err);
    next(err);
  } finally {
    conn.release();
  }
};
/* =====================================
   GET MY SERVED ORDERS
===================================== */
export const getMyServedOrders = async (req, res, next) => {
  try {
    const { id: rawWaiterId, branchId } = req.user;
    const waiterId = Number(rawWaiterId);
    const { range = "today" } = req.query;

    if (!waiterId || Number.isNaN(waiterId)) {
      return res.status(400).json({ message: "Invalid waiter ID" });
    }

    /* =================================================
       🧠 BUILD DATE RANGE
    ================================================= */
    let startDate = null;

    if (range === "today") {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    }

    if (range === "week") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    }

    if (range === "month") {
      startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    /* =================================================
       🚀 QUERY
    ================================================= */
    const params = [branchId, waiterId];

    let query = `
      SELECT
        o.id,
        o.status,
        o.servedAt,
        o.paidAt,
        t.tableNumber
      FROM orders o
      JOIN tables t ON t.id = o.tableId
      WHERE o.branchId = ?
        AND o.waiterId = ?
        AND o.servedAt IS NOT NULL
    `;

    if (startDate) {
      query += ` AND o.servedAt >= ?`;
      params.push(startDate);
    }

    query += `
      ORDER BY COALESCE(o.paidAt, o.servedAt) DESC
      LIMIT 300
    `;

    const [orders] = await db.query(query, params);

    return res.json(orders);

  } catch (err) {
    console.error("GET MY SERVED ORDERS ERROR:", err);
    next(err);
  }
};

/* =====================================
   SERVE SINGLE ITEM (ENTERPRISE SAFE)
===================================== */
export const serveItem = async (req, res, next) => {
  const conn = await db.getConnection();

  try {
    const rawItemId = req.params?.itemId ?? req.params?.id;
    const itemId = Number(rawItemId);

    const { branchId, id: rawWaiterId, role } = req.user;
    const waiterId = Number(rawWaiterId);

    /* 🔒 role guard */
    if (role !== "WAITER") {
      return res.status(403).json({ message: "Only waiter allowed" });
    }

    /* 🚨 validation */
    if (!rawItemId || Number.isNaN(itemId) || itemId <= 0) {
      return res.status(400).json({ message: "Valid item ID required" });
    }

    await conn.beginTransaction();

    /* =================================================
       🔒 LOCK ITEM + ORDER
    ================================================= */
    const [[item]] = await conn.query(
      `
      SELECT 
        oi.id,
        oi.status,
        oi.orderId,
        o.waiterId AS orderWaiterId,
        o.status AS orderStatus
      FROM order_items oi
      JOIN orders o ON o.id = oi.orderId
      WHERE oi.id = ?
        AND o.branchId = ?
      FOR UPDATE
      `,
      [itemId, branchId]
    );

    if (!item) {
      await conn.rollback();
      return res.status(404).json({ message: "Item not found" });
    }

    /* =================================================
       ✅ IDEMPOTENT GUARD
    ================================================= */
    if (item.status === "served") {
      await conn.rollback();
      return res.json({
        message: "Item already served",
        alreadyServed: true,
        orderId: Number(item.orderId),
      });
    }

    /* 🚨 order stage check */
    if (item.orderStatus !== "out_for_delivery") {
      await conn.rollback();
      return res.status(409).json({
        message: "Order not in serving stage",
      });
    }

    /* 🚨 waiter ownership */
    if (Number(item.orderWaiterId) !== waiterId) {
      await conn.rollback();
      return res.status(403).json({
        message: "Assigned to another waiter",
      });
    }

    /* 🚨 item must be ready */
    if (item.status !== "ready") {
      await conn.rollback();
      return res.status(409).json({
        message: "Item not ready to serve",
      });
    }

    /* =================================================
       ✅ MARK ITEM SERVED
    ================================================= */
    await conn.query(
      `
      UPDATE order_items
      SET status = 'served',
          servedAt = NOW()
      WHERE id = ?
        AND status = 'ready'
      `,
      [itemId]
    );

    /* =================================================
       🔍 CHECK REMAINING ITEMS
    ================================================= */
    const [[remaining]] = await conn.query(
      `
      SELECT COUNT(*) AS remaining
      FROM order_items
      WHERE orderId = ?
        AND status IN ('ready','preparing','pending')
      `,
      [item.orderId]
    );

    let orderCompleted = false;

    /* =================================================
       ✅ AUTO COMPLETE ORDER
    ================================================= */
    if (remaining.remaining === 0) {
      const [updateOrder] = await conn.query(
        `
        UPDATE orders
        SET status = 'served',
            servedAt = NOW()
        WHERE id = ?
          AND branchId = ?
          AND status = 'out_for_delivery'
        `,
        [item.orderId, branchId]
      );

      if (updateOrder.affectedRows > 0) {
        orderCompleted = true;
      }
    }

    await conn.commit();

    /* =================================================
       📡 SOCKET EVENTS (STANDARDIZED)
    ================================================= */
    const io = req.app.get("io");

    const itemPayload = {
      itemId,
      orderId: Number(item.orderId),
      remainingItems: remaining.remaining,
      status: "served",
    };

    /* 🔔 update item status */
    io?.to(`order:${item.orderId}`).emit("order:item:update", itemPayload);
    io?.to(`branch:${branchId}`).emit("order:item:update", itemPayload);

    /* 🔔 order completion */
    if (orderCompleted) {
      const orderPayload = {
        orderId: Number(item.orderId),
        waiterId,
        status: "served",
        servedAt: new Date(),
      };

      io?.to(`order:${item.orderId}`).emit("order:status", orderPayload);
      io?.to(`branch:${branchId}`).emit("order:status", orderPayload);
    }

    return res.json({
      message: "Item served",
      orderCompleted,
      remainingItems: remaining.remaining,
    });

  } catch (err) {
    await conn.rollback();
    console.error("SERVE ITEM ERROR:", err);
    next(err);
  } finally {
    conn.release();
  }
};
export const generateBillController = async (req, res, next) => {
  try {
    const rawOrderId = req.params.orderId;
    const orderId = Number(rawOrderId);
    const user = req.user;

    /* ================= VALIDATION ================= */

    if (!rawOrderId || Number.isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({
        message: "Valid orderId required",
      });
    }

    const allowedRoles = ["WAITER", "CASHIER", "MANAGER", "ADMIN"];

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        message: "Not allowed to generate bill",
      });
    }

    /* ================= GENERATE BILL ================= */

    const bill = await generateBillService({
      orderId,
      user,
    });

    /* ================= SOCKET EVENTS ================= */

    const io = req.app.get("io");

    const payload = {
      orderId,
      totalAmount: bill.total || bill.totalAmount,
      status: "bill_generated",
      generatedAt: new Date(),
    };

    /* 🔔 update customer live order */
    io?.to(`order:${orderId}`).emit("order:status", payload);

    /* 🔔 update branch dashboards */
    io?.to(`branch:${user.branchId}`).emit("order:status", payload);

    /* optional event for billing screens */
    io?.to(`branch:${user.branchId}`).emit("order:bill_generated", payload);

    /* ================= RESPONSE ================= */

    return res.json({
      message: bill.alreadyGenerated
        ? "Bill already generated"
        : "Bill generated successfully",
      ...bill,
    });

  } catch (err) {
    console.error("Generate bill error:", err);

    return res.status(500).json({
      message: "Failed to generate bill",
      error: err.message,
    });
  }
};
export const getServedOrdersHistory = async (req, res, next) => {
  try {
    const { branchId, id: waiterId } = req.user;
    const { filter = "today" } = req.query;

    let dateCondition = "";

    switch (filter) {

      case "today":
        dateCondition = "DATE(o.servedAt) = CURDATE()";
        break;

      case "yesterday":
        dateCondition = "DATE(o.servedAt) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
        break;

      case "week":
        dateCondition = "YEARWEEK(o.servedAt, 1) = YEARWEEK(CURDATE(), 1)";
        break;

      case "month":
        dateCondition = "MONTH(o.servedAt) = MONTH(CURDATE()) AND YEAR(o.servedAt) = YEAR(CURDATE())";
        break;

      case "year":
        dateCondition = "YEAR(o.servedAt) = YEAR(CURDATE())";
        break;

      case "all":
        dateCondition = "1=1";
        break;

      default:
        dateCondition = "DATE(o.servedAt) = CURDATE()";
    }

    const [orders] = await db.query(
      `
      SELECT
        o.id,
        o.status,
        o.servedAt,
        o.totalAmount,
        t.tableNumber,

        COUNT(oi.id) AS itemsCount,
        SUM(oi.quantity) AS totalQty

      FROM orders o
      JOIN tables t ON t.id = o.tableId
      LEFT JOIN order_items oi ON oi.orderId = o.id

      WHERE o.branchId = ?
      AND o.waiterId = ?
      AND o.status IN ('served','paid')
      AND ${dateCondition}

      GROUP BY o.id
      ORDER BY o.servedAt DESC
      LIMIT 200
      `,
      [branchId, waiterId]
    );

    return res.json({
      success: true,
      filter,
      count: orders.length,
      orders,
    });

  } catch (err) {
    console.error("GET SERVED HISTORY ERROR:", err);
    next(err);
  }
};


export const getWaiterDashboard = async (req, res) => {
  try {

    const { branchId, id: waiterId } = req.user;

    /* READY ORDERS */
    const [[ready]] = await db.query(
      `
      SELECT COUNT(*) AS count
      FROM orders
      WHERE branchId = ?
      AND status = 'ready'
      `,
      [branchId]
    );

    /* MY ACTIVE ORDERS */
    const [[myOrders]] = await db.query(
      `
      SELECT COUNT(*) AS count
      FROM orders
      WHERE branchId = ?
      AND waiterId = ?
      AND status = 'out_for_delivery'
      `,
      [branchId, waiterId]
    );

    /* SERVED TODAY */
    const [[servedToday]] = await db.query(
      `
      SELECT COUNT(*) AS count
      FROM orders
      WHERE branchId = ?
      AND status = 'served'
      AND DATE(servedAt) = CURDATE()
      `,
      [branchId]
    );

    /* TOTAL SERVED BY WAITER */
    const [[myServed]] = await db.query(
      `
      SELECT COUNT(*) AS count
      FROM orders
      WHERE branchId = ?
      AND waiterId = ?
      AND status = 'served'
      `,
      [branchId, waiterId]
    );

    return res.json({
      readyOrders: ready.count,
      myOrders: myOrders.count,
      servedToday: servedToday.count,
      myServed: myServed.count
    });

  } catch (err) {

    console.error("WAITER DASHBOARD ERROR:", err);

    return res.status(500).json({
      message: "Failed to load dashboard"
    });

  }
};