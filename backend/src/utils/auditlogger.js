import { db } from "../config/db.js";

export const logAudit = async ({
  action,
  entityType,
  entityId,
  user,
  meta = {},
  conn = null, // allow transaction reuse
}) => {
  const executor = conn || db;

  await executor.query(
    `
    INSERT INTO audit_logs
    (action, entityType, entityId, userId, userRole, branchId, companyId, meta)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      action,
      entityType,
      entityId,
      user?.id || null,
      user?.role || null,
      user?.branchId || null,
      user?.companyId || null,
      JSON.stringify(meta),
    ]
  );
};

export const auditLog = async ({
  req,
  action,
  entityType,
  entityId = null,
  meta = {},
}) => {
  try {
    const user = req.user || {};

    await db.query(
      `
      INSERT INTO audit_logs
      (
        action,
        entityType,
        entityId,
        userId,
        userRole,
        branchId,
        companyId,
        meta
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        action,
        entityType,
        entityId,
        user.id || null,
        user.role || "SYSTEM",
        user.branchId || null,
        user.companyId || null,
        JSON.stringify(meta),
      ]
    );
  } catch (err) {
    // NEVER break main flow because of audit failure
    console.error("⚠️ AUDIT LOG ERROR:", err.message);
  }
};
