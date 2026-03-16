import api from "./interceptors";

export const getManagers = async () => {
  const res = await api.get("/owner/managers"); // ✅ FIX
  return res.data;
};

export const createManager = async (data) => {
  const res = await api.post("/owner/managers", data); // ✅ FIX
  return res.data;
};
export const getOrderHistory = (range = "today") =>
  api.get(`/orders/history?range=${range}`);
