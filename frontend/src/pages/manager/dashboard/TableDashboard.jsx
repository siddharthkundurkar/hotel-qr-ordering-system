import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  getTableOccupancy,
  getTableAnalytics,
} from "../../../api/dashboardservice";

const RANGES = ["day", "week", "month", "year"];

export default function TableDashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState("week");
  const [tables, setTables] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [occupancy, setOccupancy] = useState({
    total: 0,
    occupied: 0,
    available: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [range]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [occRes, analyticsRes] = await Promise.all([
        getTableOccupancy(),
        getTableAnalytics(range),
      ]);

      setOccupancy({
        total: occRes.total ?? 0,
        occupied: occRes.occupied ?? 0,
        available: occRes.available ?? 0,
      });

      setTables(occRes.tables || []);
      setAnalytics(analyticsRes);
    } catch (err) {
      console.error("Table dashboard error", err);
    } finally {
      setLoading(false);
    }
  };

  const occupancyPercent =
    occupancy.total > 0
      ? Math.round((occupancy.occupied / occupancy.total) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
        >
          <ArrowLeft size={18} />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Table Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Occupancy & usage analytics
          </p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="Total Tables" value={occupancy.total} />
        <KpiCard title="Occupied" value={occupancy.occupied} />
        <KpiCard title="Available" value={occupancy.available} />
        <KpiCard title="Occupancy %" value={`${occupancyPercent}%`} />
      </div>

      {/* RANGE FILTER */}
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

      {/* GRAPHS */}
      {!loading && analytics && (
        <div className="grid lg:grid-cols-2 gap-6">

          {/* LINE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5 h-80">
            <h3 className="font-semibold mb-3 text-slate-900 dark:text-white">
              Occupancy Trend
            </h3>

            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.occupancyTrend}>
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line
                  dataKey="occupied"
                  stroke="#6366f1"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* BAR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5 h-80">
            <h3 className="font-semibold mb-3 text-slate-900 dark:text-white">
              Free vs Occupied
            </h3>

            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.occupancyTrend}>
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="occupied" fill="#6366f1" />
                <Bar dataKey="free" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}

      {/* TABLE GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((t) => (
          <motion.div
            key={t.id}
            whileHover={{ scale: 1.03 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4"
          >
            <p className="font-semibold text-slate-900 dark:text-white">
              Table {t.number}
            </p>

            <p
              className={`text-sm mt-1 ${
                t.status === "occupied"
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {t.status}
            </p>
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