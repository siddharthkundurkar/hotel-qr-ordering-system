import { useEffect, useState } from "react";
import KitchenOrderCard from "../kitchen/KitchenOrderCard";
import { getKitchenOrderHistory } from "../../api/kitchen.services";
import toast from "react-hot-toast";

const FILTERS = [
  { key: "today", label: "Today" },
  { key: "week", label: "Last 7 Days" },
  { key: "month", label: "This Month" },
];

export default function KitchenHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("today");

  useEffect(() => {
    loadHistory();
  }, [range]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await getKitchenOrderHistory(range);
      const data = Array.isArray(res?.data) ? res.data : [];

      setOrders(
        data.filter(
          (o) => o.status === "served" || o.status === "paid"
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to load kitchen history");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ===== Header ===== */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              🍳 Kitchen History
            </h2>
            <p className="text-sm text-slate-500">
              Completed orders (served & paid)
            </p>
          </div>

          {/* Filters */}
          <div className="flex bg-slate-100 rounded-xl p-1 w-fit">
            {FILTERS.map((f) => {
              const active = range === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setRange(f.key)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition
                    ${
                      active
                        ? "bg-indigo-600 text-white shadow"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== Content ===== */}
      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 bg-white rounded-2xl border animate-pulse"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border p-10 text-center">
            <p className="text-lg font-semibold text-slate-700">
              No completed orders
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Try changing the date range
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <KitchenOrderCard
                key={order.id}
                order={order}
                readOnly
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
