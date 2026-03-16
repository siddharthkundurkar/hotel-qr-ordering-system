import { db } from "../config/db.js";

export const setTaxConfig = async (req, res, next) => {
  try {
    const { gstPercentage, serviceChargePercentage } = req.body;
    const { companyId, branchId } = req.user;

    await db.query(
      `INSERT INTO tax_configs
       (companyId, branchId, gstPercentage, serviceChargePercentage)
       VALUES (?, ?, ?, ?)`,
      [companyId, branchId, gstPercentage, serviceChargePercentage]
    );

    res.json({ message: "Tax config saved" });
  } catch (err) {
    next(err);
  }
};
