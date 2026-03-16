import { useEffect, useMemo, useState } from "react";
import { getPaidOrders } from "../../api/cashier.services";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CashierHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= FILTERS ================= */

  const [filters, setFilters] = useState({
    date: "today",        // today | yesterday | week
    paymentMethod: "all", // all | cash | upi | card
  });

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getPaidOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load bill history", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= DATE HELPERS ================= */

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const isThisWeek = (date) => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return date >= start;
  };

  /* ================= APPLY FILTERS ================= */

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const paidDate = new Date(o.paidAt);
      const now = new Date();

      if (filters.date === "today" && !isSameDay(paidDate, now)) {
        return false;
      }

      if (
        filters.date === "yesterday" &&
        !isSameDay(
          paidDate,
          new Date(now.setDate(now.getDate() - 1))
        )
      ) {
        return false;
      }

      if (filters.date === "week" && !isThisWeek(paidDate)) {
        return false;
      }

      if (
        filters.paymentMethod !== "all" &&
        o.paymentMethod !== filters.paymentMethod
      ) {
        return false;
      }

      return true;
    });
  }, [orders, filters]);

  const openInvoice = (url) => {
    if (!url) return;
    const full =
      url.startsWith("http") ? url : `${API_BASE}${url}`;
    window.open(full, "_blank", "noopener,noreferrer");
  };

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="text-center text-slate-500">
        Loading bill history…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Bill History
        </h1>
        <p className="text-sm text-slate-500">
          Paid orders
        </p>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-4">
        {/* DATE */}
        <select
          value={filters.date}
          onChange={(e) =>
            setFilters(f => ({ ...f, date: e.target.value }))
          }
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">This Week</option>
        </select>

        {/* PAYMENT */}
        <select
          value={filters.paymentMethod}
          onChange={(e) =>
            setFilters(f => ({
              ...f,
              paymentMethod: e.target.value,
            }))
          }
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="all">All Payments</option>
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-center">Table</th>
              <th className="px-4 py-3 text-center">Payment</th>
              <th className="px-4 py-3 text-center">Amount</th>
              <th className="px-4 py-3 text-center">Time</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>

          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-6 text-slate-500"
                >
                  No bills found
                </td>
              </tr>
            ) : (
              filteredOrders.map(o => (
                <tr
                  key={o.orderId}
                  className="border-t hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    #{o.orderId}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {o.tableNumber}
                  </td>
                  <td className="px-4 py-3 text-center uppercase">
                    {o.paymentMethod}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">
                    ₹{o.totalAmount}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {new Date(o.paidAt).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() =>
                        openInvoice(o.invoiceUrl)
                      }
                      className="text-indigo-600 hover:underline"
                    >
                      Invoice
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
