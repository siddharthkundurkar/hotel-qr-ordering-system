export default function OwnerDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Owner Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <StatCard title="Branches" value="0" />
        <StatCard title="Managers" value="0" />
        <StatCard title="Status" value="Active" />
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow">
      <p className="text-slate-500">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}
