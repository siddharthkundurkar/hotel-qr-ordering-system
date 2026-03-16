import { useEffect, useState } from "react";
import { updateMenuItem } from "../../../api/menu.services";
import { getMenuCategories } from "../../../api/category.services";

export default function EditMenuModal({ item, onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(item.imageUrl || null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: item.name || "",
    price: item.price ?? "",
    categoryId: item.categoryId || "",
    description: item.description || "", // ✅ ADDED
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

  /* ================= IMAGE PREVIEW ================= */
  const handleImageChange = (file) => {
    if (!file) return;

    setImage(file);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  };

  /* ================= SUBMIT ================= */
  const submit = async () => {
    if (!form.name || !form.price || !form.categoryId) {
      alert("Name, price and category are required");
      return;
    }

    try {
      setLoading(true);

      await updateMenuItem(item.id, {
        name: form.name.trim(),
        price: Number(form.price),
        categoryId: form.categoryId,
        description: form.description.trim() || null, // ✅ SENT
        image, // optional
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update menu item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-96 p-6">
        <h3 className="text-lg font-semibold mb-4">
          Edit Menu Item
        </h3>

        {/* NAME */}
        <input
          className="w-full border rounded px-3 py-2 mb-3"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          placeholder="Item name"
        />

        {/* PRICE */}
        <input
          type="number"
          min="1"
          className="w-full border rounded px-3 py-2 mb-3"
          value={form.price}
          onChange={(e) =>
            setForm({ ...form, price: e.target.value })
          }
          placeholder="Price"
        />

        {/* CATEGORY */}
        <select
          className="w-full border rounded px-3 py-2 mb-3"
          value={form.categoryId}
          onChange={(e) =>
            setForm({ ...form, categoryId: e.target.value })
          }
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
          rows={3}
          placeholder="Item description (optional)"
          className="w-full border rounded px-3 py-2 mb-3 text-sm resize-none"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
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
          onChange={(e) =>
            handleImageChange(e.target.files?.[0])
          }
          className="mb-4"
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
            className="bg-black text-white px-4 py-1 rounded disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}
