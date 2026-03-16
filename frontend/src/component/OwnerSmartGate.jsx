import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../api/interceptors";
import { useAuth } from "../context/AuthContext";

export default function OwnerSmartGate({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const [checking, setChecking] = useState(true);
  const [hasBranch, setHasBranch] = useState(false);

  useEffect(() => {
    // ✅ wait for user
    if (!user) return;

    // ✅ SUPER ADMIN should NEVER be checked
    if (user.role === "SUPER_ADMIN") {
      setChecking(false);
      return;
    }

    // ✅ only owners need branch check
    if (user.role !== "OWNER") {
      setChecking(false);
      return;
    }

    const checkBranches = async () => {
      try {
        // 🚨 no company → skip API
        if (!user.companyId) {
          setChecking(false);
          return;
        }

        const res = await api.get("/branches/my");
        setHasBranch(res.data.length > 0);
      } catch (err) {
        console.log("Branch check failed:", err);
      } finally {
        setChecking(false);
      }
    };

    checkBranches();
  }, [user]);

  // ✅ wait for auth + branch check
  if (loading || checking) return null;

  // safety
  if (!user) return <Navigate to="/login" replace />;

  // ✅ SUPER ADMIN bypass
  if (user.role === "SUPER_ADMIN") {
    return children;
  }

  // ✅ only OWNER logic below
  if (user.role !== "OWNER") {
    return children;
  }

  // 🚨 STEP 1 — no company
  if (
    !user.companyId &&
    location.pathname !== "/setup/company"
  ) {
    return <Navigate to="/setup/company" replace />;
  }

  // 🚨 STEP 2 — no branch
  if (
    user.companyId &&
    !hasBranch &&
    location.pathname !== "/setup/branch"
  ) {
    return <Navigate to="/setup/branch" replace />;
  }

  // ✅ READY
  return children;
}
