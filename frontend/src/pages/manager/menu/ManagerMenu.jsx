import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Tag,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
} from "lucide-react";

import {
  getMenuItems,
  toggleMenuItemAvailability,
  deleteMenuItem,
} from "../../../api/menu.services";

import AddMenuModal from "./AddMenuModal";
import AddCategoryModal from "./AddCategoryModal";
import EditMenuModal from "./EditMenuModal";
import CreateComboModal from "./AddCreateComboModal";

export default function ManagerMenu() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");

  const [openMenu, setOpenMenu] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const [openCombo, setOpenCombo] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  /* ================= LOAD MENU ================= */

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const data = await getMenuItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTERS ================= */

  const categories = useMemo(() => {
    return [
      "ALL",
      ...Array.from(
        new Set(items.map((i) => i.category).filter(Boolean))
      ),
    ];
  }, [items]);

  const filteredItems = useMemo(() => {
    const searchLower = search.toLowerCase();

    return items.filter((item) => {
      const name = (item.name || "").toLowerCase();

      const matchSearch = name.includes(searchLower);
      const matchCategory =
        category === "ALL" || item.category === category;

      return matchSearch && matchCategory;
    });
  }, [items, search, category]);

  /* ================= ACTIONS ================= */

  const toggleAvailability = async (id) => {
    if (loadingAction) return;

    try {
      setLoadingAction(true);

      await toggleMenuItemAvailability(id);

      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, is_available: !i.is_available }
            : i
        )
      );
    } catch {
      alert("Failed to update availability");
    } finally {
      setLoadingAction(false);
    }
  };

  const removeItem = async (id) => {
    if (loadingAction) return;

    if (!window.confirm("Delete this menu item?")) return;

    try {
      setLoadingAction(true);

      await deleteMenuItem(id);

      setItems((prev) =>
        prev.filter((i) => i.id !== id)
      );
    } catch {
      alert("Failed to delete menu item");
    } finally {
      setLoadingAction(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="p-6 min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* HEADER */}

      <div className="flex justify-between items-center mb-6">

        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Menu
          </h1>

          <p className="text-slate-500 dark:text-slate-400">
            Manage menu items, combos & categories
          </p>
        </div>

        <div className="flex gap-3">

          <button
  onClick={() => setOpenCategory(true)}
  className="
  flex items-center gap-2
  px-4 py-2 rounded-lg
  border border-slate-200 dark:border-slate-700
  bg-white dark:bg-slate-800
  text-slate-800 dark:text-slate-200
  hover:bg-slate-100 dark:hover:bg-slate-700
  transition
  "
>
  <Tag size={16} />
  Add Category
</button>

          <button
            onClick={() => setOpenCombo(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus size={16} />
            Add Combo
          </button>

          <button
            onClick={() => setOpenMenu(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black hover:bg-slate-800 text-white"
          >
            <Plus size={16} />
            Add Item
          </button>

        </div>

      </div>

      {/* FILTERS */}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">

        <div className="relative flex-1">

          <Search
            className="absolute left-3 top-3 text-slate-400"
            size={18}
          />

          <input
  className="
  w-full pl-10 pr-4 py-2
  border border-slate-200 dark:border-slate-700
  rounded-lg
  bg-white dark:bg-slate-800
  text-slate-800 dark:text-slate-200
  placeholder:text-slate-400 dark:placeholder:text-slate-500
  focus:ring-2 focus:ring-indigo-500
  "
  placeholder="Search menu item..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>

</div>

<select
  className="
  border border-slate-200 dark:border-slate-700
  rounded-lg px-4 py-2
  bg-white dark:bg-slate-800
  text-slate-800 dark:text-slate-200
  "
  value={category}
  onChange={(e) => setCategory(e.target.value)}
>
  {categories.map((c) => (
    <option key={c} value={c}>
      {c}
    </option>
  ))}
</select>
</div>

      {/* TABLE */}

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow overflow-hidden border border-slate-200 dark:border-slate-800">

        {loading ? (

          <div className="py-20 text-center text-slate-500">
            Loading menu...
          </div>

        ) : (

          <table className="w-full">

            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">

              <tr>

                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3 text-left">Item</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>

              </tr>

            </thead>

            <tbody>

              {filteredItems.map((item, index) => (

                <tr
  key={item.id}
  className="
  border-t border-slate-200 dark:border-slate-800
  hover:bg-slate-50 dark:hover:bg-slate-800
  transition
  text-slate-700 dark:text-slate-300
"
>

  <td className="px-4 py-3 font-medium">
    {index + 1}
  </td>

                  <td className="px-4 py-3 flex items-center gap-3">

                    <img
                      src={item.imageUrl || "/images/food-placeholder.png"}
                      alt={item.name}
                      onError={(e)=>{
                        e.target.src="/images/food-placeholder.png"
                      }}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-200"
                    />

                    <div className="flex flex-col">

                      <span className="font-medium text-slate-900 dark:text-white">
                        {item.name}
                      </span>

                      {item.is_combo && (
                        <span className="text-xs text-indigo-500">
                          Combo
                        </span>
                      )}

                    </div>

                  </td>

               <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
  {item.category || "-"}
</td>

                 <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
  ₹{Number(item.price).toFixed(2)}
</td>

                  <td className="px-4 py-3">

  <span
    className={`px-3 py-1 rounded-full text-xs font-medium ${
      item.is_available
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
        : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
    }`}
  >
    {item.is_available ? "Available" : "Unavailable"}
  </span>

</td>

<td className="px-4 py-3">

  <div className="flex items-center gap-2">

    {/* Toggle Availability */}
    <button
      onClick={() => toggleAvailability(item.id)}
      disabled={loadingAction}
      className="p-2 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
    >
      {item.is_available ? (
        <EyeOff size={16} />
      ) : (
        <Eye size={16} />
      )}
    </button>

    {/* Edit */}
    <button
      onClick={() => setSelectedItem(item)}
      className="p-2 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
    >
      <Pencil size={16} />
    </button>

    {/* Delete */}
    <button
      onClick={() => removeItem(item.id)}
      disabled={loadingAction}
      className="p-2 rounded text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition"
    >
      <Trash2 size={16} />
    </button>

  </div>

</td>
                </tr>

              ))}

              {filteredItems.length === 0 && (

                <tr>

                  <td
                    colSpan="6"
                    className="text-center py-16 text-slate-500"
                  >
                    No menu items found
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        )}

      </div>

      {/* MODALS */}

      {openMenu && (
        <AddMenuModal
          onClose={() => setOpenMenu(false)}
          onSuccess={fetchMenu}
        />
      )}

      {openCategory && (
        <AddCategoryModal
          onClose={() => setOpenCategory(false)}
        />
      )}

      {openCombo && (
        <CreateComboModal
          onClose={() => setOpenCombo(false)}
          onSuccess={fetchMenu}
        />
      )}

      {selectedItem && (
        <EditMenuModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSuccess={fetchMenu}
        />
      )}

    </div>
  );
}