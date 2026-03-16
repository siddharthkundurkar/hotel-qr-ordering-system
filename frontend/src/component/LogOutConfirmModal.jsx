import { LogOut, X } from "lucide-react";

export default function LogoutConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            Confirm Logout
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Are you sure you want to logout?
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
