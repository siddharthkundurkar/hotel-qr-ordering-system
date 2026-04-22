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

  const goToNext = async (sessionToken) => {
    try {
      const res = await publicApi.get("/orders/current", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (res?.data?.order) {
        navigate(`/qr/${token}/live-order`, { replace: true });
      } else {
        navigate(`/qr/${token}/menu`, { replace: true });
      }
    } catch (err) {
      console.error("ORDER FETCH ERROR:", err?.response?.data || err.message);
      navigate(`/qr/${token}/menu`, { replace: true });
    }
  };

  const validateOrOpen = async () => {
    try {
      setLoading(true);

      let sessionToken = localStorage.getItem(storageKey);

      /* ================= RESTORE SESSION ================= */

      if (sessionToken) {
        try {
          await publicApi.get("/menu", {
            headers: {
              Authorization: `Bearer ${sessionToken}`,
            },
          });

          console.log("🟢 Existing session valid");

          await goToNext(sessionToken);
          return;
        } catch {
          console.log("🟡 Stored session invalid");
          localStorage.removeItem(storageKey);
          sessionToken = null;
        }
      }

      /* ================= OPEN NEW SESSION ================= */

      const res = await publicApi.get(`/qr/${token}`);
      sessionToken = res.data.sessionToken;

      localStorage.setItem(storageKey, sessionToken);

      console.log("🟢 New session opened");

      await goToNext(sessionToken);

    } catch (err) {
      console.error("QR OPEN ERROR:", err?.response?.data || err.message);

      setError(
        err?.response?.data?.message || "Invalid or expired QR code"
      );
    } finally {
      setLoading(false);
    }
  };

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