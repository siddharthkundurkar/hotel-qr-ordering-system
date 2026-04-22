import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import publicApi from "../../api/public.services";

export default function ScanPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const storageKey = `tableSession:${token}`;

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    validateOrOpen();
  }, [token]);

  /* ================= RETRY HELPER ================= */

  const retryRequest = async (fn, retries = 3, delay = 1000) => {
    let lastError;

    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    throw lastError;
  };

  /* ================= DECIDE NEXT ================= */

 const goToNext = async (sessionToken) => {
  try {
    const res = await retryRequest(() =>
      publicApi.get("/orders/current", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      })
    );

    const order = res?.data?.order;

    const activeStatuses = [
      "pending",
      "accepted",
      "preparing",
      "ready",
    ];

    const status = order?.status?.toLowerCase?.(); // ✅ SAFE

    if (order && status && activeStatuses.includes(status)) {
      navigate(`/qr/${token}/live-order`, { replace: true });
    } else {
      navigate(`/qr/${token}/menu`, { replace: true });
    }

  } catch (err) {
    console.error(
      "ORDER FETCH ERROR:",
      err?.response?.data || err.message
    );

    navigate(`/qr/${token}/menu`, { replace: true });
  }
};

  /* ================= MAIN FLOW ================= */

  const validateOrOpen = async () => {
    try {
      setLoading(true);

      let sessionToken = localStorage.getItem(storageKey);

      /* ===== RESTORE SESSION ===== */

      if (sessionToken) {
        try {
          await retryRequest(() =>
            publicApi.get("/menu", {
              headers: {
                Authorization: `Bearer ${sessionToken}`,
              },
            })
          );

          console.log("🟢 Existing session valid");

          await goToNext(sessionToken);
          return;
        } catch {
          console.log("🟡 Stored session invalid");
          localStorage.removeItem(storageKey);
          sessionToken = null;
        }
      }

      /* ===== OPEN NEW SESSION ===== */

      const res = await retryRequest(() =>
        publicApi.get(`/qr/${token}`)
      );

      sessionToken = res.data.sessionToken;

      localStorage.setItem(storageKey, sessionToken);

      console.log("🟢 New session opened");

      await goToNext(sessionToken);

    } catch (err) {
      console.error(
        "QR OPEN ERROR:",
        err?.response?.data || err.message
      );

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Invalid or expired QR code"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Opening table…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-center p-4">
        <div>
          <p className="font-semibold">QR Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return null;
}