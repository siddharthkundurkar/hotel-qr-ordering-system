import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/auth.services";
import { useAuth } from "../../context/AuthContext";
import { setAccessToken, clearAccessToken } from "../../api/interceptors";
import api from "../../api/interceptors";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (e) => {
    setError(""); // ✅ clear error while typing

    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    /* 🔥 ENTERPRISE — clear previous session FIRST */
    clearAccessToken();
    setUser(null);

    // 1️⃣ login
    const res = await login(formData.email, formData.password);

    const accessToken = res?.accessToken || res?.data?.accessToken;
    const userData = res?.user || res?.data?.user;

    if (!accessToken) {
      throw new Error("No access token received");
    }

    // 2️⃣ set token
    setAccessToken(accessToken);
    await Promise.resolve(); // prevent race

    const role = userData?.role;

    /* 🚨 MANAGER FLOW — must select branch */
   /* 🚨 MANAGER FLOW — must select branch */
if (role === "MANAGER") {
  // ⭐⭐⭐ CRITICAL — hydrate auth context
  setUser({
    id: userData.id,
    role: userData.role,
    companyId: userData.companyId,
    branchId: null,
  });

  navigate("/manager/select-branch", { replace: true });
  return;
}

    /* ✅ NORMAL USERS */
    const meRes = await api.get("/auth/me");
    const freshUser = meRes.data;

    setUser(freshUser);

    const roleRoutes = {
      SUPER_ADMIN: "/platform/dashboard",
      OWNER: "/owner",
      WAITER: "/staff/waiter",
      KITCHEN: "/staff/kitchen",
      CASHIER: "/cashier",
    };

    navigate(roleRoutes[freshUser.role] || "/", { replace: true });

  } catch (err) {
    setError(
      err?.response?.data?.message ||
      err?.message ||
      "Invalid email or password"
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
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full mb-4 p-3 border rounded"
          onChange={handleChange}
          required
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
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
