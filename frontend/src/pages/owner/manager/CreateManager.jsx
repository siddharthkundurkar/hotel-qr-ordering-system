import { useEffect, useState } from "react";
import { X, User, Mail, Lock, GitBranch } from "lucide-react";
import { createManager } from "../../../api/managerService";
import { getBranches } from "../../../api/branchService";

export default function CreateManagerModal({ onClose, onSuccess }) {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    branchId: "",
    isHeadManager: false,
  });

  useEffect(() => {
    getBranches().then(setBranches);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createManager(formData);
      onSuccess();
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to create manager");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* MODAL */}
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800
        bg-white dark:bg-slate-900 shadow-xl p-6 z-10 animate-scaleIn"
      >

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Add Manager
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* FULL NAME */}
        <Input
          label="Full Name"
          icon={<User size={18} />}
          name="fullName"
          onChange={handleChange}
          required
        />

        {/* EMAIL */}
        <Input
          label="Email"
          icon={<Mail size={18} />}
          name="email"
          type="email"
          onChange={handleChange}
          required
        />

        {/* PASSWORD */}
        <Input
          label="Password"
          icon={<Lock size={18} />}
          name="password"
          type="password"
          onChange={handleChange}
          required
        />

        {/* BRANCH */}
        <div className="mb-5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Assign Branch
          </label>

          <div className="relative mt-2">
            <GitBranch
              className="absolute left-3 top-3 text-slate-400"
              size={18}
            />

            <select
              name="branchId"
              required
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300
              dark:border-slate-700 bg-white dark:bg-slate-800
              text-slate-900 dark:text-slate-200
              focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* HEAD MANAGER OPTION */}
        <div
          className="mb-6 flex items-start gap-3 rounded-xl border
          border-slate-200 dark:border-slate-700
          bg-slate-50 dark:bg-slate-800/40 p-4"
        >
          <input
            type="checkbox"
            name="isHeadManager"
            checked={formData.isHeadManager}
            onChange={handleChange}
            className="mt-1 h-4 w-4 accent-indigo-600"
          />

          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Set as Head Manager
            </p>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Head Manager has higher control over this branch.
              Leave unchecked to create a normal manager.
            </p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3">

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300
            dark:border-slate-700 text-slate-700 dark:text-slate-300
            hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700
            text-white font-medium shadow transition disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Manager"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- INPUT COMPONENT ---------------- */

function Input({ label, icon, ...props }) {
  return (
    <div className="mb-5">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>

      <div className="relative mt-2">
        <span className="absolute left-3 top-3 text-slate-400">
          {icon}
        </span>

        <input
          {...props}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300
          dark:border-slate-700 bg-white dark:bg-slate-800
          text-slate-900 dark:text-slate-200
          focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>
    </div>
  );
}