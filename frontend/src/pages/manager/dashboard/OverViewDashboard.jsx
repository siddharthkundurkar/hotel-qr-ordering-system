import { useEffect, useState } from "react";
import { Users, Table, Utensils, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";

import {
  getTableOccupancy,
  getOrdersToday,
  getRecentOrders,
} from "../../../api/dashboardservice";

export default function OverviewDashboard() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    staff: 0,
    tables: 0,
    occupiedTables: 0,
    orders: 0,
    lowStock: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);

        const [tables, orders, recent] = await Promise.all([
          getTableOccupancy(),
          getOrdersToday(),
          getRecentOrders(),
        ]);

        if (!mounted) return;

        setStats({
          staff: 0,
          tables: tables?.total ?? 0,
          occupiedTables: tables?.occupied ?? 0,
          orders: orders?.count ?? 0,
          lowStock: 0,
        });

        setRecentOrders(recent ?? []);
      } catch (err) {
        console.error("Overview dashboard error", err);
      } finally {
        mounted && setLoading(false);
      }
    };

    loadDashboard();

    return () => (mounted = false);
  }, []);

  if (loading) {
    return (
      <div className="text-center text-slate-500 dark:text-slate-400 py-20">
        Loading overview…
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* KPI CARDS */}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

        <KpiCard
          title="Staff"
          value={stats.staff}
          icon={<Users size={20} />}
        />

        <KpiCard
          title="Tables"
          value={`${stats.occupiedTables}/${stats.tables}`}
          icon={<Table size={20} />}
        />

        <KpiCard
          title="Orders Today"
          value={stats.orders}
          icon={<Utensils size={20} />}
        />

        <KpiCard
          title="Low Stock"
          value={stats.lowStock}
          icon={<ClipboardList size={20} />}
        />

      </div>

      {/* RECENT ORDERS */}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6">

        <h3 className="font-semibold mb-3 text-slate-900 dark:text-white">
          Recent Orders
        </h3>

        {recentOrders.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No recent orders.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentOrders.map((o) => (
              <li
                key={o.id}
                className="flex justify-between text-sm border-b border-slate-200 dark:border-slate-700 pb-2 text-slate-700 dark:text-slate-300"
              >
                <span>Table {o.tableNumber}</span>

                <span className="font-medium">
                  ₹{o.totalAmount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* QUICK INFO */}

      <div className="grid lg:grid-cols-2 gap-6">

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6">

          <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">
            Branch Activity
          </h3>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor tables, orders and staff activity
            from the tabs above.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6">

          <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">
            Tips
          </h3>

          <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
            <li>• Check table dashboard for occupancy</li>
            <li>• Track orders in orders dashboard</li>
            <li>• Monitor staff performance</li>
          </ul>
        </div>

      </div>
    </motion.div>
  );
}

/* ================= KPI CARD ================= */

function KpiCard({ title, value, icon }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4 flex items-center justify-between">

      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {title}
        </p>

        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
          {value}
        </p>
      </div>

      <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300">
        {icon}
      </div>

    </div>
  );
}