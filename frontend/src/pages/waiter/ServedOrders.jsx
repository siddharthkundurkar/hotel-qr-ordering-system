import { useEffect, useState } from "react";
import { getServedOrdersHistory } from "../../api/waiter.services";

const filters = [
  "today",
  "yesterday",
  "week",
  "month",
  "year",
  "all",
];

export default function ServedOrders() {

  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("today");
  const [loading, setLoading] = useState(true);

  const loadOrders = async (f = filter) => {

    try {

      setLoading(true);

      const data = await getServedOrdersHistory(f);

      setOrders(Array.isArray(data) ? data : []);

    } catch {

      setOrders([]);

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadOrders(filter);

  }, [filter]);

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-5">

      {/* ===== HEADER ===== */}

      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
        Served Orders
      </h1>

      {/* ===== FILTERS ===== */}

      <div className="flex flex-wrap gap-2">

        {filters.map((f) => (

          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition
            ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {f.toUpperCase()}
          </button>

        ))}

      </div>

      {/* ===== CONTENT ===== */}

      {loading ? (

        <div className="space-y-3">

          {[1,2,3,4].map((i)=>(
            <div
              key={i}
              className="h-20 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse"
            />
          ))}

        </div>

      ) : orders.length === 0 ? (

        <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
          No served orders found
        </div>

      ) : (

        <div className="space-y-3">

          {orders.map((o) => (

            <div
              key={o.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4 flex justify-between items-center hover:shadow-md transition"
            >

              {/* LEFT */}

              <div>

                <p className="font-bold text-lg text-slate-800 dark:text-slate-100">
                  Table {o.tableNumber}
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Order #{o.id}
                </p>

                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {new Date(o.servedAt).toLocaleString()}
                </p>

              </div>

              {/* RIGHT */}

              <div className="text-right space-y-1">

                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Items: {o.itemsCount}
                </p>

                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Qty: {o.totalQty}
                </p>

                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  ₹{o.totalAmount}
                </p>

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}