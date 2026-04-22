import { useEffect, useState, useRef, useCallback } from "react";

import socket from "../../socket";
import { getCurrentCustomerOrder } from "../../api/customer.services";
import { useParams, useOutletContext } from "react-router-dom";
import {
  LiveCookingIndicator,
  ChefCookingAnimation,
} from "./LiveCookingIndicator";

const STORAGE_KEY = "customer:lastLiveOrder";

export default function CustomerLiveOrder() {
  const outlet = useOutletContext?.() || {};
const { token } = useParams();

const sessionToken =
  outlet.sessionToken ||
  localStorage.getItem(`tableSession:${token}`);
  const setHasActiveOrder = outlet?.setHasActiveOrder;

  const orderIdRef = useRef(null);

  /* ================= STATE ================= */

  const [order, setOrder] = useState(() => {
    try {
      const cached = sessionStorage.getItem(STORAGE_KEY);
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      orderIdRef.current = parsed?.id || null;

      return parsed;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(!order);
  const [hydrated, setHydrated] = useState(false);

  /* ================= REFS ================= */

  const aliveRef = useRef(false);
  const pollingRef = useRef(null);
  const joinedOrderRef = useRef(null);
  const audioRef = useRef(null);
  const visibilityRef = useRef(document.visibilityState);

  /* ================= SOUND ================= */

  useEffect(() => {
    const audio = new Audio("/sounds/order-ready.mp3");
    audio.volume = 0.9;
    audioRef.current = audio;
  }, []);

  /* ================= FETCH ================= */

const fetchOrder = useCallback(
  async (silent = false) => {
    try {
      if (!sessionToken) return;

      if (!silent) setLoading(true);

      const res = await getCurrentCustomerOrder(sessionToken);

      if (!aliveRef.current) return;

      const newOrder = res?.data?.order || null;

      /* ===============================
         🛡️ PREVENT ORDER DISAPPEARING
      =============================== */

      if (newOrder) {
        setOrder(newOrder);
        orderIdRef.current = newOrder.id;

        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
        } catch {}

        setHasActiveOrder?.(true);

        /* ===============================
           JOIN SOCKET ROOM
        =============================== */

        if (
          socket.connected &&
          joinedOrderRef.current !== newOrder.id
        ) {
          socket.emit("join:order", Number(newOrder.id));
          joinedOrderRef.current = newOrder.id;
        }

      } else {
        /* ===============================
           KEEP EXISTING ORDER (important)
        =============================== */

        if (!orderIdRef.current) {
          setHasActiveOrder?.(false);
        }
      }

    } catch (e) {
      const status = e?.response?.status;

      if (status === 403) {
        console.warn("🔁 Session/device mismatch. Resetting session.");

        Object.keys(localStorage)
          .filter((k) => k.startsWith("tableSession:"))
          .forEach((k) => localStorage.removeItem(k));

        sessionStorage.removeItem(STORAGE_KEY);

        window.location.reload();
        return;
      }

      console.error("LIVE ORDER ERROR:", e?.response?.data || e.message);
    } finally {
      if (!silent && aliveRef.current) setLoading(false);
    }
  },
  [sessionToken, setHasActiveOrder]
);
  /* ================= INIT ================= */

  useEffect(() => {
    aliveRef.current = true;

    if (sessionToken === undefined) return;

    setHydrated(true);

    // ❌ DO NOT delete cached order here
    if (!sessionToken) {
      setLoading(false);
      return;
    }

    fetchOrder();

    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(() => {
      if (visibilityRef.current === "hidden") return;

      if (
  orderIdRef.current &&
 ["served", "bill_generated", "paid"].includes(order?.status)
) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        return;
      }

      fetchOrder(true);
    }, 45000);

    return () => {
      aliveRef.current = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [sessionToken, fetchOrder, order?.status]);

  /* ================= VISIBILITY ================= */

  useEffect(() => {
    const handleVisibility = () => {
      visibilityRef.current = document.visibilityState;

      if (document.visibilityState === "visible") {
        fetchOrder(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchOrder]);

  /* ================= SOCKET ================= */
useEffect(() => {
  if (!sessionToken) return;

if (socket.connected && orderIdRef.current) {
 socket.emit("join:order", Number(orderIdRef.current));
}
const handleStatus = (data) => {
  if (!aliveRef.current) return;
  if (!data?.orderId) return;
  if (Number(data.orderId) !== Number(orderIdRef.current)) return;

  setOrder((prev) => {
    if (!prev) {
  return { id: data.orderId, status: data.status };
}

    const next = { ...prev, status: data.status };

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}

    if (data.status === "ready") {
      audioRef.current?.play().catch(() => {});
      navigator.vibrate?.([120, 60, 120]);
    }

    if (data.status === "served") {
      navigator.vibrate?.(200);
    }

    return next;
  });

  setTimeout(() => fetchOrder(true), 500);
};

  const handleItemStatus = (data) => {
  if (!data?.itemId) return;

  setOrder((prev) => {
    if (!prev || !prev.items) return prev;

    const updatedItems = prev.items.map((item) =>
      Number(item.id) === Number(data.itemId)
        ? { ...item, status: data.status }
        : item
    );

    const next = { ...prev, items: updatedItems };

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}

    return next;
  });
};

  const handleReconnect = () => {
    if (orderIdRef.current && socket.connected) {
    socket.emit("join:order", Number(orderIdRef.current));
    }
  };

  socket.off("order:status", handleStatus);
socket.off("order:item:update", handleItemStatus);
socket.off("connect", handleReconnect);

socket.on("order:status", handleStatus);
socket.on("order:item:update", handleItemStatus);
socket.on("connect", handleReconnect);

  return () => {
    socket.off("order:status", handleStatus);
    socket.off("order:item:update", handleItemStatus);
    socket.off("connect", handleReconnect);
  };
}, [sessionToken, fetchOrder]);

  /* ================= HYDRATION ================= */

  if (!hydrated) {
    return (
      <div className="p-10 text-center text-slate-500">
        Restoring your session…
      </div>
    );
  }

  /* ================= LOADING ================= */

  if (loading && !order && sessionToken) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-3xl" />
        <div className="h-24 bg-slate-200 rounded-2xl" />
        <div className="h-24 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  /* ================= EMPTY ================= */

 if (!order && !loading) {
    return (
      <div className="p-10 text-center">
        <div className="text-slate-400 text-lg mb-2">
          No active order
        </div>
        <div className="text-sm text-slate-500">
          Place an order to track it here
        </div>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <div className="bg-white rounded-3xl shadow-lg p-6 border space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">
            🍽️ Live Order
          </h2>
          <StatusBadge status={order.status} />
        </div>

        <div className="space-y-2">
          <Row label="Order #" value={`#${order.id}`} />
          <Row label="Table" value={order.tableNumber} />
          <Row label="Waiter" value={order.waiterName || "Assigning waiter…"} />
        </div>

       <LiveCookingIndicator status={order?.status?.toLowerCase()} />
<ChefCookingAnimation status={order?.status?.toLowerCase()} />
        <OrderProgress status={order.status} />
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-5 border">
        <h3 className="font-semibold mb-3">Order Items</h3>
        <div className="space-y-3">
          {order.items?.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
function StatusBadge({ status }) {
  const styles = {
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-blue-100 text-blue-700",
    preparing: "bg-orange-100 text-orange-700",
    ready: "bg-emerald-100 text-emerald-700",
    served: "bg-green-100 text-green-700",
    bill_generated: "bg-purple-100 text-purple-700",
    paid: "bg-slate-200 text-slate-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
        styles[status] || "bg-slate-200 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}
function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}

function ItemRow({ item }) {
  return (
    <div className="flex justify-between items-center border-b pb-2 text-sm">
      <span className="text-slate-700">
        {item.name} × {item.qty}
      </span>

      <StatusBadge status={item.status} />
    </div>
  );
}

function OrderProgress({ status }) {
  const steps = [
    "pending",
    "accepted",
    "preparing",
    "ready",
    "out_for_delivery",
    "served",
  ];

  const currentIndex = steps.indexOf(status);

  return (
    <div className="flex justify-between text-xs mt-3">
      {steps.map((step, index) => (
        <div
          key={step}
          className={`flex-1 text-center ${
            index <= currentIndex
              ? "text-emerald-600 font-medium"
              : "text-slate-400"
          }`}
        >
          {step.replaceAll("_", " ")}
        </div>
      ))}
    </div>
  );
}