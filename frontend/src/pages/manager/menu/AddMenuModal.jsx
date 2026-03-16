import { useEffect, useState } from "react";
import { createMenuItem } from "../../../api/menu.services";
import { getMenuCategories } from "../../../api/category.services";

export default function AddMenuModal({ onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    categoryId: "",
    description: "", // ✅ ADDED
    image: null,
  });

  /* ================= LOAD CATEGORIES ================= */
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getMenuCategories();
      setCategories(Array.isArray(data) ? data.filter(c => c.is_active) : []);
    } catch {
      alert("Failed to load categories");
    }
  };

  /* ================= IMAGE HANDLER ================= */
  const handleImageChange = (file) => {
    if (!file) return;

    setForm({ ...form, image: file });

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  };

  /* ================= SUBMIT ================= */
  const submit = async () => {
    const name = form.name.trim();
    const price = Number(form.price);

    if (!name || !price || price <= 0 || !form.categoryId) {
      alert("Valid name, price and category are required");
      return;
    }

    try {
      setLoading(true);

      await createMenuItem({
        name,
        price,
        categoryId: form.categoryId,
        description: form.description.trim() || undefined, // ✅ SENT
        image: form.image,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      alert(
        err?.response?.data?.message ||
        "Failed to create menu item"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-96 p-6">
        <h3 className="text-lg font-semibold mb-4">
          Add Menu Item
        </h3>

        {/* NAME */}
        <input
          placeholder="Item Name"
          className="w-full border rounded px-3 py-2 mb-3"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          disabled={loading}
        />

        {/* PRICE */}
        <input
          type="number"
          min="1"
          placeholder="Price"
          className="w-full border rounded px-3 py-2 mb-3"
          value={form.price}
          onChange={(e) =>
            setForm({ ...form, price: e.target.value })
          }
          disabled={loading}
        />

        {/* CATEGORY */}
        <select
          className="w-full border rounded px-3 py-2 mb-3"
          value={form.categoryId}
          onChange={(e) =>
            setForm({ ...form, categoryId: e.target.value })
          }
          disabled={loading}
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* DESCRIPTION */}
        <textarea
          placeholder="Item description (optional)"
          className="w-full border rounded px-3 py-2 mb-3 text-sm resize-none"
          rows={3}
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          disabled={loading}
        />

        {/* IMAGE PREVIEW */}
        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="w-full h-40 object-cover rounded-lg mb-3 border"
          />
        )}

        {/* IMAGE INPUT */}
        <input
          type="file"
          accept="image/*"
          className="w-full mb-4 text-sm"
          onChange={(e) =>
            handleImageChange(e.target.files?.[0])
          }
          disabled={loading}
        />

        {/* ACTIONS */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-1 rounded border"
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={loading}
            className={`px-4 py-1 rounded text-white ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-slate-800"
            }`}
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
