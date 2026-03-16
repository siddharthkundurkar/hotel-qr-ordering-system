import { useEffect, useMemo, useState } from "react";
import OrderCard from "./OrderCard";
import api from "../../../api/interceptors";
import { toast } from "react-hot-toast";
 import { ShoppingCart, IndianRupee } from "lucide-react";
/* ===== DATE HELPER ===== */
const isToday = (date) => {
  const d = new Date(date);
  const t = new Date();
  return d.toDateString() === t.toDateString();
};

const STATUS_FILTERS = ["all", "pending", "preparing", "served", "paid"];

export default function ManagerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  /* ================= FETCH ORDERS ================= */
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get("/manager/orders");

      const sorted = (data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setOrders(sorted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UPDATE STATUS ================= */
  const handleStatusChange = async (orderId, status) => {
    try {
      await api.patch(`/manager/orders/${orderId}/status`, { status });

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );

      toast.success("Order status updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order status");
    }
  };

  /* ================= FILTERED ORDERS ================= */
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      const matchesSearch =
        order.id.toString().includes(search) ||
        (order.tableNumber || "").toString().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, search]);

  const todayOrders = filteredOrders.filter((o) => isToday(o.createdAt));
  const pastOrders = filteredOrders.filter((o) => !isToday(o.createdAt));

  const todayRevenue = todayOrders.reduce(
    (sum, o) => sum + (o.totalAmount || 0),
    0
  );

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500 dark:text-slate-400">
        Loading orders...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">

      {/* ===== HEADER ===== */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Orders Dashboard
        </h1>

        {/* SUMMARY */}
      

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">

  {/* TODAY ORDERS */}
  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition">
    
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Today's Orders
      </p>

      <p className="text-2xl font-bold text-slate-900 dark:text-white">
        {todayOrders.length}
      </p>
    </div>

    <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
      <ShoppingCart className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
    </div>
  </div>


  {/* REVENUE */}
  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition">
    
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Revenue
      </p>

      <p className="text-2xl font-bold text-slate-900 dark:text-white">
        ₹{todayRevenue}
      </p>
    </div>

    <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
      <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
    </div>
  </div>

</div>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search order or table..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white dark:bg-slate-800
          border-slate-200 dark:border-slate-700
          text-slate-800 dark:text-slate-200"
        />

        {/* STATUS FILTERS */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition
              ${
                statusFilter === status
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              {status.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ===== TODAY ORDERS ===== */}
      <section className="max-w-7xl mx-auto px-6 pb-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
          Today's Orders
        </h2>

        {todayOrders.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">
            No orders today
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {todayOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </section>

      {/* ===== PREVIOUS ORDERS ===== */}
      <section className="max-w-7xl mx-auto px-6 pb-10">
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
          Previous Orders
        </h2>

        {pastOrders.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">
            No previous orders
          </p>
        ) : (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-200 dark:divide-slate-700">
            {pastOrders.map((order) => (
              <div
                key={order.id}
                className="flex justify-between items-center px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <div className="font-medium text-slate-800 dark:text-slate-200">
                  Order #{order.id}
                  <span className="text-slate-500 dark:text-slate-400 ml-2">
                    Table {order.tableNumber ?? "-"}
                  </span>
                </div>

                <div className="font-bold text-slate-700 dark:text-slate-300">
                  ₹{order.totalAmount ?? 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}