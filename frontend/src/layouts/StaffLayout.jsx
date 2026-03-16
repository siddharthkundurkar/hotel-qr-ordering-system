import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StaffAttendanceBar from "../component/attendance/StaffAttendance";

export default function StaffLayout() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const role = user.role?.toUpperCase();

  /* 🔁 AUTO REDIRECT BASED ON ROLE */
  if (location.pathname === "/staff") {
    if (role === "WAITER")
      return <Navigate to="/staff/waiter" replace />;

    if (role === "KITCHEN")
      return <Navigate to="/staff/kitchen" replace />;

    if (role === "CASHIER")
      return <Navigate to="/cashier" replace />;
  }

  /* 🧠 WAITER & KITCHEN = NO OWNER HEADER */
  const hideHeader = role === "WAITER" || role === "KITCHEN";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* 🔴 GLOBAL ATTENDANCE BAR (ALL STAFF) */}
      <StaffAttendanceBar />

      {/* HEADER (Owner / Manager / Cashier style) */}
      {!hideHeader && (
        <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">
            {role} PANEL
          </h1>

          <span className="text-sm text-slate-500">
            Branch #{user.branchId}
          </span>
        </header>
      )}

      {/* PAGE CONTENT */}
      <main className={`flex-1 ${hideHeader ? "" : "p-6"}`}>
        <Outlet />
      </main>
    </div>
  );
}
