import { db } from "../config/db.js";

/* ===============================
   TABLE OCCUPANCY
================================ */

export const tableOccupancy = async (req, res, next) => {
  try {
    const { branchId } = req.user;

    const [[row]] = await db.query(
      `
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(status='occupied'),0) AS occupied,
        COALESCE(SUM(status='available'),0) AS available
      FROM tables
      WHERE branchId = ?
      `,
      [branchId]
    );

    res.json({
      total: Number(row.total),
      occupied: Number(row.occupied),
      available: Number(row.available),
    });

  } catch (err) {
    console.error("TABLE OCCUPANCY ERROR:", err);
    next(err);
  }
};



/* ===============================
   ORDERS TODAY
================================ */

export const ordersToday = async (req, res, next) => {
  try {
    const { branchId } = req.user;

    const [[row]] = await db.query(
      `
      SELECT COUNT(*) AS count
      FROM orders
      WHERE branchId = ?
      AND createdAt >= CURDATE()
      AND status IN ('served','paid')
      `,
      [branchId]
    );

    res.json({
      count: Number(row.count || 0),
    });

  } catch (err) {
    console.error("ORDERS TODAY ERROR:", err);
    next(err);
  }
};



/* ===============================
   RECENT ORDERS
================================ */

export const recentOrders = async (req, res, next) => {
  try {
    const { branchId } = req.user;

    const [rows] = await db.query(
      `
      SELECT
        o.id,
        t.tableNumber,
        o.totalAmount,
        o.paidAt
      FROM orders o
      JOIN tables t ON t.id = o.tableId
      WHERE o.branchId = ?
      AND o.status = 'paid'
      ORDER BY o.paidAt DESC
      LIMIT 5
      `,
      [branchId]
    );

    res.json(
      rows.map((r) => ({
        id: r.id,
        tableNumber: r.tableNumber,
        totalAmount: Number(r.totalAmount || 0),
        paidAt: r.paidAt,
      }))
    );

  } catch (err) {
    console.error("RECENT ORDERS ERROR:", err);
    next(err);
  }
};



/* ===============================
   TABLE LIST
================================ */

export const getTables = async (req, res, next) => {
  try {
    const { branchId } = req.user;

    const [rows] = await db.query(
      `
      SELECT
        id,
        tableNumber,
        capacity,
        status
      FROM tables
      WHERE branchId = ?
      ORDER BY tableNumber
      `,
      [branchId]
    );

    res.json({
      tables: rows.map((t) => ({
        id: t.id,
        number: t.tableNumber,
        capacity: t.capacity,
        status: t.status,
      })),
    });

  } catch (err) {
    console.error("TABLE LIST ERROR:", err);
    next(err);
  }
};



/* ===============================
   TABLE ANALYTICS
================================ */

export const tableAnalytics = async (req, res, next) => {
  try {

    const { branchId } = req.user;
    const { range = "week" } = req.query;

    let query = "";

    switch (range) {

      case "day":
        query = `
        SELECT
          HOUR(createdAt) AS label,
          COUNT(DISTINCT tableId) AS occupied
        FROM orders
        WHERE branchId = ?
        AND DATE(createdAt) = CURDATE()
        AND status IN ('served','paid')
        GROUP BY HOUR(createdAt)
        `;
        break;

      case "month":
        query = `
        SELECT
          DAY(createdAt) AS label,
          COUNT(DISTINCT tableId) AS occupied
        FROM orders
        WHERE branchId = ?
        AND MONTH(createdAt) = MONTH(CURDATE())
        AND YEAR(createdAt) = YEAR(CURDATE())
        AND status IN ('served','paid')
        GROUP BY DAY(createdAt)
        `;
        break;

      case "year":
        query = `
        SELECT
          MONTH(createdAt) AS label,
          COUNT(DISTINCT tableId) AS occupied
        FROM orders
        WHERE branchId = ?
        AND YEAR(createdAt) = YEAR(CURDATE())
        AND status IN ('served','paid')
        GROUP BY MONTH(createdAt)
        `;
        break;

      default:
        query = `
        SELECT
          DATE(createdAt) AS label,
          COUNT(DISTINCT tableId) AS occupied
        FROM orders
        WHERE branchId = ?
        AND createdAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND status IN ('served','paid')
        GROUP BY DATE(createdAt)
        `;
    }

    const [rows] = await db.query(query, [branchId]);

    res.json({
      occupancyTrend: rows.map((r) => ({
        label: r.label,
        occupied: Number(r.occupied || 0),
        free: 0
      }))
    });

  } catch (err) {
    console.error("TABLE ANALYTICS ERROR:", err);
    next(err);
  }
};



/* ===============================
   TABLE KPIs
================================ */

export const tableKpis = async (req, res, next) => {
  try {

    const { branchId } = req.user;

    const [[avg]] = await db.query(
      `
      SELECT
        ROUND(
          COUNT(DISTINCT tableId) /
          NULLIF((SELECT COUNT(*) FROM tables WHERE branchId = ?),0)
          * 100
        ) AS avgOccupancy
      FROM orders
      WHERE branchId = ?
      AND status IN ('served','paid')
      AND createdAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      `,
      [branchId, branchId]
    );

    const [[peak]] = await db.query(
      `
      SELECT HOUR(createdAt) AS peakHour
      FROM orders
      WHERE branchId = ?
      AND status IN ('served','paid')
      GROUP BY HOUR(createdAt)
      ORDER BY COUNT(*) DESC
      LIMIT 1
      `,
      [branchId]
    );

    res.json({
      avgOccupancy: Number(avg.avgOccupancy || 0),
      peakHour: peak?.peakHour != null ? `${peak.peakHour}:00` : "N/A",
    });

  } catch (err) {
    console.error("TABLE KPI ERROR:", err);
    next(err);
  }
};



