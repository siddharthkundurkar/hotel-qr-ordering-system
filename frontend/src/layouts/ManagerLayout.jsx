import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Utensils,
  Table,
  ClipboardList,
  Settings,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useState } from "react";
import SelectBranchModal from "../pages/manager/SelectBranchPage";

export default function ManagerLayout() {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [showLogout, setShowLogout] = useState(false); // ✅ NEW

  if (loading) return null;

  const needsBranch =
    user?.role === "MANAGER" && !user.branchId;

  return (
    <div className="min-h-screen flex relative bg-slate-100 dark:bg-slate-950">

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`
          w-64 flex flex-col
          bg-white dark:bg-slate-900
          border-r border-slate-200 dark:border-slate-800
          ${needsBranch ? "pointer-events-none opacity-70" : ""}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 text-xl font-bold border-b">
          HMS Manager
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <SidebarLink to="/manager" icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <SidebarLink to="/manager/staff" icon={<Users size={18} />} label="Staff" />
          <SidebarLink to="/manager/tables" icon={<Table size={18} />} label="Tables" />
          <SidebarLink to="/manager/menu" icon={<Utensils size={18} />} label="Menu" />
          <SidebarLink to="/manager/orders" icon={<ClipboardList size={18} />} label="Orders" />
          <SidebarLink to="/manager/inventory" icon={<ClipboardList size={18} />} label="Inventory" />
          <SidebarLink to="/manager/settings" icon={<Settings size={18} />} label="Settings" />
        </nav>

        {/* Theme Toggle */}
        <div className="px-4 pb-3">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm
              bg-slate-100 dark:bg-slate-800
              hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        {/* Logout */}
        <div className="p-4 border-t">
          <button
            onClick={() => setShowLogout(true)} // ✅ CHANGED
            className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 hover:text-red-500"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* ================= CONTENT ================= */}
      <main
        className={`flex-1 p-6 overflow-y-auto ${
          needsBranch ? "blur-sm pointer-events-none" : ""
        }`}
      >
        <Outlet />
      </main>

      {/* ================= BRANCH MODAL ================= */}
      {needsBranch && <SelectBranchModal />}

      {/* ================= LOGOUT MODAL ================= */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-white">
              Confirm Logout
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to logout?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogout(false)}
                className="px-4 py-2 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ================= Sidebar Link ================= */

function SidebarLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition
        ${
          isActive
            ? "bg-indigo-600 text-white"
            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
