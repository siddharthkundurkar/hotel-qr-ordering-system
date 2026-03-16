import { useEffect, useState } from "react";
import { ClipboardList, History, CheckCircle } from "lucide-react";
import { getWaiterDashboard } from "../../api/waiter.services";

export default function WaiterDashboard() {

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const load = async () => {
      try {

        const data = await getWaiterDashboard();
        setStats(data);

      } catch (err) {
        console.error("Dashboard error", err);
      } finally {
        setLoading(false);
      }
    };

    load();

  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-2">
        {[1,2,3,4].map(i => (
          <div
            key={i}
            className="h-28 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

      <StatCard
        title="Ready Orders"
        value={stats?.readyOrders || 0}
        icon={<ClipboardList size={20}/>}
        color="amber"
      />

      <StatCard
        title="My Active Orders"
        value={stats?.myOrders || 0}
        icon={<CheckCircle size={20}/>}
        color="blue"
      />

      <StatCard
        title="Served Today"
        value={stats?.servedToday || 0}
        icon={<History size={20}/>}
        color="green"
      />

      <StatCard
        title="My Served"
        value={stats?.myServed || 0}
        icon={<History size={20}/>}
        color="purple"
      />

    </div>
  );
}

/* ================= STAT CARD ================= */

function StatCard({ title, value, icon, color }) {

  const colors = {
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    green: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition">

      <div className="flex justify-between items-center">

        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-100">
            {value}
          </p>
        </div>

        <div className={`p-3 rounded-lg ${colors[color]}`}>
          {icon}
        </div>

      </div>

    </div>
  );
}