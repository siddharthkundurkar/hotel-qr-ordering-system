import api from "./interceptors";

/* PROFILE */

export const getOwnerProfile = async () => {
  const res = await api.get("/owner/profile");
  return res.data;
};

/* COMPANY */

export const getCompanySettings = async () => {
  const res = await api.get("/owner/company");

  console.log("URL USED:", res.config.baseURL + res.config.url);
  console.log("RESPONSE:", res.data);

  return res.data;
};

/* UPDATE PROFILE */

export const updateOwnerProfile = async (payload) => {
  const res = await api.put("/owner/profile", payload);
  return res.data;
};

/* UPDATE COMPANY */

export const updateCompanySettings = async (payload) => {
  const res = await api.put("/owner/company", payload);
  return res.data;
};