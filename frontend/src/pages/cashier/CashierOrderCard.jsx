import { useState } from "react";
import { payOrder, addItemToOrder } from "../../api/cashier.services";
import toast from "react-hot-toast";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CashierOrderCard({
  order,
  onPaid,
  menu = [],
}) {
  if (!order?.orderId) return null;

  const [loading, setLoading] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState(1);

  // ✅ NEW: payment confirmation
  const [confirmMethod, setConfirmMethod] = useState(null);

  /* ================= PAY ORDER ================= */

  const handlePay = async (method) => {
    if (loading) return;

    setLoading(true);
    try {
      const res = await payOrder(order.orderId, method);

      toast.success("Payment successful");
      openInvoice(res?.data?.invoiceUrl);
      onPaid?.();
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 200 || status === 409) {
        toast("Order already paid", { icon: "ℹ️" });
        openInvoice(data?.invoiceUrl);
        onPaid?.();
        return;
      }

      toast.error(data?.message || "Payment failed");
    } finally {
      setLoading(false);
      setConfirmMethod(null); // close modal
    }
  };

  const openInvoice = (invoiceUrl) => {
    if (!invoiceUrl) return;

    const url = invoiceUrl.startsWith("http")
      ? invoiceUrl
      : `${API_BASE}${invoiceUrl}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  /* ================= ADD ITEM ================= */

  const handleAddItem = async () => {
    if (loading) return;

    if (!itemId || qty < 1) {
      toast.error("Select item and valid quantity");
      return;
    }

    setLoading(true);
    try {
      await addItemToOrder(order.orderId, itemId, qty);
      toast.success("Item added to order");

      setShowAddItem(false);
      setItemId("");
      setQty(1);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to add item"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <>
      <div className="bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-4">
        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              Table {order.tableNumber}
            </h3>
            <p className="text-xs text-slate-400">
              Order #{order.orderId}
            </p>
          </div>

          <span className="px-3 py-1 text-xs rounded-full font-semibold bg-orange-100 text-orange-700">
            SERVED
          </span>
        </div>

        {/* INFO */}
        <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-600">
          You can add items before generating the bill
        </div>

        {/* ADD ITEM */}
        <button
          onClick={() => setShowAddItem(v => !v)}
          disabled={loading}
          className="py-2 rounded-xl text-sm font-semibold bg-slate-200 hover:bg-slate-300 disabled:opacity-50"
        >
          ➕ Add Item
        </button>

        {showAddItem && (
          <div className="bg-slate-50 rounded-xl p-3 space-y-2">
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
            >
              <option value="">Select item</option>
              {menu.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} – ₹{m.price}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) =>
                setQty(Math.max(1, Number(e.target.value)))
              }
              className="w-full border rounded-lg p-2 text-sm"
            />

            <button
              onClick={handleAddItem}
              disabled={loading}
              className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              Add to Order
            </button>
          </div>
        )}

        {/* PAYMENT */}
        <div className="grid grid-cols-3 gap-3">
          <PayBtn
            label="Cash"
            color="bg-green-600"
            onClick={() => setConfirmMethod("cash")}
            loading={loading}
          />
          <PayBtn
            label="UPI"
            color="bg-blue-600"
            onClick={() => setConfirmMethod("upi")}
            loading={loading}
          />
          <PayBtn
            label="Card"
            color="bg-slate-900"
            onClick={() => setConfirmMethod("card")}
            loading={loading}
          />
        </div>
      </div>

      {/* ================= CONFIRM MODAL ================= */}
      {confirmMethod && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-80 p-5">
            <h3 className="text-lg font-semibold mb-2">
              Confirm Payment
            </h3>

            <p className="text-sm text-slate-600 mb-5">
              Confirm payment via{" "}
              <b className="uppercase">{confirmMethod}</b>?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmMethod(null)}
                disabled={loading}
                className="px-4 py-2 rounded-lg border text-sm"
              >
                Cancel
              </button>

              <button
                onClick={() => handlePay(confirmMethod)}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm disabled:opacity-50"
              >
                {loading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ================= PAYMENT BUTTON ================= */

function PayBtn({ label, color, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`py-3 rounded-xl text-sm font-semibold text-white ${color} disabled:opacity-50`}
    >
      {label}
    </button>
  );
}
