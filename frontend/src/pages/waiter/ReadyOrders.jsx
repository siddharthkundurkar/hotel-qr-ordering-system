import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import socket from "../../socket";
import {
  getReadyOrders,
  acceptOrder,
  serveItem,
  generateBill,
} from "../../api/waiter.services";
import { toast } from "react-hot-toast";
import { CheckCircle2 } from "lucide-react";
/* ================= SLA CONFIG ================= */

const READY_WARNING_SEC = 120;
const READY_LATE_SEC = 300;

function getOrderUrgency(readyAt, now) {
  if (!readyAt) return "normal";

  const diffSec = (now - new Date(readyAt).getTime()) / 1000;

  if (diffSec >= READY_LATE_SEC) return "late";
  if (diffSec >= READY_WARNING_SEC) return "warning";
  return "normal";
}

function formatReadyAgo(readyAt, now) {
  if (!readyAt) return "";

  const diffSec = Math.max(
    0,
    Math.floor((now - new Date(readyAt).getTime()) / 1000)
  );

  const m = Math.floor(diffSec / 60);
  const s = diffSec % 60;

  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ReadyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [servingItems, setServingItems] = useState(new Set());
  const [pickingOrders, setPickingOrders] = useState(new Set());
  const [billingOrders, setBillingOrders] = useState(new Set());

  const [now, setNow] = useState(Date.now());
  const [tab, setTab] = useState("ready");

  const joinedRef = useRef(false);

  const userId = useMemo(
    () => Number(localStorage.getItem("userId") || 0),
    []
  );

  const branchId = useMemo(
    () => Number(localStorage.getItem("branchId") || 0),
    []
  );

  /* ================= INITIAL FETCH ================= */

 const fetchOrders = useCallback(async () => {
  try {
    setLoading(true);

    const data = await getReadyOrders();
    const apiOrders = Array.isArray(data) ? data : [];

    setOrders((prev) => {
      const map = new Map();

      prev.forEach((o) => map.set(Number(o.id), o));

      apiOrders.forEach((o) => {
        const existing = map.get(Number(o.id));

        map.set(Number(o.id), {
          ...o,
          bill: existing?.bill || o.bill || null, // ✅ preserve bill
        });
      });

      return Array.from(map.values());
    });
  } catch {
    toast.error("Failed to load orders");
  } finally {
    setLoading(false);
  }
}, []);

  /* ================= INIT ================= */

  useEffect(() => {
    const joinRoom = () => {
      if (branchId && userId) {
        socket.emit("join:waiter", { branchId, waiterId: userId });
        joinedRef.current = true;
      }
    };

    fetchOrders();
    joinRoom();

    socket.on("connect", joinRoom);

    return () => socket.off("connect", joinRoom);
  }, [fetchOrders, branchId, userId]);

  /* ================= SOCKET EVENTS ================= */

  const updateOrderState = useCallback((payload) => {
    if (!payload?.orderId) return;

    setOrders((prev) => {
      const exists = prev.find(
        (o) => Number(o.id) === Number(payload.orderId)
      );
      if (!exists) return prev;

      if (payload.status === "served") {
        return prev.filter(
          (o) => Number(o.id) !== Number(payload.orderId)
        );
      }

      return prev.map((o) =>
        Number(o.id) === Number(payload.orderId)
          ? {
              ...o,
              status: payload.status ?? o.status,
              waiterId: payload.waiterId ?? o.waiterId,
            }
          : o
      );
    });
  }, []);

  const handleReady = useCallback((payload) => {
    setOrders((prev) => {
      if (prev.find((o) => Number(o.id) === Number(payload.orderId))) {
        return prev;
      }

      setTab("ready");

      return [
        {
          id: payload.orderId,
          status: "ready",
          tableNumber: payload.tableNumber,
          readyAt: payload.readyAt || new Date().toISOString(),
          items: [],
          readyItemsCount: 0,
        },
        ...prev,
      ];
    });
  }, []);

  const handleOrderStatus = useCallback(
    (data) => {
      updateOrderState(data);

      if (
        data.status === "out_for_delivery" &&
        Number(data.waiterId) === Number(userId)
      ) {
        setTab("mine");
      }
    },
    [userId, updateOrderState]
  );

  const handleItemUpdate = useCallback(({ orderId, itemId, remainingItems }) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (Number(order.id) !== Number(orderId)) return order;

        const remaining =
          order.items?.filter((i) => Number(i.id) !== Number(itemId)) || [];

        return {
  ...order,
  items: remaining,
  readyItemsCount: remainingItems ?? remaining.length,
};
      })
    );
  }, []);

  const handleBillRequested = useCallback(
    (data) => {
      if (!data?.orderId) return;

      if (Number(data.waiterId) === Number(userId)) {
        setTab("mine");
      }

      toast.success("Bill requested");
    },
    [userId]
  );

  useEffect(() => {
    socket.on("order:ready", handleReady);
    socket.on("order:status", handleOrderStatus);
    socket.on("order:item:update", handleItemUpdate);
    socket.on("order:bill_requested", handleBillRequested);

    return () => {
      socket.off("order:ready", handleReady);
      socket.off("order:status", handleOrderStatus);
      socket.off("order:item:update", handleItemUpdate);
      socket.off("order:bill_requested", handleBillRequested);
    };
  }, [
    handleReady,
    handleOrderStatus,
    handleItemUpdate,
    handleBillRequested,
  ]);

  /* ================= CLOCK ================= */

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  /* ================= FILTER ================= */

  const readyOrders = useMemo(
    () => orders.filter((o) => o.status === "ready"),
    [orders]
  );

  const myOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status === "out_for_delivery" &&
          Number(o.waiterId) === Number(userId)
      ),
    [orders, userId]
  );

  /* ================= ACTIONS ================= */

 const handlePick = async (orderId) => {
  if (pickingOrders.has(orderId)) return;

  try {
    setPickingOrders((prev) => {
      const next = new Set(prev);
      next.add(orderId);
      return next;
    });

    const res = await acceptOrder(orderId);

    toast.success(res?.message || "Order accepted");

    if (res?.status === "out_for_delivery") {
      setOrders((prev) =>
        prev.map((o) =>
          Number(o.id) === Number(orderId)
            ? { ...o, status: "out_for_delivery", waiterId: userId }
            : o
        )
      );

      setTab("mine");
    }

  } catch (err) {
    fetchOrders();
    toast.error(err?.response?.data?.message || "Accept failed");
  } finally {
    setPickingOrders((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
  }
};

 const handleServe = async (itemId) => {
  if (servingItems.has(itemId)) return;

  try {
    setServingItems((prev) => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });

    /* ✅ optimistic UI update */
    setOrders((prev) =>
      prev.map((order) => {
        if (!order.items?.some((i) => i.id === itemId)) return order;

        const remaining =
          order.items?.filter((i) => i.id !== itemId) || [];

        return {
          ...order,
          items: remaining,
          readyItemsCount: remaining.length,
          _optimisticEmpty: remaining.length === 0,
        };
      })
    );

    await serveItem(itemId);

  } catch (err) {
    fetchOrders(); // restore state if error
    toast.error(err?.response?.data?.message || "Serve failed");
  } finally {
    setServingItems((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  }
};

const handleGenerateBill = async (orderId) => {
  if (billingOrders.has(orderId)) return;

  try {
    setBillingOrders((prev) => new Set(prev).add(orderId));

    const data = await generateBill(orderId);

    toast.success(data?.message || "Bill generated");

    setOrders((prev) =>
      prev.map((o) =>
        Number(o.id) === Number(orderId)
          ? {
              ...o,
              bill: data,
            }
          : o
      )
    );

  } catch (err) {
    toast.error(err?.response?.data?.message || "Bill failed");
  } finally {
    setBillingOrders((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
  }
};
  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  /* ================= UI ================= */

  return (
   <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* ===== SEGMENT NAVBAR ===== */}
     <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b dark:border-slate-800 shadow-sm">
        <div className="max-w-3xl mx-auto p-2">
          <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setTab("ready")}
              className={`py-2.5 rounded-lg text-sm font-semibold transition
                ${
                  tab === "ready"
                    ? "bg-white shadow text-amber-700"
                    : "text-slate-500"
                }`}
            >
              Ready Orders
              {readyOrders.length > 0 && (
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white">
                  {readyOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setTab("mine")}
              className={`py-2.5 rounded-lg text-sm font-semibold transition
                ${
                  tab === "mine"
                    ? "bg-white shadow text-blue-700"
                    : "text-slate-500"
                }`}
            >
              My Orders
              {myOrders.length > 0 && (
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-blue-500 text-white">
                  {myOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="p-3 md:p-6 space-y-4 max-w-3xl mx-auto">
        {tab === "ready" &&
          (readyOrders.length === 0 ? (
            <Empty text="No ready orders" />
          ) : (
            readyOrders.map((order) => (
              <ReadyCard
                key={order.id}
                order={order}
                pickingOrders={pickingOrders}
                onPick={handlePick}
                now={now}
              />
            ))
          ))}

        {tab === "mine" &&
          (myOrders.length === 0 ? (
            <Empty text="No active orders" />
          ) : (
            myOrders.map((order) => (
              <ActiveCard
                key={order.id}
                order={order}
                servingItems={servingItems}
                billingOrders={billingOrders}
                onServe={handleServe}
                onGenerateBill={handleGenerateBill}
              />
            ))
          ))}
      </div>
    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */

function Empty({ text }) {
  return <div className="text-center py-10 text-slate-400 text-sm">{text}</div>;
}

/* ---------- READY CARD ---------- */

function ReadyCard({ order, pickingOrders, onPick, now }) {
  const urgency = getOrderUrgency(order.readyAt, now);
  const readyAgo = formatReadyAgo(order.readyAt, now);

  const glowClass =
    urgency === "late"
      ? "ring-2 ring-red-400 shadow-[0_0_20px_rgba(248,113,113,0.45)] animate-pulse"
      : urgency === "warning"
        ? "ring-2 ring-amber-300"
        : "border border-amber-200";

  const isPicking = pickingOrders.has(order.id);

  return (
   <div
  className={`bg-white dark:bg-slate-900 rounded-2xl ${glowClass}
  hover:shadow-lg transition-all duration-200 p-4 flex items-center justify-between
  border dark:border-slate-800`}
>
      <div>
        <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
          Table {order.tableNumber}
        </p>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Order #{order.id}</p>

        {order.readyAt && (
          <p className="text-[11px] text-slate-500 mt-1">
            ⏱ Ready {readyAgo} ago
          </p>
        )}
      </div>

      <button
        disabled={isPicking}
        onClick={() => onPick(order.id)}
        className="min-w-[110px] px-5 py-3 rounded-xl text-white font-semibold bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-60 transition"
      >
        {isPicking ? "Accepting…" : "Accept"}
      </button>
    </div>
  );
}

/* ---------- ACTIVE CARD ---------- */

function ActiveCard({
  order,
  servingItems,
  billingOrders,
  onServe,
  onGenerateBill,
}) {
  const isFinishing = order._optimisticEmpty;
  const allServed = (order.items?.length || 0) === 0;
  const isBilling = billingOrders?.has(order.id);

  return (
  <div
    className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-blue-100 dark:border-slate-800 p-4 space-y-4 hover:shadow-md transition-all duration-300 ${
      isFinishing ? "opacity-50 scale-95" : "opacity-100 scale-100"
    }`}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
          Table {order.tableNumber}
        </p>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Order #{order.id}
        </p>
      </div>

      <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
        SERVING
      </span>
    </div>

    <div className="space-y-2">
      {allServed && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-2">
          All items served…
        </p>
      )}

      {order.items?.map((item) => {
        const isServing = servingItems.has(item.id);

        return (
          <div
            key={item.id}
            className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700"
          >
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                {item.name}
              </p>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Qty: {item.qty}
              </p>
            </div>

            <button
              disabled={isServing}
              onClick={() => onServe(item.id)}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-60 transition"
            >
              <CheckCircle2 size={16} />
              {isServing ? "Serving…" : "Serve"}
            </button>
          </div>
        );
      })}
    </div>

    {/* 🧾 GENERATE BILL BUTTON */}
    {order.bill ? (
      <div className="text-center py-3 text-green-600 dark:text-green-400 font-semibold text-sm">
        Bill Generated
      </div>
    ) : (
      <button
        disabled={isBilling}
        onClick={() => onGenerateBill(order.id)}
        className="w-full mt-2 px-4 py-3 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 disabled:opacity-60 transition"
      >
        {isBilling ? "Generating Bill…" : "Generate Bill"}
      </button>
    )}
  </div>
);
}