/* ===============================
   ORDER ANALYTICS
================================ */

export const getOrderAnalytics = async (req, res, next) => {
  try {

    const { branchId } = req.user;
    const { range = "week" } = req.query;

    let dateCondition = "";
    let groupBy = "";
    let labelFormat = "";

    switch (range) {

      case "day":
        dateCondition = "DATE(createdAt) = CURDATE()";
        groupBy = "HOUR(createdAt)";
        labelFormat = "LPAD(HOUR(createdAt),2,'0')";
        break;

      case "week":
        dateCondition = "createdAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
        groupBy = "DATE(createdAt)";
        labelFormat = "DATE_FORMAT(DATE(createdAt),'%a')";
        break;

      case "month":
        dateCondition = "MONTH(createdAt)=MONTH(CURDATE()) AND YEAR(createdAt)=YEAR(CURDATE())";
        groupBy = "DATE(createdAt)";
        labelFormat = "DATE_FORMAT(DATE(createdAt),'%d')";
        break;

      case "year":
        dateCondition = "YEAR(createdAt)=YEAR(CURDATE())";
        groupBy = "MONTH(createdAt)";
        labelFormat = "DATE_FORMAT(createdAt,'%b')";
        break;

      default:
        return res.status(400).json({ message: "Invalid range" });
    }

    const [[totals]] = await db.query(
      `
      SELECT
        COUNT(*) AS totalOrders,
        COALESCE(SUM(totalAmount),0) AS revenue,
        COALESCE(AVG(totalAmount),0) AS avgOrder
      FROM orders
      WHERE branchId = ?
      AND ${dateCondition}
      AND status IN ('served','paid')
      `,
      [branchId]
    );

    const [trendRows] = await db.query(
`
SELECT
  DATE_FORMAT(dateGroup,'%a') AS label,
  COUNT(*) AS orders,
  COALESCE(SUM(totalAmount),0) AS revenue
FROM (
  SELECT
    DATE(createdAt) AS dateGroup,
    totalAmount
  FROM orders
  WHERE branchId = ?
  AND ${dateCondition}
  AND status IN ('served','paid')
) t
GROUP BY dateGroup
ORDER BY dateGroup
`,
[branchId]
);

    res.json({
      totalOrders: Number(totals.totalOrders || 0),
      revenue: Number(totals.revenue || 0),
      avgOrder: Number(totals.avgOrder || 0).toFixed(2),
      trend: trendRows.map((r) => ({
        label: r.label,
        orders: Number(r.orders || 0),
        revenue: Number(r.revenue || 0),
      })),
    });

  } catch (err) {
    console.error("ORDER ANALYTICS ERROR:", err);
    next(err);
  }
};



/* ===============================
   KITCHEN LIVE STATS
================================ */

export const kitchenStats = async (req, res, next) => {
  try {

    const { branchId } = req.user;

    const [[row]] = await db.query(
      `
      SELECT
        COALESCE(SUM(status='preparing'),0) AS preparing,
        COALESCE(SUM(status='ready'),0) AS ready,
        COALESCE(SUM(status='served'),0) AS served
      FROM orders
      WHERE branchId = ?
      `,
      [branchId]
    );

    res.json({
      preparing: Number(row.preparing),
      ready: Number(row.ready),
      served: Number(row.served),
    });

  } catch (err) {
    console.error("KITCHEN STATS ERROR:", err);
    next(err);
  }
};
export const getStaffList = async (req, res, next) => {
  try {
    const { branchId } = req.user;

    const [rows] = await db.query(
      `
      SELECT 
        id,
        full_name AS name,
        role
      FROM users
      WHERE branch_id = ?
      AND role IN ('WAITER','CHEF','STAFF')
      `,
      [branchId]
    );

    res.json(rows);
  } catch (err) {
    console.error("STAFF LIST ERROR:", err);
    next(err);
  }
};
export const getStaffAnalytics = async (req, res, next) => {
  try {
    const { branchId } = req.user;

    /* ================= TOTAL STAFF ================= */

    const [[total]] = await db.query(
      `
      SELECT COUNT(*) AS totalStaff
      FROM users
      WHERE branch_id = ?
      AND role NOT IN ('OWNER','MANAGER')
      `,
      [branchId]
    );

    /* ================= ACTIVE STAFF TODAY ================= */

    const [[active]] = await db.query(
      `
      SELECT COUNT(DISTINCT waiterId) AS activeToday
      FROM orders
      WHERE branchId = ?
      AND DATE(createdAt) = CURDATE()
      AND waiterId IS NOT NULL
      `,
      [branchId]
    );

    /* ================= STAFF PERFORMANCE ================= */

    const [performance] = await db.query(
      `
      SELECT 
        u.id,
        u.full_name AS name,
        u.role,
        COUNT(o.id) AS orders
      FROM users u
      LEFT JOIN orders o
        ON o.waiterId = u.id
        AND DATE(o.createdAt) = CURDATE()
      WHERE u.branch_id = ?
      AND u.role NOT IN ('OWNER','MANAGER')
      GROUP BY u.id
      ORDER BY orders DESC
      `,
      [branchId]
    );

    /* ================= AVG ORDERS ================= */

    const avgOrders =
      performance.length > 0
        ? Math.round(
            performance.reduce((sum, s) => sum + s.orders, 0) /
              performance.length
          )
        : 0;

    /* ================= RESPONSE ================= */

    res.json({
      totalStaff: total.totalStaff || 0,
      activeToday: active.activeToday || 0,
      avgOrders,
      topStaff: performance[0]?.name || "—",
      performance,
    });

  } catch (err) {
    console.error("STAFF ANALYTICS ERROR:", err);
    next(err);
  }
};