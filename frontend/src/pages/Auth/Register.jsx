import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api, { setAccessToken } from "../../api/axios";

export default function Register() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/register", formData);

      const { accessToken, user } = response.data;

      // 🔥 CRITICAL — set memory token FIRST
      setAccessToken(accessToken);

      // 🔥 CRITICAL — immediately set auth user
      setUser(user);

      // ⚠️ OPTIONAL — only if you truly want persistence
      // localStorage.setItem("token", accessToken);

      // small microtask delay helps avoid race with AuthProvider
      await Promise.resolve();

      navigate("/setup/company", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">
          Create Owner Account
        </h2>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          className="w-full mb-4 p-3 border rounded"
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full mb-4 p-3 border rounded"
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="mobile"
          placeholder="Mobile Number"
          className="w-full mb-4 p-3 border rounded"
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full mb-6 p-3 border rounded"
          onChange={handleChange}
          required
        />

        <button
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded"
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="text-sm text-center mt-4">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-indigo-600 font-medium"
          >
            Login
          </button>
        </p>
      </form>
    </div>
  );
}
