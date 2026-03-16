import { db } from "../config/db.js";

/* =====================================
   VERIFY TABLE SESSION (RESILIENT)
===================================== */

export const verifyTableSession = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    const deviceId = req.headers["x-device-id"];

    /* =====================================
       🔒 BASIC VALIDATION
    ===================================== */

    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(403).json({
        message: "Table session required",
      });
    }

    if (!deviceId) {
      return res.status(403).json({
        message: "Device identification required",
      });
    }

    const sessionToken = auth.split(" ")[1];

    if (!sessionToken || sessionToken.length < 20) {
      return res.status(403).json({
        message: "Invalid session token",
      });
    }

    /* =====================================
       🔎 VALIDATE SESSION
    ===================================== */

    const [[session]] = await db.query(
      `
      SELECT 
        id,
        tableId,
        branchId,
        companyId,
        expiresAt,
        isActive
      FROM table_sessions
      WHERE sessionToken = ?
      LIMIT 1
      `,
      [sessionToken]
    );

    if (!session || !session.isActive) {
      return res.status(403).json({
        message: "Invalid or expired table session",
      });
    }

    /* =====================================
       ⏰ HARD EXPIRY
    ===================================== */

    if (new Date(session.expiresAt) < new Date()) {
      return res.status(403).json({
        message: "Session expired. Please scan QR again.",
      });
    }

    /* =====================================
       📱 VERIFY DEVICE (AUTO-RECOVER SAFE)
    ===================================== */

    let [[device]] = await db.query(
      `
      SELECT id, isActive
      FROM table_session_devices
      WHERE sessionId = ?
        AND deviceId = ?
      ORDER BY id DESC
      LIMIT 1
      `,
      [session.id, deviceId]
    );

    /* 🔄 Device missing → auto register */
    if (!device) {
      await db.query(
        `
        INSERT INTO table_session_devices
          (sessionId, deviceId, isActive, lastActivity)
        VALUES (?, ?, 1, NOW())
        `,
        [session.id, deviceId]
      );
    }

    /* 🔄 Device inactive → reactivate */
    else if (!device.isActive) {
      await db.query(
        `
        UPDATE table_session_devices
        SET isActive = 1,
            lastActivity = NOW()
        WHERE id = ?
        `,
        [device.id]
      );
    }

    /* =====================================
       🔄 REFRESH ACTIVITY
    ===================================== */

    await Promise.all([
      db.query(
        `
        UPDATE table_sessions
        SET 
          lastActivity = NOW(),
          expiresAt = DATE_ADD(NOW(), INTERVAL 2 HOUR)
        WHERE id = ?
        `,
        [session.id]
      ),

      db.query(
        `
        UPDATE table_session_devices
        SET lastActivity = NOW()
        WHERE sessionId = ?
          AND deviceId = ?
        `,
        [session.id, deviceId]
      ),
    ]);

    /* =====================================
       🔎 VERIFY TABLE
    ===================================== */

    const [[table]] = await db.query(
      `
      SELECT id, status
      FROM tables
      WHERE id = ?
        AND branchId = ?
        AND is_deleted = 0
      LIMIT 1
      `,
      [session.tableId, session.branchId]
    );

    if (!table) {
      return res.status(403).json({
        message: "Table not found",
      });
    }

    if (table.status === "inactive") {
      return res.status(403).json({
        message: "Table inactive",
      });
    }

    /* =====================================
       ✅ ATTACH SESSION
    ===================================== */

    req.tableSession = {
      tableId: session.tableId,
      branchId: session.branchId,
      companyId: session.companyId,
      sessionId: session.id,
      deviceId,
      multiDevice: true,
    };

    next();

  } catch (err) {
    console.error("🔴 TABLE SESSION ERROR:", err);

    return res.status(500).json({
      message: "Table session validation failed",
    });
  }
};