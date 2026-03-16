import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";

import {
  getStaff,
  updateStaffStatus,
  deleteStaff,
} from "../../../api/staff.services";

import CreateStaffModal from "./CreateStaffModal";
import EditStaffModal from "./EditStaffModal";

export default function ManagerStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openCreate, setOpenCreate] = useState(false);
  const [editStaff, setEditStaff] = useState(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await getStaff();
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Staff fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTER ================= */

  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const name = s.full_name || "";
      const email = s.email || "";

      const matchSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        email.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        status === "ALL" ||
        (status === "ACTIVE" && s.is_active === 1) ||
        (status === "INACTIVE" && s.is_active === 0);

      return matchSearch && matchStatus;
    });
  }, [staff, search, status]);

  /* ================= ACTIONS ================= */

  const toggleStatus = async (s) => {
    const confirm = window.confirm(
      `Are you sure you want to ${s.is_active ? "disable" : "enable"} this staff member?`
    );
    if (!confirm) return;

    try {
      await updateStaffStatus(s.id, s.is_active ? 0 : 1);
      fetchStaff();
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

  const removeStaff = async (id) => {
    const confirm = window.confirm("Delete this staff member permanently?");
    if (!confirm) return;

    try {
      await deleteStaff(id);
      fetchStaff();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">

      {/* HEADER */}

      <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Staff</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage staff access & roles
            </p>
          </div>

          <button
            onClick={() => setOpenCreate(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            + Add Staff
          </button>
        </div>

        {/* FILTER BAR */}

        <div className="max-w-7xl mx-auto px-6 pb-4 flex gap-4 flex-wrap">

          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-3 text-slate-400" />

            <input
              placeholder="Search by name or email"
              className="w-full pl-10 pr-4 py-2 border rounded-lg
              bg-white dark:bg-slate-800
              border-slate-200 dark:border-slate-700
              focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-lg px-4 py-2
            bg-white dark:bg-slate-800
            border-slate-200 dark:border-slate-700"
          >
            <option value="ALL">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

        </div>
      </div>

      {/* LIST */}

      <div className="max-w-7xl mx-auto px-6 py-6">

        {loading ? (
          <p className="text-center text-slate-500 py-20">
            Loading staff…
          </p>
        ) : filteredStaff.length === 0 ? (
          <p className="text-center text-slate-500 py-20">
            No staff found
          </p>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">

            {/* TABLE HEADER */}

            <div className="grid grid-cols-[1.2fr_1.8fr_0.8fr_0.8fr_1fr_0.8fr] gap-4 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-sm font-semibold">
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
              <span>Created</span>
              <span className="text-right">Actions</span>
            </div>

            {/* ROWS */}

            {filteredStaff.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-[1.2fr_1.8fr_0.8fr_0.8fr_1fr_0.8fr] gap-4 px-4 py-3 border-t border-slate-200 dark:border-slate-800 items-center hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >

                {/* NAME */}
                <span className="font-medium truncate">
                  {s.full_name}
                </span>

                {/* EMAIL */}
                <span className="text-slate-600 dark:text-slate-400 truncate">
                  {s.email}
                </span>

                {/* ROLE */}
                <span className="text-xs uppercase font-semibold">
                  {s.role}
                </span>

                {/* STATUS */}
                <span
                  className={`text-xs px-3 py-1 rounded-full w-fit ${
                    s.is_active
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
                  }`}
                >
                  {s.is_active ? "Active" : "Inactive"}
                </span>

                {/* CREATED */}
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(s.created_at).toLocaleDateString()}
                </span>

                {/* ACTIONS */}

                <div className="flex justify-end gap-3">

                  <button
                    onClick={() => toggleStatus(s)}
                    className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    {s.is_active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                  </button>

                  <button
                    onClick={() => setEditStaff(s)}
                    className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    onClick={() => removeStaff(s.id)}
                    className="text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                  >
                    <Trash2 size={18} />
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}
      </div>

      {/* MODALS */}

      {openCreate && (
        <CreateStaffModal
          onClose={() => setOpenCreate(false)}
          onSuccess={fetchStaff}
        />
      )}

      {editStaff && (
        <EditStaffModal
          staff={editStaff}
          onClose={() => setEditStaff(null)}
          onSuccess={fetchStaff}
        />
      )}

    </div>
  );
}