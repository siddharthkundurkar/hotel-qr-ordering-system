import api from "./interceptors";

/* ================= MANAGER ORDERS ================= */

/* GET ALL ORDERS */
export const getManagerOrders = async (signal) => {
  try {
    const { data } = await api.get("/manager/orders", { signal });
    return data;
  } catch (err) {
    console.error("Fetch manager orders failed:", err);
    throw err;
  }
};

/* UPDATE ORDER STATUS */
export const updateManagerOrderStatus = async (orderId, status) => {
  try {
    const { data } = await api.patch(
      `/manager/orders/${orderId}/status`,
      { status }
    );
    return data;
  } catch (err) {
    console.error("Update order status failed:", err);
    throw err;
  }
};



/* ================= MANAGER PROFILE ================= */

/* GET PROFILE */
export const getManagerProfile = async (signal) => {
  try {
    const { data } = await api.get("/manager/profile", { signal });
    return data;
  } catch (err) {
    console.error("Fetch manager profile failed:", err);
    throw err;
  }
};


/* UPDATE PROFILE */
export const updateManagerProfile = async (payload) => {
  try {
    const { data } = await api.put("/manager/profile", payload);
    return data;
  } catch (err) {
    console.error("Update profile failed:", err);
    throw err;
  }
};



/* ================= MANAGER BRANCH ================= */

/* GET BRANCH INFO */
export const getManagerBranch = async (signal) => {
  try {
    const { data } = await api.get("/manager/branch", { signal });
    return data;
  } catch (err) {
    console.error("Fetch branch failed:", err);
    throw err;
  }
};



/* ================= CHANGE PASSWORD ================= */

export const changeManagerPassword = async (payload) => {
  try {
    const { data } = await api.post("/manager/change-password", payload);
    return data;
  } catch (err) {
    console.error("Password change failed:", err);
    throw err;
  }
};