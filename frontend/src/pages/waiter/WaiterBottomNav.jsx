import { CheckCircle2, ClipboardList } from "lucide-react";

export default function WaiterBottomNav({
  tab,
  setTab,
  readyCount = 0,
}) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40">
      {/* 🔥 glass background */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t dark:border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <div
          className="
            grid grid-cols-2
            pb-[calc(env(safe-area-inset-bottom)+12px)]
            pt-1
          "
        >
          <NavItem
            active={tab === "READY"}
            label="Ready"
            icon={<CheckCircle2 size={20} />}
            badge={readyCount}
            color="green"
            onClick={() => setTab("READY")}
          />

          <NavItem
            active={tab === "MY"}
            label="My Orders"
            icon={<ClipboardList size={20} />}
            color="blue"
            onClick={() => setTab("MY")}
          />
        </div>
      </div>
    </div>
  );
}

/* ===============================
   NAV ITEM — PRODUCTION SAFE
=============================== */
function NavItem({ active, label, icon, onClick, color, badge = 0 }) {
  const activeColor = {
    green: "text-emerald-600 dark:text-emerald-400",
    blue: "text-blue-600 dark:text-blue-400",
  }[color];

  const activeBg = {
    green: "bg-emerald-50 dark:bg-emerald-950/40",
    blue: "bg-blue-50 dark:bg-blue-950/40",
  }[color];

  const indicatorColor = {
    green: "bg-emerald-500",
    blue: "bg-blue-500",
  }[color];

  return (
    <button
      onClick={onClick}
      role="tab"
      aria-label={label}
      aria-selected={active}
      className={`
        relative flex flex-col items-center justify-center
        gap-1 py-3 text-xs font-semibold
        transition-all duration-200
        active:scale-[0.96]
        select-none
        focus:outline-none

        ${
          active
            ? `${activeColor} ${activeBg}`
            : "text-slate-400 dark:text-slate-500 hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
        }
      `}
    >
      {/* ⭐ ACTIVE TOP INDICATOR */}
      <div
        className={`
          absolute top-0 left-6 right-6 h-[3px] rounded-full
          transition-all duration-300
          ${active ? indicatorColor : "bg-transparent"}
        `}
      />

      {/* ICON */}
      <div className="relative">
        {icon}

        {/* 🔥 BADGE */}
        {badge > 0 && (
          <span
            className="
              absolute -top-2 -right-3
              min-w-[18px] h-[18px] px-1
              rounded-full
              bg-red-500 text-white
              text-[10px] font-bold
              flex items-center justify-center
              shadow-md
              animate-[badgePop_0.25s_ease]
            "
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>

      {/* LABEL */}
      <span className="tracking-wide">{label}</span>
    </button>
  );
}