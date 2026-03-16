import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

export default function CashierLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // ✅ load theme from localStorage
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  /* ================= THEME EFFECT ================= */

  useEffect(() => {
    const root = document.documentElement;

    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen flex bg-slate-100 dark:bg-slate-900">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="text-xl font-bold">Cashier POS</h1>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <SidebarItem to="dashboard" icon={LayoutDashboard}>
            Dashboard
          </SidebarItem>

          <SidebarItem to="orders" icon={CreditCard}>
            Orders
          </SidebarItem>

          <SidebarItem to="history" icon={Receipt}>
            Bill History
          </SidebarItem>
        </nav>

        <div className="p-4 border-t space-y-2">
          {/* THEME TOGGLE */}
          <button
            onClick={() => setDark(v => !v)}
            className="w-full flex items-center gap-2 text-sm px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? "Light Mode" : "Dark Mode"}
          </button>

          {/* LOGOUT */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-sm text-red-600 px-3 py-2 rounded hover:bg-red-50"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white dark:bg-slate-800 border-b px-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">
              {new Date().toLocaleDateString()}
            </p>
            <p className="font-semibold">Cashier</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ================= SIDEBAR ITEM ================= */

function SidebarItem({ to, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
          isActive
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
        }`
      }
    >
      <Icon size={18} />
      {children}
    </NavLink>
  );
}
