import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  GitBranch,
  Users,
  UserCog,
  BarChart3,
  Settings,
  LogOut,
  Sun,
  Moon
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api, { clearAccessToken } from "../api/interceptors";
import { useEffect, useState } from "react";

export default function OwnerLayout() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  /* ================= THEME ================= */

  const [dark, setDark] = useState(
    localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
  );

  useEffect(() => {
    const root = document.documentElement;

    if (dark) {
      root.classList.add("dark");
      localStorage.theme = "dark";
    } else {
      root.classList.remove("dark");
      localStorage.theme = "light";
    }
  }, [dark]);

  const toggleTheme = () => setDark((prev) => !prev);

  /* ================= LOGOUT ================= */

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.log("Logout error:", err);
    }

    clearAccessToken();
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">

      {/* ================= SIDEBAR ================= */}

      <aside className="w-64 flex flex-col border-r bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">

        {/* LOGO */}

        <div className="h-16 flex items-center px-6 font-bold text-lg border-b border-slate-200 dark:border-slate-800">
          HMS Owner
        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 px-4 py-6 space-y-2">

          <SidebarLink
            to="/owner"
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
          />

          <SidebarLink
            to="/owner/branches"
            icon={<GitBranch size={18} />}
            label="Branches"
          />

          <SidebarLink
            to="/owner/managers"
            icon={<UserCog size={18} />}
            label="Managers"
          />

          {/* ⭐ STAFF PAGE */}
          <SidebarLink
            to="/owner/staff"
            icon={<Users size={18} />}
            label="Staff"
          />

          <SidebarLink
            to="/owner/reports"
            icon={<BarChart3 size={18} />}
            label="Reports"
          />

          <SidebarLink
            to="/owner/settings"
            icon={<Settings size={18} />}
            label="Settings"
          />

        </nav>

        {/* FOOTER */}

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">

          {/* THEME BUTTON */}

          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 text-sm w-full px-3 py-2 rounded-lg
            hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            {dark ? "Light Mode" : "Dark Mode"}
          </button>

          {/* LOGOUT */}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-sm w-full px-3 py-2 rounded-lg
            hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 transition"
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>

      </aside>

      {/* ================= MAIN ================= */}

      <main className="flex-1 flex flex-col">

        {/* TOPBAR */}

        <header className="h-16 flex items-center justify-between px-6 border-b
        bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">

          <h1 className="font-semibold text-lg">
            Owner Panel
          </h1>

        </header>

        {/* CONTENT */}

        <div className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </div>

      </main>

    </div>
  );
}

/* ================= SIDEBAR LINK ================= */

function SidebarLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition
        ${
          isActive
            ? "bg-indigo-600 text-white shadow"
            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}