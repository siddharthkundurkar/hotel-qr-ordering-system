import { useEffect, useMemo, useState } from "react";
import {
  getServedOrders,
  getPaidOrders,
} from "../../api/cashier.services";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#22c55e", "#3b82f6", "#0f172a"];

export default function CashierDashboard() {
  const [paidOrders, setPaidOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= FILTERS ================= */

  const [filters, setFilters] = useState({
    date: "today",        // today | week | month | year
    paymentMethod: "all", // all | cash | upi | card
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const paid = await getPaidOrders();
      setPaidOrders(Array.isArray(paid) ? paid : []);
    } catch (err) {
      console.error("Dashboard load failed", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= DATE HELPERS ================= */

  const isWithinRange = (date) => {
    const now = new Date();

    if (filters.date === "today") {
      return date.toDateString() === now.toDateString();
    }

    if (filters.date === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      return date >= start;
    }

    if (filters.date === "month") {
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }

    if (filters.date === "year") {
      return date.getFullYear() === now.getFullYear();
    }

    return true;
  };

  /* ================= FILTERED PAID ORDERS ================= */

  const filteredPaidOrders = useMemo(() => {
    return paidOrders.filter(o => {
      const d = new Date(o.paidAt);

      if (!isWithinRange(d)) return false;

      if (
        filters.paymentMethod !== "all" &&
        o.paymentMethod !== filters.paymentMethod
      ) {
        return false;
      }

      return true;
    });
  }, [paidOrders, filters]);

  /* ================= KPI ================= */

  const totalRevenue = filteredPaidOrders.reduce(
    (s, o) => s + Number(o.totalAmount || 0),
    0
  );

  const totalBills = filteredPaidOrders.length;

  /* ================= CHART DATA ================= */

  // Revenue over time
  const revenueByDate = Object.values(
    filteredPaidOrders.reduce((acc, o) => {
      const key = new Date(o.paidAt).toLocaleDateString();
      acc[key] = acc[key] || { date: key, revenue: 0, bills: 0 };
      acc[key].revenue += Number(o.totalAmount);
      acc[key].bills += 1;
      return acc;
    }, {})
  );

  // Payment distribution
  const paymentData = ["cash", "upi", "card"].map(method => ({
    name: method.toUpperCase(),
    value: filteredPaidOrders
      .filter(o => o.paymentMethod === method)
      .reduce((s, o) => s + Number(o.totalAmount), 0),
  }));

  /* ================= UI ================= */

  if (loading) {
    return <div className="text-slate-500">Loading dashboard…</div>;
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Cashier Analytics</h1>
        <p className="text-sm text-slate-500">
          Revenue & billing insights
        </p>
      </div>

      {/* FILTERS */}
      <div className="bg-white border rounded-xl p-4 flex gap-4 flex-wrap">
        <select
          value={filters.date}
          onChange={(e) =>
            setFilters(f => ({ ...f, date: e.target.value }))
          }
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>

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

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Total Revenue" value={`₹${totalRevenue}`} />
        <StatCard title="Total Bills" value={totalBills} />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <ChartCard title="Revenue Trend">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueByDate}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Payment Distribution */}
        <ChartCard title="Payment Method Share">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={paymentData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
              >
                {paymentData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Bills Trend */}
      <ChartCard title="Bills Count Trend">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={revenueByDate}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="bills"
              stroke="#3b82f6"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

/* ================= UI HELPERS ================= */

function StatCard({ title, value }) {
  return (
    <div className="bg-white border rounded-xl p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white border rounded-xl p-5">
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}
