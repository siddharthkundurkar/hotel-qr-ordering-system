import api from "./interceptors";

/* ===============================
   TABLE OCCUPANCY (Stats card)
================================ */
export const getTableOccupancy = async () => {
  try {
    const res = await api.get("/dashboard/tables/occupancy");

    return {
      total: Number(res.data?.total ?? 0),
      occupied: Number(res.data?.occupied ?? 0),
      available: Number(res.data?.available ?? 0),
    };
  } catch (err) {
    console.error("Failed to load table occupancy", err);
    return { total: 0, occupied: 0, available: 0 };
  }
};

/* ===============================
   TABLE LIST (Table Dashboard)
================================ */
export const getTables = async () => {
  try {
    const res = await api.get("/dashboard/tables/list");

    return Array.isArray(res.data?.tables)
      ? res.data.tables
      : [];
  } catch (err) {
    console.error("Failed to load tables", err);
    return [];
  }
};

/* ===============================
   TABLE ANALYTICS (Day / Week / Month / Year)
================================ */
export const getTableAnalytics = async (range = "week") => {
  try {
    const res = await api.get("/dashboard/tables/analytics", {
      params: { range },
    });

    return {
      occupancyTrend: Array.isArray(res.data?.occupancyTrend)
        ? res.data.occupancyTrend
        : [],
    };
  } catch (err) {
    console.error("Failed to load table analytics", err);
    return { occupancyTrend: [] };
  }
};

/* ===============================
   TABLE KPIs
================================ */
export const getTableKpis = async () => {
  try {
    const res = await api.get("/dashboard/tables/kpis");

    return {
      avgOccupancy: Number(res.data?.avgOccupancy ?? 0),
      peakHour: res.data?.peakHour ?? "N/A",
    };
  } catch (err) {
    console.error("Failed to load table KPIs", err);
    return { avgOccupancy: 0, peakHour: "N/A" };
  }
};

/* ===============================
   ORDERS TODAY
================================ */
export const getOrdersToday = async () => {
  try {
    const res = await api.get("/dashboard/orders/today");
    return { count: Number(res.data?.count ?? 0) };
  } catch (err) {
    console.error("Failed to load orders today", err);
    return { count: 0 };
  }
};

/* ===============================
   RECENT PAID ORDERS
================================ */
export const getRecentOrders = async () => {
  try {
    const res = await api.get("/dashboard/orders/recent");

    return Array.isArray(res.data)
      ? res.data.map((o) => ({
          id: o.id,
          tableNumber: o.tableNumber,
          totalAmount: Number(o.totalAmount ?? 0),
          paidAt: o.paidAt,
        }))
      : [];
  } catch (err) {
    console.error("Failed to load recent orders", err);
    return [];
  }
};
export const getOrdersAnalytics = async (range = "week") => {
  try {
    const res = await api.get("/dashboard/orders/analytics", {
      params: { range },
    });
    return res.data;
  } catch (err) {
    console.error("Failed to load orders analytics", err);
    return {
      totalOrders: 0,
      revenue: 0,
      avgOrder: 0,
      trend: [],
    };
  }
};
export const getStaffAnalytics = async (range) => {
  const { data } = await api.get(`/dashboard/staff/analytics?range=${range}`);
  return data;
};

export const getStaffList = async () => {
  const { data } = await api.get(`/dashboard/staff/list`);
  return data;
};

/* ===============================
   INVENTORY STATS
================================ */

export const getInventoryStats = async () => {
  const res = await api.get("/dashboard/inventory/stats");
  return res.data;
};

/* ===============================
   KITCHEN STATS
================================ */

export const getKitchenStats = async () => {
  const res = await api.get("/dashboard/kitchen/stats");
  return res.data;
};
