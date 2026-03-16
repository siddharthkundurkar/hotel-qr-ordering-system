import { memo, useMemo, useState } from "react";

function KitchenOrderCard({
  order = {},
  onStatusChange,
  onItemReady,
  readOnly = false,
  loading = false,
}) {
  if (!order?.id) return null;

  const [processingItems, setProcessingItems] = useState(new Set());

  /* =================================================
     STATUS FLOW
  ================================================= */
  const STATUS_FLOW = {
    pending: "accepted",
    accepted: "preparing",
  };

  /* =================================================
     STATUS META
  ================================================= */
  const STATUS_META = {
    pending: {
      title: "New Order",
      badge: "bg-red-100 text-red-700",
      button: "Accept Order",
      buttonStyle: "bg-red-600 hover:bg-red-700",
      accent: "bg-red-500",
    },
    accepted: {
      title: "Accepted",
      badge: "bg-yellow-100 text-yellow-700",
      button: "Start Cooking",
      buttonStyle: "bg-yellow-600 hover:bg-yellow-700",
      accent: "bg-yellow-500",
    },
    preparing: {
      title: "Preparing",
      badge: "bg-orange-100 text-orange-700",
      accent: "bg-orange-500",
    },
    ready: {
      title: "Ready",
      badge: "bg-blue-100 text-blue-700",
      accent: "bg-blue-500",
    },
  };

  const meta = STATUS_META[order.status];
  if (!meta) return null;

  const nextStatus = STATUS_FLOW[order.status];
  const items = Array.isArray(order.items) ? order.items : [];

  const isDelayed = Boolean(order.isDelayed);

  const accentClass = isDelayed
    ? "bg-red-600 animate-pulse"
    : meta.accent;

  /* =================================================
     PRIORITY SORT
  ================================================= */
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return 0;
    });
  }, [items]);

  /* =================================================
     PROGRESS
  ================================================= */
  const total = items.length;
  const readyCount = items.filter(i => i.status === "ready").length;
  const percent = total ? Math.round((readyCount / total) * 100) : 0;

  /* =================================================
     HANDLE ITEM READY
  ================================================= */
  const handleItemReady = async (itemId) => {

    if (processingItems.has(itemId)) return;

    setProcessingItems(prev => new Set(prev).add(itemId));

    try {
      await onItemReady?.(itemId);
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden transition hover:shadow-md ${
        isDelayed ? "border-red-400" : "border-slate-200"
      }`}
    >
      <div className={`h-1 ${accentClass}`} />

      <div className="p-4">

        {/* HEADER */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Table {order.tableNumber ?? "-"}
            </h3>
            <p className="text-[11px] text-slate-400">
              Order #{order.id}
            </p>
          </div>

          <span
            className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full ${meta.badge}`}
          >
            {meta.title}
          </span>
        </div>

        {/* PROGRESS */}
        {order.status === "preparing" && (
          <div className="mb-3">
            <div className="w-full bg-slate-200 rounded h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {readyCount}/{total} items ready
            </p>
          </div>
        )}

        {/* ITEMS */}
        <div className="space-y-1.5 mb-3 max-h-[220px] overflow-y-auto pr-1">
          {sortedItems.map(item => {

            const itemReady = item.status === "ready";
            const processing = processingItems.has(item.id);

            return (
              <div
                key={`item-${item.id}`}
                className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg ${
                  item.isPriority
                    ? "bg-red-50 border border-red-200"
                    : "bg-slate-50"
                }`}
              >
                <div className="flex gap-2 items-center min-w-0">
                  <div className="w-6 h-6 rounded-md bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {item.qty}
                  </div>

                  <p className="text-sm font-medium text-slate-800 truncate">
                    {item.name}
                  </p>
                </div>

                {order.status === "preparing" && (
                  <button
                    disabled={itemReady || processing}
                    onClick={() => handleItemReady(item.id)}
                    className={`text-[10px] font-bold px-2 py-1 rounded transition ${
                      itemReady
                        ? "bg-green-100 text-green-700"
                        : processing
                        ? "bg-gray-300 text-gray-600"
                        : "bg-orange-600 text-white hover:bg-orange-700"
                    }`}
                  >
                    {itemReady ? "Ready" : processing ? "..." : "Mark Ready"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ORDER ACTION */}
        {!readOnly &&
          nextStatus &&
          meta.button &&
          typeof onStatusChange === "function" && (
            <button
              disabled={loading}
              onClick={() => onStatusChange(order.id)}
              className={`w-full py-2.5 rounded-lg text-white font-bold text-sm transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${meta.buttonStyle}`}
            >
              {loading ? "Updating…" : meta.button}
            </button>
          )}
      </div>
    </div>
  );
}

export default memo(KitchenOrderCard);