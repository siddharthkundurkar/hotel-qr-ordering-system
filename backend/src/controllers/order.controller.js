import {
  getManagerOrdersService,
  updateOrderStatusService
} from "../services/order.services.js";

/* ===============================
   GET MANAGER ORDERS
================================ */
export const getManagerOrders = async (req, res) => {
  try {
    const { branchId } = req.user;

    if (!branchId) {
      return res.status(400).json({ message: "Branch not found in token" });
    }

    const orders = await getManagerOrdersService(branchId);
    res.json(orders);

  } catch (err) {
    console.error("Get manager orders error:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/* ===============================
   UPDATE ORDER STATUS (MANAGER)
================================ */
export const updateOrderStatusByManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { branchId } = req.user;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    await updateOrderStatusService(id, branchId, status);
    res.json({ message: "Order status updated" });

  } catch (err) {
    console.error("Update order error:", err);
    res.status(400).json({ message: err.message });
  }
};
/* ===============================
   GET ORDER STATUS (SYNC FALLBACK)
================================ */
export const getOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const [[order]] = await db.query(
      `
      SELECT status
      FROM orders
      WHERE id = ?
      `,
      [id]
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ status: order.status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
