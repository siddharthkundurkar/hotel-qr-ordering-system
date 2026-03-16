import api from "./interceptors";

/* =====================================
   🧠 shared config
===================================== */
const noCacheHeaders = {
  "Cache-Control": "no-store",
};

const defaultTimeout = { timeout: 15000 };

/* =====================================
   KITCHEN – ACTIVE ORDERS
===================================== */
export const getKitchenOrders = (signal) => {
  return api.get("/kitchen/orders", {
    headers: noCacheHeaders,
    signal, // ✅ request cancel support
    timeout: 15000,
  });
};

/* =====================================
   KITCHEN – UPDATE ORDER STATUS
   ⚠️ rarely used (item drives readiness)
===================================== */
export const updateKitchenOrderStatus = (orderId) => {
  if (!orderId) {
    return Promise.reject(new Error("orderId required"));
  }

  return api.patch(
    `/kitchen/orders/${orderId}/status`,
    {},
    defaultTimeout
  );
};

/* =====================================
   ⭐ UPDATE ITEM STATUS (PRIMARY ACTION)
===================================== */
export const updateKitchenItemStatus = (itemId) => {
  if (!itemId) {
    return Promise.reject(new Error("itemId required"));
  }

  return api.patch(
    `/kitchen/items/${itemId}/status`,
    {},
    {
      ...defaultTimeout,
      // ⭐ IMPORTANT: allows caller to inspect 409
      validateStatus: (status) =>
        (status >= 200 && status < 300) || status === 409,
    }
  );
};

/* =====================================
   ⭐ MARK ITEM PRIORITY (FAST LANE)
===================================== */
export const markItemPriority = (itemId) => {
  if (!itemId) {
    return Promise.reject(new Error("itemId required"));
  }

  return api.patch(
    `/kitchen/items/${itemId}/priority`,
    {},
    defaultTimeout
  );
};

/* =====================================
   🚀 EXPO – BATCH BUMP
===================================== */
export const batchBumpOrders = (orderIds) => {
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return Promise.reject(new Error("orderIds required"));
  }

  return api.post(
    "/kitchen/expo/batch-bump",
    { orderIds },
    { timeout: 20000 }
  );
};

/* =====================================
   KITCHEN – ORDER HISTORY
===================================== */
export const getKitchenOrderHistory = (range = "today") => {
  return api.get("/kitchen/orders/history", {
    params: { range },
    timeout: 15000,
  });
};

/* =====================================
   GLOBAL ORDER HISTORY
===================================== */
export const getOrderHistory = (range = "today") => {
  return api.get("/orders/history", {
    params: { range },
    timeout: 15000,
  });
};

/* =====================================
   KITCHEN – SUMMARY
===================================== */
export const getKitchenSummary = (signal) => {
  return api.get("/kitchen/summary", {
    headers: noCacheHeaders,
    signal,
    timeout: 10000,
  });
};