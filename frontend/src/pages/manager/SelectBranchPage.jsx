import { useEffect, useState } from "react";
import { Building2, Loader2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getBranches } from "../../api/branchService";
import { selectBranch, authMe } from "../../api/auth.services";
import { useAuth } from "../../context/AuthContext";
import { setAccessToken } from "../../api/interceptors";

export default function SelectBranchPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState(null);

  /* =========================================
     🚀 Redirect ONLY when manager has branch
  ========================================= */
  useEffect(() => {
    if (user?.role === "MANAGER" && user?.branchId) {
      navigate("/manager", { replace: true });
    }
  }, [user, navigate]);

  /* =========================================
     📡 Load branches (ENTERPRISE SAFE)
     ⭐ waits for auth
     ⭐ prevents early 401
  ========================================= */
  useEffect(() => {
    // 🛑 wait until auth ready
    if (!user) return;

    let cancelled = false;

    const loadBranches = async () => {
      try {
        setLoading(true);

        const data = await getBranches();

        if (cancelled) return;

        const unique = Array.from(
          new Map(
            (Array.isArray(data) ? data : [])
              .filter((b) => b?.id)
              .map((b) => [b.id, b])
          ).values()
        );

        setBranches(unique);
      } catch (err) {
        console.error("❌ Failed to load branches", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBranches();

    return () => {
      cancelled = true;
    };
  }, [user]); // ✅ CRITICAL

  /* =========================================
     ✅ Select branch
  ========================================= */
  const handleSelect = async (branchId) => {
    try {
      setSelectingId(branchId);

      const res = await selectBranch(branchId);
      const token = res?.accessToken || res?.data?.accessToken;

      if (token) setAccessToken(token);

      const freshUser = await authMe();
      setUser(freshUser);

      navigate("/manager", { replace: true });
    } catch (err) {
      console.error("❌ Branch selection failed", err);
    } finally {
      setSelectingId(null);
    }
  };

  /* =========================================
     ⏳ Loading screen
  ========================================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* ===== Header ===== */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100">
            <Building2 className="h-7 w-7 text-indigo-600" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Select Branch
          </h1>

          <p className="text-slate-500 mt-2">
            Choose the branch you want to manage
          </p>
        </div>

        {/* ===== Empty state ===== */}
        {branches.length === 0 ? (
          <div className="text-center text-slate-500">
            No branches available
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {branches.map((branch) => {
              const isLoading = selectingId === branch.id;

              return (
                <button
                  key={branch.id}
                  onClick={() => handleSelect(branch.id)}
                  disabled={isLoading}
                  className="group text-left bg-white rounded-2xl border border-slate-200
                             p-5 shadow-sm hover:shadow-md hover:border-indigo-300
                             transition disabled:opacity-60"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        {branch.name}
                      </h3>

                      {branch.address && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                          {branch.address}
                        </p>
                      )}
                    </div>

                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-slate-300 group-hover:text-indigo-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}