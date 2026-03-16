import crypto from "crypto";
import { db } from "../config/db.js";
import { logAudit } from "../utils/auditlogger.js";

/* =====================================
   DEVICE LIMIT BY TABLE TYPE
===================================== */

const DEVICE_LIMIT_BY_TYPE = {
  REGULAR: 4,
  FAMILY: 8,
  VIP: 6,
  HALL: 12,
};

const getMaxDevicesForTable = (tableType) => {
  if (!tableType) return 6;
  const normalized = String(tableType).toUpperCase().trim();
  return DEVICE_LIMIT_BY_TYPE[normalized] || 6;
};

/* =====================================
   OPEN TABLE BY QR
===================================== */

export const openTableByQr = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { token } = req.params;
    const deviceId = req.headers["x-device-id"];
    const ipAddress = req.ip;

    if (!deviceId) {
      return res.status(400).json({
        message: "Device identification required",
      });
    }

    if (!token) {
      return res.status(400).json({
        message: "QR token missing",
      });
    }

    await conn.beginTransaction();

    /* ================================================
       🧹 CLEAN EXPIRED SESSIONS
    ================================================= */

    await conn.query(`
      UPDATE table_sessions
      SET isActive = 0
      WHERE expiresAt < NOW()
        AND isActive = 1
    `);

    /* ================================================
       🔎 LOCK TABLE
    ================================================= */

    const [[table]] = await conn.query(
      `
      SELECT id, branchId, companyId, status, tableType
      FROM tables
      WHERE qrToken = ?
        AND is_deleted = 0
      FOR UPDATE
      `,
      [token],
    );

    if (!table) {
      await conn.rollback();
      return res.status(403).json({ message: "Invalid QR code" });
    }

    if (table.status === "inactive") {
      await conn.rollback();
      return res.status(403).json({ message: "Table inactive" });
    }

    /* ================================================
       🧹 CLEAN STALE DEVICES
    ================================================= */

    await conn.query(`
      UPDATE table_session_devices
      SET isActive = 0
      WHERE lastActivity < NOW() - INTERVAL 3 HOUR
        AND isActive = 1
    `);

    /* ================================================
       🔎 GET ACTIVE SESSION
    ================================================= */

    const [[session]] = await conn.query(
      `
      SELECT id, sessionToken
      FROM table_sessions
      WHERE tableId = ?
        AND isActive = 1
        AND expiresAt > NOW()
      ORDER BY id DESC
      LIMIT 1
      FOR UPDATE
      `,
      [table.id],
    );

    let sessionId;
    let sessionToken;
    let reused = false;

    /* ================================================
       🆕 CREATE SESSION
    ================================================= */

    if (!session) {
      sessionToken = crypto.randomUUID();

      const [insertResult] = await conn.query(
        `
        INSERT INTO table_sessions
          (tableId, branchId, companyId, sessionToken, ipAddress, expiresAt, isActive)
        VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 2 HOUR), 1)
        `,
        [table.id, table.branchId, table.companyId, sessionToken, ipAddress],
      );

      sessionId = insertResult.insertId;
    } else {
      sessionId = session.id;
      sessionToken = session.sessionToken;
      reused = true;
    }

    /* ================================================
       🔎 CHECK EXISTING DEVICE
    ================================================= */

    const [[existingDevice]] = await conn.query(
      `
      SELECT id
      FROM table_session_devices
      WHERE sessionId = ?
        AND deviceId = ?
      LIMIT 1
      `,
      [sessionId, deviceId],
    );

    if (!existingDevice) {
      const [[countRow]] = await conn.query(
        `
        SELECT COUNT(*) AS deviceCount
        FROM table_session_devices
        WHERE sessionId = ?
          AND isActive = 1
        `,
        [sessionId],
      );

      const maxDevices = getMaxDevicesForTable(table.tableType);

      if (countRow.deviceCount >= maxDevices) {
        await conn.rollback();

        return res.status(403).json({
          message:
            "Maximum people already joined this table. Please ask waiter.",
          maxDevices,
        });
      }

      console.log("Register device:", deviceId);

      await conn.query(
        `
        INSERT INTO table_session_devices
          (sessionId, deviceId, ipAddress, isActive, lastActivity)
        VALUES (?, ?, ?, 1, NOW())
        `,
        [sessionId, deviceId, ipAddress],
      );
    } else {
      await conn.query(
        `
        UPDATE table_session_devices
        SET lastActivity = NOW(),
            isActive = 1
        WHERE sessionId = ?
          AND deviceId = ?
        `,
        [sessionId, deviceId],
      );
    }

    await conn.commit();

    return res.json({
      sessionToken,
      tableId: table.id,
      reused,
      multiDevice: true,
    });
  } catch (err) {
    await conn.rollback();
    console.error("🔴 QR OPEN ERROR:", err);

    return res.status(500).json({
      message: "Failed to open table",
    });
  } finally {
    conn.release();
  }
};

