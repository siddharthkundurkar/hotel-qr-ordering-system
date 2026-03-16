import { useState } from "react";
import { Lock } from "lucide-react";

export default function PasswordConfirmModal({ onClose, onConfirm }) {

  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">

      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-slate-900 p-6 rounded-xl w-96">

        <div className="flex items-center gap-2 mb-4 font-semibold">
          <Lock size={18} />
          Confirm Password
        </div>

        <input
          type="password"
          placeholder="Enter your password"
          className="w-full px-4 py-2 border rounded-lg mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex justify-end gap-3">

          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Confirm
          </button>

        </div>

      </div>
    </div>
  );
}