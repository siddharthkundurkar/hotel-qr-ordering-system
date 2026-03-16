import { db } from "../config/db.js";

export const getDailySales = async (req, res, next) => {
  try {
    const { date } = req.query;
    const { companyId } = req.user;

    const reportDate = date || new Date().toISOString().slice(0, 10);

    // 1️⃣ Total orders & revenue
    const [[summary]] = await db.query(
      `SELECT
         COUNT(*) AS totalOrders,
         IFNULL(SUM(b.amount), 0) AS totalRevenue
       FROM bills b
       JOIN orders o ON b.orderId = o.id
       JOIN branches br ON o.branchId = br.id
       WHERE DATE(b.createdAt) = ?
         AND br.company_id = ?`,
      [reportDate, companyId]
    );

    // 2️⃣ Payment method split
    const [payments] = await db.query(
      `SELECT
         b.paymentMethod,
         SUM(b.amount) AS total
       FROM bills b
       JOIN orders o ON b.orderId = o.id
       JOIN branches br ON o.branchId = br.id
       WHERE DATE(b.createdAt) = ?
         AND br.company_id = ?
       GROUP BY b.paymentMethod`,
      [reportDate, companyId]
    );

    const paymentSummary = {};
    payments.forEach(p => {
      paymentSummary[p.paymentMethod] = p.total;
    });

    return res.json({
      date: reportDate,
      totalOrders: summary.totalOrders,
      totalRevenue: summary.totalRevenue,
      payments: paymentSummary
    });

  } catch (err) {
    next(err);
  }
};
export const getBranchRevenue = async (req, res, next) => {
  try {
    const { companyId } = req.user;

    const [rows] = await db.query(
      `SELECT
         br.id AS branchId,
         br.name AS branchName,
         COUNT(b.id) AS totalOrders,
         IFNULL(SUM(b.amount), 0) AS totalRevenue
       FROM branches br
       LEFT JOIN orders o ON br.id = o.branchId
       LEFT JOIN bills b ON o.id = b.orderId
       WHERE br.company_id = ?
       GROUP BY br.id, br.name
       ORDER BY totalRevenue DESC`,
      [companyId]
    );

    return res.json(rows);

  } catch (err) {
    next(err);
  }
};
export const getTopItems = async (req, res, next) => {
  try {
    const { companyId } = req.user;

    const [rows] = await db.query(
      `SELECT
         mi.id AS itemId,
         mi.name AS itemName,
         SUM(oi.quantity) AS quantitySold,
         SUM(oi.quantity * oi.price) AS totalRevenue
       FROM order_items oi
       JOIN orders o ON oi.orderId = o.id
       JOIN menu_items mi ON oi.itemId = mi.id
       JOIN branches br ON o.branchId = br.id
       WHERE br.company_id = ?
         AND o.status = 'paid'
       GROUP BY mi.id, mi.name
       ORDER BY totalRevenue DESC`,
      [companyId]
    );

    return res.json(rows);

  } catch (err) {
    next(err);
  }
};
export const staffPerformanceReport = async (req, res, next) => {
  try {
    const { branchId } = req.user;

    const [rows] = await db.query(
      `SELECT
         s.id,
         s.fullName,
         COUNT(o.id) AS ordersHandled,
         SUM(o.totalAmount) AS revenue,
         AVG(TIMESTAMPDIFF(MINUTE, o.createdAt, o.acceptedAt)) AS avgAcceptTime
       FROM staff s
       JOIN orders o ON o.waiterId = s.id
       WHERE o.status = 'paid'
         AND o.branchId = ?
       GROUP BY s.id`,
      [branchId]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
};
