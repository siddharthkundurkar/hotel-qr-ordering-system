import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  getOrdersAnalytics,
  getOrdersToday,
  getRecentOrders,
} from "../../../api/dashboardservice";

const RANGES = ["day", "week", "month", "year"];

export default function OrdersDashboard() {
  const [range, setRange] = useState("week");
  const [analytics, setAnalytics] = useState(null);
  const [today, setToday] = useState(0);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const axisColor = "#94a3b8"; // slate-400
  const lineColor = "#6366f1"; // indigo
  const barColor = "#10b981"; // emerald

  useEffect(() => {
    loadData();
  }, [range]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [todayRes, analyticsRes, recentRes] = await Promise.all([
        getOrdersToday(),
        getOrdersAnalytics(range),
        getRecentOrders(),
      ]);

      setToday(todayRes.count ?? 0);
      setAnalytics(analyticsRes);
      setRecent(recentRes ?? []);
    } catch (err) {
      console.error("Orders dashboard error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Orders Dashboard
      </h1>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="Orders Today" value={today} />
        <KpiCard title="Total Orders" value={analytics?.totalOrders ?? 0} />
        <KpiCard title="Revenue" value={`₹${analytics?.revenue ?? 0}`} />
        <KpiCard title="Avg Order Value" value={`₹${analytics?.avgOrder ?? 0}`} />
      </div>

      {/* RANGE FILTER */}
      <RangeTabs range={range} setRange={setRange} />

      {/* GRAPHS */}
      {!loading && analytics && (
        <div className="grid lg:grid-cols-2 gap-6">

          <ChartCard title="Orders Trend">
            <LineChart data={analytics.trend}>
              <XAxis dataKey="label" stroke={axisColor} />
              <YAxis stroke={axisColor} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke={lineColor}
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ChartCard>

          <ChartCard title="Revenue Trend">
            <BarChart data={analytics.trend}>
              <XAxis dataKey="label" stroke={axisColor} />
              <YAxis stroke={axisColor} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="revenue" fill={barColor} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>

        </div>
      )}

      {/* RECENT ORDERS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5">

        <h3 className="font-semibold mb-3 text-slate-900 dark:text-white">
          Recent Orders
        </h3>

        {recent.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No recent orders
          </p>
        ) : (
          <ul className="space-y-2">
            {recent.map((o) => (
              <li
                key={o.id}
                className="flex justify-between text-sm border-b border-slate-200 dark:border-slate-700 pb-2 text-slate-700 dark:text-slate-300"
              >
                <span>Table {o.tableNumber}</span>
                <span className="font-medium">₹{o.totalAmount}</span>
              </li>
            ))}
          </ul>
        )}

      </div>
    </motion.div>
  );
}
/* ================= KPI CARD ================= */

function KpiCard({ title, value }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {title}
      </p>

      <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
        {value}
      </p>
    </div>
  );
}

/* ================= RANGE TABS ================= */

function RangeTabs({ range, setRange }) {
  const RANGES = ["day", "week", "month", "year"];

  return (
    <div className="flex gap-2 flex-wrap">
      {RANGES.map((r) => (
        <button
          key={r}
          onClick={() => setRange(r)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition
          ${
            range === r
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          {r.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/* ================= CHART CARD ================= */

function ChartCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5 h-80">

      <h3 className="font-semibold mb-3 text-slate-900 dark:text-white">
        {title}
      </h3>

      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>

    </div>
  );
}