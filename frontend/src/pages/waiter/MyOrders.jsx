import { useEffect, useRef, useState, useCallback } from "react";
import socket from "../../socket";
import { getMyServedOrders } from "../../api/waiter.services";
import { toast } from "react-hot-toast";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const aliveRef = useRef(false);
  const joinedRef = useRef(false);
  const errorShownRef = useRef(false);
  const seenEventsRef = useRef(new Set());

  const waiterIdRef = useRef(
    Number(localStorage.getItem("userId") || 0)
  );

  const branchIdRef = useRef(
    Number(localStorage.getItem("branchId") || 0)
  );

  /* ================= SAFE SORT ================= */

  const sortOrders = (list) =>
    [...list].sort((a, b) => {
      const ta = new Date(a?.paidAt || a?.servedAt || 0).getTime();
      const tb = new Date(b?.paidAt || b?.servedAt || 0).getTime();
      return tb - ta;
    });

  /* ================= UPSERT ================= */

  const upsertOrder = useCallback((prev, incoming) => {
    const index = prev.findIndex((o) => o.id === incoming.id);

    if (index >= 0) {
      const next = [...prev];
      next[index] = { ...next[index], ...incoming };
      return sortOrders(next);
    }

    return sortOrders([incoming, ...prev]);
  }, []);

  /* ================= INITIAL FETCH ================= */

  const fetchInitial = useCallback(async () => {
    try {
      seenEventsRef.current.clear();

      const data = await getMyServedOrders();

      if (!aliveRef.current) return;

      const safe = Array.isArray(data) ? data : [];

      setOrders((prev) => {
        const map = new Map();

        prev.forEach((o) => map.set(o.id, o));
        safe.forEach((o) => map.set(o.id, { ...map.get(o.id), ...o }));

        return sortOrders(Array.from(map.values()));
      });

      errorShownRef.current = false;
    } catch {
      if (!errorShownRef.current) {
        toast.error("Failed to load order history");
        errorShownRef.current = true;
      }
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, []);

  /* ================= SOCKET + INIT ================= */

  useEffect(() => {
    aliveRef.current = true;

    const joinRoom = () => {
      const branchId = branchIdRef.current;
      const waiterId = waiterIdRef.current;

      if (branchId && waiterId) {
        socket.emit("join:waiter", { branchId, waiterId });
        joinedRef.current = true;
      }
    };

    fetchInitial();
    joinRoom();

    socket.on("connect", joinRoom);

    /* 🔔 ORDER SERVED */

    const handleServed = (data) => {
      if (!aliveRef.current) return;

      if (Number(data.waiterId) !== waiterIdRef.current) return;

      const key = `served-${data.orderId}-${data.servedAt}`;

      if (seenEventsRef.current.has(key)) return;

      seenEventsRef.current.add(key);

      setOrders((prev) =>
        upsertOrder(prev, {
          id: data.orderId,
          tableNumber: data.tableNumber ?? "-",
          status: "served",
          servedAt: data.servedAt || new Date().toISOString(),
          paidAt: null,
        })
      );
    };

    /* 💰 ORDER PAID */

    const handlePaid = (data) => {
      if (!aliveRef.current) return;

      const key = `paid-${data.orderId}-${data.paidAt}`;

      if (seenEventsRef.current.has(key)) return;

      seenEventsRef.current.add(key);

      setOrders((prev) =>
        upsertOrder(prev, {
          id: data.orderId,
          status: "paid",
          paidAt: data.paidAt || new Date().toISOString(),
        })
      );
    };

    socket.on("order:served", handleServed);
    socket.on("order:paid", handlePaid);

    return () => {
      aliveRef.current = false;

      socket.off("connect", joinRoom);
      socket.off("order:served", handleServed);
      socket.off("order:paid", handlePaid);
    };
  }, [fetchInitial, upsertOrder]);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  /* ================= EMPTY ================= */

  if (orders.length === 0) {
    return (
      <div className="p-10 text-center">
        <div className="text-4xl mb-2">📭</div>
        <p className="text-slate-500 font-medium">
          No completed orders yet
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Served orders will appear here
        </p>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="p-4 space-y-3">
      {orders.map((o) => (
        <OrderCard key={o.id} order={o} />
      ))}
    </div>
  );
}