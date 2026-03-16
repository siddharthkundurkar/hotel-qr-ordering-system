import { useState } from "react";
import { Users, Table, Utensils, ClipboardList } from "lucide-react";

import OverviewDashboard from "./OverViewDashboard";
import TableDashboard from "./TableDashboard";
import OrderDashboard from "./OrderDashboard";
import StaffDashboard from "./StaffDashboard";

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Branch Dashboard
        </h1>

        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Branch overview and daily operations
        </p>
      </div>

      {/* TOP NAVIGATION */}
      <div className="flex gap-6 border-b border-slate-200 dark:border-slate-700">

        <Tab
          label="Overview"
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        />

        <Tab
          label="Tables"
          icon={<Table size={16} />}
          active={activeTab === "tables"}
          onClick={() => setActiveTab("tables")}
        />

        <Tab
          label="Orders"
          icon={<Utensils size={16} />}
          active={activeTab === "order"}
          onClick={() => setActiveTab("order")}
        />

        <Tab
          label="Staff"
          icon={<Users size={16} />}
          active={activeTab === "staff"}
          onClick={() => setActiveTab("staff")}
        />

        <Tab
          label="Inventory"
          icon={<ClipboardList size={16} />}
          active={activeTab === "inventory"}
          onClick={() => setActiveTab("inventory")}
        />

      </div>

      {/* DASHBOARD CONTENT */}

      {activeTab === "overview" && <OverviewDashboard />}

      {activeTab === "tables" && <TableDashboard />}

      {activeTab === "order" && <OrderDashboard />}

      {activeTab === "staff" && <StaffDashboard />}

      {activeTab === "inventory" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm">
          <p className="text-slate-700 dark:text-slate-300">
            Inventory dashboard coming soon.
          </p>
        </div>
      )}

    </div>
  );
}

/* ================= TAB ================= */

function Tab({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 flex items-center gap-2 text-sm font-medium transition
      ${
        active
          ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}