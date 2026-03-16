import api from "./interceptors";

/* ===============================
   GET SERVED (UNPAID) ORDERS
================================ */
export const getServedOrders = async () => {
  const res = await api.get("/cashier/orders/served");
  return res.data?.orders || [];
};

/* ===============================
   GET PAID ORDERS
================================ */
export const getPaidOrders = async () => {
  const res = await api.get("/cashier/orders/paid");
  return res.data || [];
};

/* ===============================
   PAY ORDER
================================ */
export const payOrder = async (orderId, paymentMethod) => {
  const res = await api.patch(
    `/cashier/orders/${orderId}/pay`,
    { paymentMethod }
  );

  return res.data;
};

/* ===============================
   ADD ITEM
================================ */
export const addItemToOrder = async (orderId, itemId, quantity) => {
  const res = await api.post(
    `/cashier/orders/${orderId}/items`,
    { itemId, quantity }
  );

  return res.data;
};

/* ===============================
   CASHIER MENU
================================ */
export const getMenuForCashier = async () => {
  const res = await api.get("/cashier/menu");
  return res.data?.items || [];
};