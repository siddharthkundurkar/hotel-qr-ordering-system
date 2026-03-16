import { useEffect, useMemo, useState } from "react";
import TableRow from "./TableRow";
import AddTableModel from "./AddTableModel";
import EditTableModal from "./EditTableModal";
import QRCodeModal from "./QrCodeModal";

import {
  getTables,
  updateTableStatus,
  deleteTable,
} from "../../../api/table.services";

export default function ManagerTables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openAdd, setOpenAdd] = useState(false);
  const [editTable, setEditTable] = useState(null);
  const [qrTable, setQrTable] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [sortType, setSortType] = useState("REGULAR");
  /* ================= FETCH TABLES ================= */

  const fetchTables = async () => {
    try {
      setLoading(true);

      const data = await getTables();

      setTables(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load tables", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this table?")) return;

    try {
      await deleteTable(id);

      setTables((prev) =>
        prev.filter((t) => t.id !== id)
      );
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete table");
    }
  };

  /* ================= STATUS ================= */

  const handleStatusChange = async (id, status) => {
    try {
      await updateTableStatus(id, status);

      setTables((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status } : t
        )
      );
    } catch (err) {
      console.error("Status update failed", err);
      alert("Failed to update table status");
    }
  };

  /* ================= FILTER ================= */

const filtered = useMemo(() => {
  const searchLower = search.toLowerCase();

  return tables
    .filter((t) => {
      if (!t) return false;

      const tableNumber = (t.tableNumber || "").toLowerCase();

      const matchSearch = tableNumber.includes(searchLower);
      const matchFilter = filter === "ALL" || t.status === filter;

      return matchSearch && matchFilter;
    })
    .sort((a, b) =>
      (a.tableNumber || "").localeCompare(b.tableNumber || "", undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
}, [tables, search, filter]);
  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-4">
      {/* HEADER */}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Tables
        </h1>

        <button
          onClick={() => setOpenAdd(true)}
          className="
          bg-indigo-600 hover:bg-indigo-700
          text-white px-4 py-2 rounded-lg
          transition
          "
        >
          + Add Table
        </button>
      </div>

      {/* SEARCH + FILTER */}

      <div className="flex gap-4 flex-wrap">
        <input
          placeholder="Search table number"
          className="
          border border-slate-200 dark:border-slate-700
          px-3 py-2 rounded-lg w-64
          bg-white dark:bg-slate-800
          text-slate-700 dark:text-slate-200
          placeholder-slate-400
          focus:outline-none focus:ring-2 focus:ring-indigo-500
          "
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="
          border border-slate-200 dark:border-slate-700
          px-3 py-2 rounded-lg
          bg-white dark:bg-slate-800
          text-slate-700 dark:text-slate-200
          focus:outline-none focus:ring-2 focus:ring-indigo-500
          "
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="ALL">All</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
  className="
  border border-slate-200 dark:border-slate-700
  px-3 py-2 rounded-lg
  bg-white dark:bg-slate-800
  text-slate-700 dark:text-slate-200
  "
  value={sortType}
  onChange={(e) => setSortType(e.target.value)}
>
  <option value="REGULAR">Regular</option>
  <option value="ASC">Low → High</option>
  <option value="DESC">High → Low</option>
</select>
      </div>
      
      {/* TABLE LIST */}

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow overflow-hidden border border-slate-200 dark:border-slate-800">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            Loading tables...
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 text-left">Table</th>
                <th className="px-4 py-3 text-left">Floor</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Capacity</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
  {filtered?.map((t) =>
    t ? (
      <TableRow
        key={t.id}
        table={t}
        onEdit={setEditTable}
        onDelete={handleDelete}
        onToggleInactive={handleStatusChange}
        onShowQR={setQrTable}
      />
    ) : null
  )}
</tbody>
          </table>
        )}
      </div>

      {/* MODALS */}

      {openAdd && (
        <AddTableModel
          onClose={() => setOpenAdd(false)}
          onSuccess={fetchTables}
        />
      )}

      {editTable && (
        <EditTableModal
          table={editTable}
          onClose={() => setEditTable(null)}
          onSuccess={fetchTables}
        />
      )}

      {qrTable && (
        <QRCodeModal
          table={qrTable}
          onClose={() => setQrTable(null)}
        />
      )}
    </div>
  );
}