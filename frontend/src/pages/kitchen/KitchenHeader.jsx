import { Wifi, WifiOff, Volume2, VolumeX } from "lucide-react";
import { useMemo } from "react";

export default function KitchenHeader({
  orders = [],
  isConnected = true,
  soundEnabled = true,
  onToggleSound,
  onLogout,
  lastUpdated,
}) {
  /* =================================================
     🧠 LIVE STATS (cheap + memoized)
  ================================================= */
  const stats = useMemo(() => {
    let active = 0;
    let delayed = 0;
    let priority = 0;

    for (const o of orders) {
      active++;

      if (o.isDelayed) delayed++;

      if (o.hasPriority) priority++;
    }

    return { active, delayed, priority };
  }, [orders]);

  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="px-6 py-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        {/* ================= LEFT ================= */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            🍳 Kitchen Operations
          </h1>

          <p className="text-sm text-slate-500">
            Live kitchen workflow monitor
          </p>
        </div>

        {/* ================= CENTER STATS ================= */}
        <div className="flex flex-wrap gap-3">
          <StatPill label="Active" value={stats.active} />
          <StatPill
            label="Delayed"
            value={stats.delayed}
            danger={stats.delayed > 0}
          />
          <StatPill
            label="Priority"
            value={stats.priority}
            warn={stats.priority > 0}
          />
        </div>

        {/* ================= RIGHT CONTROLS ================= */}
        <div className="flex items-center gap-3">
          {/* 🔌 Connection */}
          <div className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border bg-slate-50">
            {isConnected ? (
              <>
                <Wifi size={14} className="text-emerald-600" />
                <span className="text-emerald-700">Live</span>
              </>
            ) : (
              <>
                <WifiOff size={14} className="text-red-600" />
                <span className="text-red-700">Offline</span>
              </>
            )}
          </div>

          {/* 🔊 Sound toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-lg border bg-white hover:bg-slate-50 transition"
            title="Toggle sound"
          >
            {soundEnabled ? (
              <Volume2 size={18} />
            ) : (
              <VolumeX size={18} />
            )}
          </button>

          {/* 🕒 Last updated */}
          <div className="hidden sm:block text-xs text-slate-400">
            Updated:{" "}
            {lastUpdated
              ? new Date(lastUpdated).toLocaleTimeString()
              : "--"}
          </div>

          {/* 🔐 Logout */}
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

/* =================================================
   🧩 Stat Pill
================================================= */
function StatPill({ label, value, danger, warn }) {
  let style = "bg-slate-100 text-slate-700";

  if (danger) style = "bg-red-100 text-red-700";
  else if (warn) style = "bg-orange-100 text-orange-700";

  return (
    <div
      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${style}`}
    >
      {label}: {value}
    </div>
  );
}