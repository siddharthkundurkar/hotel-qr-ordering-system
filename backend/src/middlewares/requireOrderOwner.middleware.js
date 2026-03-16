import { db } from "../config/db.js";

export const requireOrderOwner = async (req, res, next) => {
  const { orderId } = req.params;
  const waiterId = req.user.id;

  const [rows] = await db.query(
    `SELECT waiterId FROM orders WHERE id = ?`,
    [orderId]
  );

  if (!rows.length || rows[0].waiterId !== waiterId) {
    return res.status(403).json({ message: "Not your order" });
  }

  next();
};
