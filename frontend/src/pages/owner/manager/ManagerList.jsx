import { useEffect, useState } from "react";
import { Plus, Mail, Building2 } from "lucide-react";
import { getManagers } from "../../../api/managerService";
import CreateManagerModal from "./CreateManager";

export default function ManagerList() {
  const [managers, setManagers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchManagers = async () => {
    try {
      const data = await getManagers();
      setManagers(data);
    } catch (err) {
      console.error("Failed to fetch managers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Manager Management
          </h1>

          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Assign managers to your branches
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700
          text-white px-5 py-2.5 rounded-xl font-medium shadow transition"
        >
          <Plus size={18} />
          Add Manager
        </button>

      </div>

      {/* TABLE CARD */}

      <div
        className="rounded-2xl border border-slate-200 dark:border-slate-800
        bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
      >

        {/* TABLE HEADER */}

        <div
          className="grid grid-cols-12 px-6 py-4 text-sm font-medium
          text-slate-500 dark:text-slate-400
          border-b border-slate-200 dark:border-slate-800"
        >
          <div className="col-span-3">Manager</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-3">Branch</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* TABLE BODY */}

        {loading ? (
          <div className="p-6 text-slate-500 dark:text-slate-400">
            Loading managers…
          </div>
        ) : managers.length === 0 ? (
          <div className="p-6 text-slate-500 dark:text-slate-400">
            No managers found
          </div>
        ) : (
          managers.map((m) => (
            <div
              key={m.id}
              className="grid grid-cols-12 px-6 py-4 items-center
              border-b border-slate-200 dark:border-slate-800
              hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
            >

              {/* MANAGER */}

              <div className="col-span-3 flex items-center gap-3">

                <div
                  className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20
                  text-indigo-600 dark:text-indigo-400
                  flex items-center justify-center font-semibold"
                >
                  {m.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>

                <span className="font-medium text-slate-900 dark:text-white">
                  {m.full_name}
                </span>

              </div>

              {/* EMAIL */}

              <div className="col-span-3 flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Mail size={16} />
                {m.email}
              </div>

              {/* BRANCH */}

              <div className="col-span-3 flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Building2 size={16} />
                {m.branchName}
              </div>

              {/* STATUS */}

              <div className="col-span-2">
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                  bg-green-100 text-green-700
                  dark:bg-green-500/20 dark:text-green-400"
                >
                  Active
                </span>
              </div>

              {/* ACTION */}

              <div className="col-span-1 text-right">
                <button
                  className="text-red-600 dark:text-red-400
                  hover:text-red-700 dark:hover:text-red-300
                  font-medium text-sm transition"
                >
                  Revoke
                </button>
              </div>

            </div>
          ))
        )}

      </div>

      {/* MODAL */}

      {showModal && (
        <CreateManagerModal
          onClose={() => setShowModal(false)}
          onSuccess={fetchManagers}
        />
      )}

    </div>
  );
}