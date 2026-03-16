import api from "./interceptors";

/* ================= GET STAFF ================= */

export const getStaff = async () => {
  const res = await api.get("/staff");
  return res.data;
};

/* ================= CREATE STAFF ================= */

export const createStaff = async (payload) => {
  const res = await api.post("/staff", payload);
  return res.data;
};

/* ================= UPDATE STAFF ================= */

export const updateStaff = async (id, payload) => {
  console.log("UPDATE STAFF PAYLOAD:", payload);
  const res = await api.put(`/staff/${id}`, payload);
  return res.data;
};

/* ================= UPDATE STATUS ================= */

export const updateStaffStatus = async (id, status) => {
  const res = await api.patch(`/staff/${id}/status`, { status });
  return res.data;
};

export const deleteStaff = async (id) => {
  const res = await api.delete(`/staff/${id}`);
  return res.data;
};
