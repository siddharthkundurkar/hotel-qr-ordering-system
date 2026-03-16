import { useState } from "react";
import { useNavigate } from "react-router-dom"; // ⭐ ADD THIS
import { Store, MapPin, Check } from "lucide-react";
import api from "../../api/interceptors";

export default function CreateBranchForm({ onSuccess, onCancel }) {
  const navigate = useNavigate(); // ⭐ ADD THIS

  const [formData, setFormData] = useState({
    branchName: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.branchName) {
      setError("Branch name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/branches", {
        name: formData.branchName,
        address: formData.address,
      });

      // ✅ SMART SUCCESS HANDLING
      if (onSuccess) {
        onSuccess(); // modal flow
      } else {
        navigate("/owner", { replace: true }); // ⭐ onboarding flow
      }

    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to create branch"
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="space-y-6">
        {/* Branch Name */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Branch Name *
          </label>
          <div className="relative mt-1">
            <Store className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input
              name="branchName"
              placeholder="Paradise – FC Road"
              className={inputClass}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Address
          </label>
          <div className="relative mt-1">
            <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <textarea
              name="address"
              rows="3"
              placeholder="Street, Area, Landmark"
              className={inputClass}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2"
          >
            <Check size={16} />
            {loading ? "Saving..." : "Create Branch"}
          </button>
        </div>
      </div>
    </div>
  );
}
