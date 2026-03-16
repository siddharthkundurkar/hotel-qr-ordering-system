import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import {
  getStaffAnalytics,
  getStaffList,
} from "../../../api/dashboardservice";

const RANGES = ["day", "week", "month", "year"];

export default function StaffDashboard() {
  const [range, setRange] = useState("week");
  const [analytics, setAnalytics] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [range]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, staffRes] = await Promise.all([
        getStaffAnalytics(range),
        getStaffList(),
      ]);

      setAnalytics(analyticsRes);
      setStaff(staffRes ?? []);
    } catch (err) {
      console.error("Staff dashboard error", err);
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
      <h1 className="text-2xl font-bold">Staff Dashboard</h1>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="Total Staff" value={analytics?.totalStaff ?? 0} />
        <KpiCard title="Active Today" value={analytics?.activeToday ?? 0} />
        <KpiCard title="Avg Orders / Staff" value={analytics?.avgOrders ?? 0} />
        <KpiCard title="Top Performer" value={analytics?.topStaff ?? "—"} />
      </div>

      {/* RANGE FILTER */}
      <RangeTabs range={range} setRange={setRange} />

      {/* PERFORMANCE CHART */}
      {/* PERFORMANCE CHART */}
{!loading && analytics && (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5 h-80">

    <h3 className="font-semibold mb-3 text-slate-900 dark:text-white">
      Staff Performance
    </h3>

    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={analytics.performance}
        margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
      >

        {/* GRID */}
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#e2e8f0"
          className="dark:stroke-slate-700"
        />

        {/* AXIS */}
        <XAxis
          dataKey="name"
          stroke="#94a3b8"
          tick={{ fill: "#94a3b8", fontSize: 12 }}
        />

        <YAxis
          stroke="#94a3b8"
          tick={{ fill: "#94a3b8", fontSize: 12 }}
        />

        {/* TOOLTIP */}
        <Tooltip
          cursor={{ fill: "transparent" }}
          contentStyle={{
            backgroundColor: "#0f172a",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
          }}
        />

        {/* BARS */}
        <Bar
          dataKey="orders"
          fill="#6366f1"
          radius={[6, 6, 0, 0]}
          barSize={40}
        />

      </BarChart>
    </ResponsiveContainer>

  </div>
)}

      {/* STAFF LIST */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((s) => (
          <motion.div
            key={s.id}
            whileHover={{ scale: 1.03 }}
            className="bg-white rounded-xl shadow p-4"
          >
            <p className="font-semibold">{s.name}</p>
            <p className="text-sm text-slate-500">{s.role}</p>
          </motion.div>
        ))}
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