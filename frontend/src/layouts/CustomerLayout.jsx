import { Outlet, NavLink, useParams } from "react-router-dom";
import { Utensils, ClipboardList } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

export default function CustomerLayout() {
  const { token } = useParams();

  /* ===============================
     🔥 BULLETPROOF SESSION
  ================================ */
  const sessionToken = useMemo(() => {
    if (!token) return null;
    try {
      return localStorage.getItem(`tableSession:${token}`);
    } catch {
      return null;
    }
  }, [token]);

  /* ===============================
     🔴 LIVE ORDER DOT STATE
  ================================ */
  const [hasActiveOrder, setHasActiveOrder] = useState(false);

  /* =================================================
     🔥 REHYDRATE ACTIVE ORDER (REFRESH SAFE)
  ================================================= */
  useEffect(() => {
    try {
      const flag = sessionStorage.getItem("hasActiveOrder");
      setHasActiveOrder(flag === "1");
    } catch {
      setHasActiveOrder(false);
    }
  }, []);

  /* =================================================
     🔥 PERSIST WHEN CHANGED
  ================================================= */
  useEffect(() => {
    try {
      sessionStorage.setItem("hasActiveOrder", hasActiveOrder ? "1" : "0");
    } catch {}
  }, [hasActiveOrder]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-30 px-3 pt-3">
        <div
          className="
          max-w-md mx-auto
          bg-white/90 backdrop-blur-xl
          border border-slate-200
          shadow-[0_8px_30px_rgba(0,0,0,0.08)]
          rounded-2xl
          px-4 py-3
          flex items-center justify-between
        "
        >
          {/* LEFT */}
          <div className="flex items-center gap-2">
            <div className="text-lg">🍽️</div>
            <div className="leading-tight">
              <h1 className="text-sm font-bold text-slate-800">
                Restaurant
              </h1>
              <p className="text-[10px] text-slate-500">
                Live ordering
              </p>
            </div>
          </div>

          {/* RIGHT STATUS DOT */}
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </header>

      {/* ================= CONTENT ================= */}
      <main className="flex-1 overflow-y-auto pb-28">
        <Outlet context={{ sessionToken, setHasActiveOrder }} />
      </main>

      {/* ================= FLOATING NAV ================= */}
      <nav className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
        <div className="max-w-md mx-auto px-3 pb-[max(env(safe-area-inset-bottom),10px)]">
          <div
            className="
            pointer-events-auto
            bg-white/90 backdrop-blur-xl
            border border-slate-200
            shadow-[0_10px_40px_rgba(0,0,0,0.12)]
            rounded-2xl
            flex justify-around
            py-2
          "
          >
            <PremiumNavItem
              to={token ? `/scan/${token}/menu` : "#"}
              icon={Utensils}
              label="Menu"
              disabled={!sessionToken}
            />

            <PremiumNavItem
              to={token ? `/scan/${token}/live-order` : "#"}
              icon={ClipboardList}
              label="My Order"
              disabled={!sessionToken}
              showDot={hasActiveOrder}
            />
          </div>
        </div>
      </nav>
    </div>
  );
}

/* ================= PREMIUM NAV ITEM ================= */

function PremiumNavItem({
  to,
  icon: Icon,
  label,
  disabled,
  showDot = false,
}) {
  return (
    <NavLink to={disabled ? "#" : to} end>
      {({ isActive }) => (
        <div
          className={`
            relative flex flex-col items-center justify-center
            min-w-[92px] py-2 px-3
            text-[11px] font-semibold
            rounded-xl
            transition-all duration-200
            select-none active:scale-95

            ${
              disabled
                ? "text-slate-300 pointer-events-none"
                : isActive
                ? "text-emerald-600"
                : "text-slate-400 hover:text-slate-600"
            }
          `}
        >
          {/* ⭐ ACTIVE BACKGROUND */}
          <div
            className={`
              absolute inset-0 rounded-xl
              transition-all duration-300
              ${
                isActive
                  ? "bg-emerald-50 opacity-100 scale-100"
                  : "opacity-0 scale-90"
              }
            `}
          />

          {/* ICON */}
          <div className="relative z-10">
            <Icon size={22} strokeWidth={2} />

            {/* 🔴 LIVE ORDER DOT */}
            {showDot && !isActive && (
              <span
                className="
                absolute -top-1 -right-1
                h-2.5 w-2.5
                rounded-full
                bg-red-500
                animate-pulse
                shadow-[0_0_8px_rgba(239,68,68,0.8)]
              "
              />
            )}
          </div>

          {/* LABEL */}
          <span className="relative z-10 mt-1 tracking-wide">
            {label}
          </span>
        </div>
      )}
    </NavLink>
  );
}