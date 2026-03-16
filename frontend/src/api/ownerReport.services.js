import api from "./interceptors";

/* =====================================================
   SALES REPORT
   filters: branchId, from, to, groupBy
===================================================== */

export const getSalesReport = async (params = {}) => {
  const res = await api.get("/owner-reports/sales", { params });
  return res.data;
};



/* =====================================================
   TOP ITEMS
   filters: branchId, from, to
===================================================== */

export const getTopItemsReport = async (params = {}) => {
  const res = await api.get("/owner-reports/top-items", { params });
  return res.data;
};



/* =====================================================
   BRANCH PERFORMANCE
===================================================== */

export const getBranchPerformance = async (params = {}) => {
  const res = await api.get("/owner-reports/branches", { params });
  return res.data;
};



/* =====================================================
   HOURLY SALES
===================================================== */

export const getHourlySales = async (params = {}) => {
  const res = await api.get("/owner-reports/hourly-sales", { params });
  return res.data;
};



/* =====================================================
   CATEGORY PERFORMANCE
===================================================== */

export const getCategoryPerformance = async (params = {}) => {
  const res = await api.get("/owner-reports/category-performance", { params });
  return res.data;
};



/* =====================================================
   WAITER PERFORMANCE
===================================================== */

export const getWaiterPerformance = async (params = {}) => {
  const res = await api.get("/owner-reports/waiter-performance", { params });
  return res.data;
};



/* =====================================================
   TABLE TURNOVER
===================================================== */

export const getTableTurnover = async (params = {}) => {
  const res = await api.get("/owner-reports/table-turnover", { params });
  return res.data;
};



/* =====================================================
   PAYMENT METHOD REPORT
===================================================== */

export const getPaymentMethodReport = async (params = {}) => {
  const res = await api.get("/owner-reports/payment-method", { params });
  return res.data;
};