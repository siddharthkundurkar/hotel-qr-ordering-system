import api from "./interceptors";

/* =====================================
   🧠 shared config
===================================== */
const noCacheHeaders = {
  "Cache-Control": "no-store",
};

const REQUEST_TIMEOUT = 15000;

/* =====================================
   🔢 safe number helper
===================================== */
const toId = (value, name) => {
  const id = Number(value);
  if (!id || Number.isNaN(id)) {
    throw new Error(`${name} required`);
  }
  return id;
};

/* =====================================================
   📦 READY ORDERS (Kitchen → Waiter Queue)
===================================================== */
export const getReadyOrders = async (signal) => {
  const res = await api.get("/waiter/orders/ready", {
    headers: noCacheHeaders,
    timeout: REQUEST_TIMEOUT,
    ...(signal ? { signal } : {}), // ✅ safe signal usage
  });

  return res.data;
};

/* =====================================================
   🚚 ACCEPT ORDER
===================================================== */
export const acceptOrder = async (orderId) => {
  const id = toId(orderId, "acceptOrder: orderId");

  const res = await api.patch(
    `/waiter/orders/${id}/accept`,
    {},
    { timeout: REQUEST_TIMEOUT }
  );

  return res.data;
};

/* =====================================================
   🍽️ SERVE SINGLE ITEM
===================================================== */
export const serveItem = async (itemId) => {
  const id = toId(itemId, "serveItem: itemId");

  const res = await api.patch(
    `/waiter/items/${id}/serve`,
    {},
    { timeout: REQUEST_TIMEOUT }
  );

  return res.data;
};

/* =====================================================
   ✅ MARK ORDER AS SERVED (fallback)
===================================================== */
export const markOrderAsServed = async (orderId) => {
  const id = toId(orderId, "markOrderAsServed: orderId");

  const res = await api.patch(
    `/waiter/orders/${id}/served`,
    {},
    { timeout: REQUEST_TIMEOUT }
  );

  return res.data;
};

/* =====================================================
   📊 MY SERVED ORDERS
===================================================== */
export const getMyServedOrders = async (signal) => {
  const res = await api.get("/waiter/orders/my", {
    headers: noCacheHeaders,
    timeout: REQUEST_TIMEOUT,
    ...(signal ? { signal } : {}),
  });

  return res.data;
};

/* =====================================================
   📚 UNIFIED ORDER HISTORY
===================================================== */
export const getOrderHistory = async (range = "today") => {
  const res = await api.get("/orders/history", {
    params: { range },
    timeout: REQUEST_TIMEOUT,
  });

  return res.data;
};
/* =====================================================
   🧾 GENERATE BILL
===================================================== */
export const generateBill = async (orderId) => {
  const id = toId(orderId, "generateBill: orderId");

  const res = await api.post(
    `/waiter/orders/${id}/generate-bill`,
    {},
    { timeout: REQUEST_TIMEOUT }
  );

  return res.data;
};
export const getServedOrdersHistory = async (filter = "today") => {
  const res = await api.get(`/waiter/orders/served-history?filter=${filter}`);
  return res.data?.orders || [];
};
export const getWaiterDashboard = async () => {
  const res = await api.get("/waiter/dashboard");
  return res.data;
};