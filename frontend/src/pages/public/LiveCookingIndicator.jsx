/* =================================================
   🍳 LIVE COOKING INDICATOR
================================================= */

export function LiveCookingIndicator({ status }) {
  const normalized = String(status || "")
    .toLowerCase()
    .trim();

  const map = {
    pending: {
      label: "Order received",
      color: "bg-gray-400",
      anim: "animate-pulse",
    },
    accepted: {
      label: "Chef preparing",
      color: "bg-blue-500",
      anim: "animate-pulse",
    },
    preparing: {
      label: "Cooking in progress",
      color: "bg-orange-500",
      anim: "animate-pulse",
      fire: true,
    },
    ready: {
      label: "Ready to serve",
      color: "bg-indigo-500",
      anim: "animate-pulse",
    },
    out_for_delivery: {
      label: "On the way",
      color: "bg-purple-500",
      anim: "animate-pulse",
      truck: true,
    },
    served: {
      label: "Meal served 🍽️",
      color: "bg-emerald-500",
      anim: "",
      plate: true,
    },
  };

  const meta = map[normalized] || map.pending;

  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
      {/* 🔵 animated dot */}
      <div className="relative shrink-0">
        <span
          className={`block h-3 w-3 rounded-full ${meta.color} ${meta.anim}`}
        />

        {/* 🔥 cooking flame */}
        {meta.fire && (
          <span className="absolute -top-2 -right-2 text-[10px] animate-pulse">
            🔥
          </span>
        )}

        {/* 🚚 delivery */}
        {meta.truck && (
          <span className="absolute -top-2 -right-3 text-[10px] animate-bounce">
            🚚
          </span>
        )}

        {/* 🍽 served */}
        {meta.plate && (
          <span className="absolute -top-2 -right-3 text-[10px]">
            🍽️
          </span>
        )}
      </div>

      {/* 📝 label */}
      <div className="text-sm font-semibold text-slate-700">
        {meta.label}
      </div>
    </div>
  );
}

/* =================================================
   👨‍🍳 CHEF COOKING ANIMATION
================================================= */

export function ChefCookingAnimation({ status }) {
  const normalized = String(status || "").toLowerCase().trim();

  if (normalized === "served") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <div className="text-4xl animate-bounce mb-2">🍽️</div>
        <p className="font-semibold text-emerald-700">
          Your meal has been served!
        </p>
        <p className="text-xs text-emerald-600 mt-1">
          Enjoy your food
        </p>
      </div>
    );
  }

  if (!["accepted", "preparing"].includes(normalized)) return null;

  return (
    <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-5">
      <div className="flex items-center gap-4">

        <div className="relative shrink-0">
          <div className="text-4xl animate-bounce">👨‍🍳</div>
          <span className="absolute -bottom-1 left-6 text-sm animate-pulse">
            🔥
          </span>
        </div>

        <div className="flex-1">
          <div className="h-2 bg-slate-300 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 animate-cookBar rounded-full"/>
          </div>

          <p className="text-sm font-semibold text-orange-700 mt-2">
            Chef is preparing your food…
          </p>
        </div>

      </div>
    </div>
  );
}