/* =====================================
   GET PUBLIC MENU
===================================== */
/* =====================================
   GET PUBLIC MENU
===================================== */
export const getPublicMenu = async (req, res, next) => {
  try {
    const { branchId } = req.tableSession || {};

    if (!branchId) {
      return res.status(400).json({
        message: "Invalid table session",
      });
    }

    // 🚀 light caching (safe for menu)
    res.set({
      "Cache-Control": "private, max-age=60",
    });

    const [rows] = await db.query(
      `
      SELECT 
        c.id   AS categoryId,
        c.name AS categoryName,

        m.id   AS itemId,
        m.name AS itemName,
        m.price,
        m.imageUrl,
        m.is_veg,
        m.description,
        m.is_combo,
        m.combo_price

      FROM menu_items m
      JOIN menu_categories c ON c.id = m.categoryId

      WHERE m.branchId = ?
        AND m.is_available = 1
        AND c.is_active = 1

      ORDER BY 
        c.name ASC,
        m.name ASC
      `,
      [branchId],
    );

    if (!rows.length) {
      return res.json({ categories: [] });
    }

    const categoriesMap = new Map();

    for (const row of rows) {
      if (!categoriesMap.has(row.categoryId)) {
        categoriesMap.set(row.categoryId, {
          id: row.categoryId,
          name: row.categoryName,
          items: [],
        });
      }

      categoriesMap.get(row.categoryId).items.push({
        id: row.itemId,
        name: row.itemName,
        price: Number(row.price),
        imageUrl: row.imageUrl,
        isVeg: Boolean(row.is_veg),
        description: row.description,
        isCombo: Boolean(row.is_combo),
        comboPrice: row.combo_price ? Number(row.combo_price) : null,
      });
    }

    return res.json({
      categories: Array.from(categoriesMap.values()),
    });
  } catch (err) {
    console.error("PUBLIC MENU ERROR:", err);
    next(err);
  }
};

