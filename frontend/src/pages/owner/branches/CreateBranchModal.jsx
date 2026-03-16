import { useState } from "react";
import { X, Building2, MapPin } from "lucide-react";
import { createBranch } from "../../../api/branchService";

export default function CreateBranchModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((p) => ({
      ...p,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createBranch(formData);
      onSuccess();
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to create branch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* MODAL */}
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-xl w-full max-w-md p-6 z-10"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Add Branch</h2>
          <button onClick={onClose} type="button">
            <X />
          </button>
        </div>

        {/* Branch Name */}
        <div className="mb-4">
          <label className="text-sm font-medium">Branch Name</label>
          <div className="relative mt-1">
            <Building2 className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              name="name"
              required
              placeholder="Eg: Main Branch"
              className="w-full pl-10 pr-4 py-3 border rounded-lg"
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Address */}
        <div className="mb-6">
          <label className="text-sm font-medium">Address</label>
          <div className="relative mt-1">
            <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
            <textarea
              name="address"
              rows={3}
              placeholder="Full branch address"
              className="w-full pl-10 pr-4 py-3 border rounded-lg"
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
          >
            {loading ? "Creating..." : "Create Branch"}
          </button>
        </div>
      </form>
    </div>
  );
}
