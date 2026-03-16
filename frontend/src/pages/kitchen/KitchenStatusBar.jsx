import { useMemo } from "react";

export default function KitchenStatsBar({ orders = [] }) {
  const stats = useMemo(() => {
    let pending = 0;
    let accepted = 0;
    let preparing = 0;
    let ready = 0;
    let delayed = 0;
    let priority = 0;

    for (const o of orders) {
      if (o.status === "pending") pending++;
      if (o.status === "accepted") accepted++;
      if (o.status === "preparing") preparing++;
      if (o.status === "ready") ready++;
      if (o.isDelayed) delayed++;
      if (o.hasPriority) priority++;
    }

    const active = pending + accepted + preparing + ready;

    return {
      active,
      pending,
      accepted,
      preparing,
      ready,
      delayed,
      priority,
    };
  }, [orders]);

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="px-6 py-3 flex flex-wrap gap-3">
        <Stat label="Active" value={stats.active} />
        <Stat label="Pending" value={stats.pending} danger />
        <Stat label="Accepted" value={stats.accepted} warn />
        <Stat label="Preparing" value={stats.preparing} warn />
        <Stat label="Ready" value={stats.ready} good />
        <Stat label="Delayed" value={stats.delayed} danger />
        <Stat label="Priority" value={stats.priority} danger />
      </div>
    </div>
  );
}

/* 🧩 Pill */
function Stat({ label, value, danger, warn, good }) {
  let style = "bg-slate-100 text-slate-700";

  if (danger) style = "bg-red-100 text-red-700";
  else if (warn) style = "bg-orange-100 text-orange-700";
  else if (good) style = "bg-emerald-100 text-emerald-700";

  return (
    <div
      className={`px-3 py-1.5 rounded-full text-xs font-bold ${style}`}
    >
      {label}: {value}
    </div>
  );
}