import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { updateStaff } from "../../../api/staff.services";

export default function EditStaffModal({ staff, onClose, onSuccess }) {

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: staff.full_name || "",
    email: staff.email || "",
    mobile: staff.mobile || "",
    address: staff.address || "",
    role: staff.role || "WAITER",
  });

  /* ================= ESC CLOSE ================= */

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  /* ================= SUBMIT ================= */

  const submit = async () => {

    if (!form.fullName.trim() || !form.email.trim()) {
      setError("Full name and email are required");
      return;
    }

    try {

      setLoading(true);
      setError("");

      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim() || null,
        address: form.address.trim() || null,
        role: form.role.toUpperCase(),
      };

      await updateStaff(staff.id, payload);

      onSuccess?.();
      onClose();

    } catch (err) {

      console.error(err);

      setError(
        err?.response?.data?.message ||
        "Failed to update staff"
      );

    } finally {
      setLoading(false);
    }
  };

  return (

    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >

      <div
        onClick={(e) => e.stopPropagation()}
        className="
        w-full max-w-md rounded-xl shadow-xl
        bg-white dark:bg-slate-900
        border border-slate-200 dark:border-slate-800
        p-6
        "
      >

        {/* HEADER */}

        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg">
            Edit Staff
          </h3>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}

        <Input
          placeholder="Full Name"
          value={form.fullName}
          onChange={(e) =>
            setForm({ ...form, fullName: e.target.value })
          }
        />

        <Input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <Input
          type="tel"
          placeholder="Phone Number"
          value={form.mobile}
          onChange={(e) =>
            setForm({ ...form, mobile: e.target.value })
          }
        />

        <Input
          placeholder="Address"
          value={form.address}
          onChange={(e) =>
            setForm({ ...form, address: e.target.value })
          }
        />

        {/* ROLE */}

        <select
          value={form.role}
          onChange={(e) =>
            setForm({ ...form, role: e.target.value })
          }
          className="
          w-full mb-3 px-3 py-2 rounded-lg
          border border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-800
          focus:outline-none focus:ring-2 focus:ring-indigo-500
          "
        >
          <option value="WAITER">Waiter</option>
          <option value="KITCHEN">Kitchen</option>
          <option value="CASHIER">Cashier</option>
        </select>

        {/* ERROR */}

        {error && (
          <p className="text-sm text-red-500 mb-3">
            {error}
          </p>
        )}

        {/* ACTION */}

        <button
          onClick={submit}
          disabled={loading}
          className="
          w-full py-2 rounded-lg
          bg-indigo-600 hover:bg-indigo-700
          text-white font-medium
          disabled:opacity-60
          transition
          "
        >
          {loading ? "Updating..." : "Update Staff"}
        </button>

      </div>

    </div>
  );
}

/* ================= INPUT ================= */

function Input({ type = "text", ...props }) {
  return (
    <input
      type={type}
      {...props}
      className="
      w-full mb-3 px-3 py-2 rounded-lg
      border border-slate-200 dark:border-slate-700
      bg-white dark:bg-slate-800
      focus:outline-none focus:ring-2 focus:ring-indigo-500
      "
    />
  );
}