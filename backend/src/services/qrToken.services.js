import jwt from "jsonwebtoken";
import { db } from "../config/db.js";

const QR_SECRET = process.env.QR_SECRET; // ✅ NO FALLBACK
const QR_ISSUER = "hms-backend";
const QR_AUDIENCE = "table-qr";

/**
 * Generate signed QR token
 */
export const generateQrToken = ({ tableId, branchId, companyId }) => {
  return jwt.sign(
    {
      type: "TABLE_QR",
      tableId,
      branchId,
      companyId,
    },
    QR_SECRET,
    {
      expiresIn: "180d",
      issuer: QR_ISSUER,
      audience: QR_AUDIENCE,
    }
  );
};

/**
 * Verify QR token (scan only)
 */
// services/qrToken.services.js




export const verifyQrToken = async (token) => {
  let payload;

  try {
    payload = jwt.verify(token, QR_SECRET, {
      issuer: QR_ISSUER,
      audience: QR_AUDIENCE,
    });
  } catch (err) {
    console.log("JWT VERIFY ERROR:", err.message);
    throw new Error("QR token expired or invalid");
  }

  if (payload.type !== "TABLE_QR") {
    throw new Error("Invalid QR token");
  }

  const tableId = String(payload.tableId);
  const branchId = String(payload.branchId);
  const companyId = String(payload.companyId);

  console.log("Payload:", payload);

  const [[table]] = await db.query(
    `SELECT id, status, branch_id, company_id
     FROM tables
     WHERE id = ?
       AND branch_id = ?
       AND company_id = ?
       AND is_deleted = 0`,
    [tableId, branchId, companyId]
  );

  console.log("DB RESULT:", table);

  if (!table) throw new Error("Invalid QR token");

  if (table.status === "inactive") {
    throw new Error("Table inactive");
  }

  return {
    tableId: table.id,
    branchId: table.branch_id,
    companyId: table.company_id,
  };
};



