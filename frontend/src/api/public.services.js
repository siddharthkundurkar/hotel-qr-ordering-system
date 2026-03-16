import axios from "axios";

/* ================= DEVICE HELPER ================= */
const getDeviceId = () => {
  let id = localStorage.getItem("deviceId");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("deviceId", id);
  }

  return id;
};

/* ================= AXIOS INSTANCE ================= */
const publicApi = axios.create({
  baseURL: 
    "https://hotel-qr-ordering-system.onrender.com/api/public",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

/* ================= REQUEST INTERCEPTOR ================= */
publicApi.interceptors.request.use((config) => {
  /* ✅ ALWAYS attach device id (CRITICAL) */
  config.headers["x-device-id"] = getDeviceId();

  /* ✅ attach latest table session safely */
  const sessionKey = Object.keys(localStorage)
    .filter((k) => k.startsWith("tableSession:"))
    .sort()
    .pop(); // get latest

  if (sessionKey) {
    const token = localStorage.getItem(sessionKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default publicApi;