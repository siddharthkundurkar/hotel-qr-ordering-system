import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_REDIRECT = {
  OWNER: "/owner",
  MANAGER: "/manager",
  WAITER: "/staff/waiter",
  KITCHEN: "/staff/kitchen",
  CASHIER: "/cashier",
};

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
  return (
    <div className="h-screen flex items-center justify-center">
      Restoring session...
    </div>
  );
}

  // 🔐 Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  /* =================================================
     ✅ ROLE GUARD FIRST (ENTERPRISE ORDER)
  ================================================= */
  if (roles && !roles.includes(user.role)) {
    return (
      <Navigate
        to={ROLE_REDIRECT[user.role] || "/login"}
        replace
      />
    );
  }

  /* =================================================
     🚨 MANAGER WITHOUT BRANCH
     (ONLY block manager routes, not the select page)
  ================================================= */
  const isManager = user.role === "MANAGER";
  const hasBranch = !!user.branchId;
  const isSelectPage =
    location.pathname === "/manager/select-branch";

  if (isManager && !hasBranch && !isSelectPage) {
    return <Navigate to="/manager/select-branch" replace />;
  }

  return children;
}