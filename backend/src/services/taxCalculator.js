export const calculateTax = ({
  subTotal,
  gstPercentage,
  serviceChargePercentage = 0,
}) => {
  const sub = Number(subTotal);
  const gst = Number(gstPercentage);
  const service = Number(serviceChargePercentage);

  if (Number.isNaN(sub)) throw new Error("Invalid subtotal");
  if (Number.isNaN(gst)) throw new Error("Invalid GST");
  if (Number.isNaN(service)) throw new Error("Invalid service charge");

  const gstAmount = (sub * gst) / 100;
  const serviceCharge = (sub * service) / 100;
  const totalAmount = sub + gstAmount + serviceCharge;

  return {
    subTotal: Number(sub.toFixed(2)),
    gstAmount: Number(gstAmount.toFixed(2)),
    serviceCharge: Number(serviceCharge.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
  };
};
