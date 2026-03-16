import { useState, useMemo } from "react";
import { updateCompanyStatus } from "../../../api/platform.services";

export default function CompanyTable({
  companies,
  loading,
  onRefresh,
}) {
  const [updatingId, setUpdatingId] = useState(null);

  // ✅ HARD GUARD
  const safeCompanies = useMemo(
    () => (Array.isArray(companies) ? companies : []),
    [companies]
  );

  const toggleStatus = async (company) => {
    if (!company?.id) return;
    if (updatingId) return;

    try {
      setUpdatingId(company.id);

      await updateCompanyStatus(
        company.id,
        company.is_active ? 0 : 1
      );

      await onRefresh?.();
    } catch (err) {
      console.error("Status update failed", err);
    } finally {
      setUpdatingId(null);
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 text-sm text-slate-500">
        Loading companies...
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr className="text-left text-sm text-slate-600">
            <th className="p-4">Company</th>
            <th className="p-4">GST</th>
            <th className="p-4">City</th>
            <th className="p-4">Contract</th>
            <th className="p-4">Status</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>

        <tbody>
          {/* EMPTY STATE */}
          {safeCompanies.length === 0 && (
            <tr>
              <td
                colSpan="6"
                className="text-center p-8 text-slate-500"
              >
                No companies found
              </td>
            </tr>
          )}

          {/* ROWS */}
          {safeCompanies.map((company) => (
            <tr
              key={company.id}
              className="border-t hover:bg-slate-50"
            >
              <td className="p-4 font-medium">
                {company.name || "-"}
              </td>

              <td className="p-4">
                {company.gst_number || "-"}
              </td>

              <td className="p-4">
                {company.city || "-"}
              </td>

              <td className="p-4">
                {company.contract_type || "-"}
              </td>

              <td className="p-4">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    company.is_active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {company.is_active ? "Active" : "Suspended"}
                </span>
              </td>

              <td className="p-4">
                <button
                  disabled={updatingId === company.id}
                  onClick={() => toggleStatus(company)}
                  className="text-indigo-600 hover:underline text-sm disabled:opacity-50"
                >
                  {updatingId === company.id
                    ? "Updating..."
                    : company.is_active
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
