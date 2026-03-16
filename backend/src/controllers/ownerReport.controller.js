import { db } from "../config/db.js";

/* =================================================
   FILTER BUILDER
================================================= */

const buildFilters = (companyId, query) => {
  const { branchId, from, to } = query;

  let where = `WHERE b.company_id = ?`;
  const params = [companyId];

  if (branchId) {
    where += ` AND o.branchId = ?`;
    params.push(branchId);
  }

  if (from) {
    where += ` AND DATE(o.createdAt) >= ?`;
    params.push(from);
  }

  if (to) {
    where += ` AND DATE(o.createdAt) <= ?`;
    params.push(to);
  }

  return { where, params };
};





/* =================================================
   SALES REPORT
================================================= */

export const getSalesReport = async (req, res, next) => {
  try {

    const { companyId } = req.user;
    const { branchId, from, to, groupBy = "day" } = req.query;

    const { where, params } = buildFilters(companyId, { branchId, from, to });

    const groupField =
      groupBy === "month"
        ? `DATE_FORMAT(o.createdAt,'%Y-%m')`
        : `DATE(o.createdAt)`;

    const [rows] = await db.query(
      `
      SELECT
        ${groupField} AS period,
        SUM(o.totalAmount) AS revenue,
        COUNT(o.id) AS orders
      FROM orders o
      JOIN branches b ON b.id = o.branchId
      ${where}
      GROUP BY period
      ORDER BY period DESC
      `,
      params
    );

    res.json(rows);

  } catch (err) {
    next(err);
  }
};





/* =================================================
   TOP ITEMS
================================================= */

export const getTopItemsReport = async (req, res, next) => {
  try {

    const { companyId } = req.user;
    const { branchId, from, to } = req.query;

    let where = `WHERE b.company_id = ?`;
    const params = [companyId];

    if (branchId) {
      where += ` AND o.branchId = ?`;
      params.push(branchId);
    }

    if (from) {
      where += ` AND DATE(o.createdAt) >= ?`;
      params.push(from);
    }

    if (to) {
      where += ` AND DATE(o.createdAt) <= ?`;
      params.push(to);
    }

    const [rows] = await db.query(
      `
      SELECT
        mi.name,
        SUM(oi.quantity) AS sold,
        SUM(oi.quantity * oi.price) AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.orderId
      JOIN branches b ON b.id = o.branchId
      JOIN menu_items mi ON mi.id = oi.itemId
      ${where}
      GROUP BY mi.id
      ORDER BY sold DESC
      LIMIT 20
      `,
      params
    );

    res.json(rows);

  } catch (err) {
    console.error("Top Items Report Error:", err);
    next(err);
  }
};



/* =================================================
   BRANCH PERFORMANCE
================================================= */

export const getBranchPerformance = async (req, res, next) => {
  try {

    const { companyId } = req.user;
    const { where, params } = buildFilters(companyId, req.query);

    const [rows] = await db.query(
      `
      SELECT
        b.id,
        b.name,
        SUM(o.totalAmount) AS revenue,
        COUNT(o.id) AS orders
      FROM orders o
      JOIN branches b ON b.id = o.branchId
      ${where}
      GROUP BY b.id
      ORDER BY revenue DESC
      `,
      params
    );

    res.json(rows);

  } catch (err) {
    next(err);
  }
};





/* =================================================
   HOURLY SALES
================================================= */

export const getHourlySales = async (req, res, next) => {
  try {

    const { companyId } = req.user;
    const { where, params } = buildFilters(companyId, req.query);

    const [rows] = await db.query(
      `
      SELECT
        HOUR(o.createdAt) AS hour,
        COUNT(o.id) AS orders,
        SUM(o.totalAmount) AS revenue
      FROM orders o
      JOIN branches b ON b.id = o.branchId
      ${where}
      GROUP BY hour
      ORDER BY hour
      `,
      params
    );

    res.json(rows);

  } catch (err) {
    next(err);
  }
};





/* =================================================
   CATEGORY PERFORMANCE
================================================= */

export const getCategoryPerformance = async (req, res, next) => {
  try {

    const { companyId } = req.user;
    const { where, params } = buildFilters(companyId, req.query);

    const [rows] = await db.query(
      `
      SELECT
        c.name AS category,
        SUM(oi.quantity) AS items_sold,
        SUM(oi.price * oi.quantity) AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN branches b ON b.id = o.branchId
      JOIN menu_items mi ON mi.id = oi.menu_item_id
      JOIN menu_categories c ON c.id = mi.category_id
      ${where}
      GROUP BY c.id
      ORDER BY revenue DESC
      `,
      params
    );

    res.json(rows);

  } catch (err) {
    next(err);
  }
};





/* =================================================
   WAITER PERFORMANCE
================================================= */

export const getWaiterPerformance = async (req, res, next) => {
  try {

    const { companyId } = req.user;
    const { where, params } = buildFilters(companyId, req.query);

    const [rows] = await db.query(
      `
      SELECT
        u.full_name AS waiter,
        COUNT(o.id) AS orders,
        SUM(o.totalAmount) AS revenue
      FROM orders o
      JOIN branches b ON b.id = o.branchId
      JOIN users u ON u.id = o.waiterId
      ${where}
      GROUP BY u.id
      ORDER BY revenue DESC
      `,
      params
    );

    res.json(rows);

  } catch (err) {
    next(err);
  }
};





/* =================================================
   TABLE TURNOVER
================================================= */

export const getTableTurnover = async (req, res, next) => {
  try {

    const { companyId } = req.user;
    const { where, params } = buildFilters(companyId, req.query);

    const [rows] = await db.query(
      `
      SELECT
        t.tableNumber,
        COUNT(o.id) AS total_orders,
        SUM(o.totalAmount) AS revenue
      FROM orders o
      JOIN branches b ON b.id = o.branchId
      JOIN tables t ON t.id = o.tableId
      ${where}
      GROUP BY t.id
      ORDER BY total_orders DESC
      `,
      params
    );

    res.json(rows);

  } catch (err) {
    next(err);
  }
};





/* =================================================
   PAYMENT METHOD REPORT
================================================= */

export const getPaymentMethodReport = async (req, res, next) => {
  try {

    res.json([
      { payment_method: "Cash", orders: 0, revenue: 0 },
      { payment_method: "UPI", orders: 0, revenue: 0 },
      { payment_method: "Card", orders: 0, revenue: 0 }
    ]);

  } catch (err) {
    next(err);
  }
};