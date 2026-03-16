import { useEffect, useState, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CompanyTable from "./components/PlatformCompanyTable";
import { getPlatformCompanies } from "../../api/platform.services";

const PAGE_SIZE = 10;

export default function PlatformCompanies() {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  /* ================= LOAD ================= */
  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);

      const res = await getPlatformCompanies({
        search,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });

      setCompanies(res.companies || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Failed to load companies", err);
      setCompanies([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Platform Companies
          </h1>
          <p className="text-slate-500">
            Manage all tenant companies
          </p>
        </div>

        <button
          onClick={() => navigate("/platform/create-company")}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus size={16} />
          Create Company
        </button>
      </div>

      {/* 🔍 SEARCH */}
      <div className="relative max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-3 text-slate-400"
        />
        <input
          placeholder="Search companies..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="w-full pl-9 pr-3 py-2 border rounded-lg"
        />
      </div>

      {/* TABLE */}
      <CompanyTable
        companies={companies}
        loading={loading}
        onRefresh={loadCompanies}
      />

      {/* 🧭 PAGINATION */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Page {page} of {totalPages || 1}
        </p>

        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
