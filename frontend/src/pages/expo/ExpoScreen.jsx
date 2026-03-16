import { useEffect, useState } from "react";
import socket from "../../socket";
import api from "../../api/interceptors";
import { toast } from "react-hot-toast";

export default function ExpoScreen() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState([]);

  /* ===============================
     FETCH READY
  =============================== */
  const fetchReady = async () => {
    const res = await api.get("/waiter/ready-orders");
    setOrders(res.data || []);
  };

  useEffect(() => {
    fetchReady();

    const branchId = localStorage.getItem("branchId");
    socket.emit("join:branch", branchId);

    socket.on("order:ready", fetchReady);
    socket.on("order:served", fetchReady);

    return () => {
      socket.off("order:ready", fetchReady);
      socket.off("order:served", fetchReady);
    };
  }, []);

  /* ===============================
     SELECT
  =============================== */
  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  /* ===============================
     🚀 BATCH BUMP
  =============================== */
  const handleBatchBump = async () => {
    if (!selected.length) {
      toast.error("Select orders first");
      return;
    }

    try {
      await api.post("/expo/batch-bump", {
        orderIds: selected,
      });

      toast.success("Orders dispatched 🚀");
      setSelected([]);
      fetchReady();
    } catch {
      toast.error("Batch bump failed");
    }
  };

  /* =============================== */

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">🍳 Expo Screen</h1>

      <button
        onClick={handleBatchBump}
        className="px-4 py-2 bg-red-600 text-white rounded-xl"
      >
        🚀 Batch Bump ({selected.length})
      </button>

      <div className="grid gap-3">
        {orders.map((o) => (
          <div
            key={o.id}
            onClick={() => toggle(o.id)}
            className={`p-4 rounded-xl border cursor-pointer
            ${
              selected.includes(o.id)
                ? "bg-red-50 border-red-400"
                : "bg-white"
            }`}
          >
            <p className="font-bold">
              Table {o.tableNumber}
            </p>
            <p className="text-sm text-slate-500">
              Order #{o.id}
            </p>

            <p className="text-xs mt-1">
              {o.items?.length || 0} items ready
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
