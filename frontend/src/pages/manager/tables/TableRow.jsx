import { Pencil, Trash2, Power, QrCode } from "lucide-react";

const statusBadge = {
  available: "bg-green-100 text-green-700",
  occupied: "bg-red-100 text-red-700",
  inactive: "bg-gray-100 text-gray-600",
};

export default function TableRow({
  table,
  isManager = true,
  onEdit,
  onDelete,
  onToggleInactive,
  onShowQR,
}) {

  /* 🔒 Prevent crash */
  if (!table) return null;

  const {
    id,
    tableNumber,
    floor,
    tableType,
    capacity,
    status,
  } = table;

  const badge =
    statusBadge[status] || "bg-gray-100 text-gray-600";

  return (
    <tr className="border-b hover:bg-slate-50 dark:hover:bg-slate-800 transition">

      {/* TABLE NUMBER */}
      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
        {tableNumber ?? "-"}
      </td>

      {/* FLOOR */}
      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
        {floor ?? "-"}
      </td>

      {/* TYPE */}
      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
        {tableType ?? "-"}
      </td>

      {/* CAPACITY */}
      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
        {capacity ?? "-"}
      </td>

      {/* STATUS */}
      <td className="px-4 py-3">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${badge}`}
        >
          {status ?? "unknown"}
        </span>
      </td>

      {/* ACTIONS */}
      <td className="px-4 py-3 flex gap-2">

        <button
          onClick={() => onEdit?.(table)}
          className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <Pencil size={16} />
        </button>

        <button
          onClick={() => onShowQR?.(table)}
          className="p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600"
          title="Show QR"
        >
          <QrCode size={16} />
        </button>

        {isManager && (
          <button
            onClick={() =>
              onToggleInactive?.(
                id,
                status === "inactive"
                  ? "available"
                  : "inactive"
              )
            }
            className="p-2 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900 text-yellow-600"
            title="Activate / Inactivate table"
          >
            <Power size={16} />
          </button>
        )}

        {isManager && (
          <button
            onClick={() => onDelete?.(id)}
            className="p-2 rounded hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600"
          >
            <Trash2 size={16} />
          </button>
        )}

      </td>
    </tr>
  );
}