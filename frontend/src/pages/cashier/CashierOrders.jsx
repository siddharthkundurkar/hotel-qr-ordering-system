import { useEffect, useRef, useState } from "react";
import { getMenuForCashier } from "../../api/menu.services";
import CashierOrderCard from "./CashierOrderCard";
import socket from "../../socket";
import toast from "react-hot-toast";

export default function CashierOrders({
  orders,
  setOrders,
  loading,
}) {
  const [menu, setMenu] = useState([]);
  const joinedRef = useRef(false);

  /* ================= FETCH MENU ================= */

  const fetchMenu = async () => {
    try {
      const data = await getMenuForCashier();
      setMenu(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Menu load failed", err);
      toast.error("Failed to load menu");
    }
  };

  /* ================= SOCKET + INIT ================= */

  useEffect(() => {
    fetchMenu();

    const branchId = localStorage.getItem("branchId");
    if (branchId && !joinedRef.current) {
      socket.emit("join:branch", branchId);
      joinedRef.current = true;
    }

    /* 🔔 ORDER SERVED */
    const onServed = (payload) => {
      const order = payload?.order ?? payload;
      if (!order?.orderId) return;

      setOrders(prev => {
        if (prev.some(o => o.orderId === order.orderId)) {
          return prev;
        }

        toast.success(`Order #${order.orderId} ready for billing`);
        return [...prev, order];
      });
    };

    /* 🔔 ORDER PAID */
    const onPaid = ({ orderId }) => {
      if (!orderId) return;
      setOrders(prev =>
        prev.filter(o => o.orderId !== orderId)
      );
    };

    socket.on("order:served", onServed);
    socket.on("order:paid", onPaid);

    return () => {
      socket.off("order:served", onServed);
      socket.off("order:paid", onPaid);
    };
  }, [setOrders]);

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500">
        Loading cashier orders…
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      {orders.length === 0 ? (
        <p className="text-slate-500 text-center">
          No orders to pay
        </p>
      ) : (
        orders.map(order => (
          <CashierOrderCard
            key={order.orderId}
            order={order}
            menu={menu}
            onPaid={() =>
              setOrders(prev =>
                prev.filter(o => o.orderId !== order.orderId)
              )
            }
          />
        ))
      )}
    </div>
  );
}
