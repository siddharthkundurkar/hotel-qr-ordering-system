import { db } from "../config/db.js";
import { logAudit } from "../utils/auditlogger.js";
import { checkKitchenSLA } from "../utils/slaChecker.js";
import { autoAssignWaiter } from "../utils/autoAssignWaiter.js";

/* =====================================
   GET ACTIVE KITCHEN ORDERS
   (pending + accepted + preparing + ready)
===================================== */



export const getKitchenOrders = async (req, res, next) => {
  try {
    const { branchId } = req.user;

    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    /* ACTIVE ORDERS */
    const [orders] = await db.query(
      `
      SELECT 
        o.id,
        o.status,
        o.createdAt,
        o.acceptedAt,
        o.isDelayed,
        o.waiterId,
        t.tableNumber,
        MAX(COALESCE(oi.isPriority,0)) AS hasPriority
      FROM orders o
      JOIN tables t ON t.id = o.tableId
      LEFT JOIN order_items oi ON oi.orderId = o.id
      WHERE o.branchId = ?
        AND o.status IN ('pending','accepted','preparing','ready','served')
      GROUP BY 
        o.id,
        o.status,
        o.createdAt,
        o.acceptedAt,
        o.isDelayed,
        o.waiterId,
        t.tableNumber
      ORDER BY
        hasPriority DESC,
        o.isDelayed DESC,
        o.createdAt ASC
      LIMIT 500
      `,
      [branchId]
    );

    if (!orders.length) return res.json([]);

    /* ITEMS */
    const [items] = await db.query(
      `
      SELECT 
        oi.id AS itemId,
        oi.orderId,
        oi.status,
        oi.quantity,
        oi.isPriority,
        mi.name
      FROM order_items oi
      JOIN orders o ON o.id = oi.orderId
      JOIN menu_items mi ON mi.id = oi.itemId
      WHERE o.branchId = ?
        AND o.status IN ('pending','accepted','preparing','ready','served')
      ORDER BY
        oi.isPriority DESC,
        oi.createdAt ASC
      `,
      [branchId]
    );

    const map = {};

    for (const o of orders) {
      map[o.id] = {
        id: Number(o.id),
        status: o.status,
        createdAt: o.createdAt,
        acceptedAt: o.acceptedAt,
        isDelayed: Boolean(o.isDelayed),
        hasPriority: Boolean(o.hasPriority),
        waiterId: o.waiterId ? Number(o.waiterId) : null,
        tableNumber: o.tableNumber,
        pendingItemsCount: 0,
        canMarkReady: false,
        items: [],
      };
    }

    for (const i of items) {
      const order = map[i.orderId];
      if (!order) continue;

      order.items.push({
        id: Number(i.itemId),
        name: i.name,
        qty: Number(i.quantity || 0),
        status: i.status,
        isPriority: Boolean(i.isPriority),
      });

      if (i.status !== "ready") {
        order.pendingItemsCount++;
      }
    }

    for (const order of Object.values(map)) {
      order.canMarkReady =
        order.status === "preparing" &&
        order.pendingItemsCount === 0;
    }

    return res.json(Object.values(map));

  } catch (err) {
    console.error("❌ GET KITCHEN ORDERS ERROR:", err);
    next(err);
  }
};

