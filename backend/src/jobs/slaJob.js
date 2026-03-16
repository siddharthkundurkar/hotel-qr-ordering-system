import { db } from "../config/db.js";
import { checkKitchenSLA } from "../utils/slaChecker.js";

export const runSlaJob = async (io) => {
  const [orders] = await db.query(
    `
    SELECT id, branchId
    FROM orders
    WHERE status IN ('pending','preparing')
      AND isDelayed = 0
    `
  );

  for (const o of orders) {
    await checkKitchenSLA(o.id, o.branchId, io);
  }
};
