import axios from "axios";

/* =================================================
   🔌 MAIN API CLIENT
================================================= */
const api = axios.create({
  baseURL: "https://hotel-qr-ordering-system.onrender.com/api",
  withCredentials: true, // required for refresh cookie
});

/* =================================================
   🔁 CLEAN CLIENT FOR REFRESH (CRITICAL)
   (prevents interceptor loops)
================================================= */
const refreshClient = axios.create({
  baseURL: "https://hotel-qr-ordering-system.onrender.com/api",
  withCredentials: true,
});

/* =================================================
   🔐 ACCESS TOKEN (MEMORY ONLY)
================================================= */
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const clearAccessToken = () => {
  accessToken = null;
};

/* =================================================
   📤 REQUEST INTERCEPTOR
================================================= */
api.interceptors.request.use((config) => {
  // don't overwrite if already set (important for retries)
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/* =================================================
   🔄 TOKEN REFRESH LOGIC
================================================= */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

/* =================================================
   📥 RESPONSE INTERCEPTOR
================================================= */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    const is401 = error.response.status === 401;
    const isRefreshCall = originalRequest.url?.includes("/auth/refresh");

    if (is401 && !originalRequest._retry && !isRefreshCall) {
      /* ============================================
         🔁 QUEUE IF ALREADY REFRESHING
      ============================================ */
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      /* ============================================
         🚀 START REFRESH
      ============================================ */
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await refreshClient.post("/auth/refresh");

        const newToken = res?.data?.accessToken;

        // 🔥 ENTERPRISE GUARD
        if (!newToken) {
          throw new Error("No access token returned");
        }

        setAccessToken(newToken);

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAccessToken();

        // 🔥 HARD REDIRECT (enterprise behavior)
        window.location.href = "/login";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;