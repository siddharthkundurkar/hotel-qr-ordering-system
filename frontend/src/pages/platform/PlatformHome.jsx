import { useNavigate } from "react-router-dom";

export default function PlatformHome() {
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Platform Control Center
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate("/platform/dashboard")}
          className="p-6 bg-white rounded-xl shadow hover:shadow-lg"
        >
          📊 Dashboard
        </button>

        <button
          onClick={() => navigate("/platform/companies")}
          className="p-6 bg-white rounded-xl shadow hover:shadow-lg"
        >
          🏢 Companies
        </button>

        <button
          onClick={() => navigate("/platform/owners")}
          className="p-6 bg-white rounded-xl shadow hover:shadow-lg"
        >
          👑 Owners
        </button>
      </div>
    </div>
  );
}
