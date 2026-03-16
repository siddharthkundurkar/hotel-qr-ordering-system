import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import socket from "../socket";
import {
  LogOut,
  Menu,
  History,
  ClipboardList,
  LayoutDashboard,
  Moon,
  Sun
} from "lucide-react";

import LogoutConfirmModal from "../component/LogOutConfirmModal";
import { useTheme } from "../context/ThemeContext";

export default function WaiterLayout() {

  const navigate = useNavigate();
  const location = useLocation();

  const [online, setOnline] = useState(socket.connected);
  const [showLogout, setShowLogout] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { theme, toggleTheme } = useTheme();

  /* ================= SOCKET STATUS ================= */

  useEffect(() => {

    const handleConnect = () => setOnline(true);
    const handleDisconnect = () => setOnline(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };

  }, []);

  /* ================= LOGOUT ================= */

  const handleLogoutConfirm = useCallback(() => {

    try {

      setShowLogout(false);

      socket.removeAllListeners();
      socket.disconnect();

      localStorage.clear();

      navigate("/login", { replace: true });

    } catch (err) {
      console.error("Logout error:", err);
    }

  }, [navigate]);

  /* ================= NAVIGATION ================= */

  const go = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-950">

      {/* ================= SIDEBAR ================= */}

      <aside
        className={`fixed top-0 left-0 h-full w-64
        bg-white dark:bg-slate-900
        border-r border-slate-200 dark:border-slate-800
        shadow-xl
        transform transition-transform duration-300
        z-50
        ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >

        {/* Sidebar Header */}
        <div className="h-14 flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <span className="text-lg mr-2">🍽️</span>
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">
            Waiter Panel
          </span>
        </div>

        {/* Scrollable menu */}
        <div className="overflow-y-auto h-[calc(100%-56px)] p-3 space-y-2">

          {/* DASHBOARD */}
          <button
            onClick={() => go("/staff/waiter/dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition
            ${
              isActive("/staff/waiter/dashboard")
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          {/* READY ORDERS */}
          <button
            onClick={() => go("/staff/waiter/ready")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition
            ${
              isActive("/staff/waiter/ready")
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            <ClipboardList size={18} />
            Ready Orders
          </button>

          {/* SERVED ORDERS */}
          <button
            onClick={() => go("/staff/waiter/served-orders")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition
            ${
              isActive("/staff/waiter/served-orders")
                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            <History size={18} />
            Served Orders
          </button>

        </div>
      </aside>

      {/* ================= OVERLAY ================= */}

      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ================= MAIN AREA ================= */}

      <div className="flex-1 flex flex-col">

        {/* ================= HEADER ================= */}

        <header className="sticky top-0 z-30 backdrop-blur bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800">

          <div className="h-14 px-3 max-w-7xl mx-auto flex items-center justify-between">

            {/* LEFT */}
            <div className="flex items-center gap-3">

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Menu size={22} />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-lg">🍽️</span>

                <div>
                  <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Waiter Dashboard
                  </h1>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Live service mode
                  </p>
                </div>
              </div>

            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3">

              {/* online status */}
              <span
                className={`h-2 w-2 rounded-full ${
                  online ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                }`}
              />

              {/* theme toggle */}
              <button
  onClick={toggleTheme}
  aria-label="Toggle Theme"
  title="Toggle Theme"
  className="
  h-10 w-10 flex items-center justify-center
  rounded-xl
  border border-slate-200 dark:border-slate-700
  bg-white dark:bg-slate-900
  text-slate-600 dark:text-slate-300
  hover:bg-slate-100 dark:hover:bg-slate-800
  hover:scale-105
  active:scale-95
  transition
  "
>
  {theme === "dark" ? (
    <Sun size={18} className="text-amber-500" />
  ) : (
    <Moon size={18} className="text-indigo-500" />
  )}
</button>

              {/* logout */}
              <button
                onClick={() => setShowLogout(true)}
                className="h-10 w-10 flex items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/30 transition"
              >
                <LogOut size={18}/>
              </button>

            </div>

          </div>

        </header>

        {/* ================= CONTENT ================= */}

        <main className="flex-1 overflow-y-auto max-w-7xl mx-auto w-full px-3 pt-4 pb-16">
          <Outlet />
        </main>

      </div>

      {/* ================= LOGOUT MODAL ================= */}

      {showLogout && (
        <LogoutConfirmModal
          onConfirm={handleLogoutConfirm}
          onCancel={() => setShowLogout(false)}
        />
      )}

    </div>
  );
}