export const openInvoice = (invoiceUrl) => {
  const BACKEND_URL = "https://hotel-qr-ordering-system.onrender.com";
  window.open(`${BACKEND_URL}${invoiceUrl}`, "_blank");
};
