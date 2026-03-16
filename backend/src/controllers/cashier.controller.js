import { db } from "../config/db.js";
import { calculateTax } from "../services/taxCalculator.js";
import { generateInvoicePDF } from "../services/invoicePdf.service.js";
import { logAudit } from "../utils/auditlogger.js";

/* ===============================
GET SERVED ORDERS (UNPAID ONLY)
================================ */
export const getServedOrders = async (req, res, next) => {
  try {
    const { branchId } = req.user;

    const [orders] = await db.query(
      `
      SELECT
        o.id AS orderId,
        o.status,
        o.createdAt,
        o.servedAt,
        o.waiterId,
        o.totalAmount,
        t.tableNumber
      FROM orders o
      LEFT JOIN tables t ON t.id = o.tableId
      WHERE o.branchId = ?
        AND o.status = 'served'
        AND o.paidAt IS NULL
      ORDER BY o.servedAt ASC
      `,
      [branchId]
    );

    return res.json({
      success: true,
      count: orders.length,
      orders,
    });

  } catch (err) {
    next(err);
  }
};

/* ===============================
PAY ORDER (ENTERPRISE FIXED)
================================ */
export const payOrder = async (req, res) => {
  const conn = await db.getConnection();
  const io = req.app.get("io");

  try {
    const { id: orderId } = req.params;
    const { paymentMethod } = req.body;
    const { companyId, branchId } = req.user;

    if (!paymentMethod) {
      return res.status(400).json({ message: "Payment method required" });
    }

    await conn.beginTransaction();

    /* ===============================
       LOCK ORDER
    =============================== */

    const [[order]] = await conn.query(
      `
      SELECT id, tableId, sessionId, status
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

    /* ===============================
       LOCK BILL ROW (prevents duplicate bills)
    =============================== */

    const [[existingBill]] = await conn.query(
      `
      SELECT id, invoiceNumber, invoiceUrl
      FROM bills
      WHERE sessionId = ?
      LIMIT 1
      FOR UPDATE
      `,
      [order.sessionId]
    );

    if (existingBill) {
      await conn.rollback();

      return res.json({
        message: "Session already paid",
        invoiceNumber: existingBill.invoiceNumber,
        invoiceUrl: existingBill.invoiceUrl,
      });
    }

    /* ===============================
       GET ALL SERVED ORDERS IN SESSION
    =============================== */

    const [orders] = await conn.query(
      `
      SELECT id
      FROM orders
      WHERE sessionId = ?
      AND branchId = ?
      AND status = 'served'
      FOR UPDATE
      `,
      [order.sessionId, branchId]
    );

    if (!orders.length) {
      await conn.rollback();
      return res.status(400).json({
        message: "No served orders for payment",
      });
    }

    const orderIds = orders.map(o => o.id);

    /* ===============================
       CALCULATE SUBTOTAL
    =============================== */

    const [[subtotalRow]] = await conn.query(
      `
      SELECT SUM(price * quantity) AS subTotal
      FROM order_items
      WHERE orderId IN (?)
      `,
      [orderIds]
    );

    const subTotal = Number(subtotalRow?.subTotal || 0);

    if (subTotal <= 0) {
      await conn.rollback();
      return res.status(400).json({
        message: "Invalid order total",
      });
    }

    /* ===============================
       TAX CONFIG
    =============================== */

    const [[taxConfig]] = await conn.query(
      `
      SELECT gstPercentage, serviceChargePercentage
      FROM tax_configs
      WHERE companyId = ?
      AND branchId = ?
      AND isActive = 1
      `,
      [companyId, branchId]
    );

    const bill = calculateTax({
      subTotal,
      gstPercentage: taxConfig?.gstPercentage || 0,
      serviceChargePercentage:
        taxConfig?.serviceChargePercentage || 0,
    });

    const invoiceNumber = `INV-${branchId}-${Date.now()}-${order.sessionId}`;

    /* ===============================
       FETCH ITEMS FOR INVOICE
    =============================== */

    const [items] = await conn.query(
      `
      SELECT
        mi.name,
        SUM(oi.quantity) AS quantity,
        MAX(oi.price) AS price,
        SUM(oi.quantity * oi.price) AS lineTotal
      FROM order_items oi
      JOIN menu_items mi ON mi.id = oi.itemId
      WHERE oi.orderId IN (?)
      GROUP BY oi.itemId, mi.name
      `,
      [orderIds]
    );

    const [[company]] = await conn.query(
      `SELECT name FROM companies WHERE id = ?`,
      [companyId]
    );

    const [[branch]] = await conn.query(
      `SELECT address FROM branches WHERE id = ?`,
      [branchId]
    );

    /* ===============================
       GENERATE INVOICE PDF
    =============================== */

    let invoiceUrl = null;

    try {
      invoiceUrl = await generateInvoicePDF({
        invoiceNumber,
        company,
        branch,
        order,
        items,
        bill,
      });
    } catch (e) {
      console.warn("Invoice generation failed:", e.message);
    }

    /* ===============================
       INSERT BILL
    =============================== */

    try {
    await conn.query(
`
INSERT INTO bills
(
  orderId,
  sessionId,
  subTotal,
  gstAmount,
  serviceCharge,
  totalAmount,
  paymentMethod,
  invoiceNumber,
  invoiceUrl
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
[
  orderId,
  order.sessionId,
  bill.subTotal,
  bill.gstAmount,
  bill.serviceCharge,
  bill.totalAmount,
  paymentMethod,
  invoiceNumber,
  invoiceUrl,
]
);
    } catch (err) {

      if (err.code === "ER_DUP_ENTRY") {
        await conn.rollback();

        return res.json({
          message: "Session already paid",
        });
      }

      throw err;
    }

    /* ===============================
       MARK ALL ORDERS PAID
    =============================== */

    await conn.query(
      `
      UPDATE orders
      SET status = 'paid',
          paidAt = NOW()
      WHERE id IN (?)
      `,
      [orderIds]
    );

    /* ===============================
       CLOSE SESSION
    =============================== */

    await conn.query(
      `
      UPDATE table_sessions
      SET isActive = 0
      WHERE id = ?
      `,
      [order.sessionId]
    );

    await conn.query(
      `
      UPDATE tables
      SET status = 'available'
      WHERE id = ?
      `,
      [order.tableId]
    );

    await conn.commit();

    /* ===============================
       SOCKET EVENTS
    =============================== */

    io?.to(`branch:${branchId}`).emit("session:paid", {
      sessionId: order.sessionId,
      totalAmount: bill.totalAmount,
    });

    return res.json({
      message: "Payment successful",
      invoiceNumber,
      invoiceUrl,
      bill,
    });

  } catch (err) {

    await conn.rollback();
    console.error("PAY ORDER ERROR:", err);

    return res.status(500).json({
      message: "Payment failed",
      error: err.message,
    });

  } finally {
    conn.release();
  }
};

