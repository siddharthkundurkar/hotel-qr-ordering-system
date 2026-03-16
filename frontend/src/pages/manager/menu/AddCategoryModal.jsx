import { useEffect, useRef, useState } from "react";
import { createMenuCategory } from "../../../api/category.services";

export default function AddCategoryModal({ onClose }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);

  /* ================= AUTO FOCUS ================= */

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* ================= SUBMIT ================= */

  const submit = async () => {
    if (loading) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      alert("Category name required");
      return;
    }

    try {
      setLoading(true);

      await createMenuCategory({
        name: trimmedName,
      });

      onClose();

    } catch (err) {

      alert(
        err?.response?.data?.message ||
        "Failed to create category"
      );

    } finally {
      setLoading(false);
    }
  };

  /* ================= ESC CLOSE ================= */

  const handleKeyDown = (e) => {
    if (e.key === "Enter") submit();
    if (e.key === "Escape") onClose();
  };

  /* ================= UI ================= */

  return (
    <div
      className="
      fixed inset-0 z-50
      bg-black/40 backdrop-blur-sm
      flex items-center justify-center
      "
    >
      <div
        className="
        bg-white dark:bg-slate-900
        w-96 rounded-xl p-6
        shadow-xl
        "
      >
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
          Add Category
        </h3>

        <input
          ref={inputRef}
          placeholder="Category name"
          value={name}
          disabled={loading}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="
          w-full border border-slate-200 dark:border-slate-700
          rounded-lg px-3 py-2 mb-4
          bg-white dark:bg-slate-800
          text-slate-900 dark:text-slate-200
          placeholder-slate-400
          focus:outline-none focus:ring-2 focus:ring-indigo-500
          "
        />

        <div className="flex justify-end gap-2">

          <button
            onClick={onClose}
            disabled={loading}
            className="
            px-4 py-2 rounded-lg
            border border-slate-200 dark:border-slate-700
            hover:bg-slate-100 dark:hover:bg-slate-800
            "
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={loading}
            className={`
            px-4 py-2 rounded-lg text-white
            ${
              loading
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }
            `}
          >
            {loading ? "Adding..." : "Add"}
          </button>

        </div>
      </div>
    </div>
  );
}