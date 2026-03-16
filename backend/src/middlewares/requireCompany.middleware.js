export const requireCompany = (req, res, next) => {
  if (!req.user.companyId) {
    return res.status(403).json({
      message: "Company not assigned to user"
    });
  }
  next();
};
