import { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
import OwnerTable from "./components/PlatformOwnerTable";
import { getPlatformOwners } from "../../api/platform.services";

export default function PlatformOwners() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);

  // pagination
  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);

  // search
  const [search, setSearch] = useState("");

  /* ================= LOAD ================= */
  const loadOwners = useCallback(async () => {
    try {
      setLoading(true);

      const res = await getPlatformOwners({
        search,
        limit,
        offset: (page - 1) * limit,
      });

      // ✅ ENTERPRISE CORRECT SHAPE
      setOwners(res.owners || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Failed to load owners", err);
      setOwners([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    loadOwners();
  }, [loadOwners]);

  /* ================= SEARCH ================= */
  const handleSearch = (e) => {
    setPage(1);
    setSearch(e.target.value);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-6 space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Platform Owners</h1>
          <p className="text-slate-500">
            Manage all restaurant owners
          </p>
        </div>

        {/* SEARCH */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-3 text-slate-400"
          />
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search owners..."
            className="pl-9 pr-4 py-2 border rounded-lg w-64"
          />
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <OwnerTable
        owners={owners}
        loading={loading}
        onRefresh={loadOwners}
      />

      {/* ===== PAGINATION ===== */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Page {page} of {totalPages}
        </p>

        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
