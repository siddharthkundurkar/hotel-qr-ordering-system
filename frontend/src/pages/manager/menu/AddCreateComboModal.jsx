import { useEffect, useState } from "react";
import { X, Plus, Minus } from "lucide-react";
import api from "../../../api/interceptors";

export default function CreateComboModal({ onClose, onSuccess }) {

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    name: "",
    price: "",
    categoryId: "",
    isVeg: true,
    description: "",
  });

  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {

      setLoadingData(true);

      const [menuRes, catRes] = await Promise.all([
        api.get("/menus"),
        api.get("/categories"),
      ]);

      const menu = Array.isArray(menuRes.data)
        ? menuRes.data.filter((i) => !i.is_combo)
        : [];

      const cats = Array.isArray(catRes.data)
        ? catRes.data.filter((c) => c.is_active)
        : [];

      setMenuItems(menu);
      setCategories(cats);

    } catch (err) {

      console.error("Combo load error:", err);
      alert("Failed to load menu data");

    } finally {
      setLoadingData(false);
    }
  };

  /* ================= ITEM QTY ================= */

  const addItem = (item) => {
    setItems((prev) => ({
      ...prev,
      [item.id]: {
        itemId: item.id,
        name: item.name,
        quantity: (prev[item.id]?.quantity || 0) + 1,
      },
    }));
  };

  const removeItem = (id) => {
    setItems((prev) => {

      if (!prev[id]) return prev;

      const copy = { ...prev };

      if (copy[id].quantity <= 1) {
        delete copy[id];
      } else {
        copy[id].quantity -= 1;
      }

      return copy;
    });
  };

  /* ================= SUBMIT ================= */

  const submit = async () => {

    if (loading) return;

    if (!form.name.trim() || !form.price || !form.categoryId) {
      return alert("Name, price & category required");
    }

    if (Object.keys(items).length === 0) {
      return alert("Select at least one item");
    }

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      categoryId: Number(form.categoryId),
      isVeg: form.isVeg,
      description: form.description?.trim() || null,
      items: Object.values(items),
    };

    console.log("CREATE COMBO PAYLOAD:", payload);

    try {

      setLoading(true);

      await api.post("/menus/combos", payload);

      onSuccess?.();
      onClose();

    } catch (err) {

      console.error("CREATE COMBO ERROR:", err);

      alert(
        err?.response?.data?.message ||
        "Failed to create combo"
      );

    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">

      <div className="bg-white dark:bg-slate-900 w-[420px] rounded-xl p-5 shadow-xl">

        {/* HEADER */}

        <div className="flex justify-between mb-4">

          <h2 className="font-bold text-lg text-slate-900 dark:text-white">
            Create Combo
          </h2>

          <button onClick={onClose}>
            <X size={18}/>
          </button>

        </div>

        {/* FORM */}

        <input
          placeholder="Combo name"
          className="w-full border px-3 py-2 rounded mb-2"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          type="number"
          placeholder="Price"
          className="w-full border px-3 py-2 rounded mb-2"
          value={form.price}
          onChange={(e) =>
            setForm({ ...form, price: e.target.value })
          }
        />

        <select
          className="w-full border px-3 py-2 rounded mb-2"
          value={form.categoryId}
          onChange={(e) =>
            setForm({ ...form, categoryId: e.target.value })
          }
        >
          <option value="">Select category</option>

          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}

        </select>

        <textarea
          placeholder="Description"
          className="w-full border px-3 py-2 rounded mb-2"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />

        {/* VEG / NONVEG */}

        <div className="flex gap-4 mb-3">

          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={form.isVeg}
              onChange={() =>
                setForm({ ...form, isVeg: true })
              }
            />
            Veg
          </label>

          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={!form.isVeg}
              onChange={() =>
                setForm({ ...form, isVeg: false })
              }
            />
            Non-Veg
          </label>

        </div>

        {/* ITEMS */}

        <div className="border rounded p-2 max-h-44 overflow-y-auto mb-3">

          {loadingData ? (

            <div className="text-center text-slate-500 py-4">
              Loading items...
            </div>

          ) : (

            menuItems.map((item) => (

              <div
                key={item.id}
                className="flex justify-between items-center mb-2"
              >

                <span className="text-sm">
                  {item.name}
                </span>

                {items[item.id] ? (

                  <div className="flex gap-2 items-center">

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 hover:bg-slate-100 rounded"
                    >
                      <Minus size={14}/>
                    </button>

                    <span className="text-sm">
                      {items[item.id].quantity}
                    </span>

                    <button
                      onClick={() => addItem(item)}
                      className="p-1 hover:bg-slate-100 rounded"
                    >
                      <Plus size={14}/>
                    </button>

                  </div>

                ) : (

                  <button
                    className="text-sm text-indigo-600"
                    onClick={() => addItem(item)}
                  >
                    Add
                  </button>

                )}

              </div>

            ))

          )}

        </div>

        {/* SUBMIT */}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create Combo"}
        </button>

      </div>

    </div>
  );
}