/* =====================================
   UPDATE ORDER STATUS (KITCHEN)
   pending → accepted → preparing → ready
===================================== */
export const updateKitchenOrderStatus = async (req, res, next) => {
  const conn = await db.getConnection();
  const io = req.app.get("io");

  try {
    const orderId = Number(req.params.id);
    const { branchId } = req.user;

    if (!orderId || Number.isNaN(orderId)) {
      return res.status(400).json({ message: "Valid order ID required" });
    }

    const STATE_MACHINE = {
      pending: { next: "accepted", timestamp: "acceptedAt" },
      accepted: { next: "preparing", timestamp: "cookingStartedAt" },
      preparing: { next: "ready", timestamp: "readyAt" },
      ready: { next: null },
    };

    await conn.beginTransaction();

    /* =================================================
       🔒 LOCK ORDER
    ================================================= */
    const [[order]] = await conn.query(
      `
      SELECT id, status, tableId, waiterId
      FROM orders
      WHERE id = ? AND branchId = ?
      FOR UPDATE
      `,
      [orderId, branchId]
    );

    if (!order) {
      await conn.rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    const currentState = STATE_MACHINE[order.status];

    /* ✅ IDEMPOTENT GUARD */
    if (!currentState?.next) {
      await conn.rollback();
      return res.json({
        message: "Order already in final state",
        status: order.status,
        alreadyFinal: true,
      });
    }

    const nextStatus = currentState.next;

    /* =================================================
       🧠 READY VALIDATION
    ================================================= */
    if (nextStatus === "ready") {
      const [[remaining]] = await conn.query(
        `
        SELECT COUNT(*) AS remaining
        FROM order_items
        WHERE orderId = ?
          AND status IN ('pending','preparing')
        FOR UPDATE
        `,
        [orderId]
      );

      if (remaining.remaining > 0) {
        await conn.rollback();
        return res.json({
          message: "Order not ready yet",
          remainingItems: Number(remaining.remaining),
          notReady: true,
        });
      }
    }

    /* =================================================
       🕒 TIMESTAMP
    ================================================= */
    const timestampSQL = currentState.timestamp
      ? `, ${currentState.timestamp} = NOW()`
      : "";

    /* =================================================
       ✅ UPDATE ORDER
    ================================================= */
    const [updateResult] = await conn.query(
      `
      UPDATE orders
      SET status = ? ${timestampSQL}
      WHERE id = ?
        AND branchId = ?
        AND status = ?
      `,
      [nextStatus, orderId, branchId, order.status]
    );

    if (updateResult.affectedRows === 0) {
      await conn.rollback();
      return res.json({
        message: "Order already updated",
        raceSafe: true,
      });
    }

    /* =================================================
       🤖 AUTO ASSIGN WAITER
    ================================================= */
    let assignedWaiterId = order.waiterId
      ? Number(order.waiterId)
      : null;

    if (nextStatus === "ready" && !assignedWaiterId) {
      assignedWaiterId = await autoAssignWaiter(conn, {
        orderId,
        branchId,
        tableId: order.tableId,
      });

      if (assignedWaiterId) {
        await conn.query(
          `
          UPDATE orders
          SET waiterId = ?
          WHERE id = ? AND branchId = ?
          `,
          [assignedWaiterId, orderId, branchId]
        );
      }
    }

    /* =================================================
       🧾 AUDIT
    ================================================= */
    await logAudit({
      action: "ORDER_STATUS_CHANGED",
      entityType: "ORDER",
      entityId: orderId,
      user: req.user,
      meta: {
        from: order.status,
        to: nextStatus,
      },
      conn,
    });

    await conn.commit();

    /* =================================================
       📡 SOCKET EVENTS (STANDARDIZED)
    ================================================= */

    const payload = {
      orderId,
      status: nextStatus,
      waiterId: assignedWaiterId,
    };

    /* 🔔 customer live order */
    io?.to(`order:${orderId}`).emit("order:status", payload);

    /* 🔔 branch dashboards */
    io?.to(`branch:${branchId}`).emit("order:status", payload);

    /* optional kitchen dashboard event */
    io?.to(`branch:${branchId}`).emit("order:kitchen:update", payload);

    if (nextStatus === "ready") {
      const readyPayload = {
        orderId,
        status: "ready",
        readyAt: new Date(),
        waiterId: assignedWaiterId,
      };

      io?.to(`order:${orderId}`).emit("order:status", readyPayload);

      io?.to(`branch:${branchId}`).emit("order:ready", readyPayload);

      if (assignedWaiterId) {
        io?.to(`waiter:${assignedWaiterId}`).emit("order:ready", {
          orderId,
        });
      }
    }

    if (nextStatus === "accepted") {
      setImmediate(() => checkKitchenSLA(orderId, branchId, io));
    }

    return res.json({
      message: "Order updated",
      orderId,
      status: nextStatus,
      waiterId: assignedWaiterId,
    });

  } catch (err) {
    await conn.rollback();
    console.error("❌ KITCHEN STATUS ERROR:", err);
    next(err);
  } finally {
    conn.release();
  }
};





export const updateKitchenItemStatus = async (req, res, next) => {
  const conn = await db.getConnection();
  const io = req.app.get("io");

  try {
    const itemId = Number(req.params.itemId);
    const { branchId } = req.user;

    if (!itemId || Number.isNaN(itemId)) {
      return res.status(400).json({ message: "Valid item ID required" });
    }

    await conn.beginTransaction();

    /* =================================================
       🔒 LOCK ITEM
    ================================================= */
    const [[item]] = await conn.query(
      `
      SELECT oi.id, oi.status, oi.orderId
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
       🧠 STATE MACHINE
    ================================================= */
    const transitions = {
      pending: "preparing",
      preparing: "ready",
    };

    const nextStatus = transitions[item.status];

    /* ✅ IDEMPOTENT GUARD */
    if (!nextStatus) {
      await conn.rollback();
      return res.json({
        message: "Item already in final state",
        alreadyReady: true,
        status: item.status,
      });
    }

    /* =================================================
       🔒 LOCK ORDER
    ================================================= */
    const [[orderRow]] = await conn.query(
      `
      SELECT id, status, waiterId, tableId
      FROM orders
      WHERE id = ?
        AND branchId = ?
      FOR UPDATE
      `,
      [item.orderId, branchId]
    );

    if (!orderRow) {
      await conn.rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    /* =================================================
       ✅ UPDATE ITEM
    ================================================= */
    const timeUpdate = nextStatus === "ready" ? ", readyAt = NOW()" : "";

    const [itemUpdate] = await conn.query(
      `
      UPDATE order_items
      SET status = ? ${timeUpdate}
      WHERE id = ?
        AND status = ?
      `,
      [nextStatus, itemId, item.status]
    );

    if (itemUpdate.affectedRows === 0) {
      await conn.rollback();
      return res.json({
        message: "Item already updated",
        raceSafe: true,
      });
    }

    /* =================================================
       🔍 CHECK REMAINING ITEMS
    ================================================= */
    const [[remaining]] = await conn.query(
      `
      SELECT COUNT(*) AS remaining
      FROM order_items
      WHERE orderId = ?
        AND status IN ('pending','preparing')
      FOR UPDATE
      `,
      [item.orderId]
    );

    let orderBecameReady = false;
    let assignedWaiterId = orderRow.waiterId
      ? Number(orderRow.waiterId)
      : null;

    /* =================================================
       ✅ AUTO MARK ORDER READY
    ================================================= */
    if (remaining.remaining === 0) {
      const [updateOrder] = await conn.query(
        `
        UPDATE orders
        SET status = 'ready',
            readyAt = NOW()
        WHERE id = ?
          AND branchId = ?
          AND status IN ('accepted','preparing')
        `,
        [item.orderId, branchId]
      );

      if (updateOrder.affectedRows > 0) {
        orderBecameReady = true;

        /* 🤖 AUTO ASSIGN WAITER */
        if (!assignedWaiterId) {
          assignedWaiterId = await autoAssignWaiter(conn, {
            orderId: item.orderId,
            branchId,
            tableId: orderRow.tableId,
          });

          if (assignedWaiterId) {
            await conn.query(
              `
              UPDATE orders
              SET waiterId = ?
              WHERE id = ? AND branchId = ?
              `,
              [assignedWaiterId, item.orderId, branchId]
            );
          }
        }
      }
    }

    await conn.commit();

    /* =================================================
       📡 SOCKET EVENTS
    ================================================= */

    const itemPayload = {
      itemId,
      orderId: item.orderId,
      status: nextStatus,
    };

    /* 🔔 item update for customer + kitchen */
    io?.to(`order:${item.orderId}`).emit("order:item:update", itemPayload);
    io?.to(`branch:${branchId}`).emit("order:item:update", itemPayload);

    if (orderBecameReady) {
      const orderPayload = {
        orderId: item.orderId,
        status: "ready",
        readyAt: new Date(),
        waiterId: assignedWaiterId,
      };

      /* 🔔 update customer live page */
      io?.to(`order:${item.orderId}`).emit("order:status", orderPayload);

      /* 🔔 dashboards */
      io?.to(`branch:${branchId}`).emit("order:status", orderPayload);

      /* 🔔 waiter notification */
      if (assignedWaiterId) {
        io?.to(`waiter:${assignedWaiterId}`).emit("order:ready", {
          orderId: item.orderId,
        });
      }
    }

    return res.json({
      message: "Item updated",
      nextStatus,
      orderReady: orderBecameReady,
      waiterId: assignedWaiterId,
    });

  } catch (err) {
    await conn.rollback();
    console.error("❌ KITCHEN ITEM ERROR:", err);
    next(err);
  } finally {
    conn.release();
  }
};


/* =====================================
   MARK ITEM AS PRIORITY (SERVE FAST)
===================================== */
export const markItemPriority = async (req, res, next) => {
  const conn = await db.getConnection();
  const io = req.app.get("io");

  try {
    const itemId = Number(req.params.itemId);
    const { tableSession } = req;

    if (!itemId) {
      return res.status(400).json({ message: "Item ID required" });
    }

    if (!tableSession) {
      return res.status(403).json({ message: "Table session required" });
    }

    await conn.beginTransaction();

    /* =================================================
       🔒 LOCK ITEM (deadlock-safe first lock)
    ================================================= */
    const [[item]] = await conn.query(
      `
      SELECT oi.id, oi.isPriority, oi.orderId
      FROM order_items oi
      JOIN orders o ON o.id = oi.orderId
      WHERE oi.id = ?
        AND o.tableId = ?
      FOR UPDATE
      `,
      [itemId, tableSession.tableId]
    );

    if (!item) {
      await conn.rollback();
      return res.status(404).json({ message: "Item not found" });
    }

    /* =================================================
       🛑 IDEMPOTENT GUARD (already priority)
    ================================================= */
    if (item.isPriority) {
      await conn.rollback();
      return res.json({
        message: "Item already priority",
        itemId,
        alreadyPriority: true,
      });
    }

    /* =================================================
       🔒 LOCK ORDER (important for consistency)
    ================================================= */
    const [[orderRow]] = await conn.query(
      `
      SELECT id
      FROM orders
      WHERE id = ?
      FOR UPDATE
      `,
      [item.orderId]
    );

    if (!orderRow) {
      await conn.rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    /* =================================================
       ✅ UPDATE ITEM PRIORITY
    ================================================= */
    await conn.query(
      `
      UPDATE order_items
      SET isPriority = 1,
          priorityAt = NOW()
      WHERE id = ?
      `,
      [itemId]
    );

    /* =================================================
       🚀 MAINTAIN DENORMALIZED FLAG (CRITICAL)
       (this makes kitchen super fast)
    ================================================= */
    await conn.query(
      `
      UPDATE orders
      SET hasPriority = 1
      WHERE id = ?
      `,
      [item.orderId]
    );

    await conn.commit();

    /* =================================================
       📡 SOCKET EMIT (POST COMMIT)
    ================================================= */
    const payload = {
      itemId,
      orderId: item.orderId,
    };

    io?.to(`branch:${tableSession.branchId}`).emit(
      "order:item:priority",
      payload
    );

    io?.to(`order:${item.orderId}`).emit(
      "order:item:priority",
      payload
    );

    return res.json({
      message: "Item marked as fast",
      itemId,
      orderId: item.orderId,
    });

  } catch (err) {
    await conn.rollback();
    console.error("❌ PRIORITY ERROR:", err);
    next(err);
  } finally {
    conn.release();
  }
};
/* =====================================
   EXPO BATCH BUMP (ENTERPRISE)
===================================== */
export const batchBumpOrders = async (req, res, next) => {
  const conn = await db.getConnection();
  const io = req.app.get("io");

  try {
    const { branchId } = req.user;
    let { orderIds } = req.body;

    /* =================================================
       🧠 VALIDATION
    ================================================= */
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        message: "orderIds array required",
      });
    }

    // sanitize IDs
    orderIds = [
      ...new Set(
        orderIds
          .map((id) => Number(id))
          .filter((id) => !Number.isNaN(id) && id > 0)
      ),
    ];

    if (orderIds.length === 0) {
      return res.status(400).json({
        message: "No valid order IDs provided",
      });
    }

    // batch protection
    if (orderIds.length > 100) {
      return res.status(400).json({
        message: "Too many orders in one batch (max 100)",
      });
    }

    await conn.beginTransaction();

    /* =================================================
       🔒 LOCK READY ORDERS
    ================================================= */
    const [orders] = await conn.query(
      `
      SELECT id, waiterId
      FROM orders
      WHERE id IN (?)
        AND branchId = ?
        AND status = 'ready'
      FOR UPDATE
      `,
      [orderIds, branchId]
    );

    if (!orders.length) {
      await conn.rollback();
      return res.status(404).json({
        message: "No ready orders found",
      });
    }

    const readyIds = orders.map((o) => o.id);

    /* =================================================
       ✅ UPDATE LOCKED ORDERS
    ================================================= */
    const [updateResult] = await conn.query(
      `
      UPDATE orders
      SET status = 'out_for_delivery',
          pickedAt = NOW()
      WHERE id IN (?)
        AND branchId = ?
        AND status = 'ready'
      `,
      [readyIds, branchId]
    );

    await conn.commit();

    /* =================================================
       📡 SOCKET EVENTS
    ================================================= */

    const payload = orders.map((o) => ({
      orderId: o.id,
      status: "out_for_delivery",
      waiterId: o.waiterId ? Number(o.waiterId) : null,
    }));

    /* 🔔 branch dashboard update */
    io?.to(`branch:${branchId}`).emit("order:status:batch", payload);

    /* 🔔 customer live pages */
    for (const o of payload) {
      io?.to(`order:${o.orderId}`).emit("order:status", o);
    }

    return res.json({
      message: "Batch bump success",
      count: updateResult.affectedRows,
      orders: payload,
    });

  } catch (err) {
    await conn.rollback();
    console.error("❌ BATCH BUMP ERROR:", err);
    next(err);
  } finally {
    conn.release();
  }

};
/* =====================================
   KITCHEN ORDER HISTORY
   (served + paid)
===================================== */
export const getKitchenOrderHistory = async (req, res, next) => {
  try {
    const { branchId } = req.user;
    const { range = "today" } = req.query;

    /* =================================================
       🧠 BUILD INDEX-FRIENDLY DATE RANGE
    ================================================= */

    let startDate = null;

    if (range === "today") {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "week") {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "month") {
      startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    /* =================================================
       🚀 ORDERS (INDEX FRIENDLY — NO DATE())
    ================================================= */

    const [orders] = await db.query(
      `
      SELECT
        o.id,
        o.status,
        o.servedAt,
        o.paidAt,
        t.tableNumber,
        COALESCE(o.paidAt, o.servedAt) AS sortTime
      FROM orders o
      JOIN tables t ON t.id = o.tableId
      WHERE o.branchId = ?
        AND o.status IN ('served','paid')
        ${
          startDate
            ? "AND COALESCE(o.paidAt, o.servedAt) >= ?"
            : ""
        }
      ORDER BY sortTime DESC
      LIMIT 500
      `,
      startDate ? [branchId, startDate] : [branchId]
    );

    if (!orders.length) return res.json([]);

    /* 🚨 overload guard */
    if (orders.length > 400) {
      console.warn("⚠️ Kitchen history heavy load:", orders.length);
    }

    const orderIds = orders.map(o => o.id);

    /* =================================================
       🔹 FETCH ITEMS ONLY FOR RETURNED ORDERS
    ================================================= */

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

    /* =================================================
       🧠 MAP BUILD
    ================================================= */

    const map = Object.create(null);

    for (const o of orders) {
      map[o.id] = {
        id: Number(o.id),
        status: o.status,
        servedAt: o.servedAt,
        paidAt: o.paidAt,
        tableNumber: o.tableNumber,
        items: [],
      };
    }

    for (const i of items) {
      const order = map[i.orderId];
      if (!order) continue;

      order.items.push({
        name: i.name,
        qty: Number(i.qty || 0),
      });
    }

    return res.json(Object.values(map));
  } catch (err) {
    console.error("❌ KITCHEN HISTORY ERROR:", err);
    next(err);
  }
};
/* =====================================
   KITCHEN SUMMARY
===================================== */
export const getKitchenSummary = async (req, res, next) => {
  try {
    const { branchId } = req.user;

    const [[summary]] = await db.query(
      `
      SELECT
        SUM(status = 'pending')   AS pending,
        SUM(status = 'accepted')  AS accepted,
        SUM(status = 'preparing') AS preparing,
        SUM(status = 'ready')     AS ready
      FROM orders
      WHERE branchId = ?
      `,
      [branchId]
    );

    res.json({
      pending: Number(summary.pending || 0),
      accepted: Number(summary.accepted || 0),
      preparing: Number(summary.preparing || 0),
      ready: Number(summary.ready || 0),
    });
  } catch (err) {
    next(err);
  }
};