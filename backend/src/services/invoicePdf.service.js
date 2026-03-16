import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

export const generateInvoicePDF = async ({
  invoiceNumber,
  company,
  branch,
  order,
  items = [],
  bill = {}
}) => {

  const invoicesDir = path.join(process.cwd(), "uploads", "invoices");

  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
  }

  const filePath = path.join(invoicesDir, `${invoiceNumber}.pdf`);

  /* ===== 80mm Thermal Receipt ===== */

  const doc = new PDFDocument({
    size: [226, 800], // 80mm width
    margin: 10
  });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const line = "--------------------------------";

  /* ================= HEADER ================= */

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(company?.name || "Restaurant", {
      align: "center"
    });

  doc
    .font("Helvetica")
    .fontSize(8)
    .text(branch?.address || "", {
      align: "center"
    });

  doc.moveDown(0.5);

  doc
    .fontSize(8)
    .text(`Invoice: ${invoiceNumber}`, { align: "center" });

  doc.text(`Order: ${order?.id || "-"}`, { align: "center" });

  doc.text(new Date().toLocaleString(), { align: "center" });

  doc.moveDown(0.5);

  doc.fontSize(8).text(line, { align: "center" });

  /* ================= ITEMS ================= */

  doc.moveDown(0.3);

  items.forEach((item) => {

    const qty = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    const total = qty * price;

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(item.name);

    doc
      .font("Helvetica")
      .fontSize(8)
      .text(
        `${qty} x ₹${price.toFixed(2)}`,
        { continued: true }
      )
      .text(
        `₹${total.toFixed(2)}`,
        { align: "right" }
      );

    doc.moveDown(0.2);
  });

  doc.text(line, { align: "center" });

  /* ================= TOTALS ================= */

  const subTotal = Number(bill.subTotal || 0);
  const gst = Number(bill.gstAmount || 0);
  const service = Number(bill.serviceCharge || 0);
  const total = Number(bill.totalAmount || 0);

  doc
    .fontSize(8)
    .text(`Subtotal`, { continued: true })
    .text(`₹${subTotal.toFixed(2)}`, { align: "right" });

  doc
    .text(`GST`, { continued: true })
    .text(`₹${gst.toFixed(2)}`, { align: "right" });

  doc
    .text(`Service`, { continued: true })
    .text(`₹${service.toFixed(2)}`, { align: "right" });

  doc.text(line, { align: "center" });

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(`TOTAL`, { continued: true })
    .text(`₹${total.toFixed(2)}`, { align: "right" });

  doc.text(line, { align: "center" });

  /* ================= FOOTER ================= */

  doc.moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(8)
    .text("Thank you for dining!", { align: "center" });

  doc.text("Visit Again!", { align: "center" });

  doc.moveDown(0.5);

  doc.text("Powered by HMS POS", {
    align: "center",
    opacity: 0.5
  });

  doc.end();

  await new Promise(resolve => stream.on("finish", resolve));

  return `/uploads/invoices/${invoiceNumber}.pdf`;
};