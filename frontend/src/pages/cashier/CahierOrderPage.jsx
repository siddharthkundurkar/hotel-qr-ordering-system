import { useEffect, useState } from "react";
import { getServedOrders } from "../../api/cashier.services";
import CashierOrders from "./CashierOrders";

export default function CashierOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const orders = await getServedOrders();
      setOrders(orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CashierOrders
      orders={orders}
      setOrders={setOrders}
      loading={loading}
    />
  );
}