/* =====================================
   CREATE ORDER (WITH NOTES + ACCEPTED SAFE)
===================================== */
/* =====================================
   CREATE ORDER
===================================== */
export const createOrder = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { items } = req.body;
    const { tableSession } = req;

    if (!tableSession?.tableId || !tableSession?.branchId || !tableSession?.sessionId) {
      return res.status(400).json({
        message: "Invalid table session",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Invalid items",
      });
    }

    const { tableId, branchId, sessionId } = tableSession;

    await conn.beginTransaction();

    /* ================================
       LOCK TABLE
    ================================ */

    const [[table]] = await conn.query(
      `
      SELECT status
      FROM tables
      WHERE id = ? AND branchId = ?
      FOR UPDATE
      `,
      [tableId, branchId]
    );

    if (!table || table.status === "inactive") {
      throw new Error("Invalid table");
    }

    /* ================================
       FIND ACTIVE ORDER
    ================================ */

    const [[activeOrder]] = await conn.query(
      `
      SELECT id, status
      FROM orders
      WHERE sessionId = ?
      AND branchId = ?
      AND status IN (
        'pending',
        'accepted',
        'preparing',
        'ready'
      )
      ORDER BY id DESC
      LIMIT 1
      FOR UPDATE
      `,
      [sessionId, branchId]
    );

    let orderId;
    let isNewOrder = false;

    /* ================================
       CREATE FIRST ORDER
    ================================ */

    if (!activeOrder) {

      const [orderResult] = await conn.query(
        `
        INSERT INTO orders (tableId, branchId, sessionId, status)
        VALUES (?, ?, ?, 'pending')
        `,
        [tableId, branchId, sessionId]
      );

      orderId = orderResult.insertId;
      isNewOrder = true;

      await conn.query(
        `
        UPDATE tables
        SET status = 'occupied'
        WHERE id = ? AND status = 'available'
        `,
        [tableId]
      );

    } else {

      /* ================================
         CONTINUE SAME ORDER
      ================================ */

      orderId = activeOrder.id;

    }

    /* ================================
       FETCH MENU ITEMS
    ================================ */

    const itemIds = items.map(i => i.itemId);

    const [menuRows] = await conn.query(
      `
      SELECT id, price
      FROM menu_items
      WHERE branchId = ?
      AND is_available = 1
      AND id IN (?)
      FOR UPDATE
      `,
      [branchId, itemIds]
    );

    const menuMap = new Map();

    menuRows.forEach(m => {
      menuMap.set(Number(m.id), Number(m.price));
    });

    let totalAmount = 0;

    /* ================================
       INSERT ORDER ITEMS
    ================================ */

    for (const item of items) {

      const price = menuMap.get(Number(item.itemId));

      if (!price) {
        throw new Error("Menu item unavailable");
      }

      const qty = Number(item.quantity);

      if (!qty || qty <= 0) {
        throw new Error("Invalid quantity");
      }

      const lineTotal = price * qty;
      totalAmount += lineTotal;

      await conn.query(
        `
        INSERT INTO order_items
        (orderId, itemId, quantity, price, note, isPriority, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
        `,
        [
          orderId,
          item.itemId,
          qty,
          price,
          item.note || null,
          item.priority === "high" ? 1 : 0,
        ]
      );

    }

    /* ================================
       UPDATE ORDER TOTAL
    ================================ */

    await conn.query(
      `
      UPDATE orders
      SET totalAmount = totalAmount + ?
      WHERE id = ?
      `,
      [totalAmount, orderId]
    );

    await conn.commit();

    /* ================================
       SOCKET EVENTS
    ================================ */

    const io = req.app.get("io");

    if (io) {

      if (isNewOrder) {

        io.to(`branch:${branchId}`).emit("order:new", {
          orderId,
          tableId,
          branchId,
          addedAmount: totalAmount,
          status: "pending",
        });

      } else {

        io.to(`branch:${branchId}`).emit("order:updated", {
          orderId,
          addedAmount: totalAmount
        });

      }

      io.to(`order:${orderId}`).emit("order:updated", {
        orderId,
        addedAmount: totalAmount,
      });

    }

    return res.status(201).json({
      message: "Items added successfully",
      orderId,
      addedAmount: totalAmount,
    });

  } catch (err) {

    await conn.rollback();

    console.error("CREATE ORDER ERROR:", err);

    return res.status(400).json({
      message: err.message || "Failed to create order",
    });

  } finally {
    conn.release();
  }
};
/* =====================================
   GET CURRENT CUSTOMER ORDER
===================================== */
/* =====================================
   GET CURRENT CUSTOMER ORDER
===================================== */
/* =====================================
   GET CURRENT CUSTOMER ORDER
===================================== */
export const getCurrentCustomerOrder = async (req, res, next) => {
  try {

    const { tableSession } = req;

    if (!tableSession?.sessionId || !tableSession?.branchId) {
      return res.status(400).json({
        message: "Invalid table session",
      });
    }

    const { sessionId, branchId } = tableSession;

    /* =========================================
       NO CACHE (important for live tracking)
    ========================================= */

    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    /* =========================================
       GET ACTIVE ORDER IN SESSION
    ========================================= */

    let [[order]] = await db.query(
      `
      SELECT
        o.id,
        o.status,
        o.waiterId,
        COALESCE(u.full_name, 'Assigning…') AS waiterName,
        t.tableNumber,
        o.createdAt
      FROM orders o
      JOIN tables t ON t.id = o.tableId
      LEFT JOIN users u ON u.id = o.waiterId
      WHERE o.sessionId = ?
      AND o.branchId = ?
      AND o.status IN (
        'pending',
        'accepted',
        'preparing',
        'ready',
        'out_for_delivery'
      )
      ORDER BY o.id DESC
      LIMIT 1
      `,
      [sessionId, branchId]
    );

    /* =========================================
       IF NO ACTIVE ORDER → RETURN LAST SESSION ORDER
    ========================================= */

    if (!order) {

      [[order]] = await db.query(
        `
        SELECT
          o.id,
          o.status,
          o.waiterId,
          COALESCE(u.full_name, 'Assigning…') AS waiterName,
          t.tableNumber,
          o.createdAt
        FROM orders o
        JOIN tables t ON t.id = o.tableId
        LEFT JOIN users u ON u.id = o.waiterId
        WHERE o.sessionId = ?
        AND o.branchId = ?
        ORDER BY o.id DESC
        LIMIT 1
        `,
        [sessionId, branchId]
      );

    }

    /* =========================================
       NO ORDER IN SESSION
    ========================================= */

    if (!order) {
      return res.json({
        orderId: null,
        order: null,
        status: "no_order",
      });
    }

    /* =========================================
       GET ORDER ITEMS
    ========================================= */

    const [items] = await db.query(
      `
      SELECT
        oi.id,
        oi.quantity,
        oi.status,
        oi.note,
        oi.isPriority,
        mi.name,
        mi.imageUrl
      FROM order_items oi
      JOIN menu_items mi ON mi.id = oi.itemId
      WHERE oi.orderId = ?
      ORDER BY oi.createdAt ASC, oi.id ASC
      `,
      [order.id]
    );

    order.items = items.map((i) => ({
      id: Number(i.id),
      name: i.name,
      qty: Number(i.quantity),
      status: i.status,
      note: i.note,
      isPriority: Boolean(i.isPriority),
      imageUrl: i.imageUrl,
    }));

    /* =========================================
       RESPONSE
    ========================================= */

    return res.json({
      orderId: order.id,
      order,
      status: order.status,
    });

  } catch (err) {

    console.error("❌ CURRENT ORDER ERROR:", err);
    next(err);

  }
};
/* =====================================
   🧾 CUSTOMER REQUEST BILL
===================================== */
export const requestBill = async (req, res, next) => {
  const conn = await db.getConnection();
  const io = req.app.get("io");

  try {
    const { orderId } = req.params;
    const branchId = req.branchId || req.user?.branchId;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID required" });
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
      [orderId, branchId],
    );

    if (!order) {
      await conn.rollback();
      return res.status(404).json({ message: "Order not found" });
    }

    /* =================================================
       ✅ IDEMPOTENT GUARD
    ================================================= */
    if (order.status === "bill_requested") {
      await conn.rollback();
      return res.json({
        message: "Bill already requested",
        alreadyRequested: true,
        orderId: Number(orderId),
      });
    }

    /* =================================================
       🚨 ONLY AFTER SERVED
    ================================================= */
    if (order.status !== "served") {
      await conn.rollback();
      return res.status(409).json({
        message: "Bill can be requested after order is served",
      });
    }

    /* =================================================
       ✅ UPDATE ORDER
    ================================================= */
    await conn.query(
      `
      UPDATE orders
      SET status = 'bill_requested',
          billRequestedAt = NOW()
      WHERE id = ?
        AND branchId = ?
      `,
      [orderId, branchId],
    );

    /* =================================================
       🧾 AUDIT
    ================================================= */
    await logAudit({
      action: "CUSTOMER_REQUESTED_BILL",
      entityType: "ORDER",
      entityId: orderId,
      user: req.user,
      meta: { requestedAt: new Date() },
      conn,
    });

    await conn.commit();

    /* =================================================
       📡 SOCKET EVENTS (VERY IMPORTANT)
    ================================================= */

    const payload = {
      orderId: Number(orderId),
      status: "bill_requested",
      requestedAt: new Date(),
      waiterId: order.waiterId || null,
    };

    // 🔔 notify branch (waiter dashboards)
    io?.to(`branch:${branchId}`).emit("order:bill_requested", payload);

    // 🔔 notify specific waiter (if assigned)
    if (order.waiterId) {
      io?.to(`waiter:${order.waiterId}`).emit("order:bill_requested", payload);
    }

    // 🔔 notify customer room
    io?.to(`order:${orderId}`).emit("order:status", payload);

    return res.json({
      message: "Bill requested successfully",
      ...payload,
    });
  } catch (err) {
    await conn.rollback();
    console.error("REQUEST BILL ERROR:", err);
    next(err);
  } finally {
    conn.release();
  }
};