/* ===============================
ADD ITEM TO ORDER
================================ */
export const addItemToOrder = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { id: orderId } = req.params;
    const { itemId, quantity } = req.body;
    const { branchId } = req.user;

    if (!itemId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid item data" });
    }

    await conn.beginTransaction();

    /* ===============================
       LOCK ORDER
    ================================ */

    const [[order]] = await conn.query(
      `
      SELECT id, status
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

    if (order.status !== "served") {
      await conn.rollback();
      return res.status(400).json({
        message: "Order cannot be modified at this stage",
      });
    }

    /* ===============================
       VALIDATE MENU ITEM
    ================================ */

    const [[menuItem]] = await conn.query(
      `
      SELECT id, price, is_available
      FROM menu_items
      WHERE id = ? AND branchId = ?
      `,
      [itemId, branchId]
    );

    if (!menuItem) {
      await conn.rollback();
      return res.status(404).json({ message: "Item not found" });
    }

    if (!menuItem.is_available) {
      await conn.rollback();
      return res.status(400).json({ message: "Item is currently unavailable" });
    }

    /* ===============================
       ADD ITEM TO ORDER
    ================================ */

    await conn.query(
      `
      INSERT INTO order_items (orderId, itemId, quantity, price)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        quantity = quantity + VALUES(quantity)
      `,
      [orderId, itemId, quantity, menuItem.price]
    );

    /* ===============================
       FETCH UPDATED ITEM
    ================================ */

    const [[updatedItem]] = await conn.query(
      `
      SELECT 
        oi.itemId,
        mi.name,
        oi.quantity,
        oi.price
      FROM order_items oi
      JOIN menu_items mi ON mi.id = oi.itemId
      WHERE oi.orderId = ?
      AND oi.itemId = ?
      `,
      [orderId, itemId]
    );

    await conn.commit();

    res.json({
      message: "Item added successfully",
      item: updatedItem,
    });

  } catch (err) {
    await conn.rollback();
    console.error("💥 ADD ITEM ERROR:", err);
    res.status(500).json({ message: "Failed to add item" });
  } finally {
    conn.release();
  }
};
/* ===============================
GET CASHIER MENU
================================ */
export const getCashierMenu = async (req, res) => {
  try {
    const { branchId } = req.user;

    if (!branchId) {
      return res.status(400).json({ message: "Branch not found in user session" });
    }

    const [items] = await db.query(
      `
      SELECT id, name, price
      FROM menu_items
      WHERE branchId = ?
        AND is_available = 1
      ORDER BY name ASC
      `,
      [branchId]
    );

    return res.json({ items });

  } catch (err) {
    console.error("💥 CASHIER MENU ERROR:", err);
    return res.status(500).json({
      message: "Failed to load menu"
    });
  }
};

/* ===============================
GET PAID ORDERS
================================ */
export const getPaidOrders = async (req, res, next) => {
  try {
    const { branchId } = req.user;

    const [orders] = await db.query(
      `
      SELECT
        o.id AS orderId,
        o.totalAmount,
        o.paidAt,
        b.paymentMethod,
        b.invoiceNumber,
        b.invoiceUrl,
        t.tableNumber
      FROM orders o
      JOIN bills b ON b.orderId = o.id
      JOIN tables t ON t.id = o.tableId
      WHERE o.branchId = ?
        AND o.paidAt IS NOT NULL
      ORDER BY o.paidAt DESC
      `,
      [branchId]
    );

    res.json(orders);
  } catch (err) {
    next(err);
  }
};