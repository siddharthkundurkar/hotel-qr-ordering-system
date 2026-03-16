import { useEffect, useMemo, useState, useRef } from "react";
import { Plus, Minus, Search, X } from "lucide-react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import publicApi from "../../api/public.services";
import { getDeviceId } from "../../utils/deviceId";

/* ⭐ cart persistence key */
const CART_KEY = "customerCart";

export default function CustomerMenu() {
  const navigate = useNavigate();
  const { token } = useParams();
  const outlet = useOutletContext();
  const sessionToken = outlet?.sessionToken;

  const aliveRef = useRef(true);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [language, setLanguage] = useState("en");

  /* ✅ persistent cart */
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  /* ================= TRANSLATIONS ================= */

  const translations = {
    en: {
      search: "Search dishes…",
      all: "All",
      add: "Add",
      yourCart: "Your Cart",
      placeOrder: "Place Order",
      placing: "Placing Order…",
      items: "items",
      loading: "Loading menu…",
      orderFailed: "Order failed",
      sessionMissing: "Session expired. Please scan QR again.",
    },
    hi: {
      search: "व्यंजन खोजें…",
      all: "सभी",
      add: "जोड़ें",
      yourCart: "आपका कार्ट",
      placeOrder: "ऑर्डर करें",
      placing: "ऑर्डर किया जा रहा है…",
      items: "आइटम",
      loading: "मेन्यू लोड हो रहा है…",
      orderFailed: "ऑर्डर विफल हुआ",
      sessionMissing: "सेशन समाप्त। कृपया फिर से QR स्कैन करें।",
    },
  };

  const t = translations[language];

  /* ================= SAVE CART ================= */

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart]);

  /* ================= NAME RESOLVER ================= */

  const getName = (obj) => {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    return obj?.[language] || obj?.en || "";
  };

  /* ================= FETCH MENU ================= */

  useEffect(() => {
    if (!sessionToken) {
      setLoading(false);
      return;
    }

    aliveRef.current = true;
    setLoading(true);

    const loadMenu = async () => {
      try {
        const res = await publicApi.get("/menu", {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "x-device-id": getDeviceId(),
          },
        });

        if (!aliveRef.current) return;
        setCategories(res.data?.categories || []);
      } catch (e) {
        const msg = e?.response?.data?.message;
        console.error("❌ MENU ERROR:", msg || e.message);

        if (
          msg?.toLowerCase().includes("expired") ||
          msg?.toLowerCase().includes("invalid") ||
          msg?.toLowerCase().includes("device")
        ) {
          Object.keys(localStorage)
            .filter((k) => k.startsWith("tableSession:"))
            .forEach((k) => localStorage.removeItem(k));

          navigate(`/scan/${token}`);
        }
      } finally {
        if (aliveRef.current) setLoading(false);
      }
    };

    loadMenu();

    return () => {
      aliveRef.current = false;
    };
  }, [sessionToken, navigate, token]);

  /* ================= CART ================= */

  const addItem = (item) => {
    setCart((prev) => ({
      ...prev,
      [item.id]: {
        ...item,
        price: Number(item.price) || 0,
        qty: (prev[item.id]?.qty || 0) + 1,
        note: prev[item.id]?.note || "",
      },
    }));
  };

  const removeItem = (item) => {
    setCart((prev) => {
      const copy = { ...prev };
      if (!copy[item.id]) return prev;
      if (copy[item.id].qty <= 1) delete copy[item.id];
      else copy[item.id].qty -= 1;
      return copy;
    });
  };

  const totalQty = useMemo(
    () => Object.values(cart).reduce((s, i) => s + i.qty, 0),
    [cart]
  );

  const totalAmount = useMemo(
    () =>
      Object.values(cart).reduce(
        (s, i) => s + i.qty * (Number(i.price) || 0),
        0
      ),
    [cart]
  );

  /* ================= PLACE ORDER ================= */

  const placeOrder = async () => {
    if (ordering || totalQty === 0) return;

    if (!sessionToken) {
      alert(t.sessionMissing);
      return;
    }

    setOrdering(true);

    try {
      await publicApi.post(
        "/orders",
        {
          items: Object.values(cart).map((i) => ({
            itemId: i.id,
            quantity: i.qty,
            note: i.note || null,
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "x-device-id": getDeviceId(),
          },
        }
      );

      setCart({});
      localStorage.removeItem(CART_KEY);
      setShowCart(false);

      navigate(`/qr/${token}`, { replace: true });
    } catch (e) {
      console.error("❌ ORDER ERROR:", e?.response?.data || e.message);
      alert(t.orderFailed);
    } finally {
      setOrdering(false);
    }
  };

  /* ================= FILTER ================= */

  const filteredCategories = useMemo(() => {
    return categories
      .filter((c) =>
        activeCategory === "ALL"
          ? true
          : String(c.id) === activeCategory
      )
      .map((c) => ({
        ...c,
        items: c.items.filter((i) =>
          getName(i.name).toLowerCase().includes(search.toLowerCase())
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [categories, search, activeCategory, language]);

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-500">
        {t.loading}
      </div>
    );
  }

  if (!sessionToken) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        {t.sessionMissing}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* HEADER */}
      <div className="p-4 sticky top-0 bg-white/90 backdrop-blur z-20">
        <div className="flex justify-end gap-2 mb-3">
          <LangBtn active={language === "en"} onClick={() => setLanguage("en")} label="EN" />
          <LangBtn active={language === "hi"} onClick={() => setLanguage("hi")} label="हिंदी" />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            className="w-full pl-9 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* MENU */}
      <div className="p-4 pb-40 space-y-10">
        {filteredCategories.map((cat) => (
          <div key={cat.id}>
            <h2 className="text-lg font-semibold mb-4">{getName(cat.name)}</h2>

            <div className="space-y-4">
              {cat.items.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  cart={cart}
                  addItem={addItem}
                  removeItem={removeItem}
                  getName={getName}
                  t={t}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CART BAR */}
      {totalQty > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-16 left-4 right-4 bg-orange-500 text-white rounded-2xl p-4 flex justify-between shadow-2xl"
        >
          <span>{totalQty} {t.items}</span>
          <span>₹{totalAmount}</span>
        </button>
      )}

      {/* ✅ CART MODAL (CRITICAL FIX) */}
      {/* ✅ CART MODAL (FULLY FIXED) */}
{showCart && (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
    <div className="bg-white w-full rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">{t.yourCart}</h3>
        <button onClick={() => setShowCart(false)}>
          <X />
        </button>
      </div>

      {/* ❗ EMPTY CART */}
      {Object.keys(cart).length === 0 && (
        <p className="text-center text-slate-500 py-10">
          Cart is empty
        </p>
      )}

      {/* ✅ CART ITEMS */}
      <div className="space-y-4">
        {Object.values(cart).map((item) => (
          <div
            key={item.id}
            className="border rounded-xl p-3 bg-slate-50"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <p className="font-semibold">
                  {getName(item.name)}
                </p>
                <p className="text-sm text-slate-500">
                  ₹{item.price} × {item.qty}
                </p>

                {/* ✅ NOTE INPUT */}
                <input
                  value={item.note || ""}
                  onChange={(e) =>
                    setCart((prev) => ({
                      ...prev,
                      [item.id]: {
                        ...prev[item.id],
                        note: e.target.value,
                      },
                    }))
                  }
                  placeholder="Add note (less spicy, no onion...)"
                  className="mt-2 w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>

              {/* ✅ QTY CONTROLS */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => removeItem(item)}
                  className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center"
                >
                  <Minus size={16} />
                </button>

                <span className="w-6 text-center">
                  {item.qty}
                </span>

                <button
                  onClick={() => addItem(item)}
                  className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ FOOTER */}
      {totalQty > 0 && (
        <button
          onClick={placeOrder}
          disabled={ordering}
          className="w-full mt-6 bg-emerald-600 text-white py-3 rounded-xl font-semibold"
        >
          {ordering
            ? t.placing
            : `${t.placeOrder} • ₹${totalAmount}`}
        </button>
      )}
    </div>
  </div>
)}

    </div>
  );
}

/* SMALL COMPONENTS */

function LangBtn({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm ${
        active ? "bg-emerald-600 text-white" : "bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

function MenuItemCard({ item, cart, addItem, removeItem, getName, t }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-md flex gap-4">
      <img
        src={item.imageUrl || "https://via.placeholder.com/100"}
        alt={getName(item.name)}
        className="w-24 h-24 rounded-xl object-cover"
      />

      <div className="flex-1">
        <p className="font-semibold">{getName(item.name)}</p>
        <p className="text-sm text-slate-500 mb-2">₹{item.price}</p>

        {cart[item.id] ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => removeItem(item)}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
            >
              <Minus size={16} />
            </button>
            <span>{cart[item.id].qty}</span>
            <button
              onClick={() => addItem(item)}
              className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center"
            >
              <Plus size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => addItem(item)}
            className="mt-2 px-4 py-2 rounded-full bg-emerald-600 text-white text-sm"
          >
            {t.add}
          </button>
        )}
      </div>
    </div>
  );
}
