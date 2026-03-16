import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
  getSalesReport,
  getTopItemsReport,
  getBranchPerformance,
  getHourlySales,
  getCategoryPerformance,
  getWaiterPerformance,
  getTableTurnover,
  getPaymentMethodReport
} from "../../../api/ownerReport.services";

export default function OwnerReports() {

  const [loading, setLoading] = useState(false);

  const [sales, setSales] = useState([]);
  const [items, setItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [payments, setPayments] = useState([]);

  const [filters, setFilters] = useState({
    branchId: "",
    from: "",
    to: ""
  });

  /* ================= LOAD REPORTS ================= */

  const loadReports = async () => {
    try {

      setLoading(true);

      const [
        salesData,
        itemData,
        branchData,
        hourlyData,
        waiterData,
        paymentData
      ] = await Promise.all([
        getSalesReport(filters),
        getTopItemsReport(filters),
        getBranchPerformance(filters),
        getHourlySales(filters),
        getWaiterPerformance(filters),
        getPaymentMethodReport(filters)
      ]);

      setSales(salesData);
      setItems(itemData);
      setBranches(branchData);
      setHourly(hourlyData);
      setWaiters(waiterData);
      setPayments(paymentData);

    } catch (err) {

      console.error(err);
      toast.error("Failed to load reports");

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  /* ================= FILTER HANDLER ================= */

  const handleChange = (e) => {

    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });

  };

  const applyFilters = () => {
    loadReports();
  };

  /* ================= CALCULATE TOTALS ================= */

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.revenue || 0), 0);
  const totalOrders = sales.reduce((sum, s) => sum + Number(s.orders || 0), 0);

  return (
    <div className="space-y-8">

      {/* PAGE HEADER */}

      <div>

        <h1 className="text-2xl font-bold">
          Reports
        </h1>

        <p className="text-slate-500 text-sm">
          Business analytics and performance insights
        </p>

      </div>



      {/* FILTER BAR */}

      <div className="flex flex-wrap gap-4 items-end">

        <div>

          <label className="text-sm text-slate-500">
            Branch
          </label>

          <input
            name="branchId"
            value={filters.branchId}
            onChange={handleChange}
            placeholder="Branch ID"
            className="border px-3 py-2 rounded-lg w-40"
          />

        </div>

        <div>

          <label className="text-sm text-slate-500">
            From
          </label>

          <input
            type="date"
            name="from"
            value={filters.from}
            onChange={handleChange}
            className="border px-3 py-2 rounded-lg"
          />

        </div>

        <div>

          <label className="text-sm text-slate-500">
            To
          </label>

          <input
            type="date"
            name="to"
            value={filters.to}
            onChange={handleChange}
            className="border px-3 py-2 rounded-lg"
          />

        </div>

        <button
          onClick={applyFilters}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
        >
          Apply
        </button>

      </div>



      {/* KPI CARDS */}

      <div className="grid md:grid-cols-3 gap-6">

        <Card
          title="Total Revenue"
          value={`₹ ${totalRevenue.toLocaleString()}`}
        />

        <Card
          title="Total Orders"
          value={totalOrders}
        />

        <Card
          title="Avg Order Value"
          value={`₹ ${
            totalOrders
              ? Math.round(totalRevenue / totalOrders)
              : 0
          }`}
        />

      </div>



      {/* HOURLY SALES */}

      <Section title="Hourly Sales">

        {hourly.map((h, i) => (
          <Row
            key={i}
            left={`${h.hour}:00`}
            right={`₹ ${h.revenue} (${h.orders} orders)`}
          />
        ))}

      </Section>



      {/* TOP ITEMS */}

      <Section title="Top Selling Items">

        {items.map((i, idx) => (
          <Row
            key={idx}
            left={i.name}
            right={`${i.sold} sold`}
          />
        ))}

      </Section>



      {/* BRANCH PERFORMANCE */}

      <Section title="Branch Performance">

        {branches.map((b, i) => (
          <Row
            key={i}
            left={b.name}
            right={`₹ ${b.revenue} (${b.orders} orders)`}
          />
        ))}

      </Section>



      {/* WAITER PERFORMANCE */}

      <Section title="Waiter Performance">

        {waiters.map((w, i) => (
          <Row
            key={i}
            left={w.waiter}
            right={`₹ ${w.revenue} (${w.orders} orders)`}
          />
        ))}

      </Section>



      {/* PAYMENT METHODS */}

      <Section title="Payment Methods">

        {payments.map((p, i) => (
          <Row
            key={i}
            left={p.payment_method}
            right={`₹ ${p.revenue}`}
          />
        ))}

      </Section>



      {loading && (
        <p className="text-sm text-slate-500">
          Loading reports...
        </p>
      )}

    </div>
  );
}



/* ================= CARD ================= */

function Card({ title, value }) {

  return (

    <div className="bg-white dark:bg-slate-900 border rounded-xl p-5">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <h2 className="text-2xl font-bold mt-1">
        {value}
      </h2>

    </div>

  );

}



/* ================= SECTION ================= */

function Section({ title, children }) {

  return (

    <div className="border rounded-xl overflow-hidden">

      <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-semibold">
        {title}
      </div>

      <div className="divide-y">
        {children}
      </div>

    </div>

  );

}



/* ================= ROW ================= */

function Row({ left, right }) {

  return (

    <div className="flex justify-between px-4 py-3">

      <span>{left}</span>

      <span className="font-medium">
        {right}
      </span>

    </div>

  );

}