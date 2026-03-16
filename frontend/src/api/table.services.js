import api from "./interceptors";

export const getTables = async () => {
  const res = await api.get("/tables");
  return res.data;
};

export const createTable = async (payload) => {
  const res = await api.post("/tables", payload);
  return res.data;
};

export const updateTable = async (id, payload) => {
  const res = await api.put(`/tables/${id}`, payload);
  return res.data;
};

export const updateTableStatus = async (id, status) => {
  const res = await api.patch(`/tables/${id}/status`, { status });
  return res.data;
};

export const deleteTable = async (id) => {
  const res = await api.delete(`/tables/${id}`);
  return res.data;
};
