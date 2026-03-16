import { useEffect, useState } from "react";
import {
  X,
  User,
  Mail,
  Lock,
  UserCog,
  Phone,
  MapPin,
} from "lucide-react";
import { createStaff } from "../../../api/staff.services";

export default function CreateStaffModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "WAITER",
    mobile: "",
    address: "",
  });

  /* ================= ESC CLOSE ================= */

  useEffect(() => {
    const esc = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const handleChange = (e) => {
    setFormData((p) => ({
      ...p,
      [e.target.name]: e.target.value,
    }));
  };

  /* ================= VALIDATION ================= */

  const validate = () => {
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.fullName.trim())
      return "Full name is required";

    if (!emailRegex.test(formData.email))
      return "Enter a valid email";

    if (formData.password.length < 6)
      return "Password must be at least 6 characters";

    const mobile = formData.mobile.replace(/\s/g, "");

    if (
      mobile &&
      !/^[6-9]\d{9}$/.test(mobile)
    ) {
      return "Enter a valid 10-digit mobile number";
    }

    return "";
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const msg = validate();

    if (msg) {
      setError(msg);
      return;
    }

    try {
      setLoading(true);
      setError("");

      await createStaff({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role.toUpperCase(),
        mobile: formData.mobile || null,
        address: formData.address.trim() || null,
      });

      onSuccess?.();
      onClose();

    } catch (err) {

      setError(
        err?.response?.data?.message ||
        "Failed to create staff member"
      );

    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* BACKDROP */}

      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="
        relative z-10 w-full max-w-md rounded-2xl
        bg-white dark:bg-slate-900
        border border-slate-200 dark:border-slate-800
        p-6 shadow-2xl
        "
      >

        {/* HEADER */}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            Add Staff Member
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X />
          </button>
        </div>

        <Input
          label="Full Name"
          icon={<User size={18} />}
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
        />

        <Input
          label="Email"
          icon={<Mail size={18} />}
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
        />

        <Input
          label="Password"
          icon={<Lock size={18} />}
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
        />

        <Input
          label="Mobile Number"
          icon={<Phone size={18} />}
          name="mobile"
          type="tel"
          placeholder="10-digit mobile"
          value={formData.mobile}
          onChange={handleChange}
        />

        {/* ADDRESS */}

        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">
            Address
          </label>

          <div className="relative">
            <MapPin
              size={18}
              className="absolute left-3 top-3 text-slate-400"
            />

            <textarea
              name="address"
              rows={2}
              value={formData.address}
              onChange={handleChange}
              placeholder="Staff address (optional)"
              className="
              w-full pl-10 pr-4 py-2 rounded-xl
              border border-slate-200 dark:border-slate-700
              bg-white dark:bg-slate-800
              resize-none
              focus:outline-none focus:ring-2 focus:ring-indigo-500
              "
            />
          </div>
        </div>

        {/* ROLE */}

        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">
            Role
          </label>

          <div className="relative">
            <UserCog
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="
              w-full pl-10 pr-4 py-3 rounded-xl
              border border-slate-200 dark:border-slate-700
              bg-white dark:bg-slate-800
              focus:outline-none focus:ring-2 focus:ring-indigo-500
              "
            >
              <option value="WAITER">Waiter</option>
              <option value="KITCHEN">Kitchen</option>
              <option value="CASHIER">Cashier</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        {/* ACTIONS */}

        <div className="flex justify-end gap-3">

          <button
            type="button"
            onClick={onClose}
            className="
            px-4 py-2 rounded-xl border
            border-slate-200 dark:border-slate-700
            hover:bg-slate-100 dark:hover:bg-slate-800
            "
          >
            Cancel
          </button>

          <button
            disabled={loading}
            className="
            px-6 py-2 rounded-xl
            bg-indigo-600 hover:bg-indigo-700
            text-white
            disabled:opacity-60
            "
          >
            {loading ? "Creating…" : "Create Staff"}
          </button>

        </div>

      </form>

    </div>
  );
}

/* ================= INPUT COMPONENT ================= */

function Input({ label, icon, ...props }) {
  return (
    <div className="mb-4">

      <label className="block mb-1 text-sm font-medium">
        {label}
      </label>

      <div className="relative">

        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>

        <input
          {...props}
          className="
          w-full pl-10 pr-4 py-3 rounded-xl
          border border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-800
          focus:outline-none focus:ring-2 focus:ring-indigo-500
          "
        />

      </div>

    </div>
  );
}