import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createTable } from "../../../api/table.services";

export default function AddTableModal({ onClose, onSuccess }) {

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    tableNumber: "",
    floor: "",
    tableType: "REGULAR",
    capacity: 4,
  });

  /* ================= ESC CLOSE ================= */

  useEffect(() => {
    const esc = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  /* ================= SUBMIT ================= */

  const submit = async () => {

    if (!form.tableNumber?.trim()) {
      alert("Table number required");
      return;
    }

    if (!form.floor?.trim()) {
      alert("Floor required");
      return;
    }

    if (!form.capacity || form.capacity <= 0) {
      alert("Capacity must be greater than 0");
      return;
    }

    try {
      setLoading(true);

      await createTable({
        tableNumber: form.tableNumber.trim(),
        floor: form.floor.trim(),
        tableType: form.tableType,
        capacity: Number(form.capacity),
      });

      onSuccess?.();
      onClose?.();

    } catch (err) {

      if (err?.response?.status === 409) {
        alert("Table number already exists");
      } else {
        console.error(err);
        alert("Failed to create table");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onClose?.()}
      />

      {/* MODAL */}
      <div className="relative bg-white dark:bg-slate-900 w-96 rounded-xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Add Table
          </h3>

          <button
            onClick={() => onClose?.()}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <X size={18} />
          </button>

        </div>

        {/* TABLE NUMBER */}
       {/* TABLE NUMBER */}
{/* TABLE NUMBER */}
<input
  placeholder="Table Number (T-1)"
  className="
  w-full mt-2 mb-3 px-3 py-2 rounded-lg border
  border-slate-200 dark:border-slate-700
  bg-white dark:bg-slate-800
  text-slate-800 dark:text-slate-200
  placeholder-slate-400
  focus:outline-none focus:ring-2 focus:ring-indigo-500
  "
  value={form.tableNumber}
  onChange={(e) =>
    setForm((prev) => ({
      ...prev,
      tableNumber: e.target.value,
    }))
  }
/>

{/* FLOOR */}
<input
  placeholder="Floor (Ground / First)"
  className="
  w-full mt-2 mb-3 px-3 py-2 rounded-lg border
  border-slate-200 dark:border-slate-700
  bg-white dark:bg-slate-800
  text-slate-800 dark:text-slate-200
  placeholder-slate-400
  focus:outline-none focus:ring-2 focus:ring-indigo-500
  "
  value={form.floor}
  onChange={(e) =>
    setForm((prev) => ({
      ...prev,
      floor: e.target.value,
    }))
  }
/>

{/* TYPE */}
<select
  className="
  w-full mt-2 mb-3 px-3 py-2 rounded-lg border
  border-slate-200 dark:border-slate-700
  bg-white dark:bg-slate-800
  text-slate-800 dark:text-slate-200
  focus:outline-none focus:ring-2 focus:ring-indigo-500
  "
  value={form.tableType}
  onChange={(e) =>
    setForm((prev) => ({
      ...prev,
      tableType: e.target.value,
    }))
  }
>
  <option value="REGULAR">Regular</option>
  <option value="VIP">VIP</option>
  <option value="FAMILY">Family</option>
  <option value="OUTDOOR">Outdoor</option>
  <option value="BAR">Bar</option>
</select>

{/* CAPACITY */}
<input
  type="number"
  min="1"
  placeholder="Capacity"
  className="
  w-full mt-2 mb-3 px-3 py-2 rounded-lg border
  border-slate-200 dark:border-slate-700
  bg-white dark:bg-slate-800
  text-slate-800 dark:text-slate-200
  placeholder-slate-400
  focus:outline-none focus:ring-2 focus:ring-indigo-500
  "
  value={form.capacity}
  onChange={(e) =>
    setForm((prev) => ({
      ...prev,
      capacity: Number(e.target.value),
    }))
  }
/>

{/* ACTIONS */}
<div className="flex justify-end gap-3 mt-5">

  <button
    onClick={onClose}
    className="
    px-4 py-2 rounded-lg
    bg-slate-100 hover:bg-slate-200
    dark:bg-slate-700 dark:hover:bg-slate-600
    text-slate-700 dark:text-slate-200
    transition
    "
  >
    Cancel
  </button>

  <button
    onClick={submit}
    disabled={loading}
    className="
    px-4 py-2 rounded-lg
    bg-indigo-600 hover:bg-indigo-700
    text-white
    transition
    "
  >
    {loading ? "Adding..." : "Add Table"}
  </button>

</div>
      </div>
    </div>
  );
}