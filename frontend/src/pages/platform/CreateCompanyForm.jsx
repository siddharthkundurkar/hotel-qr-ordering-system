import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Check,
  MapPin,
  Users,
} from "lucide-react";
import { createCompanyWithOwner } from "../../api/platform.services";

export default function CreateCompanyForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // company
    restaurantName: "",
    gstNumber: "",
    address: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
    foodLicenseNumber: "",
    businessStartDate: "",
    contractType: "",
    teamSize: "",

    // owner
    ownerName: "",
    ownerEmail: "",
    ownerMobile: "",
    ownerPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setError(""); // ✅ clear error on typing

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ validations
    if (!formData.restaurantName.trim()) {
      return setError("Company name is required");
    }

    if (!formData.ownerName.trim()) {
      return setError("Owner name is required");
    }

    if (!formData.ownerEmail.trim() || !formData.ownerPassword) {
      return setError("Owner email and password are required");
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        // company
        restaurantName: formData.restaurantName.trim(),
        gstNumber: formData.gstNumber?.trim() || null,
        address: formData.address?.trim() || null,
        country: formData.country?.trim() || null,
        state: formData.state?.trim() || null,
        city: formData.city?.trim() || null,
        pincode: formData.pincode?.trim() || null,
        foodLicenseNumber: formData.foodLicenseNumber?.trim() || null,
        businessStartDate: formData.businessStartDate || null,
        contractType: formData.contractType || null,
        teamSize: formData.teamSize || null,

        // owner
        ownerName: formData.ownerName.trim(),
        ownerEmail: formData.ownerEmail.trim().toLowerCase(),
        ownerMobile: formData.ownerMobile?.trim() || null,
        ownerPassword: formData.ownerPassword,
      };

      // ✅ USE SERVICE (important)
      await createCompanyWithOwner(payload);

      // ✅ redirect inside platform
      navigate("/platform/companies", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create company"
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200";

  const labelClass = "text-sm font-medium text-gray-700";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate("/platform/dashboard")}
            className="flex items-center gap-2 text-sm text-slate-600 mb-4 hover:text-indigo-600 transition"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>

          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-xl bg-indigo-600 mb-4 shadow-md">
            <Building2 className="text-white" size={28} />
          </div>

          <h1 className="text-3xl font-bold">Create Company</h1>
          <p className="text-slate-600">
            Create a new hotel/company and its owner
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border rounded-xl shadow-lg p-8 space-y-6"
        >
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          {/* Company */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Company Name *</label>
              <input
                name="restaurantName"
                required
                className={inputClass}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className={labelClass}>GST Number</label>
              <input
                name="gstNumber"
                className={inputClass}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className={labelClass}>Address</label>
            <div className="relative">
              <MapPin
                className="absolute left-3 top-3.5 text-gray-400"
                size={18}
              />
              <textarea
                name="address"
                rows="3"
                className={inputClass}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Extra */}
          <div className="grid md:grid-cols-3 gap-6">
            <input
              type="date"
              name="businessStartDate"
              className={inputClass}
              onChange={handleChange}
            />

            <select
              name="contractType"
              className={inputClass}
              onChange={handleChange}
            >
              <option value="">Select Contract</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </select>

            <div className="relative">
              <Users
                className="absolute left-3 top-3.5 text-gray-400"
                size={18}
              />
              <input
                type="number"
                name="teamSize"
                className={inputClass}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* OWNER */}
          <div className="border-t pt-6 space-y-4">
            <h2 className="text-lg font-semibold">
              Owner Details
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <input
                name="ownerName"
                required
                placeholder="Owner Full Name"
                className={inputClass}
                onChange={handleChange}
              />

              <input
                type="email"
                name="ownerEmail"
                required
                placeholder="owner@email.com"
                className={inputClass}
                onChange={handleChange}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <input
                name="ownerMobile"
                placeholder="+91 9876543210"
                className={inputClass}
                onChange={handleChange}
              />

              <input
                type="password"
                name="ownerPassword"
                required
                placeholder="Owner Password"
                className={inputClass}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 
                       text-white py-3 rounded-lg flex items-center justify-center 
                       gap-2 font-medium transition-transform hover:scale-[1.01]"
          >
            <Check size={18} />
            {loading ? "Creating..." : "Create Company"}
          </button>
        </form>
      </div>
    </div>
  );
}
