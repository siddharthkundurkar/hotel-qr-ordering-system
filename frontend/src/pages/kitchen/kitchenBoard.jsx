import { useMemo } from "react";
import KitchenOrderCard from "./KitchenOrderCard";

const STATUSES = [
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
];

export default function KitchenBoard({
  orders = [],
  onStatusChange = () => {},
  onItemReady = () => {}, // ⭐ CRITICAL FIX
}) {
  /* =================================================
     🧠 GROUP + SORT (ENTERPRISE SAFE)
  ================================================= */
  const groupedOrders = useMemo(() => {
    const map = {
      pending: [],
      accepted: [],
      preparing: [],
      ready: [],
    };

    if (!orders?.length) return map;

    const now = Date.now();

    for (const order of orders) {
      if (!map[order.status]) continue;

      const createdMs = order.createdAt
        ? new Date(order.createdAt).getTime()
        : now;

      map[order.status].push({
        ...order,
        __createdMs: createdMs,
      });
    }

    Object.keys(map).forEach((status) => {
      map[status].sort((a, b) => {
        // ⭐ priority first
        if (a.hasPriority && !b.hasPriority) return -1;
        if (!a.hasPriority && b.hasPriority) return 1;

        // ⭐ delayed next
        if (a.isDelayed && !b.isDelayed) return -1;
        if (!a.isDelayed && b.isDelayed) return 1;

        // ⭐ FIFO fallback
        return a.__createdMs - b.__createdMs;
      });
    });

    return map;
  }, [orders]);

  const columns = useMemo(() => STATUSES, []);

  return (
    <div className="px-4 md:px-6 pb-6">
      {/* 🔥 ENTERPRISE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {columns.map(({ key, label }) => {
          const columnOrders = groupedOrders[key] || [];

          return (
            <div
              key={key}
              className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[calc(100vh-160px)]"
            >
              {/* ================= STICKY HEADER ================= */}
              <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur px-4 py-3 border-b border-slate-200 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-700 tracking-wide">
                    {label}
                  </h2>

                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
                    {columnOrders.length}
                  </span>
                </div>
              </div>

              {/* ================= SCROLL LANE ================= */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {columnOrders.length === 0 ? (
                  <div className="text-sm text-slate-400 italic text-center py-10 border border-dashed rounded-lg">
                    No orders
                  </div>
                ) : (
                  columnOrders.map((order) => (
                    <KitchenOrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={onStatusChange}
                      onItemReady={onItemReady} // ⭐ PASS DOWN (VERY IMPORTANT)
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}