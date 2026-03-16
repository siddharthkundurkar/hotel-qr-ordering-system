export const openInvoice = (invoiceUrl) => {
  const BACKEND_URL = "http://localhost:5000";
  window.open(`${BACKEND_URL}${invoiceUrl}`, "_blank");
};
