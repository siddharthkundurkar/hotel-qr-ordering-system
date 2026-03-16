import { useEffect, useState } from "react";
import { Plus, MapPin } from "lucide-react";
import { getBranches } from "../../../api/branchService";
import CreateBranchForm from "../../Auth/CreateBranch";

export default function BranchList() {
  const [branches, setBranches] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const fetchBranches = async () => {
    const data = await getBranches();
    setBranches(data);
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  return (
    <div className="relative">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Branches</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage all your restaurant branches
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition"
        >
          <Plus size={18} />
          Add Branch
        </button>
      </div>

      {/* INLINE FORM */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <CreateBranchForm
            onSuccess={() => {
              fetchBranches();
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* EMPTY STATE */}
      {branches.length === 0 && !showForm && (
        <div className="bg-white rounded-xl border border-dashed p-10 text-center text-slate-500">
          No branches found. Click <b>Add Branch</b> to create your first branch.
        </div>
      )}

      {/* BRANCH CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
       {branches.map((branch, index) => (
  <div
    key={`${branch.id}-${index}`}
    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-1 transition-all"
  >

            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {branch.name}
              </h3>

              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Active
              </span>
            </div>

            <div className="flex items-start gap-2 text-slate-600 text-sm">
              <MapPin size={16} className="mt-0.5 text-slate-400" />
              <p>{branch.address || "Address not provided"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
