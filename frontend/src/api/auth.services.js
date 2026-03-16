import api from "../api/interceptors";

// authService.js
export const login = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });

  // ❌ REMOVE localStorage here (interceptor handles token)
  // ❌ REMOVE returning only user

  return res.data; // ✅ RETURN FULL PAYLOAD
};


export const authMe = async () => {
  const res = await api.get("/auth/me");
  return res.data;
};

export const logout = async () => {
  await api.post("/auth/logout");
  localStorage.removeItem("accessToken");
  window.location.href = "/login";
};

// auth.services.js
export const refreshToken = async () => {
  const res = await api.post("/auth/refresh");
  localStorage.setItem("accessToken", res.data.accessToken);
  return res.data.accessToken;
};
export const selectBranch = async (branchId) => {
  const res = await api.post("/auth/select-branch", { branchId });
  localStorage.setItem("accessToken", res.data.accessToken);
  return res.data;
};