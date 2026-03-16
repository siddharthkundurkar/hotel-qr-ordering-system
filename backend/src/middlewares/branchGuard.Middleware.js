// middleware/branchGuard.js

export const branchGuard = () => {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      /* ===============================
         🔓 SUPER ADMIN
      =============================== */
      if (user.role === "SUPER_ADMIN") {
        return next();
      }

      /* ===============================
         🔓 OWNER / MANAGER
         (they may use selector middleware)
      =============================== */
      if (user.role === "OWNER" || user.role === "MANAGER") {
        return next();
      }

      /* ===============================
         🔒 STAFF — STRICT
      =============================== */
      if (!user.branchId) {
        return res.status(403).json({
          message: "Staff not assigned to branch",
        });
      }

      // 🔐 inject trusted branch
      req.branchId = Number(user.branchId);

      next();
    } catch (err) {
      console.error("❌ branchGuard error:", err);
      return res.status(500).json({
        message: "Branch guard failure",
      });
    }
  };
};