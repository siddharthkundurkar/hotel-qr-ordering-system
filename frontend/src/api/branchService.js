import api from "./interceptors";

export const getBranches = async () => {
  const res = await api.get("/branches/my");
  return res.data;
};

export const createBranch = async (payload) => {
  const res = await api.post("/branches", payload);
  return res.data;
};
