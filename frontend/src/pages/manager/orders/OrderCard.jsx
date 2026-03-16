export default function OrderCard({ order, onStatusChange }) {
  const STATUS_CONFIG = {
    pending: {
      label: "PENDING",
      next: "preparing",
      color:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    },
    preparing: {
      label: "PREPARING",
      next: "served",
      color:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    },
    served: {
      label: "SERVED",
      next: "paid",
      color:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    paid: {
      label: "PAID",
      next: null,
      color:
        "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
    },
  };

  const items = Array.isArray(order.items) ? order.items : [];
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  const orderTime = order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col gap-4">

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Table {order.tableNumber ?? "-"}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Order #{order.id} • {orderTime}
          </p>

          <p className="text-xs text-slate-400 dark:text-slate-500">
            {items.length} items
          </p>
        </div>

        <span
          className={`px-3 py-1 text-xs rounded-full font-semibold ${status.color}`}
        >
          {status.label}
        </span>
      </div>

      {/* ITEMS */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
        <p className="text-sm font-bold mb-2 text-slate-800 dark:text-slate-200">
          Items
        </p>

        {items.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">
            No items added yet
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id || item.name}
                className="flex justify-between items-center"
              >
                <span className="text-base font-medium text-slate-800 dark:text-slate-200">
                  {item.name}
                </span>

                <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                  × {item.qty}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700">
        <p className="text-lg font-bold text-slate-900 dark:text-white">
          ₹{order.totalAmount ?? 0}
        </p>

        {status.next && (
          <button
            onClick={() => onStatusChange(order.id, status.next)}
            className="px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition"
          >
            Mark as {status.next}
          </button>
        )}
      </div>
    </div>
  );
}