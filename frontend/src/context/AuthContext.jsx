import React, { createContext, useContext, useEffect, useState } from "react";
import API, {
  setAccessToken,
  clearAccessToken,
} from "../api/interceptors";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= SAFE SETTER ================= */
  const setUser = (userData) => {
    setUserState((prev) =>
      typeof userData === "function" ? userData(prev) : userData
    );
  };

  /* ================= LOGOUT ================= */
  const logout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (err) {
  console.log("Auth restore failed:", err?.response?.data || err.message);

  // only logout if actually unauthorized
  if (err?.response?.status === 401) {
    clearAccessToken();
    setUserState(null);
  }
}
  /* ================= INIT AUTH (RUN ONCE) ================= */
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // ✅ if user already present → skip
        if (user) {
          if (isMounted) setLoading(false);
          return;
        }

        /* ================= REFRESH TOKEN ================= */
        const refreshRes = await API.post("/auth/refresh");
        const newToken = refreshRes.data.accessToken;

        setAccessToken(newToken);

        /* ================= DECODE JWT ================= */
        const payload = JSON.parse(atob(newToken.split(".")[1]));
        const role = payload?.role;
        const branchId = payload?.branchId;

        /* ================= MANAGER WITHOUT BRANCH ================= */
        if (role === "MANAGER" && !branchId) {
          if (isMounted) {
            setUserState({
              id: payload.id,
              role,
              companyId: payload.companyId,
              branchId: null,
            });
          }
          return;
        }

        /* ================= NORMAL USERS ================= */
        const meRes = await API.get("/auth/me");

        if (isMounted) {
          setUserState(meRes.data);
        }
      } catch (err) {
        clearAccessToken();
        if (isMounted) setUserState(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []); // ✅ RUN ONLY ONCE

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        logout,
        isAuth: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* ================= HOOK ================= */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};