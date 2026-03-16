import { db } from "../config/db.js";

/* =====================================
   SMART TABLE GUARD (ENTERPRISE)
===================================== */

export const runTableGuard = async (io) => {
  const conn = await db.getConnection();

  try {
    console.log("🛡️ Table Guard running...");

    /* =================================================
       1️⃣ EXPIRE DEAD SESSIONS (BATCH SAFE)
    ================================================= */

    const [expiredSessions] = await conn.query(`
      SELECT id, tableId
      FROM table_sessions
      WHERE isActive = 1
        AND expiresAt < NOW()
    `);

    if (expiredSessions.length > 0) {
      const sessionIds = expiredSessions.map((s) => s.id);

      // ✅ deactivate sessions in batch
      await conn.query(
        `
        UPDATE table_sessions
        SET isActive = 0
        WHERE id IN (?)
        `,
        [sessionIds]
      );

      // ✅ deactivate devices (VERY IMPORTANT)
      await conn.query(
        `
        UPDATE table_session_devices
        SET isActive = 0
        WHERE sessionId IN (?)
        `,
        [sessionIds]
      );

      // 🔎 check tables to free
      const tableIds = [
        ...new Set(expiredSessions.map((s) => s.tableId)),
      ];

      for (const tableId of tableIds) {
        const [[stillActive]] = await conn.query(
          `
          SELECT COUNT(*) AS cnt
          FROM table_sessions
          WHERE tableId = ?
            AND isActive = 1
            AND expiresAt > NOW()
          `,
          [tableId]
        );

        if (stillActive.cnt === 0) {
          await conn.query(
            `
            UPDATE tables
            SET status = 'available'
            WHERE id = ?
              AND status = 'occupied'
            `,
            [tableId]
          );

          console.log(
            `🪑 Table ${tableId} auto-freed (session expired)`
          );
        }
      }
    }

    /* =================================================
       2️⃣ ABANDONED TABLE DETECTOR (SMARTER)
    ================================================= */

    const [abandonedTables] = await conn.query(`
      SELECT t.id
      FROM tables t
      LEFT JOIN table_sessions s
        ON s.tableId = t.id
        AND s.isActive = 1
        AND s.expiresAt > NOW()
      WHERE t.status = 'occupied'
        AND s.id IS NULL
        AND t.updatedAt < NOW() - INTERVAL 4 HOUR
    `);

    if (abandonedTables.length > 0) {
      const ids = abandonedTables.map((t) => t.id);

      await conn.query(
        `
        UPDATE tables
        SET status = 'available'
        WHERE id IN (?)
        `,
        [ids]
      );

      console.log(
        `🧹 Freed ${ids.length} abandoned tables`
      );
    }

    /* =================================================
       3️⃣ ORDER STUCK DETECTOR (IDEMPOTENT)
    ================================================= */

    const [stuckOrders] = await conn.query(`
      SELECT id, branchId
      FROM orders
      WHERE status IN ('pending','accepted','preparing')
        AND isDelayed = 0
        AND createdAt < NOW() - INTERVAL 45 MINUTE
    `);

    if (stuckOrders.length > 0) {
      const orderIds = stuckOrders.map((o) => o.id);

      await conn.query(
        `
        UPDATE orders
        SET isDelayed = 1,
            delayReason = 'Auto-detected by system'
        WHERE id IN (?)
        `,
        [orderIds]
      );

      // 🔔 socket notify
      for (const order of stuckOrders) {
        io?.to(`branch:${order.branchId}`).emit(
          "order:delayed",
          { orderId: order.id }
        );
      }
    }

    console.log("✅ Table Guard completed");
  } catch (err) {
    console.error("🔴 TABLE GUARD ERROR:", err);
  } finally {
    conn.release();
  }
};
