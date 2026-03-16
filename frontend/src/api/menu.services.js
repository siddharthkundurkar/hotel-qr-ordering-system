import api from "./interceptors";

/* ================= GET MENU ITEMS ================= */

export const getMenuItems = async (params = {}) => {
  const res = await api.get("/menus", { params });
  return res.data;
};

/* ================= CREATE MENU ITEM ================= */

export const createMenuItem = async ({
  name,
  price,
  categoryId,
  image,
  isVeg,
  description,
}) => {
  const formData = new FormData();

  formData.append("name", name);
  formData.append("price", price);
  formData.append("categoryId", categoryId);

  if (isVeg !== undefined) {
    formData.append("isVeg", isVeg);
  }

  if (description?.trim()) {
    formData.append("description", description.trim());
  }

  if (image) {
    formData.append("image", image);
  }

  const res = await api.post("/menus", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

/* ================= CREATE COMBO ================= */
/*
Backend expects:
{
  name,
  comboPrice,
  categoryId,
  isVeg,
  description,
  items: [{ itemId, quantity }]
}
*/

export const createCombo = async ({
  name,
  price,        // 👈 from UI
  categoryId,
  isVeg,
  description,
  items,
}) => {
  const payload = {
    name,
    comboPrice: Number(price), // ✅ FIX
    categoryId,
    isVeg,
    description: description?.trim() || null,
    items,
  };

  console.log("CREATE COMBO PAYLOAD (frontend):", payload);

  const res = await api.post("/menus/combos", payload);
  return res.data;
};

/* ================= UPDATE MENU ITEM ================= */

export const updateMenuItem = async (
  id,
  { name, price, categoryId, image, isVeg, description }
) => {
  const formData = new FormData();

  if (name !== undefined) formData.append("name", name);
  if (price !== undefined) formData.append("price", price);
  if (categoryId !== undefined) formData.append("categoryId", categoryId);
  if (isVeg !== undefined) formData.append("isVeg", isVeg);

  // ✅ SAFE DESCRIPTION HANDLING
  if (typeof description === "string" && description.trim()) {
    formData.append("description", description.trim());
  }

  if (image) formData.append("image", image);

  const res = await api.put(`/menus/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};


/* ================= DELETE MENU ITEM ================= */

export const deleteMenuItem = async (id) => {
  const res = await api.delete(`/menus/${id}`);
  return res.data;
};

/* ================= TOGGLE AVAILABILITY ================= */

export const toggleMenuItemAvailability = async (id) => {
  const res = await api.patch(`/menus/${id}/toggle`);
  return res.data;
};
export const getMenuForCashier = () =>
  api.get("/cashier/menu");
