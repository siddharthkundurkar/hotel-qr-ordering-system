import api from "./interceptors";

export const createMenuCategory = async (payload) => {
  const res = await api.post("/categories", payload);
  return res.data;
};
export const getMenuCategories = async () => {
  const res = await api.get("/categories");
  return res.data;
};
