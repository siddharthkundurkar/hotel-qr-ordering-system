import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { logout } from "../api/auth.services";

export default function PlatformLayout() {
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= LOGOUT ================= */
  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed", err);
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-6">
          Super Admin
        </h2>

        <div className="space-y-3 flex-1">
          <NavLink
            to="/platform/dashboard"
            className="block hover:text-indigo-400"
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/platform/owners"
            className="block hover:text-indigo-400"
          >
            Owners
          </NavLink>

          <NavLink
            to="/platform/companies"
            className="block hover:text-indigo-400"
          >
            Companies
          </NavLink>
        </div>

        {/* 🔥 LOGOUT BUTTON */}
        <button
          onClick={() => setShowLogout(true)}
          className="flex items-center gap-2 mt-6 text-rose-400 hover:text-rose-300 transition"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      {/* ================= CONTENT ================= */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>

      {/* ================= LOGOUT MODAL ================= */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold mb-2">
              Confirm Logout
            </h3>

            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to logout?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogout(false)}
                className="px-4 py-2 border rounded-lg text-sm"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                onClick={handleLogout}
                disabled={loading}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700 disabled:opacity-50"
              >
                {loading ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
