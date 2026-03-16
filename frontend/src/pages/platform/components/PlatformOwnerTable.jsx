import { useState } from "react";
import { updateOwnerStatus } from "../../../api/platform.services";

export default function OwnerTable({
  owners,
  loading,
  onRefresh,
}) {
  const [updatingId, setUpdatingId] = useState(null);

  // 🛡️ HARD GUARD
  const safeOwners = Array.isArray(owners) ? owners : [];

  /* ================= STATUS TOGGLE ================= */
  const toggleStatus = async (owner) => {
    if (updatingId) return;

    try {
      setUpdatingId(owner.id);

      await updateOwnerStatus(
        owner.id,
        owner.is_active ? 0 : 1
      );

      await onRefresh?.();
    } catch (err) {
      console.error("Owner status update failed", err);
    } finally {
      setUpdatingId(null);
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 text-sm text-slate-500">
        Loading owners...
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <table className="w-full">
        {/* ================= HEADER ================= */}
        <thead className="bg-slate-50">
          <tr className="text-left text-sm text-slate-600">
            <th className="p-4">Owner</th>
            <th className="p-4">Email</th>
            <th className="p-4">Mobile</th>
            <th className="p-4">Company</th>
            <th className="p-4">Status</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>

        {/* ================= BODY ================= */}
        <tbody>
          {/* EMPTY STATE */}
          {safeOwners.length === 0 && (
            <tr>
              <td
                colSpan="6"
                className="text-center p-10 text-slate-500"
              >
                No owners found
              </td>
            </tr>
          )}

          {/* ROWS */}
          {safeOwners.map((owner) => (
            <tr
              key={owner.id}
              className="border-t hover:bg-slate-50 transition"
            >
              {/* OWNER */}
              <td className="p-4">
                <div className="font-medium">
                  {owner.full_name || "-"}
                </div>
                <div className="text-xs text-slate-400">
                  ID: {owner.id}
                </div>
              </td>

              {/* EMAIL */}
              <td className="p-4 text-sm">
                {owner.email || "-"}
              </td>

              {/* MOBILE */}
              <td className="p-4 text-sm">
                {owner.mobile || "-"}
              </td>

              {/* COMPANY BADGE */}
              <td className="p-4">
                {owner.companyName ? (
                  <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-medium">
                    {owner.companyName}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    Unassigned
                  </span>
                )}
              </td>

              {/* STATUS */}
              <td className="p-4">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    owner.is_active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {owner.is_active ? "Active" : "Suspended"}
                </span>
              </td>

              {/* ACTION */}
              <td className="p-4">
                <button
                  disabled={updatingId === owner.id}
                  onClick={() => toggleStatus(owner)}
                  className="text-indigo-600 hover:underline text-sm disabled:opacity-50"
                >
                  {updatingId === owner.id
                    ? "Updating..."
                    : owner.is_active
                    ? "Suspend"
                    : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
