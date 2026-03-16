import publicApi from "./public.services";
import { getDeviceId } from "../utils/deviceId";

export const getCurrentCustomerOrder = (sessionToken) =>
  publicApi.get("/orders/current", {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      "x-device-id": getDeviceId(),
    },
  });
/* =====================================
   🧾 REQUEST BILL (PUBLIC FLOW — FIXED)
===================================== */
export const requestBill = async (orderId) => {
  const id = Number(orderId);
  if (!id) throw new Error("requestBill: orderId required");

  const res = await publicApi.patch(
    `/orders/${id}/request-bill`,
    {}
  );

  return res.data;
};