import { useState } from "react";
import { X } from "lucide-react";
import { updateTable } from "../../../api/table.services";

export default function EditTableModal({ table, onClose, onSuccess }) {

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    tableNumber: table.tableNumber,
    floor: table.floor,
    tableType: table.tableType,
    capacity: table.capacity,
  });

  const submit = async () => {
    try {
      setLoading(true);

      await updateTable(table.id, {
        ...form,
        capacity: Number(form.capacity),
      });

      onSuccess();
      onClose();

    } catch (err) {
      alert("Failed to update table");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white dark:bg-slate-900 rounded-xl w-96 p-6">

        <div className="flex justify-between mb-4">
          <h3 className="font-semibold">
            Edit Table
          </h3>

          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <input
          className="input"
          value={form.tableNumber}
          onChange={(e) =>
            setForm({ ...form, tableNumber: e.target.value })
          }
          placeholder="Table Number"
        />

        <input
          className="input"
          value={form.floor}
          onChange={(e) =>
            setForm({ ...form, floor: e.target.value })
          }
          placeholder="Floor"
        />

        <input
          type="number"
          className="input"
          value={form.capacity}
          onChange={(e) =>
            setForm({
              ...form,
              capacity: Number(e.target.value),
            })
          }
          placeholder="Capacity"
        />

        <select
          className="input"
          value={form.tableType}
          onChange={(e) =>
            setForm({ ...form, tableType: e.target.value })
          }
        >
          <option value="REGULAR">Regular</option>
          <option value="VIP">VIP</option>
          <option value="FAMILY">Family</option>
          <option value="OUTDOOR">Outdoor</option>
          <option value="BAR">Bar</option>
        </select>

        <button
          onClick={submit}
          disabled={loading}
          className="btn-primary w-full mt-3"
        >
          {loading ? "Updating..." : "Update Table"}
        </button>

      </div>
    </div>
  );
}