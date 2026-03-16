import { db } from "../config/db.js";
import { logAudit } from "./auditlogger.js";

export const checkKitchenSLA = async (orderId, branchId, io) => {
  const [[order]] = await db.query(
    `
    SELECT id, status, cookingStartedAt, createdAt
    FROM orders
    WHERE id = ? AND branchId = ?
    `,
    [orderId, branchId]
  );

  if (!order) return;

  let delayed = false;
  let reason = "";

  const now = new Date();

  // ⏱ pending too long
  if (order.status === "pending") {
    const mins =
      (now - new Date(order.createdAt)) / 60000;
    if (mins > 5) {
      delayed = true;
      reason = "Pending too long";
    }
  }

  // ⏱ preparing too long
  if (
    order.status === "preparing" &&
    order.cookingStartedAt
  ) {
    const mins =
      (now - new Date(order.cookingStartedAt)) / 60000;
    if (mins > 15) {
      delayed = true;
      reason = "Preparation delay";
    }
  }

  if (!delayed) return;

  // ✅ Mark delayed (idempotent)
  await db.query(
    `
    UPDATE orders
    SET isDelayed = 1, delayReason = ?
    WHERE id = ? AND isDelayed = 0
    `,
    [reason, orderId]
  );

  // 🧾 AUDIT
  await logAudit({
    action: "ORDER_DELAYED",
    entityType: "ORDER",
    entityId: orderId,
    meta: { reason },
  });

  // 🔔 SOCKET ALERT
  io?.to(`branch:${branchId}`).emit("order:delayed", {
    orderId,
    reason,
  });
};
