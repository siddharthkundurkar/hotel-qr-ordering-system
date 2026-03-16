import { useEffect, useRef, useState, useCallback } from "react";
import socket from "../../socket";
import KitchenBoard from "./kitchenBoard";
import KitchenHeader from "./KitchenHeader";
import {
  getKitchenOrders,
  updateKitchenOrderStatus,
  updateKitchenItemStatus,
} from "../../api/kitchen.services";
import toast, { Toaster } from "react-hot-toast";
import KitchenStatsBar from "./KitchenStatusBar";

const ACTIVE_STATUSES = [
  "pending",
  "accepted",
  "preparing",
  "ready",
];

export default function KitchenOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const audioRef = useRef(null);
  const joinedRef = useRef(false);
  const prevIdsRef = useRef(new Set());
  const updatingItemRef = useRef(null);

  /* 🔔 Init sound */
  useEffect(() => {
    const audio = new Audio("/sounds/new-order.mpeg");
    audio.volume = 0.9;
    audioRef.current = audio;
  }, []);

  /* =================================================
     📡 INITIAL FETCH
  ================================================= */
  const fetchOrders = useCallback(async () => {
    try {
      const res = await getKitchenOrders();
      const data = Array.isArray(res?.data) ? res.data : [];

      const active = data.filter(o =>
        ACTIVE_STATUSES.includes(o.status)
      );

      /* 🔊 play sound for new orders */
      active.forEach(o => {
        if (soundEnabled && !prevIdsRef.current.has(o.id)) {
          audioRef.current?.play().catch(() => {});
          toast.success("🍽️ New order received");
        }
      });

      prevIdsRef.current = new Set(active.map(o => o.id));

      setOrders(active);
      setLastUpdated(Date.now());
    } catch {
      toast.error("Failed to load kitchen orders");
    } finally {
      setLoading(false);
    }
  }, [soundEnabled]);

  /* =================================================
     🚀 SOCKET PATCHING — ENTERPRISE SAFE
  ================================================= */
  useEffect(() => {
    fetchOrders();

    const branchId = localStorage.getItem("branchId");
    if (branchId && !joinedRef.current) {
      socket.emit("join:branch", branchId);
      joinedRef.current = true;
    }

    /* 🔌 connection */
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    /* ✅ ORDER PATCH */
    socket.on("order:kitchen:update", payload => {
      setOrders(prev =>
        prev.map(o =>
          o.id === payload.orderId
            ? {
                ...o,
                status: payload.status ?? o.status,
                waiterId: payload.waiterId ?? o.waiterId,
              }
            : o
        )
      );
    });

    /* ⭐ ITEM PATCH — FIXED KEY */
    socket.on("order:item:update", ({ orderId, itemId, status }) => {
      setOrders(prev =>
        prev.map(order => {
          if (order.id !== orderId) return order;

          return {
            ...order,
            items: order.items.map(item =>
              item.id === itemId // ✅ FIXED HERE
                ? { ...item, status }
                : item
            ),
          };
        })
      );
    });

    /* ⭐ HARD SYNC EVENTS (VERY IMPORTANT) */
    socket.on("order:ready", fetchOrders);
    socket.on("order:new", fetchOrders);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("order:kitchen:update");
      socket.off("order:item:update");
      socket.off("order:ready");
      socket.off("order:new");
    };
  }, [fetchOrders]);

  /* =================================================
     🔁 ORDER STATUS UPDATE
  ================================================= */
  const updateStatus = async (orderId) => {
  let previousOrders;

  try {
    /* ✅ SAVE SNAPSHOT FOR ROLLBACK */
    previousOrders = orders;

    /* ✅ OPTIMISTIC UI UPDATE */
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;

        const flow = {
          pending: "accepted",
          accepted: "preparing",
          preparing: "ready",
        };

        return {
          ...o,
          status: flow[o.status] || o.status,
        };
      })
    );

    /* ✅ CALL API */
    await updateKitchenOrderStatus(orderId);
  } catch (err) {
    /* ❌ ROLLBACK IF FAILED */
    setOrders(previousOrders);

    if (err?.response?.status === 409) {
      const remaining = err.response.data?.remainingItems;
      toast.error(
        remaining
          ? `${remaining} items still pending`
          : "Order cannot move yet"
      );
    } else {
      toast.error("Failed to update order status");
    }
  }
};
  /* =================================================
     ⭐ ITEM READY
  ================================================= */
  const updateItemStatus = async (itemId) => {
  if (updatingItemRef.current === itemId) return;

  updatingItemRef.current = itemId;

  /* 🔥 OPTIMISTIC UI UPDATE — INSTANT */
  setOrders(prev =>
    prev.map(order => ({
      ...order,
      items: order.items.map(item =>
        item.id === itemId
          ? { ...item, status: "ready" }
          : item
      ),
    }))
  );

  try {
    await updateKitchenItemStatus(itemId);
  } catch (err) {
    toast.error("Failed to update item");

    /* ❗ ROLLBACK ON FAILURE */
    fetchOrders();
  } finally {
    updatingItemRef.current = null;
  }
};

  /* 🔐 LOGOUT */
  const handleLogout = () => {
    localStorage.clear();
    socket.disconnect();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500">
        Loading kitchen orders…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70">
      <Toaster position="top-center" />

      <KitchenHeader
        orders={orders}
        isConnected={isConnected}
        soundEnabled={soundEnabled}
        lastUpdated={lastUpdated}
        onToggleSound={() => setSoundEnabled(prev => !prev)}
        onLogout={() => setShowLogout(true)}
      />

      <KitchenStatsBar orders={orders} />

      <KitchenBoard
        orders={orders}
        onStatusChange={updateStatus}
        onItemReady={updateItemStatus}
      />

      {showLogout && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800">
              Logout from Kitchen?
            </h3>

            <p className="text-sm text-slate-500 mt-2">
              You will be logged out of the kitchen panel.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowLogout(false)}
                className="flex-1 py-2 rounded-xl border text-slate-600 font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={handleLogout}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}