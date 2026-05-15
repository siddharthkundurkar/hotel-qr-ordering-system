export const openInvoice = (invoiceUrl) => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  window.open(`${BACKEND_URL}${invoiceUrl}`, "_blank");
};
