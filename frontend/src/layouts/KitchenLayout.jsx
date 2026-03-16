import { NavLink, Outlet } from "react-router-dom";

export default function KitchenLayout() {
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b">
        <div className="px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">
            🍳 Kitchen Panel
          </h1>

          <div className="flex gap-6">
            {/* Active Orders = index route */}
            <NavLink
              to="."
              end
              className={({ isActive }) =>
                isActive
                  ? "font-semibold text-indigo-600"
                  : "text-slate-500"
              }
            >
              Active Orders
            </NavLink>

            {/* History */}
            <NavLink
              to="history"
              className={({ isActive }) =>
                isActive
                  ? "font-semibold text-indigo-600"
                  : "text-slate-500"
              }
            >
              Order History
            </NavLink>
          </div>
        </div>
      </div>

      <Outlet />
    </div>
  );
}
